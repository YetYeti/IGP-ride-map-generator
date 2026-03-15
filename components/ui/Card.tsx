import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  id?: string
}

export function Card({ children, className = '', id }: CardProps) {
  return (
    <div
      id={id}
      className={`panel-surface rounded-[28px] text-[color:var(--foreground)] ${className}`}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '' }: CardProps) {
  return <div className={`flex flex-col space-y-2 p-7 ${className}`}>{children}</div>
}

export function CardTitle({ children, className = '' }: CardProps) {
  return (
    <h3 className={`font-display text-[1.7rem] font-semibold leading-none text-[color:var(--foreground)] ${className}`}>
      {children}
    </h3>
  )
}

export function CardContent({ children, className = '' }: CardProps) {
  return <div className={`p-7 pt-0 ${className}`}>{children}</div>
}
