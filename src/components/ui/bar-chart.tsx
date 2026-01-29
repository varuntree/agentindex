'use client'

interface BarChartData {
  label: string
  value: number
  maxValue?: number
}

interface BarChartProps {
  data: BarChartData[]
  className?: string
  /** If true, shows raw count instead of value/maxValue format */
  showCount?: boolean
}

export function BarChart({ data, className = '', showCount = false }: BarChartProps) {
  // For count mode, derive maxValue from data
  const derivedMax = showCount ? Math.max(...data.map(d => d.value), 1) : undefined

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {data.map((item, index) => {
        const maxValue = showCount ? derivedMax! : (item.maxValue ?? 5)
        const percentage = Math.min((item.value / maxValue) * 100, 100)

        return (
          <div key={index} className="flex items-center gap-3">
            <span className="w-32 text-sm font-medium shrink-0">{item.label}</span>
            <div className="flex-1 h-6 bg-gray-200 border-2 border-black relative">
              <div
                className="h-full"
                style={{
                  width: `${percentage}%`,
                  backgroundColor: '#26C169',
                }}
              />
            </div>
            <span className="w-12 text-sm font-medium text-right shrink-0">
              {showCount ? item.value : `${item.value.toFixed(1)}/${maxValue}`}
            </span>
          </div>
        )
      })}
    </div>
  )
}
