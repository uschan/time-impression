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

目标：将项目部署到 `https://wildsalt.me/time-impression/`。

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

### 第三步：配置 Nginx (核心修复)

**出现 MIME type 错误是因为 Nginx 默认不知道 .js 文件是 application/javascript。** 请务必添加 `include /etc/nginx/mime.types;`。

编辑你的 Nginx 配置 (通常在 `/etc/nginx/sites-available/wildsalt.me`):

```nginx
server {
    listen 80;
    server_name wildsalt.me;
    
    root /var/www/wildsalt.me; 
    index index.html;

    # === 关键配置：确保 MIME 类型正确加载 ===
    include /etc/nginx/mime.types;
    
    # 如果上面的 include 不起作用，可以显式强制指定 JS 类型
    types {
        application/javascript js mjs;
        text/css css;
        text/html html htm;
    }

    # === 二级目录配置 ===
    location /time-impression/ {
        # alias 必须以 / 结尾，这很重要
        alias /var/www/wildsalt.me/time-impression/;
        
        # 尝试寻找文件，如果找不到，回退到 index.html
        try_files $uri $uri/ /time-impression/index.html;
    }

    # ... 其他配置 ...
}
```

**保存并重启 Nginx:**
```bash
sudo nginx -t  # 检查配置是否有语法错误
sudo systemctl reload nginx
```

### 🔴 故障排查

**Q: 打开页面卡在 "Loading..."，控制台报错 `Failed to load module script ... MIME type of "application/octet-stream"`**

**A:** 这是 Nginx 配置问题。Nginx 把 `.js` 文件当成了二进制流下载，而不是脚本执行。
1. 确保 Nginx 配置里有 `include /etc/nginx/mime.types;`。
2. 检查 `/etc/nginx/mime.types` 文件是否存在，且里面包含 `application/javascript js;`。
3. 如果还不行，请直接将上面的 `types { application/javascript js mjs; }` 代码块粘贴到 `server` 块中。
4. **强制刷新浏览器** (Ctrl+F5) 清除缓存。

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
