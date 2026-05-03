import React from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  ChevronRight,
  LineChart as LineChartIcon,
  TrendingUp,
} from 'lucide-react';
import type { HeatmapData } from '@/types/farm';

interface NDVITrendsPanelProps {
  heatmapData: HeatmapData;
  onViewStressMap?: () => void;
}

type RangeKey = '1M' | '3M' | '6M' | '1Y' | '3Y';

const RANGE_DAYS: Record<RangeKey, number> = {
  '1M': 30,
  '3M': 90,
  '6M': 180,
  '1Y': 365,
  '3Y': 1095,
};

const TREND_STYLES = {
  improving: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  stable: 'bg-amber-100 text-amber-800 border-amber-200',
  declining: 'bg-red-100 text-red-800 border-red-200',
};

const CHIP_STYLES = {
  emerald: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  amber: 'bg-amber-100 text-amber-800 border-amber-200',
  red: 'bg-red-100 text-red-800 border-red-200',
  sky: 'bg-sky-100 text-sky-800 border-sky-200',
};

const PRIORITY_STYLES = {
  High: 'bg-red-100 text-red-800 border-red-200',
  Medium: 'bg-amber-100 text-amber-800 border-amber-200',
  Low: 'bg-emerald-100 text-emerald-800 border-emerald-200',
};

const HEALTH_STYLES: Record<string, string> = {
  Excellent: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  Good: 'bg-lime-100 text-lime-800 border-lime-200',
  Moderate: 'bg-amber-100 text-amber-800 border-amber-200',
  Poor: 'bg-orange-100 text-orange-800 border-orange-200',
  Critical: 'bg-red-100 text-red-800 border-red-200',
};

const formatShortDate = (date: Date): string =>
  date.toLocaleDateString('en-US', { day: '2-digit', month: 'short' });

const formatAxisDate = (date: Date, range: RangeKey): string => {
  if (range === '1M' || range === '3M') {
    return date.toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: '2-digit',
    });
  }

  if (range === '6M') {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      year: '2-digit',
    });
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });
};

const formatLongDate = (date: Date): string =>
  date.toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const NdviTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: any[];
}) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;

  return (
    <div className='bg-white border border-neutral-200 rounded-lg px-2.5 py-1.5 shadow-lg text-xs'>
      <p className='font-semibold text-neutral-700'>{d.longLabel}</p>
      <p className='text-emerald-700 font-bold'>
        NDVI: {(d.ndvi as number).toFixed(4)}
      </p>
    </div>
  );
};

