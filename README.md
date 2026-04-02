# SAP Quick Launcher

A fast, modern SAP connection manager built with Tauri v2 + React + TypeScript + TailwindCSS.

## Features

- 🚀 Quick launch SAP GUI via `sapshcut.exe`
- 🔐 Secure password storage
- 🏷️ Environment tags (PRD/QAS/DEV)
- 🎨 Dark/Light theme support
- 🌐 Chinese/English language
- ⌨️ Global shortcut `Ctrl+Shift+S`
- 📦 System tray support

## Tech Stack

- **Framework**: Tauri v2 (Rust backend + Web frontend)
- **Frontend**: React 18 + TypeScript + TailwindCSS
- **Storage**: Tauri Store plugin (JSON)
- **Build**: Windows .exe

## Development

```bash
# Install dependencies
npm install

# Run dev server
npm run tauri dev

# Build for production
npm run tauri build
```

## SAP Command Format

```
sapshcut.exe -user="%username%" -pw="%password%" -language=%lang% -SYSTEM=%system% -CLIENT=%client% -sysname="%sysname%" -maxgui
```

## Project Structure

```
sap-quick-launcher/
├── src/                    # React frontend
│   ├── components/         # UI components
│   ├── hooks/              # Custom hooks
│   ├── types/              # TypeScript types
│   ├── App.tsx             # Main app
│   └── main.tsx            # Entry point
├── src-tauri/              # Rust backend
│   ├── src/
│   │   ├── main.rs         # Entry
│   │   └── lib.rs          # Logic
│   ├── Cargo.toml
│   └── tauri.conf.json
├── package.json
└── tailwind.config.js
```
