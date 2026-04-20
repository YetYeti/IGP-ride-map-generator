import { NextResponse } from 'next/server'
import { getAccountSessionSummary, clearAccountSession } from '@/lib/session/session-store'

export async function GET() {
  return NextResponse.json({
    session: getAccountSessionSummary(),
  })
}

export async function DELETE() {
  clearAccountSession()

  return NextResponse.json({
    session: getAccountSessionSummary(),
  })
}
