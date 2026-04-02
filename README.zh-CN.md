# SAP Quick Launcher

一款现代化、专业级的 SAP 连接管理工具，帮助 SAP 顾问高效管理多环境系统连接。

## 功能特性

- 🚀 **一键启动** - 告别繁琐的登录流程，快速启动 SAP GUI 连接
- 🔐 **安全存储** - 凭证本地加密存储，绝不上传云端
- 🏷️ **多环境管理** - PRD/QAS/DEV 环境一目了然，标签快速区分
- 🎨 **精美界面** - 深色/浅色主题自由切换
- 🌐 **双语支持** - 中文/英文界面
- ⌨️ **全局快捷键** - 随时呼出应用，保持工作流连贯
- 📦 **系统托盘** - 最小化到托盘，不打扰正常工作

## 技术栈

- **框架**: Tauri v2 (Rust 后端 + Web 前端)
- **前端**: React 18 + TypeScript + TailwindCSS
- **存储**: Tauri Store 插件 (本地 JSON)
- **打包**: Windows .exe / .msi

## 快速开始

```bash
# 安装依赖
npm install

# 开发模式
npm run tauri dev

# 生产构建
npm run tauri build
```

## SAP 启动命令格式

```
sapshcut.exe -user="%username%" -pw="%password%" -language=%lang% -SYSTEM=%system% -CLIENT=%client% -sysname="%sysname%" -maxgui
```

## 项目结构

```
sap-quick-launcher/
├── src/                    # React 前端
│   ├── components/         # UI 组件
│   ├── hooks/              # 自定义 Hooks
│   ├── types/              # TypeScript 类型
│   ├── App.tsx             # 主应用
│   └── main.tsx            # 入口文件
├── src-tauri/              # Rust 后端
│   ├── src/
│   │   ├── main.rs         # 入口
│   │   └── lib.rs          # 业务逻辑
│   ├── Cargo.toml
│   └── tauri.conf.json
├── package.json
└── tailwind.config.js
```

## 下载

从 [GitHub Releases](https://github.com/zyhcs/Sap-Quick-Launcher/releases) 下载最新版本。

## 许可证

MIT License
