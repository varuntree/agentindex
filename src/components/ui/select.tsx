'use client'

import { forwardRef, type SelectHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'

interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  options: SelectOption[]
  placeholder?: string
  error?: boolean
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', options = [], placeholder, error = false, ...props }, ref) => {
    return (
      <div className="relative">
        <select
          ref={ref}
          className={`w-full h-10 px-4 pr-10 text-sm bg-white border-2 rounded-lg appearance-none cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-voqo-green disabled:bg-gray-50 disabled:cursor-not-allowed ${
            error ? 'border-red-500' : 'border-black'
          } ${className}`}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
      </div>
    )
  }
)

Select.displayName = 'Select'

export { Select, type SelectProps, type SelectOption }
