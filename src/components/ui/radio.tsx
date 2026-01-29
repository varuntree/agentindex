'use client'

import { forwardRef, type InputHTMLAttributes } from 'react'

interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
}

const Radio = forwardRef<HTMLInputElement, RadioProps>(
  ({ className = '', label, id, ...props }, ref) => {
    const radioId = id || `radio-${Math.random().toString(36).slice(2, 9)}`

    return (
      <label
        htmlFor={radioId}
        className={`inline-flex items-center gap-2 cursor-pointer ${className}`}
      >
        <div className="relative">
          <input
            ref={ref}
            type="radio"
            id={radioId}
            className="peer sr-only"
            {...props}
          />
          <div className="w-5 h-5 border-2 border-black rounded-full bg-white transition-colors peer-checked:border-voqo-green peer-focus:ring-2 peer-focus:ring-voqo-green peer-focus:ring-offset-2 peer-disabled:bg-gray-100 peer-disabled:cursor-not-allowed" />
          <div className="absolute top-1.5 left-1.5 w-2 h-2 rounded-full bg-voqo-green opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
        </div>
        {label && <span className="text-sm">{label}</span>}
      </label>
    )
  }
)

Radio.displayName = 'Radio'

export { Radio, type RadioProps }
