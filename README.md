# IGPSPORT 骑行轨迹生成器

从 IGPSPORT 获取骑行数据并生成轨迹合成图和叠加地图。

## 功能特点

- 支持登录 IGPSPORT 账号
- 自动获取所有户外骑行数据
- 生成轨迹合成图（PNG）
- 生成轨迹叠加网页（HTML，支持多种地图样式）
- 现代化响应式设计
- 实时日志显示
- 生成结果预览和下载

## 技术栈

- **前端**：Next.js 14 + React 18 + TypeScript + Tailwind CSS
- **地图**：react-leaflet + Leaflet
- **后端**：Next.js API Routes
- **Python**：matplotlib, folium, fitparse
- **部署**：CentOS 7 + systemd + Nginx

## 快速开始

### 本地开发

1. 安装依赖
```bash
npm install
uv sync
```

2. 启动开发服务器
```bash
npm run dev
```

访问 http://localhost:3000

## 服务器部署（CentOS 7）

### 前置要求

- CentOS 7 服务器（建议 2GB+ RAM）
- sudo 权限
- 域名（可选，用于 HTTPS）

### 服务器准备

#### 1. 安装 Node.js 18.x

```bash
# 添加 NodeSource 仓库
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -

# 安装 Node.js
sudo yum install -y nodejs

# 验证安装
node --version
npm --version
```

#### 2. 安装 Python 3

```bash
# 安装 Python 3 和相关工具
sudo yum install -y python3 python3-pip python3-devel

# 验证安装
python3 --version
```

#### 3. 安装 uv（Python 包管理器）

```bash
# 安装 uv
curl -LsSf https://astral.sh/uv/install.sh | sh

# 添加到 PATH（如果需要）
export PATH="$HOME/.local/bin:$PATH"
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc

# 验证安装
uv --version
```

#### 4. 安装 Nginx

```bash
# 安装 Nginx
sudo yum install -y nginx

# 启动 Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# 验证安装
sudo systemctl status nginx
```

### 应用部署

#### 1. 创建系统用户

```bash
# 创建专用用户
sudo useradd -r -s /bin/false igpsport

# 创建目录结构
sudo mkdir -p /opt/igpsport
sudo mkdir -p /var/lib/igpsport/temp
sudo mkdir -p /var/log/igpsport

# 设置权限
sudo chown -R igpsport:igpsport /opt/igpsport /var/lib/igpsport /var/log/igpsport
sudo chmod -R 755 /var/lib/igpsport
sudo chmod -R 775 /var/log/igpsport
```

#### 2. 部署应用代码

```bash
# 克隆代码到 /opt/igpsport
cd /opt
sudo git clone <your-repository-url> igpsport

# 设置权限
sudo chown -R igpsport:igpsport /opt/igpsport
```

#### 3. 安装依赖

```bash
cd /opt/igpsport

# 安装 Node.js 依赖
sudo -u igpsport npm ci --production

# 安装 Python 依赖
sudo -u igpsport uv sync
```

#### 4. 构建应用

```bash
cd /opt/igpsport

# 构建应用（standalone 模式）
sudo -u igpsport npm run build
```

#### 5. 配置 systemd 服务

```bash
# 复制 systemd 服务文件
sudo cp deployments/igpsport.service /etc/systemd/system/

# 重新加载 systemd
sudo systemctl daemon-reload

# 启用服务
sudo systemctl enable igpsport

# 启动服务
sudo systemctl start igpsport

# 查看服务状态
sudo systemctl status igpsport
```

如果服务启动失败，查看日志：

```bash
sudo journalctl -u igpsport -f
```

### Nginx 配置

#### 1. 配置反向代理

```bash
# 复制 Nginx 配置文件
sudo cp deployments/nginx.conf /etc/nginx/conf.d/igpsport.conf

# 编辑配置文件，修改域名
sudo vi /etc/nginx/conf.d/igpsport.conf

# 将 your-domain.com 替换为你的实际域名
```

#### 2. 测试配置

```bash
# 测试 Nginx 配置
sudo nginx -t

# 如果测试通过，重新加载 Nginx
sudo systemctl reload nginx
```

#### 3. 配置防火墙

```bash
# 开放 HTTP 和 HTTPS 端口
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload

# 验证规则
sudo firewall-cmd --list-all
```

### SSL 证书配置

#### 使用 Let's Encrypt 获取免费 SSL 证书

```bash
# 安装 Certbot
sudo yum install -y certbot python2-certbot-nginx

# 获取 SSL 证书（会自动配置 Nginx）
sudo certbot --nginx -d your-domain.com

# 按照提示输入邮箱并同意条款
```

#### 自动续期

```bash
# 添加自动续期任务到 crontab
echo "0 0,12 * * * root certbot renew --quiet" | sudo tee -a /etc/cron.d/certbot-renew

# 查看续期定时任务
sudo cat /etc/cron.d/certbot-renew
```

