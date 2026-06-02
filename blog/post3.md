# CERN ROOT Installation on Windows 11 and Ubuntu 22.04

I wrote this because I found it challenging to successfully install and use ROOT on windows. After I successfully installed ROOT on my Windows 11 OS, I re-examined by steps to arrive at the most efficient way to install ROOT, so I wrote this document hoping it can help others facing same problem.

---

## (1) CERN ROOT installation on Windows 11

📄 [PDF: Windows 11 Installation Guide](/images/CERN%20ROOT%20installation%20on%20WIn11.pdf)

### (I) INSTALLING ROOT AND OTHER REQUIRED PROGRAMS:

To use ROOT, make sure to install:

* Go to download latest release of CERN ROOT at official website: [Releases - ROOT](https://root.cern/install/all_releases/). In the binary Binary distributions area download the Windows Visual Studio 2022 64-bit x64 version. Make sure to add ROOT to path for current user and select Full installation in the `.exe` file installing process.
* **CMake :** Latest stable version available from official website; [https://cmake.org/download/](https://cmake.org/download/). In the binary distributions area download the Windows x64 Installer version (`.msi`) file.
* **Microsoft Visual C++:** The Community version is free (download at [https://visualstudio.microsoft.com/downloads/](https://visualstudio.microsoft.com/downloads/)). The Desktop Development With C++ workload must be selected. Normally after selecting Desktop Development With C++, the installer will automatically select some optional features, most of them are unnecessary which can be unselected, BUT, must include the first option and **Windows 11 SDK** as shown in figure below.

![ROOT Installation](/images/post3-Picture1.png)

Now u can either open ROOT by clicking the shortcut on start menu, or from windows Terminal by calling:

```bash
root
```

### (II) IMPORTANT NOTES ABOUT PyROOT:

Apparently to use PyROOT you must download and use same python3 version on your computer as used by the ROOT framework you installed. Every ROOT version you will find on the official website inhabits different python3 versions. In the case of v6.30.06 used as example in the document, the implemented python3 version in framework was 3.11.7. I know by calling the following code in terminal:

```bash
root-config --python-version
```

![ROOT Config](/images/post3-Picture2.png)

If you have different python version installed you must head to python official website to download and install EXACTLY same version edition.

AFTER INSTALLING SAME PYTHON VERSION: You can now call ROOT functions in .py file by importing code using `import ROOT`. However, you will notice that you will get error `ModuleNotFoundError: No module named 'ROOT'` if your .py file is not located in `root\bin` directory at your disk. To avoid this problem, remember to add the following lines of code before `import ROOT`:

```python
## Finding PyROOT
import sys
root_path = r'C:/root/bin' # change your path if u installed ROOT elsewhere
sys.path.append(root_path)
```

---

## (2) CERN ROOT Installation on Ubuntu 22.04

*(Content coming soon for Ubuntu installation!)*
