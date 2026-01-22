const { spawn, exec } = require('child_process')
const { platform } = require('os')

// 配置
const DEFAULT_PORT = 3000
const PORT = process.env.PORT || DEFAULT_PORT

// 清理端口函数
function killPort(port) {
  const isWindows = platform() === 'win32'
  
  if (isWindows) {
    // Windows: 使用 netstat + taskkill
    exec(`netstat -ano | findstr :${port}`, (error, stdout) => {
      if (!error) {
        const lines = stdout.split('\n')
        lines.forEach(line => {
          const match = line.match(/\s+(\d+)\s+LISTENING/i)
          if (match) {
            const pid = match[1]
            try {
              exec(`taskkill /F /PID ${pid}`)
              console.log(`已清理端口 ${port} 的进程 (PID: ${pid})`)
            } catch (e) {
              // 忽略错误
            }
          }
        })
      }
    })
  } else {
    // macOS/Linux: 使用 lsof + kill
    exec(`lsof -ti:${port} | xargs kill -9 2>/dev/null`, (error) => {
      if (!error) {
        console.log(`端口 ${port} 已清理`)
      }
    })
  }
}

// 清理函数
function cleanup() {
  console.log('\n正在清理端口 ' + PORT + '...')
  killPort(PORT)
  console.log('端口 ' + PORT + ' 已清理')
  process.exit(0)
}

// 先清理端口（避免启动时冲突）
console.log('正在清理端口 ' + PORT + ' (启动前)...')
killPort(PORT)

// 等待一小段时间确保端口清理完成
setTimeout(() => {
  // 监听退出信号
  process.on('SIGINT', cleanup)   // Ctrl+C
  process.on('SIGTERM', cleanup)  // kill 命令
  process.on('exit', cleanup)     // 正常退出

  // 启动 Next.js 开发服务器
  console.log('正在启动开发服务器，端口:', PORT)
  const isWindows = platform() === 'win32'

  // 使用 npx 运行 next，确保能找到命令
  const nextPath = isWindows ? 'npx.cmd' : 'npx'
  const nextArgs = ['next', 'dev']

  const nextDev = spawn(nextPath, nextArgs, {
    stdio: 'inherit',
    shell: isWindows
  })

  // Next.js 退出时也清理
  nextDev.on('exit', (code) => {
    console.log(`开发服务器已退出 (code: ${code})`)
    cleanup()
  })

  nextDev.on('error', (err) => {
    console.error('启动失败:', err)
    cleanup()
  })
}, 500)
