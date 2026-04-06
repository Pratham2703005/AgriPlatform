import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { HeatmapData } from '@/types/farm';

interface NDVITrendsPanelProps {
  heatmapData: HeatmapData;
}

const NDVI_COLORS = ['#94a3b8', '#64748b', '#22c55e']; // oldest → newest: gray → green

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const NdviTooltip = ({ active, payload }: { active?: boolean; payload?: any[] }) => {
  if (active && payload && payload.length) {
    const d = payload[0];
    return (
      <div className="bg-white border border-neutral-200 rounded-lg px-2.5 py-1.5 shadow-lg text-xs">
        <p className="font-semibold text-neutral-700">{d.payload.label}</p>
        <p className="text-green-700 font-bold">NDVI: {(d.value as number).toFixed(4)}</p>
      </div>
    );
  }
  return null;
};

export const NDVITrendsPanel: React.FC<NDVITrendsPanelProps> = ({ heatmapData }) => {
  const healthyPercent = ((heatmapData.pixel_counts.green / heatmapData.pixel_counts.valid) * 100);
  const moderatePercent = ((heatmapData.pixel_counts.yellow / heatmapData.pixel_counts.valid) * 100);
  const stressedPercent = ((heatmapData.pixel_counts.red / heatmapData.pixel_counts.valid) * 100);

  const yieldChange = heatmapData.growth.percentage;

  // Build chart data from ndvi_trend (sorted oldest → newest)
  const trendData = (heatmapData.anomaly?.ndvi_trend ?? [])
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((d) => {
      const dt = new Date(d.date + 'T00:00:00');
      return {
        label: dt.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        year: dt.getFullYear().toString(),
        ndvi: d.mean_ndvi,
      };
    });

  return (
    <div className="space-y-4">
      {/* NDVI Trend Bar Chart */}
      {trendData.length === 0 && (
        <div className="bg-neutral-50 rounded-lg p-3 border border-neutral-200 text-center">
          <p className="text-xs text-neutral-500">NDVI trend data not available. Re-fetch analysis to load 3-year trend.</p>
        </div>
      )}
      {trendData.length > 0 && (
        <div className="bg-white rounded-lg p-3 border border-neutral-200">
          <h4 className="text-xs font-semibold text-neutral-900 mb-1">Mean NDVI — 3 Year Trend</h4>
          <p className="text-[10px] text-neutral-500 mb-3">Annual satellite-derived vegetation index</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={trendData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <YAxis
                domain={['auto', 'auto']}
                tick={{ fontSize: 10, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => v.toFixed(2)}
              />
              <Tooltip content={<NdviTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
              <Bar dataKey="ndvi" radius={[4, 4, 0, 0]}>
                {trendData.map((_, i) => (
                  <Cell key={i} fill={NDVI_COLORS[i % NDVI_COLORS.length] ?? '#64748b'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          {/* Value labels below chart */}
          <div className="flex justify-around mt-1">
            {trendData.map((d, i) => (
              <div key={i} className="text-center">
                <span className="text-[10px] font-bold text-neutral-800">{d.ndvi.toFixed(4)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Health Distribution */}
      <div className="bg-white rounded-lg p-3 border border-neutral-200">
        <h4 className="text-xs font-semibold text-neutral-900 mb-2">Health Distribution</h4>
        <div className="space-y-2">
          {[
            { label: 'Healthy', pct: healthyPercent, color: 'bg-green-500', text: 'text-green-700' },
            { label: 'Moderate', pct: moderatePercent, color: 'bg-yellow-500', text: 'text-yellow-700' },
            { label: 'Stressed', pct: stressedPercent, color: 'bg-red-500', text: 'text-red-700' },
          ].map((item) => (
            <div key={item.label}>
              <div className="flex justify-between mb-0.5">
                <span className="text-[11px] text-neutral-600">{item.label}</span>
                <span className={`text-[11px] font-semibold ${item.text}`}>{item.pct.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-neutral-200 rounded-full h-1.5 overflow-hidden">
                <div className={`${item.color} h-full transition-all duration-300`} style={{ width: `${item.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Field Status */}
      <div className="bg-white rounded-lg p-3 border border-neutral-200">
        <h4 className="text-xs font-semibold text-neutral-900 mb-2">Field Status</h4>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-neutral-600">Overall Health</span>
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: healthyPercent > 60 ? '#22c55e' : healthyPercent > 40 ? '#eab308' : '#ef4444' }} />
              <span className="text-[11px] font-semibold text-neutral-700">
                {healthyPercent > 60 ? 'Excellent' : healthyPercent > 40 ? 'Good' : 'Monitor'}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-neutral-600">Yield Trend</span>
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: yieldChange > 0 ? '#22c55e' : yieldChange === 0 ? '#eab308' : '#ef4444' }} />
              <span className="text-[11px] font-semibold text-neutral-700">
                {yieldChange > 0 ? 'Increasing' : yieldChange === 0 ? 'Stable' : 'Declining'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
