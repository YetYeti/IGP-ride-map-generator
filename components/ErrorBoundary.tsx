'use client'

import React from 'react'

interface ErrorBoundaryProps {
  children: React.ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-white">
          <div className="max-w-md text-center">
            <h2 className="text-xl font-semibold text-gray-900">页面出现错误</h2>
            <p className="mt-2 text-sm text-gray-500">
              {this.state.error?.message ?? '发生了未知错误'}
            </p>
            <button
              className="mt-4 rounded-md bg-black px-4 py-2 text-sm text-white hover:bg-gray-800"
              onClick={() => {
                this.setState({ hasError: false, error: null })
              }}
            >
              重试
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
