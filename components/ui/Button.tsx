import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
  children: React.ReactNode
}

export function Button({
  variant = 'default',
  size = 'default',
  className = '',
  children,
  ...props
}: ButtonProps) {
  const baseStyles =
    'inline-flex items-center justify-center rounded-full font-semibold tracking-[0.06em] transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--ring)] focus-visible:ring-offset-0 disabled:pointer-events-none disabled:opacity-50'

  const variants = {
    default: 'bg-[color:var(--primary)] text-[color:var(--primary-foreground)] shadow-[0_18px_34px_rgba(240,91,42,0.24)] hover:-translate-y-0.5 hover:bg-[color:var(--primary-strong)]',
    outline: 'border border-[color:var(--border-strong)] bg-white/55 text-[color:var(--foreground)] hover:bg-white/85',
    ghost: 'bg-transparent text-[color:var(--muted-foreground)] hover:bg-white/60 hover:text-[color:var(--foreground)]',
  }

  const sizes = {
    default: 'h-11 px-5 text-sm',
    sm: 'h-9 px-4 text-xs',
    lg: 'h-14 px-8 text-sm',
  }

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
