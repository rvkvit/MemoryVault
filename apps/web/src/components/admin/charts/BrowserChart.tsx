'use client'

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import type { BrowserStat } from '@/types/farewell'

const COLORS = ['#0078D4', '#00D4B8', '#8B5CF6', '#F59E0B', '#6B7280']

interface BrowserChartProps {
  data: BrowserStat[]
}

export function BrowserChart({ data }: BrowserChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-body-s text-[rgba(255,255,255,0.25)]">
        No data yet
      </div>
    )
  }

  const total = data.reduce((s, d) => s + d.count, 0)
  const chartData = data.map((d) => ({ name: d.browser, value: d.count }))

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={52}
          outerRadius={76}
          paddingAngle={2}
          dataKey="value"
          strokeWidth={0}
        >
          {chartData.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
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
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(value) => (
            <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12 }}>{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
