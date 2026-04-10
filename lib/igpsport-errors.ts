export function logIGPSPORTError(label: string, error: unknown) {
  console.error(label, error)

  if (error instanceof Error) {
    console.error(`${label} stack:`, error.stack)
  }
}
