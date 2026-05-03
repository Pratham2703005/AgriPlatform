import React from 'react';
import {
  Cloud,
  Droplets,
  Wind,
  Sun,
  AlertTriangle,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Line,
  Bar,
  Legend,
} from 'recharts';
import type { WeatherData } from '@/types/farm';

interface ExtendedWeatherData extends WeatherData {
  temperature?: number;
  humidity?: number;
  wind_speed?: number;
}

interface AdvisoryItem {
  title: string;
  priority: 'High' | 'Medium' | 'Low';
  reason: string;
}

interface AlertItem {
  title: string;
  message: string;
}

const PRIORITY_STYLES: Record<AdvisoryItem['priority'], string> = {
  High: 'bg-red-100 text-red-800 border-red-200',
  Medium: 'bg-amber-100 text-amber-800 border-amber-200',
  Low: 'bg-emerald-100 text-emerald-800 border-emerald-200',
};

const RISK_STYLES: Record<'Low' | 'Moderate' | 'High', string> = {
  Low: 'from-emerald-50 via-teal-50 to-cyan-50 border-emerald-200',
  Moderate: 'from-amber-50 via-orange-50 to-yellow-50 border-amber-200',
  High: 'from-red-50 via-orange-50 to-rose-50 border-red-200',
};

const RISK_TEXT_STYLES: Record<'Low' | 'Moderate' | 'High', string> = {
  Low: 'text-emerald-900',
  Moderate: 'text-amber-900',
  High: 'text-red-900',
};

const formatShortDate = (value: string): string => {
  const date = new Date(`${value}T00:00:00`);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const getConditionLabel = (item: ExtendedWeatherData): string => {
  const description = item.weather_description?.toLowerCase() || '';

  if (description.includes('thunder') || description.includes('storm'))
    return 'Storm';
  if (description.includes('rain') || (item.precipitation ?? 0) >= 5)
    return 'Rain';
  if (description.includes('cloud')) return 'Cloudy';
  if ((item.temperature ?? 0) >= 34) return 'Hot';

  return 'Clear';
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const WeatherTrendTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: any[];
  label?: string;
}) => {
  if (!active || !payload?.length) return null;

  return (
    <div className='rounded-lg border border-neutral-200 bg-white px-2.5 py-2 text-xs shadow-lg'>
      <p className='font-semibold text-neutral-700'>{label}</p>
      {payload.find(p => p.dataKey === 'temperature') && (
        <p className='text-orange-700'>
          Temp:{' '}
          {(
            payload.find(p => p.dataKey === 'temperature')?.value as number
          ).toFixed(1)}{' '}
          C
        </p>
      )}
      {payload.find(p => p.dataKey === 'precipitation') && (
        <p className='text-blue-700'>
          Rain:{' '}
          {(
            payload.find(p => p.dataKey === 'precipitation')?.value as number
          ).toFixed(1)}{' '}
          mm
        </p>
      )}
    </div>
  );
};

interface WeatherDataPanelProps {
  calendarData: WeatherData[];
  plantingDate?: string;
  harvestDate?: string;
  onRefresh: () => void;
  isLoading?: boolean;
}

