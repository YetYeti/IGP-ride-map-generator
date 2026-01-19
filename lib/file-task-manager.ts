import { existsSync, readFileSync, writeFileSync, unlinkSync, mkdirSync, readdirSync, statSync } from 'fs'
import path from 'path'

interface Task {
  id: string
  status: 'processing' | 'completed' | 'failed'
  progress: number
  logs: { timestamp: string; message: string; level: string }[]
  result: any
  error: string | null
}

const isProduction = process.env.NODE_ENV === 'production'
const TASKS_DIR = process.env.TASKS_DIR || (isProduction ? '/var/lib/igpsport/tasks' : path.join(process.cwd(), 'public', 'tasks'))

export function ensureTasksDir() {
  if (!existsSync(TASKS_DIR)) {
    mkdirSync(TASKS_DIR, { recursive: true })
  }
}

export function getTaskPath(taskId: string) {
  return path.join(TASKS_DIR, `${taskId}.json`)
}

export function saveTask(taskId: string, task: Task) {
  ensureTasksDir()
  const taskPath = getTaskPath(taskId)
  writeFileSync(taskPath, JSON.stringify(task, null, 2), 'utf8')
}

export function getTask(taskId: string): Task | null {
  const taskPath = getTaskPath(taskId)
  if (!existsSync(taskPath)) return null

  const data = readFileSync(taskPath, 'utf8')
  try {
    return JSON.parse(data) as Task
  } catch (error) {
    console.error(`Failed to parse task file ${taskPath}:`, error)
    return null
  }
}

export function updateTask(taskId: string, updates: Partial<Task>): Task | null {
  const existing = getTask(taskId)
  if (existing) {
    const updated = { ...existing, ...updates }
    saveTask(taskId, updated)
    return updated
  }
  return null
}

export function deleteTask(taskId: string) {
  const taskPath = getTaskPath(taskId)
  if (existsSync(taskPath)) {
    unlinkSync(taskPath)
  }
}

export function cleanupOldTasks(maxAgeHours: number = 24): number {
  ensureTasksDir()
  const now = Date.now()
  const maxAgeMs = maxAgeHours * 60 * 60 * 1000

  let deletedCount = 0

  try {
    const files = readdirSync(TASKS_DIR)

    files.forEach((file) => {
      if (!file.endsWith('.json')) return

      const filePath = path.join(TASKS_DIR, file)
      const stats = statSync(filePath)

      if (now - stats.mtimeMs > maxAgeMs) {
        try {
          unlinkSync(filePath)
          deletedCount++
          console.log(`Deleted old task: ${file}`)
        } catch (err) {
          console.error(`Failed to delete ${file}:`, err)
        }
      }
    })
  } catch (error) {
    console.error('Error during task cleanup:', error)
  }

  return deletedCount
}

export function getAllTasks(): Task[] {
  ensureTasksDir()
  const tasks: Task[] = []

  try {
    const files = readdirSync(TASKS_DIR)

    files.forEach((file) => {
      if (!file.endsWith('.json')) return

      const filePath = path.join(TASKS_DIR, file)
      const task = getTask(path.basename(file, '.json'))
      if (task) {
        tasks.push(task)
      }
    })
  } catch (error) {
    console.error('Error getting all tasks:', error)
  }

  return tasks
}
