# Setting Up WSL for Claude Code

Since Claude Code doesn't work directly on Windows, here's how to set up WSL (Windows Subsystem for Linux) to use it:

## Step 1: Install WSL2

Open PowerShell as Administrator and run:

```powershell
# Enable WSL feature
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart

# Enable Virtual Machine Platform
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart

# Restart your computer
Restart-Computer
```

After restart, install WSL2:

```powershell
# Download and install WSL2 kernel update
wsl --install

# Set WSL2 as default version
wsl --set-default-version 2

# Install Ubuntu (recommended)
wsl --install -d Ubuntu
```

## Step 2: Set Up Ubuntu in WSL

1. Launch Ubuntu from Start menu
2. Create a username and password when prompted
3. Update the system:

```bash
sudo apt update && sudo apt upgrade -y
```

## Step 3: Install Node.js in WSL

```bash
# Install Node.js using NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

## Step 4: Install Claude Code in WSL

```bash
# Install Claude Code globally
npm install -g @anthropic-ai/claude-code

# Verify installation
claude-code --version
```

## Step 5: Configure Claude Code

```bash
# Set up your API key
export ANTHROPIC_API_KEY="your_api_key_here"

# Add to ~/.bashrc for persistence
echo 'export ANTHROPIC_API_KEY="your_api_key_here"' >> ~/.bashrc
source ~/.bashrc
```

## Step 6: Access Your Windows Files

Your Windows files are accessible in WSL at `/mnt/c/`:

```bash
# Navigate to your project
cd "/mnt/c/Users/HP/Documents/_progile/Jogi AI/Energia DEMO/energia-ai-python"

# Run Claude Code on your project
claude-code .
```

## Alternative: VS Code with WSL Extension

Instead of Claude Code, you can use VS Code with WSL extension:

1. Install "Remote - WSL" extension in VS Code
2. Open your project folder in WSL mode
3. Use Claude integration through Cursor or VS Code extensions

## Pro Tips

1. **File Permissions**: Create projects in WSL home directory for better performance:
   ```bash
   # Create project in WSL
   mkdir ~/energia-ai-python
   cp -r "/mnt/c/Users/HP/Documents/_progile/Jogi AI/Energia DEMO/energia-ai-python"/* ~/energia-ai-python/
   ```

2. **Git Configuration**: Set up Git in WSL:
   ```bash
   git config --global user.name "Your Name"
   git config --global user.email "your.email@example.com"
   ```

3. **Python Setup**: Install Python in WSL:
   ```bash
   sudo apt install python3 python3-pip python3-venv
   ```

## Troubleshooting

- **WSL not starting**: Run `wsl --shutdown` and restart
- **Network issues**: Check Windows Defender firewall settings  
- **Performance**: Store files in WSL filesystem, not Windows mounted drives
- **Claude Code errors**: Ensure you're running from WSL terminal, not PowerShell

## Quick Test

Test your setup:

```bash
# In WSL terminal
echo $ANTHROPIC_API_KEY  # Should show your API key
claude-code --help       # Should show help text
```

Now you can use Claude Code on your Energia AI project! 