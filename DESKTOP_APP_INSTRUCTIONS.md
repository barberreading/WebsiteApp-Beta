# Staff Management Desktop App - Installation Guide

## Overview
This guide will help you create an installable desktop application from the Staff Management web app using Electron.

## Prerequisites
- Node.js (version 14 or higher)
- npm (comes with Node.js)
- Git (optional, for cloning)

## Setup Instructions

### 1. Install Dependencies
First, make sure all dependencies are installed:
```bash
npm install
```

### 2. Development Mode
To run the desktop app in development mode:
```bash
# Start the backend and frontend servers first
npm run dev

# In a new terminal, start the Electron app
npm run electron
```

### 3. Building the Desktop App

#### For Windows:
```bash
npm run build:win
```
This creates a Windows installer (.exe) in the `dist` folder.

#### For macOS:
```bash
npm run build:mac
```
This creates a macOS app bundle (.dmg) in the `dist` folder.

#### For Linux:
```bash
npm run build:linux
```
This creates a Linux package (.AppImage) in the `dist` folder.

#### Build for All Platforms:
```bash
npm run build:all
```

## Distribution

### What Gets Created:
- **Windows**: `Staff Management Desktop Setup.exe` - Double-click to install
- **macOS**: `Staff Management Desktop.dmg` - Mount and drag to Applications
- **Linux**: `Staff Management Desktop.AppImage` - Make executable and run

### File Locations:
All built files will be in the `dist/` directory after building.

## User Installation

### Windows Users:
1. Download the `.exe` file
2. Double-click to run the installer
3. Follow the installation wizard
4. Launch from Start Menu or Desktop shortcut

### macOS Users:
1. Download the `.dmg` file
2. Double-click to mount the disk image
3. Drag the app to the Applications folder
4. Launch from Applications or Launchpad

### Linux Users:
1. Download the `.AppImage` file
2. Make it executable: `chmod +x Staff-Management-Desktop.AppImage`
3. Double-click to run, or run from terminal

## Features
- **Standalone App**: No need for a web browser
- **Auto-Updates**: Built-in update mechanism
- **Native Menus**: Platform-specific menu bars
- **System Integration**: Proper desktop integration
- **Offline Capable**: Works without internet (for local data)

## Troubleshooting

### Build Issues:
- Ensure all dependencies are installed: `npm install`
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check Node.js version: `node --version` (should be 14+)

### Runtime Issues:
- Check if ports 3001 and 3002 are available
- Ensure backend database is accessible
- Check console logs in the app (Ctrl+Shift+I or Cmd+Option+I)

### Permission Issues (macOS):
- If app won't open due to security: System Preferences > Security & Privacy > Allow
- For development: `sudo spctl --master-disable` (not recommended for production)

## Development Notes

### Project Structure:
```
├── electron.js          # Main Electron process
├── assets/             # App icons and resources
│   ├── icon.svg       # Vector icon
│   └── icon.png       # Raster icon
├── frontend/          # React frontend
├── backend/           # Express backend
└── dist/             # Built applications (after build)
```

### Configuration:
- App metadata is in the root `package.json`
- Build configuration is in the `build` section
- Electron settings are in `electron.js`

## Support
For issues or questions:
1. Check the troubleshooting section above
2. Review console logs for error messages
3. Ensure all prerequisites are met
4. Verify network connectivity for backend services

---

**Note**: The desktop app bundles both the frontend and backend, making it a complete standalone application that users can install and run without any technical setup.