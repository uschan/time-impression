
# Time Impression

**Time Impression** 是一个探索时间、记忆与熵的交互式视觉实验合集。

本项目基于 React、TypeScript 和 HTML5 Canvas / WebGL 构建，包含 20 多个独立的物理模拟和视觉特效，旨在通过代码呈现时间的流逝、记忆的模糊以及秩序的崩塌。

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/react-18.x-61dafb.svg)
![TypeScript](https://img.shields.io/badge/typescript-5.x-3178c6.svg)
![Vite](https://img.shields.io/badge/vite-5.x-646cff.svg)

## ✨ 特性

- **高性能渲染**：混合使用 Canvas 2D API 和 WebGL (Three.js / React-Three-Fiber) 实现流畅的视觉效果。
- **PWA 支持**：支持离线访问，可安装至桌面或移动端主屏幕。
- **响应式设计**：适配桌面端鼠标交互与移动端触摸操作。
- **模块化架构**：每个视觉效果作为独立模块封装，易于扩展。

## 🎨 视觉效果索引

项目包含以下核心视觉模块：

### 2D 物理与粒子
- **Pendulum (Impression)**: 摆锤擦除与重写，隐喻记忆的消逝。
- **Ember**: 燃烧的文字余烬，模拟不可逆的热力学过程。
- **Fluid**: 磁性流体网格模拟。
- **Erosion**: 基于重力的文字坍塌与堆积。
- **Textile (Whalefall)**: 可撕裂、可交互的织物模拟。
- **Spore**: 有机生长与扩散算法。

### 抽象与光影
- **Vapor**: 窗户凝结水汽与雨滴折射模拟。
- **Neon**: 赛博朋克风格的雨滴与烟花粒子。
- **Eclipse**: 体积光与动态阴影遮挡。
- **Bloom**: 柔和的色彩晕染与花朵绽放效果。
- **Noir**: 黑色电影风格的烟雾与聚光灯效果。
- **Lens**: 软体液态透镜与色差折射。

### 排版与信号
- **Kinetic**: 响应式动能排版。
- **Signal**: 数字信号故障 (Glitch) 与 CRT 扫描线效果。
- **Syntax**: 漂浮的数学符号与波浪弦线。
- **Ripple**: 水波纹反射与 RGB 色散。

### 3D 体验 (WebGL)
- **Temporal**: 3D 粒子云与时间胶囊。
- **Harmonic**: 谐振粒子流与深空氛围。
- **Orb**: 斐波那契球体与元素周期表可视化。

## 🛠️ 技术栈

- **核心框架**: React 18, TypeScript
- **构建工具**: Vite
- **图形库**: 
  - HTML5 Canvas (2D Context)
  - Three.js
  - @react-three/fiber (R3F)
  - @react-three/drei
- **样式**: Tailwind CSS
- **PWA**: vite-plugin-pwa

## 🚀 快速开始

### 安装依赖

```bash
npm install
```

### 本地开发

启动本地开发服务器：

```bash
npm run dev
```

访问 `http://localhost:5173` 即可查看效果。

### 构建生产版本

```bash
npm run build
```

构建产物将输出至 `dist` 目录。

## 📱 PWA 说明

本项目已配置 PWA。在生产环境中构建后：
1. 浏览器地址栏会出现安装图标。
2. 支持离线缓存关键资源。
3. 移动端支持 "添加到主屏幕" 体验。

## 部署配置 (Nginx)

如果您部署在 Nginx 服务器上，请确保正确配置 MIME 类型以避免模块加载错误，并处理 SPA 路由：

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/dist;
    index index.html;

    # 关键：显式包含 MIME 类型
    include /etc/nginx/mime.types;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # 可选：缓存静态资源
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, no-transform";
    }
}
```

## 📄 许可证

MIT License
