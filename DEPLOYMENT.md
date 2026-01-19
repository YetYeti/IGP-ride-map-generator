# 部署指南 - CentOS 7 服务器

本指南详细介绍如何在 CentOS 7 服务器上部署 IGPSPORT 骑行轨迹生成器。

## 目录

1. [前置要求](#前置要求)
2. [服务器准备](#服务器准备)
3. [应用部署](#应用部署)
4. [Nginx 配置](#nginx-配置)
5. [SSL 证书配置](#ssl-证书配置)
6. [服务管理](#服务管理)
7. [监控和维护](#监控和维护)
8. [故障排查](#故障排查)

---

## 前置要求

- CentOS 7 服务器（建议 2GB+ RAM）
- sudo 权限
- 域名（可选，用于 HTTPS）

---

## 服务器准备

### 1. 安装 Node.js 18.x

```bash
# 添加 NodeSource 仓库
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -

# 安装 Node.js
sudo yum install -y nodejs

# 验证安装
node --version
npm --version
```

### 2. 安装 Python 3

```bash
# 安装 Python 3 和相关工具
sudo yum install -y python3 python3-pip python3-devel

# 验证安装
python3 --version
```

### 3. 安装 uv（Python 包管理器）

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

### 4. 安装 Nginx

```bash
# 安装 Nginx
sudo yum install -y nginx

# 启动 Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# 验证安装
sudo systemctl status nginx
```

### 5. 安装 Redis（可选）

如果需要使用 Redis 管理任务状态（推荐）：

```bash
# 安装 Redis
sudo yum install -y redis

# 启动 Redis
sudo systemctl start redis
sudo systemctl enable redis

# 验证安装
redis-cli ping
# 应返回 PONG
```

---

## 应用部署

### 1. 创建系统用户

```bash
# 创建专用用户
sudo useradd -r -s /bin/false igpsport

# 创建目录结构
sudo mkdir -p /opt/igpsport
sudo mkdir -p /var/lib/igpsport/{output,tasks,fit}
sudo mkdir -p /var/log/igpsport

# 设置权限
sudo chown -R igpsport:igpsport /opt/igpsport /var/lib/igpsport /var/log/igpsport
sudo chmod -R 755 /var/lib/igpsport
sudo chmod -R 775 /var/log/igpsport
```

### 2. 部署应用代码

```bash
# 克隆代码到 /opt/igpsport
cd /opt
sudo git clone <your-repository-url> igpsport

# 如果使用本地代码，可以使用 scp 或 rsync：
# sudo rsync -avz /local/path/igpsport/ /opt/igpsport/

# 设置权限
sudo chown -R igpsport:igpsport /opt/igpsport
```

### 3. 安装依赖

```bash
cd /opt/igpsport

# 安装 Node.js 依赖
sudo -u igpsport npm ci --production

# 安装 Python 依赖
sudo -u igpsport uv sync
```

### 4. 配置环境变量

```bash
# 复制环境变量模板
sudo cp .env.example .env

# 编辑环境变量
sudo vi .env
```

编辑 `.env` 文件，配置必要的环境变量：

```bash
NODE_ENV=production
PORT=3000
OUTPUT_DIR=/var/lib/igpsport/output
TASKS_DIR=/var/lib/igpsport/tasks
FIT_DIR=/var/lib/igpsport/fit
LOG_DIR=/var/log/igpsport

# 如果使用 Redis（可选）
REDIS_URL=redis://localhost:6379
```

### 5. 构建应用

```bash
cd /opt/igpsport

# 构建应用（standalone 模式）
sudo -u igpsport npm run build
```

构建成功后，会在 `.next/standalone` 目录生成独立运行文件。

### 6. 配置 systemd 服务

```bash
# 复制 systemd 服务文件
sudo cp deployments/igpsport.service /etc/systemd/system/

# 编辑服务文件，修改域名等信息（如果需要）
sudo vi /etc/systemd/system/igpsport.service

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

---

## Nginx 配置

### 1. 配置反向代理

```bash
# 复制 Nginx 配置文件
sudo cp deployments/nginx.conf /etc/nginx/conf.d/igpsport.conf

# 编辑配置文件，修改域名
sudo vi /etc/nginx/conf.d/igpsport.conf

# 将 your-domain.com 替换为你的实际域名
```

### 2. 测试配置

```bash
# 测试 Nginx 配置
sudo nginx -t

# 如果测试通过，重新加载 Nginx
sudo systemctl reload nginx
```

### 3. 配置防火墙

```bash
# 开放 HTTP 和 HTTPS 端口
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload

# 验证规则
sudo firewall-cmd --list-all
```

---

## SSL 证书配置

### 使用 Let's Encrypt 获取免费 SSL 证书

```bash
# 安装 Certbot
sudo yum install -y certbot python2-certbot-nginx

# 获取 SSL 证书（会自动配置 Nginx）
sudo certbot --nginx -d your-domain.com

# 按照提示输入邮箱并同意条款
```

### 自动续期

```bash
# 添加自动续期任务到 crontab
echo "0 0,12 * * * root certbot renew --quiet" | sudo tee -a /etc/cron.d/certbot-renew

# 查看续期定时任务
sudo cat /etc/cron.d/certbot-renew
```

### 手动续期

```bash
# 手动续期测试
sudo certbot renew --dry-run

# 实际续期
sudo certbot renew
```

---

## 服务管理

### 启动/停止/重启服务

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

### 查看日志

```bash
# systemd 日志（实时）
sudo journalctl -u igpsport -f

# systemd 日志（最近 100 行）
sudo journalctl -u igpsport -n 100

# Nginx 访问日志
sudo tail -f /var/log/nginx/igpsport_access.log

# Nginx 错误日志
sudo tail -f /var/log/nginx/igpsport_error.log

# 应用日志
sudo tail -f /var/log/igpsport/app.log
sudo tail -f /var/log/igpsport/error.log
```

---

## 监控和维护

### 健康检查

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

### 磁盘清理

定期清理过期的任务和文件：

```bash
# 清理 24 小时前的任务状态文件
# 可以添加到 crontab 自动执行
sudo crontab -e
# 添加以下行（每天凌晨 3 点执行）
0 3 * * * root /usr/bin/node /opt/igpsport/scripts/cleanup.js
```

### 日志轮转

创建日志轮转配置 `/etc/logrotate.d/igpsport`：

```bash
/var/log/igpsport/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 igpsport igpsport
    sharedscripts
    postrotate
        systemctl reload igpsport > /dev/null 2>&1 || true
    endscript
}
```

### 性能监控

```bash
# 查看系统资源使用
htop
# 或
top

# 查看磁盘使用
df -h /var/lib/igpsport

# 查看端口监听
sudo netstat -tuln | grep 3000
sudo netstat -tuln | grep 80
```

---

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

3. 检查 Nginx 日志
```bash
sudo tail -f /var/log/nginx/error.log
```

### 文件无法下载

1. 检查文件是否存在
```bash
ls -la /var/lib/igpsport/output/
```

2. 检查文件权限
```bash
sudo chown -R igpsport:igpsport /var/lib/igpsport/output/
```

3. 检查 Nginx 静态文件配置
```bash
sudo cat /etc/nginx/conf.d/igpsport.conf
```

### Python 脚本执行失败

1. 检查 Python 环境
```bash
python3 --version
which python3
```

2. 检查 Python 依赖
```bash
cd /opt/igpsport
uv sync
```

3. 手动测试 Python 脚本
```bash
cd /opt/igpsport/lib/python
python3 generate_combined_map.py --help
```

### 内存不足

如果服务器内存不足（< 2GB），可能需要：

1. 增加 Swap 空间
```bash
# 创建 2GB swap 文件
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# 永久启用
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

2. 优化 Next.js 构建（减少内存占用）
```bash
# 设置 Node.js 内存限制
export NODE_OPTIONS="--max-old-space-size=2048"
sudo -u igpsport npm run build
```

---

## 更新应用

```bash
# 1. 停止服务
sudo systemctl stop igpsport

# 2. 备份当前版本（可选）
sudo cp -r /opt/igpsport /opt/igpsport.backup

# 3. 拉取最新代码
cd /opt/igpsport
sudo git pull origin main

# 4. 安装依赖并构建
sudo -u igpsport npm ci --production
sudo -u igpsport uv sync
sudo -u igpsport npm run build

# 5. 重启服务
sudo systemctl start igpsport

# 6. 检查状态
sudo systemctl status igpsport
```

---

## 卸载

如果需要完全卸载应用：

```bash
# 1. 停止并禁用服务
sudo systemctl stop igpsport
sudo systemctl disable igpsport

# 2. 删除服务文件
sudo rm /etc/systemd/system/igpsport.service
sudo systemctl daemon-reload

# 3. 删除 Nginx 配置
sudo rm /etc/nginx/conf.d/igpsport.conf
sudo systemctl reload nginx

# 4. 删除应用文件
sudo rm -rf /opt/igpsport

# 5. 删除数据和日志（可选）
sudo rm -rf /var/lib/igpsport
sudo rm -rf /var/log/igpsport

# 6. 删除系统用户（可选）
sudo userdel igpsport
```

---

## 技术支持

如遇到问题，请检查：

1. [GitHub Issues](https://github.com/yourusername/igpsport-ride/issues)
2. 本文档的故障排查部分
3. 应用日志和系统日志
