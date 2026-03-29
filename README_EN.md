# GLM Plan Widget

<div align="center">

<img src="https://raw.githubusercontent.com/Huazeu/glm-plan-widget/master/public/icons.svg" alt="GLM Plan Widget" width="128" height="128" />

**Zhipu GLM Coding Plan Desktop Widget** — Lightweight, Real-time, Beautiful

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Electron](https://img.shields.io/badge/Electron-41.0.3-47848F?style=flat-square&logo=electron)](https://electronjs.org/)

*English | [简体中文](./README.md)*

</div>

---

## ✨ Features

- **📊 Usage Overview** — Real-time view of model and tool usage for today/week/month
- **📈 Trend Charts** — Visualize usage trends over time
- **🔔 System Tray** — Minimize to tray, monitor quota anytime
- **⚙️ Flexible Config** — Support custom API URL and Token
- **🎨 Beautiful UI** — Frosted glass style, delightful to use
- **💨 Lightweight & Fast** — Built with Electron + React

## 🚀 Quick Start

### Download & Install

Download the latest version from [Releases](https://github.com/Huazeu/glm-plan-widget/releases):

```
GLM_Plan_Widget.exe  # Windows portable (no installation needed)
```

> Just double-click to run. You'll need to configure your Zhipu API Token on first use.

### Build from Source

```bash
# Clone the project
git clone https://github.com/Huazeu/glm-plan-widget.git
cd glm-plan-widget

# Install dependencies
npm install

# Development mode
npm run dev

# Build & Package
npm run dist
```

## 📖 Usage Guide

### 1. Get Token

This app uses **Bearer Token** from Zhipu's web interface (not API Key). Here's how to get it:

#### Method 1: From Browser DevTools (Recommended)

1. Log in to [Zhipu AI Chat](https://chat.chatglm.cn/)
2. Press `F12` to open Developer Tools
3. Switch to **Network** tab
4. Send a message in the chat
5. Find any API request in the list (e.g., `model-usage`)
6. Look for the `Authorization` header, copy its value (format: `Bearer xxxx...`)
7. Only copy the part after `Bearer `

#### Method 2: From LocalStorage

1. Log in to [Zhipu AI Chat](https://chat.chatglm.cn/)
2. Press `F12` to open Developer Tools
3. Switch to **Application** tab
4. Select **Local Storage** → `https://chat.chatglm.cn`
5. Find `Authorization` or `HIGPT_TOKEN` field
6. Copy the corresponding value

### 2. Configure Widget

1. Click the ⚙️ Settings icon in the top-right corner
2. Paste your Token
3. Click Save

### 3. View Usage

- **Model Usage** — Dialogue, completion and other model API consumption
- **Tool Usage** — Web search, web reading, GitHub and other MCP tool consumption
- **Time Range** — Switch between Today/This Week/This Month

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| [Electron](https://electronjs.org/) | Desktop app framework |
| [React 19](https://react.dev/) | UI rendering |
| [Vite 8](https://vitejs.dev/) | Build tool |
| [TailwindCSS](https://tailwindcss.com/) | Styling framework |
| [Recharts](https://recharts.org/) | Data visualization |

## 🏗️ Project Structure

```
glm-plan-widget/
├── electron/
│   ├── main.ts          # Electron main process
│   └── preload.ts      # Preload script (IPC)
├── src/
│   ├── api.ts          # API logic
│   ├── App.tsx         # Main app component
│   └── index.css       # Global styles
├── public/
│   └── icons.svg       # App icon
├── package.json
├── vite.config.ts
└── README.md
```

## 🔧 Configuration

### API Proxy

Due to browser CORS restrictions, this app encapsulates API requests in the Electron main process to ensure stable and secure data fetching.

### Custom API URL

For private deployment versions of Zhipu, you can modify the Base URL in settings:

```
Default: https://open.bigmodel.cn
Private: https://your-private-api.com
```

## 📝 License

This project is open source under the [MIT License](LICENSE).

## 🙏 Acknowledgements

- [Zhipu AI](https://www.zhipuai.cn/) — GLM Coding Plan API provider
- [Electron](https://electronjs.org/) — Cross-platform desktop framework
- [Vite](https://vitejs.dev/) — Lightning fast build tool

---

<div align="center">

**If you find this project helpful, feel free to ⭐ Star!**

</div>
