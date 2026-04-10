import React from 'react'

interface NumberInputProps {
  label: string
  value: number
  min: number
  max: number
  step?: number
  disabled?: boolean
  onChange: (value: number) => void
}

export function NumberInput({
  label,
  value,
  min,
  max,
  step = 1,
  disabled = false,
  onChange,
}: NumberInputProps) {
  const [inputValue, setInputValue] = React.useState<string>(value.toString())

  React.useEffect(() => {
    setInputValue(value.toString())
  }, [value])

  const handleBlur = () => {
    const normalizedValue = normalizeNumberInputValue(inputValue, value, min, max)
    setInputValue(normalizedValue.inputValue)
    onChange(normalizedValue.value)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleBlur()
    }
  }

  return (
    <div>
      <label className="mb-1 block text-sm text-gray-600">{label}</label>
      <div className="relative">
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={inputValue}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className={`w-full rounded-md border px-3 py-2 pr-10 focus:outline-none focus:ring-2 ${
            disabled
              ? 'cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400'
              : 'border-gray-300 focus:ring-blue-500'
          }`}
        />
        {!disabled && (
          <div className="absolute right-2 top-1/2 flex -translate-y-1/2 flex-col items-center gap-0.5">
            <button
              type="button"
              onClick={() => {
                const newValue = stepNumberInputValue(value, min, max, step, 'up')
                setInputValue(newValue.toString())
                onChange(newValue)
              }}
              className="cursor-pointer text-gray-400 hover:text-gray-600"
            >
              ▲
            </button>
            <button
              type="button"
              onClick={() => {
                const newValue = stepNumberInputValue(value, min, max, step, 'down')
                setInputValue(newValue.toString())
                onChange(newValue)
              }}
              className="cursor-pointer text-gray-400 hover:text-gray-600"
            >
              ▼
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function normalizeNumberInputValue(
  inputValue: string,
  fallbackValue: number,
  min: number,
  max: number
): {
  value: number
  inputValue: string
} {
  const parsedValue = Number(inputValue)
  if (Number.isNaN(parsedValue)) {
    return {
      value: fallbackValue,
      inputValue: fallbackValue.toString(),
    }
  }

  const clampedValue = clampNumberValue(parsedValue, min, max)
  return {
    value: clampedValue,
    inputValue: clampedValue.toString(),
  }
}

function stepNumberInputValue(
  value: number,
  min: number,
  max: number,
  step: number,
  direction: 'up' | 'down'
): number {
  const delta = direction === 'up' ? step : -step
  return clampNumberValue(value + delta, min, max)
}

function clampNumberValue(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}
