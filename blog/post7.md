# Parallelization

## Workers

```python
# parallelization.py
import os
import time
import subprocess
from concurrent.futures import ProcessPoolExecutor, FIRST_COMPLETED, wait

def format_time(seconds):
    if seconds < 60:
        return f"{seconds:.1f}s"
    m, s = divmod(seconds, 60)
    if m < 60:
        return f"{int(m)}m {int(s)}s"
    h, m = divmod(m, 60)
    return f"{int(h)}h {int(m)}m"

def parallel_runs(func, args_list, max_workers = None, info = "INFO"):
    total = len(args_list)
    pending = list(enumerate(args_list))
    futures = {}
    results = [None] * total
    completed = 0
    start = time.time()

    # get the number of cores
    # do not take numbers higher than actual numbers of cores
    if max_workers is None:
        max_workers = os.cpu_count()
    else:
        max_workers = min(max_workers, os.cpu_count())
        

    with ProcessPoolExecutor(max_workers=max_workers) as executor:
        # Launch the first batch
        while len(futures) < max_workers and pending:
            idx, args = pending.pop(0)
            futures[executor.submit(func, *args)] = idx

        # Print initial status (time = 0.0s)
        current_time = time.strftime("%Hh%Mm%Ss") 
        last_time_str = format_time(0.0)
        print(f"{info}:  Idle: {len(pending)},  Running: {len(futures)},  Completed: {completed} [ current time: {current_time} ]")

        while futures:
            done, _ = wait(futures, return_when=FIRST_COMPLETED)

            for future in done:
                idx = futures.pop(future)
                try:
                    results[idx] = future.result()
                except Exception as e:
                    results[idx] = e
                completed += 1
                if pending:
                    new_idx, new_args = pending.pop(0)
                    futures[executor.submit(func, *new_args)] = new_idx

            # Only print if the formatted time has changed (group by time slot)
            elapsed = time.time() - start
            time_str = format_time(elapsed)
            if time_str != last_time_str:
                print(f"{info}:  Idle: {len(pending)},  Running: {len(futures)},  Completed: {completed} [ {time_str} ]")
                last_time_str = time_str

    # Final print (ensures we show the very last state)
    final_time = format_time(time.time() - start)
    if final_time != last_time_str or completed == total:
        print(f"{info}:  Idle: {len(pending)},  Running: {len(futures)},  Completed: {completed} [ {final_time} ]")
    return results
```

The following script can be used for test:
```python
# test_func.py

import math

def compute_primes(limit):
    """Sieve of Eratosthenes – memory‑intensive + CPU‑heavy."""
    sieve = bytearray(b'\x01') * (limit + 1)
    sieve[0:2] = b'\x00\x00'
    for i in range(2, int(limit ** 0.5) + 1):
        if sieve[i]:
            step = i
            start = i * i
            sieve[start:limit+1:step] = b'\x00' * ((limit - start) // step + 1)
    return sum(sieve)   # count of primes

def heavy_flops():
    """Floating‑point heavy loop – billions of operations."""
    total = 0.0
    for i in range(1, 30_000_000):
        total += math.sqrt(i) * math.sin(i)
    return total

if __name__ == "__main__":
    prime_count = compute_primes(2_000_000)   # primes up to 2 million
    flops_result = heavy_flops()              # 30 million sqrt+sin
    print(f"Primes found: {prime_count}")
    print(f"Floating sum: {flops_result:.2f}")
```
The usage is as follows:
```python
import sys
from parallelization import parallel_runs

def run_script(index):
    log_filename = f"./logs/log{index}.log"
    with open(log_filename, "w") as log_file:
        cmd = [sys.executable, "test_func.py"]
        return subprocess.run(cmd, stdout=log_file, stderr=subprocess.STDOUT).returncode

args_list = [(i,) for i in range(100)]
results = parallel_runs(run_script, args_list, max_workers=None, info="Testing jobs")
```

And this will me the main method we use latter for parallelization for Delphes runs and making datasets for our analysis.


## Pythia8-Delphes Parallelization

### Preparing Input

