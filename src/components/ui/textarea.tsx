'use client'

import { forwardRef, type TextareaHTMLAttributes } from 'react'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = '', error = false, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={`w-full min-h-[100px] px-4 py-3 text-sm bg-white border-2 rounded-lg transition-colors resize-y focus:outline-none focus:ring-2 focus:ring-voqo-green disabled:bg-gray-50 disabled:cursor-not-allowed ${
          error ? 'border-red-500' : 'border-black'
        } ${className}`}
        {...props}
      />
    )
  }
)

Textarea.displayName = 'Textarea'

export { Textarea, type TextareaProps }
