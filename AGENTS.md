# IGPSPORT 骑行轨迹生成器 - AGENTS.md

## AI 遵守规则

### 工作模式

本系统支持两种工作模式，**AI 在开始任何工作前必须首先确认当前模式**：

#### 📋 Plan 模式（规划模式）
- **用途**: 仅进行项目分析、架构设计、规划任务
- **行为准则**:
  - ✅ 可以：分析代码库、探索文件结构、规划任务列表、咨询架构问题
  - ❌ 禁止：执行任何代码修改、运行命令、创建文件
  - 📝 输出：分析报告、任务规划、设计文档
- **典型操作**:
  - 使用 explore/librarian agent 分析代码
  - 搜索代码模式和实现
  - 创建详细的 todo 列表（不立即执行）
  - 咨询 Oracle 进行架构设计

#### 🔨 Build 模式（执行模式）
- **用途**: 执行具体的开发任务、代码修改、文件创建
- **行为准则**:
  - ✅ 必须：按照规划的任务列表执行
  - ✅ 必须：立即开始第一个任务并标记为 in_progress
  - ✅ 必须：逐个完成任务，每个完成后立即标记
  - ❌ 禁止：跳过任务规划直接开始执行
  - ❌ 禁止：批量完成多个任务
- **典型操作**:
  - 执行 todo 列表中的任务
  - 使用 edit/write/read 等工具修改文件
  - 运行构建和测试命令
  - 验证修改结果

### 工作流程

#### Step 1: 确认模式（必须首先执行）

```bash
# 在开始任何工作前，必须明确当前模式
PLAN 模式示例:
用户: "分析一下代码库，看看有什么需要改进的"
AI: "进入 Plan 模式。我将分析代码库结构、代码风格和潜在改进点。"

BUILD 模式示例:
用户: "帮我修复登录功能"
AI: "进入 Build 模式。我将创建任务列表并开始修复。"
```

#### Step 2: Plan 模式下的操作

```bash
# 1. 使用 explore/librarian agent 分析代码
# 2. 创建详细的 todo 列表
# 3. 咨询 Oracle（如需要）
# 4. 提供分析报告
# 5. **不要** 执行任何修改
```

#### Step 3: Build 模式下的操作

```bash
# 1. 创建任务列表（todowrite）
# 2. 标记第一个任务为 in_progress
# 3. 执行任务（edit/write/read 等）
# 4. 验证结果（lsp_diagnostics）
# 5. 标记任务为 completed
# 6. 重复 2-5 直到所有任务完成
```

### 模式切换

- **Plan → Build**: 用户明确要求开始执行（如"开始实现"、"执行这个"）
- **Build → Plan**: 用户要求分析、规划、或询问问题

### 关键原则

1. **模式确认**: 开始任何工作前必须先确认模式
2. **Plan 模式**: 只规划、分析、咨询，不执行
3. **Build 模式**: 必须先规划再执行，按顺序完成任务
4. **任务追踪**: Build 模式下必须使用 todowrite 追踪进度
5. **实时更新**: 每个任务完成后立即标记，不要批量标记

---

## 构建和检查命令

### 开发和构建
```bash
npm run dev          # 启动开发服务器 (http://localhost:3000)
npm run build        # 构建生产版本
npm run start        # 启动生产服务器
npm run lint         # 运行 ESLint 检查
```

### Python 依赖
```bash
# 本地开发环境（使用 uv 管理依赖）
uv sync  # 安装/同步依赖到 .venv

# Vercel 部署时自动使用 uv（零配置）
# Vercel 会自动检测 uv.lock 或 pyproject.toml
```

#### 依赖管理说明

项目使用 **uv** 作为 Python 包管理器，确保依赖一致性：

- **pyproject.toml**: 定义项目依赖和配置（主源）
- **uv.lock**: uv 生成的锁定文件（精确版本，.gitignore 忽略）

#### 常用命令
```bash
# 安装/同步依赖
uv sync

# 添加新依赖
uv add package_name
uv add package_name>=1.0.0  # 指定版本

# 添加开发依赖
uv add --dev package_name

# 移除依赖
uv remove package_name

# 更新所有依赖
uv lock --upgrade

# 查看已安装的包
uv pip list
```

