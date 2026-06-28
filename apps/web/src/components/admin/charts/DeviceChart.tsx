'use client'

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import type { DeviceStat } from '@/types/farewell'

// Desktop → blue, Mobile → teal, Tablet → violet
const DEVICE_COLORS: Record<string, string> = {
  Desktop: '#0078D4',
  Mobile:  '#00D4B8',
  Tablet:  '#8B5CF6',
}
const FALLBACK_COLORS = ['#F59E0B', '#6B7280']

interface DeviceChartProps {
  data: DeviceStat[]
}

export function DeviceChart({ data }: DeviceChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-body-s text-[rgba(255,255,255,0.25)]">
        No data yet
      </div>
    )
  }

  const total = data.reduce((s, d) => s + d.count, 0)
  const chartData = data.map((d) => ({ name: d.device, value: d.count }))

  const getColor = (name: string, i: number) =>
    DEVICE_COLORS[name] ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length]

  return (
    <div className="space-y-3">
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={72}
            paddingAngle={2}
            dataKey="value"
            strokeWidth={0}
          >
            {chartData.map((entry, i) => (
              <Cell key={i} fill={getColor(entry.name, i)} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: 'rgba(12,14,22,0.95)',
              border: '1px solid rgba(255,255,255,0.10)',
              borderRadius: 10,
              color: 'rgba(255,255,255,0.85)',
              fontSize: 13,
            }}
            formatter={(value: number, name: string) => [
              `${value} (${Math.round((value / total) * 100)}%)`,
              name,
            ]}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Legend with percentages */}
      <div className="space-y-1.5">
        {chartData.map((entry, i) => (
          <div key={entry.name} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: getColor(entry.name, i) }}
              />
              <span className="text-label-s text-[rgba(255,255,255,0.55)]">{entry.name}</span>
            </div>
            <span className="text-label-s text-[rgba(255,255,255,0.70)] tabular-nums">
              {Math.round((entry.value / total) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