export const NDVITrendsPanel: React.FC<NDVITrendsPanelProps> = ({
  heatmapData,
  onViewStressMap,
}) => {
  const [selectedRange, setSelectedRange] = React.useState<RangeKey>('1Y');
  const [chartType, setChartType] = React.useState<'line' | 'bar'>('line');
  const [showMoreInfo, setShowMoreInfo] = React.useState(false);

  const rawTrendData = (heatmapData.anomaly?.ndvi_trend ?? [])
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(point => {
      const date = new Date(`${point.date}T00:00:00`);
      return {
        date,
        timestamp: date.getTime(),
        ndvi: point.mean_ndvi,
        label: formatShortDate(date),
        longLabel: formatLongDate(date),
      };
    });

  const latestTimestamp = rawTrendData[rawTrendData.length - 1]?.timestamp;
  const selectedTrendData = latestTimestamp
    ? rawTrendData.filter(
        d =>
          latestTimestamp - d.timestamp <=
          RANGE_DAYS[selectedRange] * 24 * 60 * 60 * 1000
      )
    : [];

  const chartData =
    selectedTrendData.length >= 2 ? selectedTrendData : rawTrendData;

  const chartDataWithLabels = chartData.map(point => ({
    ...point,
    axisLabel: formatAxisDate(point.date, selectedRange),
  }));

  const firstNdvi = chartData[0]?.ndvi;
  const lastNdvi = chartData[chartData.length - 1]?.ndvi;
  const change =
    typeof firstNdvi === 'number' && typeof lastNdvi === 'number'
      ? lastNdvi - firstNdvi
      : 0;
  const changePct =
    typeof firstNdvi === 'number' && Math.abs(firstNdvi) > 0.0001
      ? (change / Math.abs(firstNdvi)) * 100
      : 0;

  const slope = chartData.length > 1 ? change / (chartData.length - 1) : 0;

  const trendKey: 'improving' | 'stable' | 'declining' =
    Math.abs(changePct) < 3 || Math.abs(slope) < 0.01
      ? 'stable'
      : changePct > 0
        ? 'improving'
        : 'declining';

  const trendLabel =
    trendKey === 'improving'
      ? 'Improving'
      : trendKey === 'declining'
        ? 'Declining'
        : 'Stable';

  const trendInsight =
    chartData.length < 2
      ? 'Not enough NDVI points yet for a reliable health signal.'
      : trendKey === 'declining'
        ? 'Health dropped recently; early stress signals are now visible.'
        : trendKey === 'improving'
          ? 'Canopy condition is recovering with a steady positive trend.'
          : 'Health is mostly stable with no major NDVI shocks.';

  const latestNdviValue = chartData[chartData.length - 1]?.ndvi;
  const latestLabel = chartData[chartData.length - 1]?.longLabel;

  const healthTag =
    typeof latestNdviValue !== 'number'
      ? {
          label: 'Unknown',
          style: 'bg-neutral-100 text-neutral-700 border-neutral-200',
        }
      : latestNdviValue >= 0.6
        ? {
            label: 'Healthy',
            style: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          }
        : latestNdviValue >= 0.4
          ? {
              label: 'Moderate',
              style: 'bg-amber-100 text-amber-800 border-amber-200',
            }
          : {
              label: 'Stressed',
              style: 'bg-red-100 text-red-800 border-red-200',
            };

  const validPixels = Math.max(1, heatmapData.pixel_counts.valid || 0);
  const stressedPercent = (heatmapData.pixel_counts.red / validPixels) * 100;
  const moderatePercent =
    (heatmapData.pixel_counts.yellow / validPixels) * 100;

  // Derive a top issue from pixel stats only (no fabricated diagnosis).
  const topIssue: {
    name: string;
    affected_area_pct: number;
    priority: 'High' | 'Medium' | 'Low';
  } | null =
    stressedPercent >= 5
      ? {
          name: 'Stressed area',
          affected_area_pct: stressedPercent,
          priority: stressedPercent >= 35 ? 'High' : 'Medium',
        }
      : moderatePercent >= 20
        ? {
            name: 'Moderate-health area',
            affected_area_pct: moderatePercent,
            priority: 'Medium',
          }
        : null;
  const keyIssueText = topIssue
    ? `${topIssue.affected_area_pct.toFixed(1)}% of field is ${topIssue.name.toLowerCase()}.`
    : stressedPercent >= 40
      ? `${stressedPercent.toFixed(1)}% of the field currently appears stressed.`
      : 'No major stress cluster detected in the pixel breakdown.';

  const pointCount = chartData.length;
  const averageNdvi =
    pointCount > 0
      ? chartData.reduce((sum, point) => sum + point.ndvi, 0) / pointCount
      : null;
  const variance =
    pointCount > 1 && typeof averageNdvi === 'number'
      ? chartData.reduce(
          (sum, point) => sum + (point.ndvi - averageNdvi) ** 2,
          0
        ) / pointCount
      : 0;
  const volatility = Math.sqrt(variance);

  const recentDelta =
    pointCount > 1
      ? chartData[pointCount - 1]!.ndvi - chartData[pointCount - 2]!.ndvi
      : 0;

  const deltas = chartData.slice(1).map((p, i) => ({
    date: p.date,
    delta: p.ndvi - chartData[i]!.ndvi,
  }));

  const sharpestDrop = deltas.reduce<{ date: Date; delta: number } | null>(
    (acc, current) => {
      if (!acc || current.delta < acc.delta) return current;
      return acc;
    },
    null
  );

  const strongestRecovery = deltas.reduce<{ date: Date; delta: number } | null>(
    (acc, current) => {
      if (!acc || current.delta > acc.delta) return current;
      return acc;
    },
    null
  );

  const microInsight =
    !sharpestDrop || !strongestRecovery
      ? 'Field is stable with no sudden NDVI shocks in this range.'
      : sharpestDrop.delta <= -0.03
        ? `Sudden drop detected around ${formatLongDate(sharpestDrop.date)}.`
        : strongestRecovery.delta >= 0.03
          ? `Recovery signal observed around ${formatLongDate(strongestRecovery.date)}.`
          : 'Field is stable with no sudden NDVI shocks in this range.';

  const rangeWindowMs = RANGE_DAYS[selectedRange] * 24 * 60 * 60 * 1000;
  const selectedStartTimestamp = chartData[0]?.timestamp;
  const previousWindowData = selectedStartTimestamp
    ? rawTrendData.filter(
        point =>
          point.timestamp < selectedStartTimestamp &&
          point.timestamp >= selectedStartTimestamp - rangeWindowMs
      )
    : [];
  const previousAverage =
    previousWindowData.length > 0
      ? previousWindowData.reduce((sum, point) => sum + point.ndvi, 0) /
        previousWindowData.length
      : null;
  const currentAverage =
    pointCount > 0
      ? chartData.reduce((sum, point) => sum + point.ndvi, 0) / pointCount
      : null;
  const comparisonPct =
    typeof currentAverage === 'number' &&
    typeof previousAverage === 'number' &&
    Math.abs(previousAverage) > 0.0001
      ? ((currentAverage - previousAverage) / Math.abs(previousAverage)) * 100
      : null;

  const impactText =
    trendKey === 'declining' && stressedPercent >= 40
      ? 'This pattern may reduce yield by about 15-20% if not corrected soon.'
      : trendKey === 'declining'
        ? 'If this decline continues, yield can drop by around 8-12%.'
        : trendKey === 'improving'
          ? 'Recovery is underway; stable irrigation can preserve this momentum.'
          : 'Stable health now; targeted scouting can prevent sudden stress spread.';

  const comparisonText =
    typeof comparisonPct !== 'number'
      ? 'Comparison baseline is not available yet.'
      : comparisonPct >= 0
        ? `Compared to the previous ${selectedRange}, NDVI is up ${comparisonPct.toFixed(1)}%.`
        : `Compared to the previous ${selectedRange}, NDVI is down ${Math.abs(comparisonPct).toFixed(1)}%.`;

  const latestForForecast =
    typeof latestNdviValue === 'number' ? latestNdviValue : 0.5;
  const forecast = {
    optimistic: Math.min(1, latestForForecast + 0.05),
    expected: Math.min(
      1,
      Math.max(
        0,
        latestForForecast +
          (trendKey === 'improving'
            ? 0.03
            : trendKey === 'declining'
              ? -0.02
              : 0.005)
      )
    ),
    pessimistic: Math.max(0, latestForForecast - 0.05),
  };

  // Risk derived directly from NDVI pixel distribution.
  const riskScore = Math.max(
    0,
    Math.min(100, stressedPercent * 0.7 + moderatePercent * 0.3)
  );

  const derivedHealth =
    riskScore > 50
      ? 'Critical'
      : riskScore > 35
        ? 'Poor'
        : riskScore > 20
          ? 'Moderate'
          : riskScore > 10
            ? 'Good'
            : 'Excellent';
  const derivedPriority: 'High' | 'Medium' | 'Low' =
    riskScore >= 35 ? 'High' : riskScore >= 15 ? 'Medium' : 'Low';
  const aiHealth = derivedHealth;
  const aiPriority = derivedPriority;
  const riskColor =
    riskScore <= 30
      ? 'bg-emerald-500'
      : riskScore <= 60
        ? 'bg-amber-500'
        : 'bg-red-500';
  const riskLabel =
    riskScore <= 30 ? 'Low' : riskScore <= 60 ? 'Medium' : 'High';

  const hasHighStress = stressedPercent >= 35;
  const actionItems: Array<{
    title: string;
    priority: 'High' | 'Medium' | 'Low';
    urgency: string;
  }> = [
    {
      title:
        trendKey === 'declining' || hasHighStress
          ? 'Irrigation Required'
          : 'Irrigation Uniformity Check',
      priority: trendKey === 'declining' || hasHighStress ? 'High' : 'Medium',
      urgency:
        trendKey === 'declining' || hasHighStress
          ? 'Do within 24-48h'
          : 'Do within 3-5 days',
    },
    {
      title: topIssue ? `${topIssue.name} Control` : 'Nitrogen Boost',
      priority:
        topIssue?.priority ?? (trendKey === 'declining' ? 'Medium' : 'Low'),
      urgency: topIssue?.priority === 'High' ? 'Immediate' : 'Within 3-5 days',
    },
    {
      title: hasHighStress ? 'Inspect Stress Zones' : 'Targeted Field Scouting',
      priority: hasHighStress ? 'High' : 'Medium',
      urgency: hasHighStress ? 'Immediate' : 'Within 48h',
    },
  ];

  const insightChips: Array<{
    label: string;
    tone: 'emerald' | 'amber' | 'red' | 'sky';
  }> = [];

  if (trendKey === 'improving') {
    insightChips.push({ label: 'Stable Growth', tone: 'emerald' });
  }
  if (sharpestDrop && sharpestDrop.delta <= -0.03) {
    insightChips.push({ label: 'Sudden Drop Detected', tone: 'red' });
  }
  if (strongestRecovery && strongestRecovery.delta >= 0.03) {
    insightChips.push({ label: 'Recovery Signal', tone: 'sky' });
  }
  if (volatility >= 0.04) {
    insightChips.push({ label: 'High Variability', tone: 'amber' });
  } else if (volatility > 0 && volatility < 0.02) {
    insightChips.push({ label: 'Consistent Canopy', tone: 'emerald' });
  }
  if (insightChips.length === 0) {
    insightChips.push({ label: 'Steady Pattern', tone: 'amber' });
  }

  const hasAnomalyMap = Boolean(
    heatmapData.anomaly?.tile_urls?.anomaly_heatmap
  );

  return (
    <div className='space-y-2'>
      <div className='relative overflow-hidden rounded-xl border border-emerald-200 bg-[linear-gradient(130deg,#064e3b_0%,#065f46_35%,#10b981_100%)] p-2 text-white shadow-sm transition-transform duration-300 hover:-translate-y-0.5'>
        <div className='pointer-events-none absolute -right-4 -top-4 h-14 w-14 rounded-full bg-white/20 blur-lg' />
        <div className='pointer-events-none absolute -bottom-6 -left-6 h-16 w-16 rounded-full bg-emerald-300/25 blur-lg' />

        <div className='relative flex items-start justify-between gap-2'>
          <div>
            <p className='text-[10px] uppercase tracking-[0.14em] text-emerald-100'>
              Field Health
            </p>
            <div className='mt-0.5 flex items-center gap-0.5'>
              <span className='text-base font-bold leading-5'>
                {trendLabel}
              </span>
              {change >= 0 ? (
                <ArrowUpRight className='h-4 w-4 animate-bounce text-emerald-100' />
              ) : (
                <ArrowDownRight className='h-4 w-4 animate-bounce text-red-200' />
              )}
            </div>
            <p className='mt-0.5 text-[10px] leading-4 text-emerald-50'>
              {trendInsight}
            </p>
          </div>
          <span
            className={`rounded-full border bg-white/90 px-1.5 py-0.5 text-[9px] font-semibold ${healthTag.style}`}
          >
            {healthTag.label}
          </span>
        </div>

        <div className='relative mt-1.5 grid grid-cols-3 gap-1'>
          <div className='rounded-md bg-white/15 px-1.5 py-1 backdrop-blur'>
            <p className='text-[9px] text-emerald-100'>Latest NDVI</p>
            <p className='text-sm font-bold leading-4'>
              {typeof latestNdviValue === 'number'
                ? latestNdviValue.toFixed(4)
                : '--'}
            </p>
            <p className='truncate text-[9px] text-emerald-100'>
              {latestLabel ?? 'No date'}
            </p>
          </div>

          <div className='rounded-md bg-white/15 px-1.5 py-1 backdrop-blur'>
            <p className='text-[9px] text-emerald-100'>
              Trend ({selectedRange})
            </p>
            <p className='text-sm font-bold leading-4'>
              {change >= 0 ? '+' : '-'}
              {Math.abs(changePct).toFixed(1)}%
            </p>
            <p className='text-[9px] text-emerald-100'>vs period start</p>
          </div>

          <div className='rounded-md bg-white/15 px-1.5 py-1 backdrop-blur'>
            <p className='text-[9px] text-emerald-100'>Stress Area</p>
            <p className='text-sm font-bold leading-4'>
              {stressedPercent.toFixed(1)}%
            </p>
            <p className='text-[9px] text-emerald-100'>under stress</p>
          </div>
        </div>
      </div>

      <div className='rounded-xl border border-emerald-200 bg-[linear-gradient(145deg,#f0fdf4_0%,#ffffff_55%,#ecfeff_100%)] p-2 shadow-sm transition-transform duration-300 hover:-translate-y-0.5'>
        <div className='mb-1 flex items-center justify-between gap-2'>
          <div className='flex items-center gap-1.5'>
            <TrendingUp className='h-4 w-4 text-emerald-700' />
            <h4 className='text-sm font-semibold text-neutral-900'>
              NDVI Momentum
            </h4>
          </div>
          <span
            className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${TREND_STYLES[trendKey]}`}
          >
            {trendLabel}
          </span>
        </div>

        <div className='mb-1 flex flex-wrap items-center justify-between gap-1.5'>
          <div className='flex flex-wrap gap-1'>
            {(['1M', '3M', '6M', '1Y', '3Y'] as RangeKey[]).map(range => (
              <button
                key={range}
                type='button'
                onClick={() => setSelectedRange(range)}
                className={`rounded-md border px-1.5 py-0.5 text-[9px] font-semibold transition-colors ${
                  selectedRange === range
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
          <div className='inline-flex rounded-lg border border-neutral-200 bg-white p-0.5'>
            <button
              type='button'
              onClick={() => setChartType('line')}
              className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[9px] font-semibold transition-colors ${
                chartType === 'line'
                  ? 'bg-neutral-900 text-white'
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              <LineChartIcon className='h-2.5 w-2.5' />
              Line
            </button>
            <button
              type='button'
              onClick={() => setChartType('bar')}
              className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[9px] font-semibold transition-colors ${
                chartType === 'bar'
                  ? 'bg-neutral-900 text-white'
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              <BarChart3 className='h-2.5 w-2.5' />
              Bar
            </button>
          </div>
        </div>

        {chartData.length === 0 ? (
          <div className='bg-neutral-50 rounded-lg p-3 border border-neutral-200 text-center'>
            <p className='text-xs text-neutral-500'>
              NDVI trend data is not available for this farm yet.
            </p>
          </div>
        ) : (
          <ResponsiveContainer width='100%' height={116}>
            {chartType === 'line' ? (
              <AreaChart
                data={chartDataWithLabels}
                margin={{ top: 2, right: 8, left: 4, bottom: -2 }}
              >
                <defs>
                  <linearGradient id='ndviGradient' x1='0' y1='0' x2='0' y2='1'>
                    <stop offset='5%' stopColor='#10b981' stopOpacity={0.78} />
                    <stop offset='95%' stopColor='#10b981' stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray='3 3'
                  stroke='#dcfce7'
                  vertical={false}
                />
                <XAxis
                  dataKey='axisLabel'
                  tick={{ fontSize: 10, fill: '#6b7280' }}
                  axisLine={false}
                  tickLine={false}
                  interval='preserveStartEnd'
                  minTickGap={20}
                  padding={{ left: 8, right: 8 }}
                />
                <YAxis
                  domain={['auto', 'auto']}
                  tick={{ fontSize: 10, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => v.toFixed(2)}
                  width={34}
                />
                <Tooltip content={<NdviTooltip />} />
                <Area
                  type='monotone'
                  dataKey='ndvi'
                  stroke='#059669'
                  strokeWidth={2.4}
                  fill='url(#ndviGradient)'
                />
                <Line
                  type='monotone'
                  dataKey='ndvi'
                  stroke='#059669'
                  strokeWidth={2.8}
                  dot={{ r: 2.5, fill: '#059669' }}
                  activeDot={{ r: 4.5 }}
                />
              </AreaChart>
            ) : (
              <BarChart
                data={chartDataWithLabels}
                margin={{ top: 2, right: 8, left: 4, bottom: -2 }}
              >
                <CartesianGrid
                  strokeDasharray='3 3'
                  stroke='#dcfce7'
                  vertical={false}
                />
                <XAxis
                  dataKey='axisLabel'
                  tick={{ fontSize: 10, fill: '#6b7280' }}
                  axisLine={false}
                  tickLine={false}
                  interval='preserveStartEnd'
                  minTickGap={20}
                  padding={{ left: 8, right: 8 }}
                />
                <YAxis
                  domain={['auto', 'auto']}
                  tick={{ fontSize: 10, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => v.toFixed(2)}
                  width={34}
                />
                <Tooltip content={<NdviTooltip />} />
                <Bar
                  dataKey='ndvi'
                  radius={[4, 4, 0, 0]}
                  fill='#10b981'
                  maxBarSize={20}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        )}

        <div className='mt-1 flex flex-wrap gap-1'>
          {insightChips.map(chip => (
            <span
              key={chip.label}
              className={`rounded-full border px-1.5 py-0.5 text-[9px] font-semibold ${CHIP_STYLES[chip.tone]}`}
            >
              {chip.label}
            </span>
          ))}
        </div>
      </div>
      <div className='rounded-xl border border-neutral-200 bg-[linear-gradient(145deg,#ffffff_0%,#f8fafc_100%)] p-1.5 shadow-sm transition-transform duration-300 hover:-translate-y-0.5'>
        <div className='mb-1 flex items-center justify-between'>
          <h4 className='text-xs font-semibold text-neutral-900'>
            Action Priority
          </h4>
          <span className='rounded-full border border-neutral-200 bg-neutral-50 px-1.5 py-0.5 text-[10px] font-semibold text-neutral-700'>
            AI Actions
          </span>
        </div>

        <div className='grid grid-cols-2 gap-1'>
          {actionItems.map((action, index) => (
            <div
              key={action.title}
              className={`rounded-md border border-neutral-200 bg-neutral-50 px-1.5 py-1 ${index === 0 ? 'col-span-2' : ''}`}
            >
              <div className='flex items-start justify-between gap-2'>
                <p className='text-[11px] font-semibold text-neutral-900'>
                  {action.title}
                </p>
                <span
                  className={`rounded-full border px-1 py-0.5 text-[10px] font-semibold ${PRIORITY_STYLES[action.priority]}`}
                >
                  {action.priority}
                </span>
              </div>
              <p className='mt-0.5 text-[10px] text-neutral-600'>
                {action.urgency}
              </p>
              {action.confidence && (
                <p className='text-[10px] text-sky-700'>
                  Confidence: {action.confidence}
                </p>
              )}
            </div>
          ))}
        </div>

        <div className='mt-1.5 rounded-md border border-emerald-100 bg-[linear-gradient(145deg,#ecfdf5_0%,#ffffff_70%,#f0fdf4_100%)] px-1.5 py-1'>
          <p className='text-[9px] font-semibold uppercase tracking-wide text-emerald-700'>
            NDVI Forecast
          </p>
          <div className='mt-1 grid grid-cols-3 gap-1'>
            <div className='rounded-md border border-emerald-200 bg-emerald-50 px-1 py-0.5'>
              <p className='text-[9px] text-emerald-700'>Best Case</p>
              <p className='text-[11px] font-bold text-emerald-800'>
                {forecast.optimistic.toFixed(2)}
              </p>
            </div>
            <div className='rounded-md border border-sky-200 bg-sky-50 px-1 py-0.5'>
              <p className='text-[9px] text-sky-700'>Expected</p>
              <p className='text-[11px] font-bold text-sky-800'>
                {forecast.expected.toFixed(2)}
              </p>
            </div>
            <div className='rounded-md border border-amber-200 bg-amber-50 px-1 py-0.5'>
              <p className='text-[9px] text-amber-700'>Worst Case</p>
              <p className='text-[11px] font-bold text-amber-800'>
                {forecast.pessimistic.toFixed(2)}
              </p>
            </div>
          </div>
          <div className='mt-1 h-1.5 overflow-hidden rounded-full bg-neutral-200'>
            <div
              className='h-full bg-[repeating-linear-gradient(90deg,#10b981_0,#10b981_6px,transparent_6px,transparent_10px)] opacity-80'
              style={{
                width: `${Math.min(100, Math.max(0, forecast.expected * 100))}%`,
              }}
            />
          </div>
        </div>
      </div>
              
      {hasAnomalyMap && (
        <div className='group relative overflow-hidden rounded-lg border border-red-200 bg-red-50 p-1.5 shadow-sm transition-transform duration-300 hover:-translate-y-0.5'>
          <div className='absolute inset-0 bg-[radial-gradient(circle_at_70%_15%,rgba(239,68,68,0.22),transparent_46%),radial-gradient(circle_at_15%_80%,rgba(245,158,11,0.18),transparent_40%)]' />
          <div className='relative'>
            <div className='mb-1.5 h-12 overflow-hidden rounded-md border border-red-200 bg-[linear-gradient(120deg,#fee2e2_0%,#fecaca_35%,#fca5a5_70%,#fef2f2_100%)]'>
              <div className='flex h-full items-center justify-center bg-black/10 backdrop-blur-[1.5px]'>
                <p className='text-[9px] font-semibold tracking-wide text-red-900'>
                  STRESS ZONES DETECTED
                </p>
              </div>
            </div>
            <div className='flex items-start gap-1'>
              <AlertTriangle className='mt-0.5 h-3 w-3 text-red-600' />
              <div className='min-w-0'>
                <p className='text-[10px] text-red-900'>
                  Hotspots are visible in anomaly mapping. Inspect these regions
                  before the next irrigation cycle.
                </p>
              </div>
            </div>
            <div className='mt-1'>
              <button
                type='button'
                onClick={onViewStressMap}
                className='inline-flex items-center rounded-full border border-red-300 bg-white px-1.5 py-0.5 text-[9px] font-semibold text-red-700 transition-colors hover:bg-red-100'
              >
                Inspect field heatmap
                <ChevronRight className='ml-0.5 h-3 w-3' />
              </button>
            </div>
          </div>
        </div>
      )}
      {!showMoreInfo && (
        <div className='relative overflow-hidden rounded-xl border border-emerald-200/70 bg-gradient-to-b from-white via-emerald-50/55 to-emerald-100/65 p-2 shadow-sm'>
          <div className='pointer-events-none absolute inset-0 backdrop-blur-[1px]' />
          <div className='pointer-events-none absolute -bottom-10 left-0 right-0 h-24 bg-gradient-to-t from-emerald-400/45 via-emerald-300/25 to-transparent blur-2xl' />
          <div className='pointer-events-none absolute -bottom-3 left-8 right-8 h-10 rounded-full bg-emerald-300/30 blur-xl' />

          <div className='relative pb-9'>
            <div className='relative overflow-hidden p-0.5'>
              <div className='mb-1.5 flex items-center justify-between gap-2'>
                <div className='inline-flex items-center gap-1'>
                  <span className='inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-200 bg-slate-100'>
                    <LineChartIcon className='h-3 w-3 text-slate-700' />
                  </span>
                  <h3 className='text-xs font-semibold text-neutral-900'>
                    NDVI Details
                  </h3>
                </div>
                <span
                  className={`rounded-full border px-1.5 py-0.5 text-[10px] font-semibold ${PRIORITY_STYLES[aiPriority as 'High' | 'Medium' | 'Low']}`}
                >
                  {aiPriority}
                </span>
              </div>

              <div className='grid grid-cols-2 gap-1 text-[10px]'>
                <div className='rounded-md border border-neutral-200 bg-neutral-50 p-1.5'>
                  <p className='text-neutral-500'>Overall Health</p>
                  <span
                    className={`mt-0.5 inline-flex rounded-full border px-1.5 py-0.5 text-[9px] font-semibold ${HEALTH_STYLES[aiHealth] ?? HEALTH_STYLES.Moderate}`}
                  >
                    {aiHealth}
                  </span>
                </div>
                <div className='rounded-md border border-neutral-200 bg-neutral-50 p-1.5'>
                  <p className='text-neutral-500'>Risk Score</p>
                  <p className='font-semibold text-neutral-900'>
                    {Math.round(riskScore)}/100 ({riskLabel})
                  </p>
                </div>
                <div className='rounded-md border border-neutral-200 bg-neutral-50 p-1.5'>
                  <p className='text-neutral-500'>Stress Area</p>
                  <p className='font-semibold text-neutral-900'>
                    {stressedPercent.toFixed(1)}%
                  </p>
                </div>
                <div className='rounded-md border border-neutral-200 bg-neutral-50 p-1.5'>
                  <p className='text-neutral-500'>Moderate Area</p>
                  <p className='font-semibold text-neutral-900'>
                    {moderatePercent.toFixed(1)}%
                  </p>
                </div>
              </div>

              <div className='mt-1.5 h-1.5 overflow-hidden rounded-full bg-neutral-100'>
                <div
                  className={`h-full ${riskColor}`}
                  style={{ width: `${riskScore}%` }}
                />
              </div>

              <div className='mt-1.5 grid grid-cols-2 gap-1 text-[10px] text-neutral-700'>
                <p>Points: {pointCount}</p>
                <p>Volatility: {volatility.toFixed(3)}</p>
                <p>
                  Avg NDVI:{' '}
                  {typeof averageNdvi === 'number'
                    ? averageNdvi.toFixed(3)
                    : '--'}
                </p>
                <p>
                  Latest move: {recentDelta >= 0 ? '+' : '-'}
                  {Math.abs(recentDelta).toFixed(3)}
                </p>
              </div>

              <div className='pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-white/95 via-white/80 to-transparent backdrop-blur-[2px]' />
            </div>
          </div>

          <button
            type='button'
            onClick={() => setShowMoreInfo(true)}
            className='absolute bottom-2 left-1/2 -translate-x-1/2 inline-flex items-center rounded-full border border-emerald-200 bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white shadow-lg shadow-emerald-400/40 hover:bg-emerald-500 transition-colors'
          >
            More info
            <ChevronRight className='ml-1.5 h-4 w-4' />
          </button>
        </div>
      )}
      {showMoreInfo && (
        <>
          <div className='flex justify-end -mt-1'>
            <button
              type='button'
              onClick={() => setShowMoreInfo(false)}
              className='inline-flex items-center text-[11px] font-semibold text-neutral-600 hover:text-neutral-900'
            >
              Hide extra info
              <ChevronRight className='ml-1 h-3.5 w-3.5 rotate-90' />
            </button>
          </div>
          <div className='space-y-2'>
            <div className='rounded-xl border border-neutral-200 bg-[linear-gradient(155deg,#ffffff_0%,#f8fafc_60%,#f1f5f9_100%)] p-2 shadow-sm transition-transform duration-300 hover:-translate-y-0.5'>
              <div className='mb-1.5 flex items-center justify-between gap-2'>
                <div className='inline-flex items-center gap-1'>
                  <span className='inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-200 bg-slate-100'>
                    <LineChartIcon className='h-3 w-3 text-slate-700' />
                  </span>
                  <h3 className='text-xs font-semibold text-neutral-900'>
                    NDVI Details
                  </h3>
                </div>
                <span
                  className={`rounded-full border px-1.5 py-0.5 text-[10px] font-semibold ${PRIORITY_STYLES[aiPriority as 'High' | 'Medium' | 'Low']}`}
                >
                  {aiPriority}
                </span>
              </div>

              <div className='grid grid-cols-2 gap-1 text-[10px]'>
                <div className='rounded-md border border-neutral-200 bg-neutral-50 p-1.5'>
                  <p className='text-neutral-500'>Overall Health</p>
                  <span
                    className={`mt-0.5 inline-flex rounded-full border px-1.5 py-0.5 text-[9px] font-semibold ${HEALTH_STYLES[aiHealth] ?? HEALTH_STYLES.Moderate}`}
                  >
                    {aiHealth}
                  </span>
                </div>
                <div className='rounded-md border border-neutral-200 bg-neutral-50 p-1.5'>
                  <p className='text-neutral-500'>Stress Area</p>
                  <p className='font-semibold text-neutral-900'>
                    {stressedPercent.toFixed(1)}%
                  </p>
                </div>
                <div className='rounded-md border border-neutral-200 bg-neutral-50 p-1.5'>
                  <p className='text-neutral-500'>Risk Score</p>
                  <p className='font-semibold text-neutral-900'>
                    {Math.round(riskScore)}/100 ({riskLabel})
                  </p>
                </div>
                <div className='rounded-md border border-neutral-200 bg-neutral-50 p-1.5'>
                  <p className='text-neutral-500'>Moderate Area</p>
                  <p className='font-semibold text-neutral-900'>
                    {moderatePercent.toFixed(1)}%
                  </p>
                </div>
              </div>

              <div className='mt-1.5 h-1.5 overflow-hidden rounded-full bg-neutral-100'>
                <div
                  className={`h-full ${riskColor}`}
                  style={{ width: `${riskScore}%` }}
                />
              </div>

              <div className='mt-1.5 grid grid-cols-2 gap-1 text-[10px] text-neutral-700'>
                <p>Points: {pointCount}</p>
                <p>Volatility: {volatility.toFixed(3)}</p>
                <p>
                  Avg NDVI:{' '}
                  {typeof averageNdvi === 'number'
                    ? averageNdvi.toFixed(3)
                    : '--'}
                </p>
                <p>
                  Latest move: {recentDelta >= 0 ? '+' : '-'}
                  {Math.abs(recentDelta).toFixed(3)}
                </p>
              </div>
            </div>

            <div className='rounded-xl border border-amber-200 bg-[linear-gradient(155deg,#fffbeb_0%,#fff7ed_45%,#ffffff_100%)] p-2 shadow-sm transition-transform duration-300 hover:-translate-y-0.5'>
              <div className='mb-1 flex items-center justify-between'>
                <div className='inline-flex items-center gap-1'>
                  <span className='inline-flex h-5 w-5 items-center justify-center rounded-full border border-amber-200 bg-amber-100'>
                    <AlertTriangle className='h-3 w-3 text-amber-700' />
                  </span>
                  <p className='text-[10px] font-semibold uppercase tracking-wide text-amber-700'>
                    Key Issue
                  </p>
                </div>
                {topIssue?.priority && (
                  <span
                    className={`rounded-full border px-1.5 py-0.5 text-[9px] font-semibold ${PRIORITY_STYLES[topIssue.priority]}`}
                  >
                    {topIssue.priority}
                  </span>
                )}
              </div>
              <p className='text-[10px] leading-4 text-amber-900'>
                {keyIssueText}
              </p>
              <p className='mt-1 rounded-md border border-amber-200/60 bg-white/80 px-1.5 py-1 text-[9px] leading-4 text-amber-800'>
                Why it matters: {impactText}
              </p>
            </div>

            <div className='rounded-xl border border-neutral-200 bg-[linear-gradient(155deg,#ffffff_0%,#f8fafc_60%,#f1f5f9_100%)] p-2 shadow-sm transition-transform duration-300 hover:-translate-y-0.5'>
              <div className='mb-1 flex items-center justify-between'>
                <div className='inline-flex items-center gap-1'>
                  <span className='inline-flex h-5 w-5 items-center justify-center rounded-full border border-emerald-200 bg-emerald-100'>
                    <TrendingUp className='h-3 w-3 text-emerald-700' />
                  </span>
                  <p className='text-[10px] font-semibold uppercase tracking-wide text-neutral-700'>
                    Smart Summary
                  </p>
                </div>
                <span
                  className={`rounded-full border px-1.5 py-0.5 text-[9px] font-semibold ${TREND_STYLES[trendKey]}`}
                >
                  {trendLabel}
                </span>
              </div>
              <p className='text-[10px] leading-4 text-neutral-800'>
                {change >= 0 ? '↑' : '↓'} {Math.abs(changePct).toFixed(1)}% in
                the last {selectedRange}. {microInsight}
              </p>
              <p className='mt-1 rounded-md border border-neutral-200 bg-white/85 px-1.5 py-1 text-[9px] leading-4 text-neutral-600'>
                {comparisonText}
              </p>
            </div>
          </div>
        </>
      )}
      {!hasAnomalyMap && (
        <div className='rounded-lg border border-neutral-200 bg-neutral-50 p-1.5'>
          <p className='text-[10px] text-neutral-600'>
            Anomaly stress layer is unavailable for this farm right now.
          </p>
        </div>
      )}
    </div>
  );
};
