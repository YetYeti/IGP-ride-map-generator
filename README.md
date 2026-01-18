# IGPSPORT 骑行轨迹生成器 - Vercel 版本

从 IGPSPORT 获取骑行数据并生成轨迹合成图和叠加地图。

## 功能特点

- ✅ 支持登录 IGPSPORT 账号
- ✅ 自动获取所有户外骑行数据
- ✅ 生成轨迹合成图（PNG）
- ✅ 生成轨迹叠加网页（HTML，支持 4 种地图样式）
- ✅ Vercel 风格的现代化界面
- ✅ 响应式设计，支持 PC 和手机
- ✅ 实时日志显示
- ✅ 生成结果预览和下载

## 技术栈

- **前端**：Next.js 14 + React 18 + TypeScript + Tailwind CSS
- **地图**：react-leaflet + Leaflet
- **后端**：Next.js API Routes
- **数据存储**：内存缓存（可扩展到 Vercel KV/Postgres）
- **部署**：Vercel

## 快速开始

### 1. 安装前端依赖

```bash
npm install
```

### 2. 安装 Python 依赖

```bash
uv sync
```

### 3. 本地开发

```bash
npm run dev
```

访问 http://localhost:3000

### 4. 部署到 Vercel

```bash
npm run build
vercel
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
│       └── status/[taskId]/route.ts # 任务状态查询
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
├── public/
│   └── output/                    # 生成文件输出目录
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
└── vercel.json                    # Vercel 配置
```

## 使用说明

1. 输入 IGPSPORT 账号和密码
2. 选择生成选项：
   - 轨迹合成图：将所有轨迹合并为一张大图
   - 轨迹叠加网页：在交互式地图上叠加所有轨迹
3. 选择地图样式（可选 5 种）：
   - 默认样式
   - 浅色地图（含标签）
   - 浅色地图（无标签）
   - 深色地图（含标签）
   - 深色地图（无标签）
4. 点击"生成轨迹"按钮
5. 等待处理完成，实时查看日志
6. 预览生成结果并下载

## 地图样式

- **默认样式**：OpenStreetMap 标准样式
- **浅色地图**：CartoDB Positron，适合数据可视化
- **深色地图**：CartoDB Dark Matter，现代深色主题

## 开源协议

MIT License

## 更新日志

### v1.0.0 (2026-01-17)
- 初始版本
- 支持 IGPSPORT 账号登录
- 支持轨迹合成图和叠加网页生成
- 支持 4 种地图样式
- 响应式设计
