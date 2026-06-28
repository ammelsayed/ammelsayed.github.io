# Parralization


## Pythia8-Delphes Parralization

### Preparing Input

Usually when we write some code to split a mother `.hepmc` file into $N$ `.hepmc` sliced, the code that does this must keep track of the daughter slicies directories on the disk. However, for another scenario where we are directly given the `.hepmc` sclies and asked to run some method on parrallel then the first step one should do is collect the directories of those slices into a set for later application. The following command can be used for this purpose in the terminal:
```bash
$ find . -maxdepth 4 -type f -name "*.hepmc"
```
where maxdepth decides how deep you want to search for the `.hepmc` files in the specified directory `.` given for this example. If all the `.hepmc` are already present in one directory then you can either remove `-maxdepth 4` or set it to `1`. And if they embedded deeper in-between different directories and files then you can adjust the maxdepth accordingly. This command is often very useful for outputs from MadGraph5, where the `.hepmc` files are usually placed in directories such as `/vvv/Events/run_01/tag_1_pythia8_events.hepmc`. This command will print the relative path to the directory, to print the full path one can use
```bash
$ find . -maxdepth 4 -type f -name "*.hepmc" -exec realpath {} \;
```
insread.
Now we can either move all the `.hepmc` into one directory with;
```bash
$ mkdir hepmcFiles
$ find . -maxdepth 4 -type f -name "*.hepmc" -exec bash -c 'f="$(realpath "$1")"; f="${f#/}"; mv "$1" "hepmcFiles/${f//\//_}"' _ {} \;
```
If two `.hepmc` files have the same name in different subdirectories, moving them both to `./hepmcFiles` will overwrite the first with the second. To avoid that, each `.hepmc` is renamed, for example, into `/data_ammelsayed_stuff_vvv_Events_run_01_tag_1_pythia8_events.hepmc`. This moving should be very quick, it toke less than a second for moving 6.7 TB of hepmc files with me. Now all the hepmc files are in the `./hepmcFiles` directory, one can use the following python line to track the directories:
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
