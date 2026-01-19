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

2. 配置环境变量
```bash
cp .env.example .env
# 编辑 .env 文件配置必要的环境变量
```

3. 启动开发服务器
```bash
npm run dev
```

访问 http://localhost:3000

### 服务器部署

详细的部署指南请参考 [DEPLOYMENT.md](./DEPLOYMENT.md)

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
│   ├── file-task-manager.ts        # 文件系统任务状态管理
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
OUTPUT_DIR=/var/lib/igpsport/output
TASKS_DIR=/var/lib/igpsport/tasks
FIT_DIR=/var/lib/igpsport/fit
LOG_DIR=/var/log/igpsport
```

## 地图样式

- **默认样式**：OpenStreetMap 标准样式
- **浅色地图**：CartoDB Positron，适合数据可视化
- **深色地图**：CartoDB Dark Matter，现代深色主题

## 开源协议

MIT License