### 服务管理

#### 启动/停止/重启服务

```bash
# Next.js 应用
sudo systemctl start igpsport    # 启动
sudo systemctl stop igpsport     # 停止
sudo systemctl restart igpsport  # 重启
sudo systemctl status igpsport   # 状态

# Nginx
sudo systemctl start nginx       # 启动
sudo systemctl stop nginx        # 停止
sudo systemctl restart nginx     # 重启
sudo systemctl reload nginx      # 重载（不中断连接）
sudo systemctl status nginx      # 状态
```

#### 查看日志

```bash
# systemd 日志（实时）
sudo journalctl -u igpsport -f

# Nginx 访问日志
sudo tail -f /var/log/nginx/igpsport_access.log

# Nginx 错误日志
sudo tail -f /var/log/nginx/igpsport_error.log
```

### 监控和维护

#### 健康检查

应用提供了健康检查端点：

```bash
# 检查应用健康状态
curl http://localhost:3000/api/health

# 预期响应
{
  "status": "ok",
  "timestamp": "2026-01-19T11:30:00.000Z",
  "uptime": 1234.567
}
```

### 更新应用

```bash
# 1. 停止服务
sudo systemctl stop igpsport

# 2. 拉取最新代码
cd /opt/igpsport
sudo git pull origin main

# 3. 安装依赖并构建
sudo -u igpsport npm ci --production
sudo -u igpsport uv sync
sudo -u igpsport npm run build

# 4. 重启服务
sudo systemctl start igpsport

# 5. 检查状态
sudo systemctl status igpsport
```

## 项目结构

```
IGPSPORT_RIDE_MAP_VERCEL/
├── app/
│   ├── page.tsx                    # 主页面
│   ├── layout.tsx                  # 全局布局
│   ├── globals.css                 # 全局样式
│   └── api/
│       ├── generate/route.ts        # 生成轨迹 API
│       ├── status/[taskId]/route.ts # 任务状态查询
│       ├── download/[taskId]/[filename]/route.ts # 文件下载
│       └── health/route.ts        # 健康检查
├── components/
│   ├── ui/                        # 基础 UI 组件
│   ├── RideForm.tsx               # 骑行数据表单
│   ├── TrackSettings.tsx          # 轨迹设置
│   ├── LogDisplay.tsx             # 日志显示
│   ├── ResultPreview.tsx          # 结果预览
│   └── OverlayMap.tsx             # 叠加地图
├── lib/
│   ├── igpsport.ts                # IGPSPORT API 客户端
│   ├── map-styles.ts              # 地图样式配置
│   └── python/                    # Python 脚本
│       ├── generate_combined_map.py    # 生成轨迹合成图
│       └── generate_multiple_overlays.py # 生成轨迹叠加网页
├── deployments/                    # 部署配置文件
│   ├── igpsport.service           # systemd 服务配置
│   └── nginx.conf                # Nginx 配置
├── public/
│   └── output/                    # 生成文件输出目录
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
└── .env.example                  # 环境变量示例
```

## 使用说明

1. 输入 IGPSPORT 账号和密码
2. 选择生成选项：
   - 轨迹合成图：将所有轨迹合并为一张大图
   - 轨迹叠加网页：在交互式地图上叠加所有轨迹
3. 选择地图样式（可选）：
   - 默认样式
   - 浅色地图（含标签）
   - 浅色地图（无标签）
   - 深色地图（含标签）
   - 深色地图（无标签）
4. 点击"生成轨迹"按钮
5. 等待处理完成，实时查看日志
6. 预览生成结果并下载

## 环境变量

主要环境变量（详见 .env.example）：

```bash
NODE_ENV=production
PORT=3000
TEMP_DIR=/var/lib/igpsport/temp
```

## 地图样式

- **默认样式**：OpenStreetMap 标准样式
- **浅色地图**：CartoDB Positron，适合数据可视化
- **深色地图**：CartoDB Dark Matter，现代深色主题

## 故障排查

### 应用无法启动

1. 检查服务状态
```bash
sudo systemctl status igpsport
```

2. 查看详细日志
```bash
sudo journalctl -u igpsport -n 100 --no-pager
```

3. 常见问题：
   - 端口 3000 被占用：检查是否有其他进程占用
   - 环境变量配置错误：检查 `.env` 文件
   - 权限问题：检查目录和文件权限
   - Python 依赖缺失：运行 `uv sync`

### Nginx 502 Bad Gateway

1. 检查 Next.js 应用是否运行
```bash
sudo systemctl status igpsport
curl http://localhost:3000/api/health
```

2. 检查 Nginx 配置
```bash
sudo nginx -t
```

## 开源协议

MIT License
