# Time Impression - Visual Experiments

这是一个基于 React 和 Canvas 的高性能视觉交互实验合集。

## 📦 核心：如何修复 Loading 卡死问题

您遇到的 `application/octet-stream` 错误通常意味着两件事之一：
1. **Nginx 配置缺失 MIME 类型**。
2. **您上传了错误的 `index.html`** (源码而非构建产物)。

请严格按照以下步骤操作。

---

### 第一步：正确构建 (Build)

**不要**直接上传项目根目录下的文件。必须先编译。

1. 在本地终端运行：
   ```bash
   npm run build
   ```
2. 这会生成一个 **`dist`** 文件夹。
3. **检查 `dist/index.html` 的内容**：
   - 打开它，搜索 `<script` 标签。
   - ✅ 正确：`<script type="module" crossorigin src="./assets/index-xxxx.js"></script>`
   - ❌ 错误：`<script type="module" src="./index.tsx"></script>` (如果你看到这个，说明你上传的是源码，浏览器无法运行)

### 第二步：上传 `dist` 文件夹

将本地 `dist` 文件夹里的**所有内容**，上传到服务器的 `/var/www/wildsalt.me/time-impression/` 目录。

```bash
# 示例：上传 dist 内容到服务器
scp -r dist/* root@<你的VPS_IP>:/var/www/wildsalt.me/time-impression/
```

### 第三步：Nginx 强力配置 (修复 MIME 错误)

编辑 Nginx 配置文件 (`/etc/nginx/sites-available/wildsalt.me`)。我们将显式告诉 Nginx `.js` 文件是 Javascript。

```nginx
server {
    listen 80;
    server_name wildsalt.me;
    
    root /var/www/wildsalt.me; 
    index index.html;

    # =====================================================
    # 核心修复 1: 显式定义 MIME 类型
    # 防止 Nginx 把 js 文件当作二进制流 (octet-stream) 下载
    # =====================================================
    include /etc/nginx/mime.types;
    types {
        application/javascript js mjs;
        text/css css;
        text/html html htm;
        image/svg+xml svg;
    }

    # =====================================================
    # 核心修复 2: 二级目录配置
    # =====================================================
    location /time-impression/ {
        # 必须使用 alias 并且以 / 结尾
        alias /var/www/wildsalt.me/time-impression/;
        
        # 尝试寻找文件
        try_files $uri $uri/ /time-impression/index.html;
    }

    # 处理构建后的 assets 静态资源 (可选，增加保险)
    location /time-impression/assets/ {
        alias /var/www/wildsalt.me/time-impression/assets/;
        types {
            application/javascript js mjs;
            text/css css;
        }
    }
}
```

### 第四步：重启并清理缓存

1. 测试配置：
   ```bash
   sudo nginx -t
   ```
2. 重启 Nginx：
   ```bash
   sudo systemctl reload nginx
   ```
3. **重要：** 在浏览器中，按 **Ctrl + Shift + R** (或 Cmd + Shift + R) 强制刷新，清除之前的错误缓存。

---

## 本地开发

```bash
npm install
npm run dev
```
