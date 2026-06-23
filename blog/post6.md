# Setup Process for Passwordless SSH in VSCode

Typing your SSH password every time you connect to a remote server via VSCode's Remote‑SSH extension is tedious and interrupts your workflow. This guide walks you through a quick, three‑step process to set up public‑key authentication, allowing you to log in seamlessly without entering a password. The steps below assume a Windows 11 client and a Ubuntu server, but the approach works across all platforms.

## Step 1: Generate SSH Key Pair

Open **Command Prompt (CMD)** on your Windows machine and run the following command:

```bash
ssh-keygen -t rsa
```

Press **Enter** all the way through to accept the default settings (you can optionally set a passphrase for extra security, but for this guide, we'll keep it empty). Once complete, you'll find two files in the `C:\Users\YourUsername\.ssh` directory:

- `id_rsa` — your private key 
- `id_rsa.pub` — your public key 


## Step 2: Copy the Public Key

Run the following command to display the contents of your public key:

```bash
cat ~/.ssh/id_rsa.pub
```

The output will show your entire public key. The content looks something like: `ssh-rsa AAAAB3NzaC1yc2EAAA...`. Select all of the displayed text and copy it to your clipboard. 


## Step 3: Add the Public Key to Your SSH Server

Now switch over to your **Ubuntu terminal** on SSH. Run the following commands:

```bash
# Create the .ssh directory if it doesn't already exist
mkdir ~/.ssh

# Append your public key to the authorized_keys file
echo "ssh-rsa AAAAB3NzaC1yc2EAAA..." >> ~/.ssh/authorized_keys

# Set proper permissions (optional but recommended)
chmod 600 ~/.ssh/authorized_keys
```

Make sure to replace `"ssh-rsa AAAAB3NzaC1yc2EAAA..."` with the actual public key you copied from Windows.

## Step 4: Restart VSCode and Test

Close and reopen **VSCode**. Try connecting to your remote server via the **Remote-SSH** extension again. You should now be able to log in **without entering a password**!

## Security Note

The setup above works, but it has a risk. Your private key (`id_rsa`) is stored on your laptop without a passphrase. If someone breaks into your laptop, they can copy that key and log into your server without any password. That is a big problem. Here are two better and widely used approaches that fix this:

1. **Passphrase + ssh-agent with a timeout** – Create your key with a passphrase. Then use `ssh-add -t 3600` to load the key into the agent for only one hour. After that, you need to enter the passphrase again. This way, your key is encrypted on disk, and even if your laptop is hacked, the key is not sitting in memory forever. 
   - Tutorial: [Using SSH keys and SSH agent](https://www.ens-lyon.fr/PSMN/Documentation/connection/ssh_keys_and_agent.html)

2. **Hardware security key (like YubiKey)** – Generate your key with `ssh-keygen -t ed25519-sk`. The private key never leaves the hardware device. Even if your laptop is fully compromised, the attacker cannot copy your key because it is physically locked inside the USB key.
   - Tutorial: [SSH with Yubikey - Quick Start Guide](https://wiki.bwhpc.de/wiki/index.php?title=Registration/SSH/SSH-FIDO2-Quick-Start&oldid=15537)
   - Official guide: [Securing SSH Authentication with FIDO2 Security Keys](https://developers.yubico.com/SSH/Securing_SSH_with_FIDO2.html)

Use any of these if you care about security beyond basic passwordless login.
