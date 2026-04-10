const fs = require('fs')
const path = require('path')

const projectRoot = process.cwd()
const pythonSourceDir = path.join(projectRoot, 'lib', 'python')
const pythonTargetDir = path.join(projectRoot, '.next', 'standalone', 'lib', 'python')
const posterThemesSourceDir = path.join(pythonSourceDir, 'poster_themes')
const posterThemesTargetDir = path.join(pythonTargetDir, 'poster_themes')

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true })
}

function copyPythonScripts() {
  const entries = fs.readdirSync(pythonSourceDir, { withFileTypes: true })

  for (const entry of entries) {
    if (!entry.isFile() || path.extname(entry.name) !== '.py') {
      continue
    }

    fs.copyFileSync(
      path.join(pythonSourceDir, entry.name),
      path.join(pythonTargetDir, entry.name)
    )
  }
}

function copyPosterThemes() {
  if (!fs.existsSync(posterThemesSourceDir)) {
    return
  }

  fs.cpSync(posterThemesSourceDir, posterThemesTargetDir, { recursive: true, force: true })
}

function main() {
  if (!fs.existsSync(pythonSourceDir)) {
    throw new Error(`Python 资源目录不存在: ${pythonSourceDir}`)
  }

  ensureDir(pythonTargetDir)
  copyPythonScripts()
  copyPosterThemes()

  console.log('Python 运行资源已复制到 .next/standalone/lib/python')
}

main()
