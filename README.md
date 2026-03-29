# GLM Plan Widget

<div align="center">

<img src="https://raw.githubusercontent.com/Huazeu/glm-plan-widget/master/public/icons.svg" alt="GLM Plan Widget" width="128" height="128" />

**智谱 GLM Coding Plan 桌面小部件** — 轻量、实时、美观

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Electron](https://img.shields.io/badge/Electron-41.0.3-47848F?style=flat-square&logo=electron)](https://electronjs.org/)

*简体中文 | [English](./README_EN.md)*

</div>

---

## ✨ 功能特性

- **📊 用量概览** — 实时查看当日/本周/本月的模型调用和工具调用次数
- **📈 趋势图表** — 可视化展示用量变化趋势
- **🔔 系统托盘** — 最小化到托盘，随时监控配额状态
- **⚙️ 灵活配置** — 支持自定义 API 地址和 Token
- **🎨 精美界面** — 毛玻璃风格，赏心悦目
- **💨 轻量快速** — Electron + React，开箱即用

## 🚀 快速开始

### 下载安装

从 [Releases](https://github.com/Huazeu/glm-plan-widget/releases) 页面下载最新版本：

```
GLM_Plan_Widget.exe  # Windows 便携版 (无需安装)
```

> 双击运行即可。首次使用需要配置您的智谱 API Token。

### 从源码构建

```bash
# 克隆项目
git clone https://github.com/Huazeu/glm-plan-widget.git
cd glm-plan-widget

# 安装依赖
npm install

# 开发模式
npm run dev

# 构建打包
npm run dist
```

## 📖 使用指南

### 1. 获取 Token

本应用使用智谱网页端的 **Bearer Token**（不是 API Key），需要从浏览器获取：

#### 方式一：从浏览器开发者工具获取（推荐）

1. 登录 [智谱 AI 对话平台](https://chat.chatglm.cn/)
2. 按 `F12` 打开开发者工具
3. 切换到 **Network（网络）** 标签
4. 随便发送一条消息
5. 在请求列表中找到任意一个 API 请求（如 `model-usage`）
6. 在请求头中找到 `Authorization` 字段，复制其值（格式：`Bearer xxxx...`）
7. 只需要 `Bearer` 后面的那串字符

#### 方式二：从 LocalStorage 获取

1. 登录 [智谱 AI 对话平台](https://chat.chatglm.cn/)
2. 按 `F12` 打开开发者工具
3. 切换到 **Application（应用）** 标签
4. 左侧选择 **Local Storage** → `https://chat.chatglm.cn`
5. 找到 `Authorization` 或 `HIGPT_TOKEN` 字段
6. 复制对应的值

### 2. 配置小部件

1. 点击小部件右上角 ⚙️ 设置图标
2. 粘贴您的 Token
3. 点击保存

### 3. 查看用量

- **模型调用** — 对话、补全等模型 API 消耗
- **工具调用** — 联网搜索、网页阅读、GitHub 等 MCP 工具消耗
- **时间范围** — 切换今日/本周/本月数据

## 🛠️ 技术栈

| 技术 | 用途 |
|------|------|
| [Electron](https://electronjs.org/) | 桌面应用框架 |
| [React 19](https://react.dev/) | UI 渲染 |
| [Vite 8](https://vitejs.dev/) | 构建工具 |
| [TailwindCSS](https://tailwindcss.com/) | 样式框架 |
| [Recharts](https://recharts.org/) | 数据可视化 |

## 🏗️ 项目结构

```
glm-plan-widget/
├── electron/
│   ├── main.ts          # Electron 主进程
│   └── preload.ts      # 预加载脚本 (IPC 通信)
├── src/
│   ├── api.ts          # API 调用逻辑
│   ├── App.tsx         # 主应用组件
│   └── index.css       # 全局样式
├── public/
│   └── icons.svg       # 应用图标
├── package.json
├── vite.config.ts
└── README.md
```

## 🔧 配置说明

### API 代理说明

由于浏览器 CORS 限制，本应用在 Electron 主进程中封装了 API 请求代理，以确保数据获取的稳定性和安全性。

### 自定义 API 地址

如果您使用智谱私有化部署版本，可在设置中修改 Base URL：

```
默认: https://open.bigmodel.cn
私有化: https://your-private-api.com
```

## 📝 开源协议

本项目基于 [MIT License](LICENSE) 开源。

## 🙏 致谢

- [智谱 AI](https://www.zhipuai.cn/) — 提供 GLM Coding Plan API
- [Electron](https://electronjs.org/) — 跨平台桌面应用框架
- [Vite](https://vitejs.dev/) — 极速构建工具

---

<div align="center">

**如果你觉得这个项目有帮助，欢迎 ⭐ Star！**

</div>
