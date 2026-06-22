# Robust Management of Long‑Running Computational Processes: A Case Study with MadGraph

In high‑energy physics and beyond, computational workflows often rely on extensive event generators such as MadGraph5_aMC@NLO. These simulations may run for days, weeks or event months, consuming significant system resources. To ensure reproducibility, fault tolerance, and effective resource utilisation, it is imperative to launch such processes in a detached, non‑interactive manner while preserving the ability to monitor, log, and, if necessary, terminate them cleanly. This note discusses the practical aspects of process management in a Unix‑like environment, focusing on the use of `nohup`, background job control, process groups, and a self‑contained launcher script that encapsulates these mechanisms.

## The Role of `nohup`

When a command is executed from an interactive shell, it inherits the terminal session as its controlling terminal. Upon session termination—for instance, when the user logs out or closes the terminal—the kernel sends a `SIGHUP` signal to all processes belonging to the session’s foreground and background job groups. Without special handling, the receiving processes will terminate. The `nohup` utility addresses this by intercepting `SIGHUP` and by redirecting the standard output and standard error streams to a file (typically `nohup.out`) when they are not explicitly redirected. In our context, we explicitly redirect both streams using `> signal.log 2>&1` to capture all diagnostic messages into a dedicated log file, which is essential for post‑mortem analysis and progress monitoring. The combination of `nohup` and output redirection thus decouples the simulation from the invoking shell, allowing it to survive terminal closures and continue unabated in the background.

## Background Execution and Process Identification

A process launched with the trailing ampersand (`&`) is executed as a background job. The shell reports its process identifier (PID), which can be captured immediately using the special variable `$!`. Storing this PID in a file enables subsequent administrative actions, such as sending signals to the process. However, a typical simulation may spawn multiple child processes—for example, parallel integration or event generation threads—and terminating only the parent PID would leave orphaned children consuming resources. To address this, modern Unix systems organise processes into process groups. When a job is started from the shell, all members of that job belong to the same process group, and the group ID is equal to the PID of the process group leader (usually the first process in the pipeline or the background command). Sending a signal to the *negative* value of a process group ID, using `kill -15 -<PGID>`, dispatches the signal to every process in that group. This is the preferred method for gracefully shutting down a computational tree, as it allows each subprocess to perform its own cleanup routines (e.g., flushing caches, closing files) in response to `SIGTERM`.

## A Self‑Contained Launcher Script

Repetitive manual invocation of lengthy commands is error‑prone and hinders reproducibility. We therefore propose a standalone shell script, `runmg5.sh`, that encapsulates all necessary steps. Its design principles are as follows: it must accept a single mandatory argument—the configuration file of arbitrary extension—and must operate in the directory containing that file so that all generated outputs (log files, PID files, and potentially MadGraph output directories) reside in a consistent location. The script first resolves the absolute path of the configuration file using `realpath` to handle relative paths robustly. It then changes the working directory to the configuration’s parent directory. This localisation ensures that the subsequent invocation of MadGraph uses relative paths for its internal output, and that the PID and log files are placed alongside the input, avoiding clutter in the user’s home directory or the script’s own location.

The script includes commented lines for activating a Conda environment. Many physics codes, including MadGraph, rely on a specific Python runtime and set of libraries; embedding this activation within the launcher guarantees that the environment is consistent across invocations and does not depend on the user’s prior shell state. The user may uncomment those lines and adjust the paths to the Conda installation and the environment name as needed. The script then executes `nohup` with the appropriate redirection, appends the background operator, and writes the PID to a file named after the base name of the input file (e.g., `signal.pid`). The complete script is presented below.

