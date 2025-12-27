# Time Impression - Visual Experiments

这是一个基于 React 和 Canvas 的高性能视觉交互实验合集。包含液态玻璃、动力学排版、引力模拟等多种效果。

## 📦 项目准备

在部署之前，请确保本地已安装 Node.js (v18+)。

1. **安装依赖**
   ```bash
   npm install
   ```

2. **本地开发**
   ```bash
   npm run dev
   ```

---

## 🚀 部署指南 (VPS Nginx)

目标：将项目部署到 `https://wildsalt.me/subdir/` (例如 `/art` 或 `/time-impression`)。

### 第一步：构建项目

运行以下命令，Vite 会根据 `vite.config.ts` 中的 `base: './'` 配置生成相对路径的静态文件。

```bash
npm run build
```

构建完成后，你会得到一个 `dist` 文件夹。

### 第二步：上传到 VPS

假设你的 VPS 网站根目录在 `/var/www/wildsalt.me/`。
我们需要将 `dist` 文件夹内的内容上传到 `/var/www/wildsalt.me/time-impression/`。

**使用 SCP (命令行):**
```bash
# 在项目根目录下执行
# 将 dist 重命名为 time-impression 并上传
scp -r dist/* root@<你的VPS_IP>:/var/www/wildsalt.me/time-impression/
```

或者使用 **FileZilla** 等 FTP 工具手动上传。

### 第三步：配置 Nginx (防止 404/500 错误)

这是最关键的一步。由于是单页应用 (SPA)，我们需要配置 Nginx 正确处理路由和 MIME 类型。

编辑你的 Nginx 配置 (通常在 `/etc/nginx/sites-available/wildsalt.me`):

```nginx
server {
    listen 80;
    server_name wildsalt.me;
    
    # 网站根目录
    root /var/www/wildsalt.me; 
    index index.html;

    # === 关键配置开始: 二级目录配置 ===
    location /time-impression/ {
        # 使用 alias 指向实际文件夹位置
        alias /var/www/wildsalt.me/time-impression/;
        
        # 尝试寻找文件，如果找不到，回退到 index.html
        # 这对于 React Router 是必须的 (虽然本项目主要是 Canvas，但加上是个好习惯)
        try_files $uri $uri/ /time-impression/index.html;
    }
    # === 关键配置结束 ===

    # ... 其他配置 ...
}
```

**保存并重启 Nginx:**
```bash
sudo nginx -t  # 检查配置是否有语法错误
sudo systemctl reload nginx
```

---

## 🤖 自动化部署 (GitHub Actions)

如果你想推送到 GitHub 自动部署，请在项目根目录创建 `.github/workflows/deploy.yml`。

**前置准备：**
1. 在 GitHub 仓库 -> Settings -> Secrets and variables -> Actions 中添加：
   - `HOST`: VPS IP 地址
   - `USERNAME`: VPS 用户名 (如 root)
   - `SSH_KEY`: 你的私钥内容 (cat ~/.ssh/id_rsa)

**workflow 文件内容：**

```yaml
name: Deploy to VPS

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install & Build
        run: |
          npm ci
          npm run build

      - name: Deploy via SCP
        uses: appleboy/scp-action@master
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          # 将构建产物 dist 下的所有文件，发送到 VPS 的目标文件夹
          source: "dist/*"
          target: "/var/www/wildsalt.me/time-impression/"
          strip_components: 1 # 去掉 dist 这一层级，直接放内容
```

---

## ⚡ 性能测试说明

本项目包含大量 Canvas 粒子和物理模拟，在不同设备上性能差异可能很大。

**测试建议：**
1. **桌面端 Chrome/Edge**: 应该能稳定跑满 60fps/144fps。
2. **移动端 (iOS Safari)**: 
   - 注意测试 **"LENS" (液态玻璃)** 效果，这非常消耗 GPU。
   - 注意测试 **"NEON"** 和 **"GALAXY"**，因为粒子数量较多。
3. **低电量模式**: 测试手机开启省电模式下的表现（通常会限制 requestAnimationFrame 的帧率）。

**常见问题排查：**
- **白屏**: 检查 F12 Console。通常是因为 Nginx 配置的路径不对，或者 `index.html` 引用的资源路径不是相对的（本项目已修复此问题）。
- **卡顿**: 如果 CPU 占用过高，尝试减少代码中常量的粒子数量 (如 `COUNT`, `PARTICLE_COUNT`)。
