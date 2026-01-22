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

// 监听退出信号
process.on('SIGINT', cleanup)   // Ctrl+C
process.on('SIGTERM', cleanup)  // kill 命令
process.on('exit', cleanup)     // 正常退出

// 启动 Next.js 开发服务器
console.log('正在启动开发服务器，端口:', PORT)
const nextDev = spawn('next', ['dev'], {
  stdio: 'inherit',
  shell: platform() === 'win32'
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
