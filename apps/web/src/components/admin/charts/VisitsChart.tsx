'use client'

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { DailyVisit } from '@/types/farewell'

interface VisitsChartProps {
  data: DailyVisit[]
}

function formatDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function VisitsChart({ data }: VisitsChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-body-s text-[rgba(255,255,255,0.25)]">
        No visits recorded in the last 30 days
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
        <defs>
          <linearGradient id="visitGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#0078D4" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#0078D4" stopOpacity={0}    />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={formatDate}
          tick={{ fill: 'rgba(255,255,255,0.32)', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          allowDecimals={false}
          tick={{ fill: 'rgba(255,255,255,0.32)', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            background: 'rgba(12,14,22,0.95)',
            border: '1px solid rgba(255,255,255,0.10)',
            borderRadius: 10,
            color: 'rgba(255,255,255,0.85)',
            fontSize: 13,
          }}
          labelFormatter={(label) => formatDate(String(label))}
          formatter={(value) => [Number(value), 'Visits'] as [number, string]}
          cursor={{ stroke: 'rgba(255,255,255,0.08)' }}
        />
        <Area
          type="monotone"
          dataKey="visits"
          stroke="#0078D4"
          strokeWidth={2}
          fill="url(#visitGrad)"
          dot={false}
          activeDot={{ r: 4, fill: '#0078D4', strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