export const WeatherDataPanel: React.FC<WeatherDataPanelProps> = ({
  calendarData,
  plantingDate,
  harvestDate,
  onRefresh,
  isLoading = false,
}) => {
  const sortedData = (calendarData as ExtendedWeatherData[])
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date));

  // Calculate summary statistics
  const getWeatherStats = () => {
    if (sortedData.length === 0) {
      return {
        avgTemp: 0,
        totalPrecip: 0,
        avgHumidity: 0,
        avgWindSpeed: 0,
      };
    }

    const temps = sortedData
      .filter(d => d.temperature !== undefined)
      .map(d => d.temperature as number);
    const precips = sortedData
      .filter(d => d.precipitation !== undefined)
      .map(d => d.precipitation as number);
    const extendedData = sortedData;
    const humidity = extendedData
      .filter(d => d.humidity !== undefined)
      .map(d => d.humidity as number);
    const windSpeed = extendedData
      .filter(d => d.wind_speed !== undefined)
      .map(d => d.wind_speed as number);

    return {
      avgTemp:
        temps.length > 0 ? temps.reduce((a, b) => a + b, 0) / temps.length : 0,
      totalPrecip: precips.length > 0 ? precips.reduce((a, b) => a + b, 0) : 0,
      avgHumidity:
        humidity.length > 0
          ? humidity.reduce((a, b) => a + b, 0) / humidity.length
          : 0,
      avgWindSpeed:
        windSpeed.length > 0
          ? windSpeed.reduce((a, b) => a + b, 0) / windSpeed.length
          : 0,
    };
  };

  const stats = getWeatherStats();

  const heatStress = stats.avgTemp > 35;
  const heavyRain = stats.totalPrecip > 80;
  const windRisk = stats.avgWindSpeed > 8;

  const riskScore =
    (heatStress ? 1 : 0) + (heavyRain ? 1 : 0) + (windRisk ? 1 : 0);

  const riskLevel: 'Low' | 'Moderate' | 'High' =
    riskScore >= 2 ? 'High' : riskScore === 1 ? 'Moderate' : 'Low';

  const trendData = sortedData
    .filter(d => d.temperature !== undefined || d.precipitation !== undefined)
    .slice(-14)
    .map(d => ({
      label: formatShortDate(d.date),
      temperature: d.temperature ?? 0,
      precipitation: d.precipitation ?? 0,
    }));

  const advisories: AdvisoryItem[] = [];

  if (stats.totalPrecip > 50) {
    advisories.push({
      title: 'Delay Irrigation',
      priority: 'High',
      reason:
        'Cumulative rainfall is elevated and excess water can stress roots.',
    });
  }

  if (stats.avgTemp > 34) {
    advisories.push({
      title: 'Increase Irrigation Frequency',
      priority: 'Medium',
      reason:
        'High ambient temperature raises evapotranspiration and soil moisture loss.',
    });
  }

  if (stats.avgWindSpeed > 7) {
    advisories.push({
      title: 'Plan Wind-Safe Spraying Window',
      priority: 'Medium',
      reason:
        'Higher wind can increase spray drift and reduce nutrient uptake efficiency.',
    });
  }

  if (stats.totalPrecip > 35 && stats.avgTemp > 30) {
    advisories.push({
      title: 'Monitor Disease Pressure',
      priority: 'High',
      reason:
        'Warm and wet conditions can accelerate fungal and bacterial outbreaks.',
    });
  }

  if (advisories.length === 0) {
    advisories.push({
      title: 'Maintain Current Schedule',
      priority: 'Low',
      reason: 'No major weather stress detected in current conditions.',
    });
  }

  const forecastSource = sortedData.filter(d => {
    const dayTs = new Date(`${d.date}T00:00:00`).getTime();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dayTs >= today.getTime();
  });

  const forecastStrip = (
    forecastSource.length > 0 ? forecastSource : sortedData.slice(-3)
  ).slice(0, 3);

  const alerts: AlertItem[] = [];

  if (sortedData.some(d => (d.temperature ?? 0) >= 40)) {
    alerts.push({
      title: 'Extreme Heat Alert',
      message:
        'Heat-wave level temperatures detected. Protect flowering crops and irrigate during cooler hours.',
    });
  }

  if (sortedData.some(d => (d.precipitation ?? 0) >= 40)) {
    alerts.push({
      title: 'Heavy Rain Alert',
      message:
        'Very high rainfall event detected. Check drainage channels and field runoff immediately.',
    });
  }

  if (sortedData.some(d => (d.wind_speed ?? 0) >= 12)) {
    alerts.push({
      title: 'High Wind Alert',
      message:
        'Strong wind conditions detected. Avoid pesticide spraying and secure vulnerable crop supports.',
    });
  }

  const cropImpactItems: string[] = [];

  if (heavyRain)
    cropImpactItems.push(
      'High rain can raise root rot risk and nutrient leaching potential.'
    );
  if (heatStress)
    cropImpactItems.push(
      'Heat stress can increase flower drop risk and reduce grain filling efficiency.'
    );
  if (windRisk)
    cropImpactItems.push(
      'Sustained wind may cause lodging risk in tall crops and spray drift during treatment.'
    );
  if (cropImpactItems.length === 0)
    cropImpactItems.push(
      'Current weather pattern indicates low immediate crop stress impact.'
    );

  const aiInsight =
    stats.totalPrecip > 45 && stats.avgTemp > 32
      ? 'Wet and warm conditions may reduce nitrogen availability and increase pathogen pressure. Reassess soil nutrition after field drainage stabilizes.'
      : stats.avgTemp > 34
        ? 'High temperature trend suggests elevated plant water demand. Shift irrigation to early morning and monitor canopy wilting hotspots.'
        : stats.totalPrecip > 50
          ? 'Repeated rainfall indicates possible nutrient washout and root oxygen stress. Delay irrigation and inspect low-lying field sections.'
          : 'Weather pattern is stable. Continue routine irrigation and use this window for preventive crop health monitoring.';

  return (
    <div className='space-y-4'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h3 className='flex items-center font-semibold text-neutral-900'>
            <Cloud className='mr-2 h-4 w-4' />
            Weather Data
          </h3>
          <p className='mt-1 text-xs text-neutral-600'>
            Season forecast and historical intelligence
          </p>
        </div>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className='btn-secondary p-2 text-xs'
          title='Refresh weather'
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Risk Hero */}
      <div
        className={`relative overflow-hidden rounded-xl border bg-gradient-to-br p-4 ${RISK_STYLES[riskLevel]}`}
      >
        <div className='absolute right-0 top-0 h-24 w-24 rounded-full bg-white/20 blur-xl' />
        <div className='relative'>
          <div className='mb-3 flex items-center justify-between'>
            <div>
              <p className='text-[11px] font-semibold uppercase tracking-wide text-neutral-700'>
                Weather Risk Overview
              </p>
              <h4
                className={`text-xl font-bold ${RISK_TEXT_STYLES[riskLevel]}`}
              >
                Weather Risk: {riskLevel}
              </h4>
            </div>
            <span
              className={`rounded-full border px-2 py-1 text-xs font-semibold ${riskLevel === 'High' ? 'border-red-300 bg-red-100 text-red-800' : riskLevel === 'Moderate' ? 'border-amber-300 bg-amber-100 text-amber-800' : 'border-emerald-300 bg-emerald-100 text-emerald-800'}`}
            >
              Score {riskScore}/3
            </span>
          </div>

          <div className='grid grid-cols-3 gap-2'>
            <div className='rounded-lg border border-white/50 bg-white/60 p-2'>
              <div className='mb-1 flex items-center gap-1'>
                <Sun
                  className={`h-3.5 w-3.5 ${heatStress ? 'text-orange-600' : 'text-neutral-500'}`}
                />
                <p className='text-[10px] font-semibold text-neutral-700'>
                  Heat Stress
                </p>
              </div>
              <p
                className={`text-xs font-bold ${heatStress ? 'text-orange-700' : 'text-emerald-700'}`}
              >
                {heatStress ? 'Detected' : 'Normal'}
              </p>
            </div>
            <div className='rounded-lg border border-white/50 bg-white/60 p-2'>
              <div className='mb-1 flex items-center gap-1'>
                <Droplets
                  className={`h-3.5 w-3.5 ${heavyRain ? 'text-blue-600' : 'text-neutral-500'}`}
                />
                <p className='text-[10px] font-semibold text-neutral-700'>
                  Rain Risk
                </p>
              </div>
              <p
                className={`text-xs font-bold ${heavyRain ? 'text-blue-700' : 'text-emerald-700'}`}
              >
                {heavyRain ? 'Elevated' : 'Normal'}
              </p>
            </div>
            <div className='rounded-lg border border-white/50 bg-white/60 p-2'>
              <div className='mb-1 flex items-center gap-1'>
                <Wind
                  className={`h-3.5 w-3.5 ${windRisk ? 'text-teal-600' : 'text-neutral-500'}`}
                />
                <p className='text-[10px] font-semibold text-neutral-700'>
                  Wind Risk
                </p>
              </div>
              <p
                className={`text-xs font-bold ${windRisk ? 'text-teal-700' : 'text-emerald-700'}`}
              >
                {windRisk ? 'Elevated' : 'Normal'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Season Dates */}
      {(plantingDate || harvestDate) && (
        <div className='rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50 p-3'>
          <h4 className='mb-2 text-xs font-semibold text-blue-900'>
            Growing Season
          </h4>
          <div className='space-y-1 text-xs text-blue-800'>
            {plantingDate && (
              <p>
                Planting:{' '}
                <span className='font-semibold'>
                  {new Date(plantingDate).toLocaleDateString()}
                </span>
              </p>
            )}
            {harvestDate && (
              <p>
                Harvest:{' '}
                <span className='font-semibold'>
                  {new Date(harvestDate).toLocaleDateString()}
                </span>
              </p>
            )}
          </div>
        </div>
      )}

      {/* Trend Chart */}
      <div className='rounded-xl border border-neutral-200 bg-[linear-gradient(145deg,#ffffff_0%,#f8fafc_100%)] p-3 shadow-sm'>
        <div className='mb-2 flex items-center justify-between'>
          <h4 className='text-sm font-semibold text-neutral-900'>
            Weather Trend (Temp + Rain)
          </h4>
          <span className='rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-700'>
            Last 14 entries
          </span>
        </div>
        {trendData.length > 0 ? (
          <ResponsiveContainer width='100%' height={180}>
            <ComposedChart
              data={trendData}
              margin={{ top: 8, right: 8, left: -14, bottom: 0 }}
            >
              <CartesianGrid
                stroke='#e5e7eb'
                strokeDasharray='3 3'
                vertical={false}
              />
              <XAxis
                dataKey='label'
                tick={{ fontSize: 10, fill: '#6b7280' }}
                axisLine={false}
                tickLine={false}
                minTickGap={16}
              />
              <YAxis
                yAxisId='left'
                tick={{ fontSize: 10, fill: '#6b7280' }}
                axisLine={false}
                tickLine={false}
                width={34}
              />
              <YAxis
                yAxisId='right'
                orientation='right'
                tick={{ fontSize: 10, fill: '#6b7280' }}
                axisLine={false}
                tickLine={false}
                width={34}
              />
              <Tooltip content={<WeatherTrendTooltip />} />
              <Legend wrapperStyle={{ fontSize: '10px' }} />
              <Bar
                yAxisId='right'
                dataKey='precipitation'
                fill='#60a5fa'
                name='Rain (mm)'
                radius={[4, 4, 0, 0]}
                maxBarSize={18}
              />
              <Line
                yAxisId='left'
                type='monotone'
                dataKey='temperature'
                stroke='#f97316'
                strokeWidth={2.5}
                dot={{ r: 2.5 }}
                activeDot={{ r: 4 }}
                name='Temp (C)'
              />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <div className='rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-center text-xs text-neutral-500'>
            Insufficient weather trend data to visualize.
          </div>
        )}
      </div>

      {/* 7-Day Smart Advisory */}
      <div className='rounded-xl border border-neutral-200 bg-[linear-gradient(145deg,#ffffff_0%,#f8fafc_100%)] p-3 shadow-sm'>
        <div className='mb-2 flex items-center justify-between'>
          <h4 className='text-sm font-semibold text-neutral-900'>
            7-Day Smart Advisory
          </h4>
          <span className='rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-[10px] font-semibold text-neutral-700'>
            Actionable
          </span>
        </div>
        <div className='space-y-2'>
          {advisories.slice(0, 4).map(item => (
            <div
              key={item.title}
              className='rounded-lg border border-neutral-200 bg-white p-2.5'
            >
              <div className='mb-1 flex items-start justify-between gap-2'>
                <p className='text-xs font-semibold text-neutral-900'>
                  {item.title}
                </p>
                <span
                  className={`rounded-full border px-1.5 py-0.5 text-[10px] font-semibold ${PRIORITY_STYLES[item.priority]}`}
                >
                  {item.priority}
                </span>
              </div>
              <p className='text-[11px] text-neutral-600'>{item.reason}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Forecast Strip */}
      <div className='rounded-xl border border-neutral-200 bg-white p-3 shadow-sm'>
        <div className='mb-2 flex items-center justify-between'>
          <h4 className='text-sm font-semibold text-neutral-900'>
            3-Day Forecast Snapshot
          </h4>
          <Cloud className='h-4 w-4 text-sky-600' />
        </div>
        {forecastStrip.length > 0 ? (
          <div className='grid grid-cols-3 gap-2'>
            {forecastStrip.map(day => {
              const condition = getConditionLabel(day);

              return (
                <div
                  key={day.date}
                  className='rounded-lg border border-neutral-200 bg-gradient-to-b from-white to-neutral-50 p-2'
                >
                  <p className='text-[10px] font-semibold text-neutral-700'>
                    {new Date(`${day.date}T00:00:00`).toLocaleDateString(
                      'en-US',
                      { weekday: 'short' }
                    )}
                  </p>
                  <div className='my-1 flex items-center gap-1'>
                    {condition === 'Rain' ? (
                      <Droplets className='h-3.5 w-3.5 text-blue-600' />
                    ) : condition === 'Cloudy' ? (
                      <Cloud className='h-3.5 w-3.5 text-slate-500' />
                    ) : (
                      <Sun className='h-3.5 w-3.5 text-amber-500' />
                    )}
                    <p className='text-[10px] text-neutral-600'>{condition}</p>
                  </div>
                  <p className='text-sm font-bold text-neutral-900'>
                    {(day.temperature ?? 0).toFixed(0)} C
                  </p>
                  <p className='text-[10px] text-blue-700'>
                    {(day.precipitation ?? 0).toFixed(1)} mm
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className='rounded-lg border border-neutral-200 bg-neutral-50 p-2 text-center text-xs text-neutral-500'>
            No forecast entries available.
          </div>
        )}
      </div>

      {/* AI Insight */}
      <div className='rounded-xl border border-violet-200 bg-[linear-gradient(140deg,#f5f3ff_0%,#ffffff_60%,#eef2ff_100%)] p-3 shadow-sm'>
        <div className='mb-1.5 flex items-center gap-1.5'>
          <Sparkles className='h-4 w-4 text-violet-600' />
          <h4 className='text-sm font-semibold text-violet-900'>
            AI Weather Insight
          </h4>
        </div>
        <p className='text-xs leading-relaxed text-violet-800'>{aiInsight}</p>
      </div>

      {/* Extreme Alerts */}
      {alerts.length > 0 && (
        <div className='space-y-2'>
          {alerts.map(alert => (
            <div
              key={alert.title}
              className='relative overflow-hidden rounded-lg border border-red-200 bg-red-50 p-3 shadow-sm'
            >
              <div className='absolute inset-0 bg-[radial-gradient(circle_at_80%_0%,rgba(239,68,68,0.18),transparent_50%)]' />
              <div className='relative flex gap-2'>
                <AlertTriangle className='mt-0.5 h-4 w-4 animate-pulse text-red-600' />
                <div>
                  <p className='text-xs font-bold text-red-900'>
                    {alert.title}
                  </p>
                  <p className='text-[11px] text-red-800'>{alert.message}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Crop Impact */}
      <div className='rounded-xl border border-emerald-200 bg-[linear-gradient(140deg,#ecfdf5_0%,#ffffff_70%)] p-3 shadow-sm'>
        <h4 className='mb-2 text-sm font-semibold text-emerald-900'>
          Crop Impact Summary
        </h4>
        <div className='space-y-1.5'>
          {cropImpactItems.map(item => (
            <p key={item} className='text-xs text-emerald-800'>
              • {item}
            </p>
          ))}
        </div>
      </div>

      {/* Bottom Stats */}
      <div className='grid grid-cols-2 gap-2'>
        <div className='rounded-lg border border-neutral-200 bg-white p-3'>
          <div className='mb-1 flex items-center gap-2'>
            <Sun className='h-4 w-4 text-orange-500' />
            <span className='text-xs text-neutral-600'>Avg Temperature</span>
          </div>
          <p className='text-lg font-bold text-neutral-900'>
            {stats.avgTemp.toFixed(1)} C
          </p>
        </div>

        <div className='rounded-lg border border-neutral-200 bg-white p-3'>
          <div className='mb-1 flex items-center gap-2'>
            <Droplets className='h-4 w-4 text-blue-500' />
            <span className='text-xs text-neutral-600'>Total Rainfall</span>
          </div>
          <p className='text-lg font-bold text-neutral-900'>
            {stats.totalPrecip.toFixed(1)} mm
          </p>
        </div>

        <div className='rounded-lg border border-neutral-200 bg-white p-3'>
          <div className='mb-1 flex items-center gap-2'>
            <Cloud className='h-4 w-4 text-gray-500' />
            <span className='text-xs text-neutral-600'>Avg Humidity</span>
          </div>
          <p className='text-lg font-bold text-neutral-900'>
            {stats.avgHumidity.toFixed(1)}%
          </p>
        </div>

        <div className='rounded-lg border border-neutral-200 bg-white p-3'>
          <div className='mb-1 flex items-center gap-2'>
            <Wind className='h-4 w-4 text-teal-500' />
            <span className='text-xs text-neutral-600'>Avg Wind Speed</span>
          </div>
          <p className='text-lg font-bold text-neutral-900'>
            {stats.avgWindSpeed.toFixed(1)} m/s
          </p>
        </div>
      </div>
    </div>
  );
};