### 测试
⚠️ **此项目当前没有配置测试**
- 无测试文件 (*.test.*, *.spec.*)
- 无测试框架配置
- 建议添加测试：使用 Jest 或 Vitest 进行单元测试，Playwright 进行 E2E 测试

## Git 版本控制

### 分支策略
- **主分支**: `main` - 生产代码
- **开发分支**: 建议使用功能分支（`feature/xxx`, `fix/xxx`, `chore/xxx`）
- **分支命名约定**:
  - `feature/功能描述` - 新功能
  - `fix/修复描述` - Bug 修复
  - `refactor/重构描述` - 代码重构
  - `chore/维护描述` - 配置或文档更新

### 提交信息规范
使用约定式提交（Conventional Commits）格式：

```bash
# 格式
<type>(<scope>): <subject>

<body>

<footer>
```

**类型 (type)**:
- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式（不影响代码运行）
- `refactor`: 重构（既不是新功能也不是修复）
- `test`: 添加测试
- `chore`: 构建过程或辅助工具的变动

**示例**:
```bash
feat(igpsport): 添加批量获取骑行数据功能

- 实现 getAllActivities 方法
- 支持分页获取所有活动
- 添加进度回调函数

Closes #123
```

### 常用 Git 命令
```bash
# 查看状态
git status

# 添加文件到暂存区
git add .
git add <file>

# 提交更改
git commit -m "feat: 添加新功能"

# 推送到远程
git push origin main
git push -u origin feature/xxx

# 拉取最新代码
git pull origin main

# 查看提交历史
git log --oneline
git log --graph --oneline --all

# 创建新分支
git checkout -b feature/xxx

# 切换分支
git checkout main
git switch main

# 合并分支
git merge feature/xxx

# 删除分支
git branch -d feature/xxx
git branch -D feature/xxx  # 强制删除
```

### .gitignore 规则
项目已配置以下忽略规则：

```gitignore
# 依赖
/node_modules
/.pnp
.pnp.js

# Next.js 构建
/.next/
/out/

# 环境变量
.env
.env*.local

# Vercel
.vercel

# Python
.venv/
__pycache__/
*.pyc
*.pyo
.pytest_cache/
.pip-cache/
dist/
*.egg-info/

# uv package manager
uv.lock

# 输出文件
/public/output/*
!/public/output/.gitkeep

# TypeScript
*.tsbuildinfo
next-env.d.ts
```

**重要**: 不要将以下内容提交到 Git：
- `.env.local` - 本地环境变量
- `node_modules/` - 依赖包
- `.next/` - Next.js 构建输出
- `public/output/` - 生成的地图文件
- `.venv/` - Python 虚拟环境
- `uv.lock` - uv 锁定文件（本地开发使用）

### 工作流建议
```bash
# 1. 开始新功能
git checkout -b feature/add-map-styles

# 2. 开发和提交
git add pyproject.toml
git commit -m "chore(python): 添加地图样式依赖"

# 3. 本地同步依赖
uv sync

# 4. 推送到远程
git push -u origin feature/add-map-styles

# 5. Vercel 自动部署（使用 uv）
```

### Git Hooks
项目使用 Git Hooks 进行代码质量检查：

- **Pre-commit**: 运行 ESLint 和 TypeScript 类型检查
- **Commit-msg**: 验证提交信息格式

安装 Git Hooks:
```bash
npm run prepare  # 或使用 husky 安装
```

### 版本标签
使用语义化版本（Semantic Versioning）标记版本：

```bash
# 格式: v<major>.<minor>.<patch>
# 示例
v1.0.0
v1.1.0
v2.0.0

# 创建标签
git tag -a v1.0.0 -m "初始版本发布"

# 推送标签
git push origin v1.0.0
git push origin --tags

# 查看标签
git tag
git show v1.0.0
```

### 冲突解决
```bash
# 拉取时遇到冲突
git pull origin main

# 手动解决冲突文件中的标记
# <<<<<<< HEAD
# 你的代码
# =======
# 远程代码
# >>>>>>> main

# 解决后标记为已解决
git add <conflicted-file>

# 完成合并
git commit
```