```bash
#!/bin/bash

# Usage check: input file is mandatory 
if [ $# -eq 0 ]; then
    echo "ERROR: No input file provided."
    echo "Usage: $0 <config_file>"
    echo "Example: $0 /path/to/signal.yml"
    exit 1
fi

# Resolve absolute path of the input file 
INPUT_FILE=$(realpath "$1")
if [ ! -f "$INPUT_FILE" ]; then
    echo "ERROR: File '$INPUT_FILE' not found!"
    exit 1
fi

# Optional: activate conda env (uncomment and adjust paths as needed)
# echo "Activating conda with: conda activate py310"
# source ~/miniconda3/bin/activate
# conda activate py310

# Extract directory and base filename
INPUT_DIR=$(dirname "$INPUT_FILE")
INPUT_BASENAME=$(basename "$INPUT_FILE")
INPUT_NAME_NO_EXT="${INPUT_BASENAME%.*}"  # Removes .yml, .txt, .md, etc.

# Change to the input file's directory 
cd "$INPUT_DIR" || exit 1

nohup ~/softwares/MG5_aMC_v3_7_1/bin/mg5_aMC "$INPUT_BASENAME" > "${INPUT_NAME_NO_EXT}.log" 2>&1 &
echo $! > "${INPUT_NAME_NO_EXT}.pid"

echo "MadGraph started with PID $(cat ${INPUT_NAME_NO_EXT}.pid)."
echo " > Log file: ${INPUT_DIR}/${INPUT_NAME_NO_EXT}.log"
echo " > PID file: ${INPUT_DIR}/${INPUT_NAME_NO_EXT}.pid"
```

To deploy the script, save the above code as `runmg5.sh` in a directory of your choice. The script must be made executable with the command:

```bash
chmod +x runmg5.sh
```

The script expects a single argument: the path to the MadGraph configuration file. It may be invoked from any working directory, for example:

```bash
./runmg5.sh /data/experiments/run1/signal.yml
```

The script handles files with any extension (`.yml`, `.txt`, `.md`, etc.). The generated log and PID files will be written to the same directory as the configuration file, bearing the base name of the input (e.g., `signal.log` and `signal.pid` for `signal.yml`).

Should the user wish to enable Conda environment activation, the three commented lines must be uncommented and the paths adjusted according to the local Conda installation. The line `source ~/miniconda3/bin/activate` presumes that Conda is installed under `~/miniconda3`; if not, the path must be changed to the correct location. Likewise, `conda activate py310` should be modified to match the actual environment name used for MadGraph.

## Termination of the Process Hierarchy

To terminate the entire computation gracefully, one may use the stored PID to send a `SIGTERM` to the entire process group. The command

```bash
kill -15 -$(cat signal.pid)
```

achieves this. The negative sign is crucial: it instructs the kernel to interpret the following number as a process group identifier rather than a single PID. If the process group does not respond within a reasonable timeframe, a `SIGKILL` (`-9`) can be employed as a last resort, though this should be avoided unless necessary because it prevents the application from performing any cleanup. A useful verification step is to list all processes belonging to the group using `ps -eo pid,pgid,comm | grep $(cat signal.pid)` to confirm that no lingering children remain.

However, some parallelised software may deliberately create new sessions or process groups for its workers (e.g., via `setsid()`), rendering the group‑level signal ineffective. In such cases, a more thorough recursive approach is required. The following shell function traverses the entire process tree descending from a given parent PID, killing all children before the parent:

```bash
kill_tree() {
    for child in $(ps -o pid= --ppid $1); do
        kill_tree $child
    done
    kill -9 $1 2>/dev/null
}
```

To invoke it on the MadGraph process, one would execute:

```bash
kill_tree $(cat signal.pid)
```

This function uses `SIGKILL` (`-9`) on every process; it is a forceful measure and should be reserved for situations where a clean shutdown is impossible. For routine termination, the simpler process‑group signal is preferred.

For added convenience, one can encapsulate the termination command in a shell function or alias that accepts the configuration file path, locates the corresponding PID file, and issues the appropriate kill signal. The recursive function may also be extended to accept a signal number as an argument, allowing for a graduated approach (e.g., first `SIGTERM`, then `SIGKILL` after a timeout).

## Conclusion

The use of `nohup`, process groups, and a dedicated launcher script represents a robust pattern for managing long‑running scientific simulations. By isolating the process from the terminal, capturing its PID, and providing a systematic way to terminate the entire process tree, we mitigate the risks of resource leaks and facilitate batch execution on shared computing infrastructures. The `runmg5.sh` script presented here exemplifies these principles while remaining adaptable to different input files and Python environments. Such practices are not specific to MadGraph but are broadly applicable to any command‑line driven computational workload that demands persistence, logging, and clean lifecycle management.
