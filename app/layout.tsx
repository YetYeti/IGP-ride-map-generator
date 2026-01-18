import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'IGPSPORT 骑行轨迹生成器',
  description: '从 IGPSPORT 获取骑行数据并生成轨迹合成图和叠加地图',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.variable}>{children}</body>
    </html>
  )
}