## 代码风格指南

### 文件和目录命名
- **组件文件**: PascalCase (RideForm.tsx, ResultPreview.tsx, TrackSettings.tsx)
- **工具库文件**: camelCase (igpsport.ts, fit-parser.ts)
- **UI 组件**: components/ui/ 目录下 (Card.tsx, Button.tsx, Input.tsx)
- **API 路由**: app/api/*/route.ts (使用 Next.js App Router 约定)
- **页面**: app/page.tsx, app/[slug]/page.tsx
- **Python 脚本**: api/python/*.py (小写，下划线分隔)

### 导入组织
```typescript
'use client'  // 客户端组件指令（如果需要）

// 1. 第三方库
import React from 'react'
import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'

// 2. 组件导入（相对路径）
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from './ui/Button'

// 3. 类型导入
import { MapStyle, GPSData } from '@/lib/fit-parser'

// 4. Node.js 模块
import { writeFileSync, existsSync } from 'fs'
import path from 'path'
```
- 组之间空一行分隔
- 使用 `@/*` 路径别名引用项目模块
- React 总是单独导入

### 组件约定
```typescript
// 可复用组件：named exports
export function RideForm({ onSubmit, loading }: RideFormProps) { }
export function Card({ children, className = '' }: CardProps) { }

// 页面组件：default exports
export default function Home() { }
export default function AboutPage() { }
```

### 类型定义
```typescript
// 使用 interface 定义对象类型
interface Activity {
  RideId: number
  Title: string
  total_distance: number
}

// Props 接口命名：ComponentNameProps
interface RideFormProps {
  onSubmit: (data: RideFormData) => void
  loading: boolean
}

// 使用 const + as const 创建字面量类型
export const MapStyles = {
  default: 'default',
  cartodb_positron: 'cartodb_positron',
} as const

export type MapStyle = (typeof MapStyles)[keyof typeof MapStyles]

// 扩展标准类型
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
}
```

### 命名约定
- **函数/方法**: camelCase (handleSubmit, pollTaskStatus, downloadFile)
- **变量**: camelCase (formData, taskId, previewImages)
- **常量**: camelCase 或 UPPER_SNAKE_CASE（项目混用，建议统一为 UPPER_SNAKE_CASE）
- **布尔变量**: is/has 前缀 (isLoading, hasError, generateCombinedMap)
- **事件处理器**: handle + 事件 (handleSubmit, handleChange, handleLoad)
- **回调 Props**: on + 动作 (onSubmit, onSelectMapStyle, onToggleCombinedMap)
- **Python 函数**: snake_case (extract_gps_data, generate_overlay_map)

### 错误处理
```typescript
// API 路由
try {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('请求失败描述')
  }
  // 处理成功
} catch (error: any) {
  console.error('错误前缀:', error)
  console.error('错误堆栈:', error.stack)
  return NextResponse.json(
    { error: '错误信息' },
    { status: 400 }
  )
}

// 客户端组件
try {
  await someAsyncOperation()
} catch (error: any) {
  console.error('操作失败:', error)
  const timestamp = new Date().toLocaleTimeString('zh-CN')
  setLogs([{ timestamp, message: error.message, level: 'error' }])
}
```
- 使用 try-catch 包裹异步操作
- 使用 console.error 记录错误
- API 返回 NextResponse.json with status code
- ⚠️ 建议：使用自定义错误类型替代 `any`

### 格式化
- **缩进**: 2 空格
- **引号**: 单引号 'string'
- **尾随逗号**: 对象/数组元素后使用
- **行宽**: 建议不超过 100 字符

```typescript
// Props 每行一个
<Button
  type="submit"
  size="lg"
  className="w-full"
  disabled={loading}
>
  生成轨迹
</Button>

// 长对象换行
const formData = {
  username: '',
  password: '',
  overlayMapStyle: 'default',
  generateCombinedMap: true,
}

// 模板字符串
const url = `/api/status/${taskId}`
const message = `正在处理活动 ${i + 1}/${total}: ${activity.RideId}`
```

### TypeScript 配置
- **strict mode**: 已启用 (`"strict": true`)
- **路径别名**: `@/*` 映射到项目根目录
- **target**: ES2020
- **moduleResolution**: bundler

### 状态管理
```typescript
// 使用 React hooks 管理状态
const [loading, setLoading] = React.useState(false)
const [taskId, setTaskId] = React.useState<string | null>(null)
const [logs, setLogs] = React.useState<LogEntry[]>([])
const [result, setResult] = React.useState<GenerationResult | null>(null)

// 更新状态
setLoading(true)
setFormData({ ...formData, username: value })
setLogs([...logs, newLog])
```
- 明确的状态类型注解
- 使用函数式更新（当新状态依赖旧状态时）

### API 路由模式
```typescript
// app/api/generate/route.ts
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    // 处理逻辑
    return NextResponse.json({ taskId, status: 'processing' })
  } catch (error: any) {
    return NextResponse.json(
      { error: '错误信息', details: error.message },
      { status: 500 }
    )
  }
}

// app/api/status/[taskId]/route.ts
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const resolvedParams = await params
  const taskId = resolvedParams.taskId
  // 处理逻辑
}
```

### 客户端/服务端组件
- 使用 `'use client'` 指令标记客户端组件
- 默认为服务端组件（App Router）
- 仅在需要交互性（useState, useEffect）时使用客户端组件

### Python 脚本
- Python 脚本位于 `api/python/` 目录
- 用于处理 FIT 文件生成地图
- 通过 Node.js `spawn` 调用
- 使用 uv 管理依赖
- 命名约定：snake_case
- 进度输出使用 `PROGRESS:` 前缀

### Python 代码风格
```python
# 导入顺序：标准库 → 第三方库 → 本地模块
import sys
import os
import json
from typing import List, Tuple

import fitparse
import matplotlib
import folium

# 函数命名：snake_case
def extract_gps_data(fit_file_path: str) -> List[Tuple[float, float]]:
    """从FIT文件提取GPS数据"""
    # 函数体

# 类命名：PascalCase
class GPSDataProcessor:
    def process(self):
        # 方法体

# 常量：UPPER_SNAKE_CASE
TRACK_COLOR = '#F1532E'
DEFAULT_MARGIN = 300
IMAGE_DPI = 100

# 类型注解：使用 typing 模块
from typing import List, Tuple, Optional

def generate_map(data: List[Tuple[float, float]]) -> bool:
    # 函数体
```

### 部署配置 (vercel.json)
```json
{
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 60
    }
  }
}
```
- **零配置**: Vercel 自动检测并使用 uv
- **API 超时**: 60 秒
- **注意**: Python 脚本通过 Node.js spawn 调用 uv run，不作为独立 Vercel Functions

### 日志记录
```typescript
// 调试日志（使用中文）
console.log('=== 开始登录 IGPSPORT ===')
console.log('账号:', username)
console.log('密码长度:', password.length)

// 错误日志
console.error('登录失败:', error)
console.error('错误堆栈:', error.stack)
```

### CSS 和样式
- 使用 Tailwind CSS 进行样式
- 自定义样式在 app/globals.css
- 支持明暗主题（prefers-color-scheme）
- 使用 CSS 变量定义颜色
- 自定义滚动条类：.custom-scrollbar

### 环境变量
- `.env.example` 提供示例
- 本地开发使用 `.env.local`
- Vercel 部署时在项目设置中配置
- 敏感信息不要提交到版本控制

### 注意事项
1. Vercel 自动使用 uv 进行 Python 依赖安装（零配置）
2. 生成文件存储在 `public/output/` 目录
3. 建议一次处理不超过 20 个骑行数据
4. Python 脚本需要与 Node.js 版本兼容
5. 使用 gitignore 忽略 .env.local、.venv、uv.lock 和生成的输出文件
6. 客户端组件需要 'use client' 指令
7. API 路由使用 Next.js App Router 约定
8. 完全使用 uv 管理 Python 依赖，不再使用 requirements.txt