Usually when we write some code to split a mother `.hepmc` file into $N$ `.hepmc` sliced, the code that does this must keep track of the daughter slicies directories on the disk. However, for another scenario where we are directly given the `.hepmc` sclies and asked to run some method on parrallel then the first step one should do is collect the directories of those slices into a set for later application. The following command can be used for this purpose in the terminal:
```bash
$ find . -maxdepth 4 -type f -name "*.hepmc"
```
where maxdepth decides how deep you want to search for the `.hepmc` files in the specified directory `.` given for this example. If all the `.hepmc` are already present in one directory then you can either remove `-maxdepth 4` or set it to `1`. And if they embedded deeper in-between different directories and files then you can adjust the maxdepth accordingly. This command is often very useful for outputs from MadGraph5, where the `.hepmc` files are usually placed in directories such as `/vvv/Events/run_01/tag_1_pythia8_events.hepmc`. This command will print the relative path to the directory, to print the full path one can use
```bash
$ find . -maxdepth 4 -type f -name "*.hepmc" -exec realpath {} \;
```
instead.
Now we can move all the `.hepmc` into one directory with;
```bash
$ mkdir hepmcFiles
$ find . -maxdepth 4 -type f -name "*.hepmc" -exec bash -c 'f="$(realpath "$1")"; f="${f#/}"; mv "$1" "hepmcFiles/${f//\//_}"' _ {} \;
```
If two `.hepmc` files have the same name in different subdirectories, moving them both to `./hepmcFiles` will overwrite the first with the second. To avoid that, each `.hepmc` is renamed, for example, into `data_ammelsayed_stuff_vvv_Events_run_01_tag_1_pythia8_events.hepmc`. This moving should be very quick, it toke less than a second for moving 6.7 TB of hepmc files with me. Now all the hepmc files are in the `./hepmcFiles` directory, one can use the following python line to track the directories:
```python
import os
paths = os.listdir('hepmcFiles')
print(paths)
```
Additioanly, one can directly construct the list of `.hepmc` files directories directly without moving anything around with the following lines of python code:
```python
import subprocess

def get_paths(directory, ends_with = ".hepmc", max_depth = 4):
    command = f'find {directory} -maxdepth {max_depth} -type f -name "*{ends_with}" -exec realpath {{}} \;'
    result = subprocess.run(command, shell=True, capture_output=True, text=True)
    return result.stdout.splitlines()

print(get_paths("."))
```
Or if you do not want use commands at all you can use the following methods
```python
import os
from pathlib import Path

# Only avaliable for python 3.12+
def find_files_new(directory, ends_with=".root", max_depth=2):
    directory = Path(directory).resolve()
    found = set()
    for root, dirs, files in directory.walk():
        depth = len(root.relative_to(directory).parts)
        if depth >= max_depth:
            dirs[:] = []  # don't descend further
        for f in files:
            if f.endswith(ends_with):
                found.add(root / f)
    return sorted(found)

# Works for all python versions
def find_files(directory, ends_with=".root", max_depth=2):
    directory = os.path.abspath(directory)
    found = set()
    for root, dirs, files in os.walk(directory):
        depth = root[len(directory):].count(os.sep)
        if depth >= max_depth:
            dirs[:] = []  # don't descend further
        for f in files:
            if f.endswith(ends_with):
                found.add(os.path.join(root, f))  
    return sorted(found)

```

### Running Delphes parrallel jobs

```python
# run_delphes.py
import os
import subprocess
from ROOT import gInterpreter, gSystem
from ROOT import __version__ as rootVersion
from parallelization import parallel_runs, find_files
DELPHES_PATH = os.environ.get("DELPHES_HOME", "/home/ammelsayed/softwares/MG5_aMC_v3_7_1/Delphes")
gInterpreter.AddIncludePath(DELPHES_PATH)
gInterpreter.AddIncludePath(f"{DELPHES_PATH}/classes")
gInterpreter.AddIncludePath(f"{DELPHES_PATH}/external")
gSystem.Load("libDelphes")
gInterpreter.Declare('#include "classes/DelphesClasses.h"')
gInterpreter.Declare('#include "classes/SortableObject.h"')
gInterpreter.Declare('#include "external/ExRootAnalysis/ExRootTreeReader.h"')
print("Using ROOT version:", rootVersion)
print("Using Delphes libraries found at:", DELPHES_PATH)

def check_hepmc(path):
    p = Path(path)
    return p.is_file() and p.stat().st_size > 0

def get_custom_name(path):
    p = Path(path)
    return f"{p.parents[2].name}_{p.parent.name}"

def run_delphes(hepmc_path, delphes_card, output_dir, exe, overwrite=True, auto_remove_hepmc = True):
    out = Path(output_dir)
    name = get_custom_name(hepmc_path)
    root_out = out / f"{name}.root"   
    log_out = out / f"{name}.log"
    if root_out.exists() and not overwrite:
        return 0

    cmd = [exe, str(delphes_card), str(root_out), str(hepmc_path)]
    with open(log_out, "w") as log:

        result = subprocess.run(cmd, stdout=log, stderr=subprocess.STDOUT)
    
        # Delete HEPMC file only if Delphes succeeded
        if result.returncode == 0 and auto_remove_hepmc:
            try:
                os.remove(hepmc_path)
            except OSError as e:
                log.write(f"Warning: Could not delete {hepmc_path}: {e}\n")

        return result.returncode

if __name__ == "__main__":

    exe = os.path.join(DELPHES_PATH, "DelphesHepMC2")
    card = "./Cards/delphes_card.tcl"
    outdir = "./root_files"
    nb_cores_delphes = 15

    os.makedirs(outdir,exist_ok=True)
    files = [f for f in find_files(".", ends_with=".hepmc", max_depth=3) if check_hepmc(f)]
    args_list = [(f,card,outdir,exe) for f in files]
    parallel_runs(run_delphes, args_list, max_workers=nb_cores_delphes, info="Delphes jobs")
```

The output will be something like:
```text
Using ROOT version: 6.36.08
Using Delphes libraries found at: /home/ammelsayed/softwares/MG5_aMC_v3_7_1/Delphes
Delphes jobs:  Idle: 0,  Running: 1,  Completed: 0 [ current time: 19h58m34s ]
Delphes jobs:  Idle: 0,  Running: 0,  Completed: 1 [ 1h 16m ]
Delphes jobs:  Idle: 0,  Running: 0,  Completed: 1 [ 1h 16m ]
```

> [!TIP] 
>  The following command:
> ```bash
> find . -maxdepth 4 -type f -name "*.root" -exec realpath {} \; | awk '{print "  - " $0}'
> ```
> is often very useful when you are building a yaml file for `.root` files directories of some processes.