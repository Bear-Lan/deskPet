# DeskPet - 多啦A梦桌面宠物

一个可爱的桌面宠物应用，悬浮在桌面上，可以拖拽移动、投喂食物。

## 功能特性

- **悬浮桌面** - 透明背景 + 窗口置顶 + 无边框，悬浮在桌面最上层
- **拖拽移动** - 鼠标左键拖拽移动宠物位置
- **投喂功能** - 右键菜单选择食物投喂 (苹果、铜锣烧、糖果、鱼)
- **托盘图标** - 点击托盘显示/隐藏宠物，右键菜单
- **开机自启动** - 默认开启，开机自动运行
- **位置记忆** - 记住宠物位置，重启后保持
- **状态动画** - idle/eating/happy/sleeping等状态
- **单exe部署** - 打包后直接复制到其他电脑运行

## 技术栈

| 组件 | 技术 | 说明 |
|------|------|------|
| 桌面框架 | Tauri 2.x | 轻量级桌面应用框架 |
| 前端框架 | React + TypeScript | Web技术写UI |
| 构建工�� | Vite | 前端开发服务器/打包 |
| 后端语言 | Rust | 系统级交互、性能 |
| 编译器 | MSVC (VS Build Tools) | 编译Rust依赖 |

## 项目结构

```
deskPet/
├── src/                      # React前端源码
│   ├── App.tsx              # 主应用组件 (宠物/投喂/拖拽)
│   ├── App.css              # 样式
│   └── main.tsx             # React入口
├── src-tauri/               # Tauri后端 (Rust)
│   ├── src/
│   │   ├── lib.rs          # 主逻辑 (托盘/自启动/位置)
│   │   └── main.rs         # 程序入口
│   ├── Cargo.toml          # Rust依赖
│   ├── tauri.conf.json     # Tauri配置 (窗口/打包)
│   └── icons/              # 应用图标
├── public/                  # 静态资源
│   ├── idle.gif            # 空闲动画
│   ├── eating.gif          # 进食动画
│   ├── happy.gif           # 开心动画
│   └── sleeping.gif        # 睡觉动画
└── package.json            # Node依赖
```

## 环境要求

- **Node.js** 18+
- **Rust** (stable, MSVC工具链)
- **Visual Studio Build Tools** (勾选"使用C++的桌面开发")
- **Windows 10/11** (需要WebView2，Win11自带)

## 安装依赖

```bash
cd deskPet
npm install
```

## 开发运行

```bash
npm run tauri dev
```

开发模式会：
1. 启动Vite开发服务器 (localhost:1420)
2. 编译Rust后端
3. 启动应用窗口

## 打包发布

```bash
npm run tauri build
```

打包后输出：
```
src-tauri/target/release/bundle/nsis/DeskPet_1.0.0.exe
```

这是一个安装包，可以直接运行安装。

## 动画资源

将以下GIF放入 `public/` 目录：

| 文件 | 说明 | 建议规格 |
|------|------|---------|
| `idle.gif` | 空闲状态 (循环) | 256x256, 透明背景 |
| `eating.gif` | 进食状态 | 256x256, 播放一次 |
| `happy.gif` | 开心/被点击 | 256x256, 播放一次 |
| `sleeping.gif` | 睡觉状态 | 256x256, 循环 |

## 交互说明

| 操作 | 效果 |
|------|------|
| 左键点击宠物 | 播放开心动画 |
| 左键拖拽宠物 | 移动位置，松开后播放开心动画 |
| 右键点击宠物 | 显示投喂菜单 |
| 点击投喂食物 | 播放进食动画 → 开心动画 → 回到空闲 |
| 30秒无操作 | 进入睡眠状态 |
| 点击托盘图标 | 显示/隐藏宠物 |
| 托盘右键菜单 | 显示/隐藏、退出 |

## 配置文件

### tauri.conf.json

主要配置项：
- `windows.transparent` - 透明窗口
- `windows.alwaysOnTop` - 窗口置顶
- `windows.decorations` - 无边框
- `windows.skipTaskbar` - 隐藏任务栏

### Cargo.toml

关键依赖：
- `tauri-plugin-autostart` - 开机自启动
- `tauri-plugin-store` - 数据持久化
- `tray-icon` - 系统托盘

## 常见问题

### Q: 提示 "link.exe not found"
A: 需要安装 Visual Studio Build Tools，选择"使用C++的桌面开发"

### Q: 提示 "dlltool not found"
A: 使用MSVC工具链编译，不要用GNU工具链

### Q: 编译报错 "export ordinal too large"
A: MSYS2的MinGW和Tauri依赖不兼容，使用VS Build Tools + MSVC

### Q: 其他电脑运行需要装什么
A: Windows 10需要装 WebView2 Runtime (https://developer.microsoft.com/en-us/microsoft-edge/webview2/)

## 相关资源

- [Tauri文档](https://tauri.app/)
- [Rust语言](https://www.rust-lang.org/)
- [React文档](https://react.dev/)
- [WebView2下载](https://developer.microsoft.com/en-us/microsoft-edge/webview2/)
- [VS Build Tools下载](https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022)