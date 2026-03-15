import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export function Input({ label, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col space-y-2">
      {label && (
        <label className="text-xs font-semibold tracking-[0.14em] text-[color:var(--muted-foreground)]">
          {label}
        </label>
      )}
      <input
        className={`flex h-12 w-full rounded-[18px] border border-[color:var(--border)] bg-[color:var(--input)] px-4 py-2 text-sm text-[color:var(--foreground)] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] placeholder:text-[color:var(--muted-foreground)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--ring)] disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        {...props}
      />
    </div>
  )
}
