import React, { useState, useMemo } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  Cell,
} from 'recharts';
import {
  ChevronLeft,
  ChevronRight,
  Sprout,
  Calendar,
  RefreshCw,
  Wind,
  Droplets,
  Sun,
  History,
  CloudOff,
  Radio,
  Thermometer,
  ArrowLeft,
} from 'lucide-react';
import type { WeatherCalendarData, DayWeather, DayAvailability } from '../hooks/useWeatherCalendar';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function weatherEmoji(code: number): string {
  if (code === -1) return '?';
  if (code === 0) return '☀️';
  if (code <= 2) return '⛅';
  if (code <= 3) return '☁️';
  if (code <= 48) return '🌫️';
  if (code <= 55) return '🌦️';
  if (code <= 65) return '🌧️';
  if (code <= 67) return '🌨️';
  if (code <= 77) return '❄️';
  if (code <= 82) return '🌦️';
  if (code <= 86) return '❄️';
  return '⛈️';
}

function weatherLabel(code: number): string {
  if (code === -1) return 'No data yet';
  if (code === 0) return 'Clear Sky';
  if (code <= 2) return 'Partly Cloudy';
  if (code <= 3) return 'Overcast';
  if (code <= 48) return 'Foggy';
  if (code <= 55) return 'Drizzle';
  if (code <= 65) return 'Rain';
  if (code <= 67) return 'Freezing Rain';
  if (code <= 77) return 'Snow';
  if (code <= 82) return 'Rain Showers';
  if (code <= 86) return 'Snow Showers';
  return 'Thunderstorm';
}

function conditionGradient(code: number): string {
  if (code === 0) return 'from-amber-400 to-orange-500';
  if (code <= 2) return 'from-sky-400 to-blue-500';
  if (code <= 3) return 'from-slate-400 to-slate-500';
  if (code <= 48) return 'from-slate-300 to-slate-400';
  if (code <= 65) return 'from-blue-500 to-indigo-600';
  if (code <= 77) return 'from-slate-300 to-blue-300';
  return 'from-slate-600 to-slate-800';
}

interface Suitability {
  label: string;
  color: string;
  bg: string;
  cellBg: string;
  dot: string;
}

function getSuitability(day: DayWeather): Suitability {
  if (day.availability === 'unavailable')
    return { label: '—', color: 'text-neutral-400', bg: 'bg-neutral-50 border-neutral-100', cellBg: '', dot: 'bg-neutral-300' };
  if (day.weatherCode >= 95)
    return { label: 'Not Suitable', color: 'text-red-700', bg: 'bg-red-50 border-red-200', cellBg: 'bg-red-50/50', dot: 'bg-red-500' };
  if (day.weatherCode >= 61 || day.precipitationSum > 5)
    return { label: 'Poor', color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200', cellBg: 'bg-orange-50/50', dot: 'bg-orange-500' };
  if (day.windSpeedMax > 35)
    return { label: 'Caution', color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200', cellBg: 'bg-yellow-50/40', dot: 'bg-yellow-500' };
  if (day.weatherCode === 0 || day.weatherCode <= 2)
    return { label: 'Excellent', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', cellBg: 'bg-emerald-50/30', dot: 'bg-emerald-500' };
  return { label: 'Good', color: 'text-green-700', bg: 'bg-green-50 border-green-200', cellBg: '', dot: 'bg-green-500' };
}

function addDaysStr(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return toDateStr(d);
}

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function buildMonthGrid(year: number, month: number): (string | null)[][] {
  const firstDay = new Date(year, month, 1);
  let startDow = firstDay.getDay();
  startDow = (startDow + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (string | null)[] = [...Array(startDow).fill(null)];
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(`${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
  }
  while (cells.length % 7 !== 0) cells.push(null);
  const rows: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  return rows;
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DOW = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

// ─── Custom Recharts tooltips ─────────────────────────────────────────────────

const TempTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-neutral-200 rounded-xl px-3 py-2 shadow-lg text-xs">
        <p className="font-semibold text-neutral-700 mb-1">{label}</p>
        <p className="text-orange-600">High: {Math.round(payload[0]?.value ?? 0)}°C</p>
        <p className="text-sky-600">Low: {Math.round(payload[1]?.value ?? 0)}°C</p>
      </div>
    );
  }
  return null;
};

const RainTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-neutral-200 rounded-xl px-3 py-2 shadow-lg text-xs">
        <p className="font-semibold text-neutral-700 mb-1">{label}</p>
        <p className="text-blue-600">{(payload[0]?.value ?? 0).toFixed(1)} mm</p>
      </div>
    );
  }
  return null;
};

// ─── Day Detail View ──────────────────────────────────────────────────────────

interface DayDetailViewProps {
  day: DayWeather;
  allDays: Record<string, DayWeather>;
  onBack: () => void;
}

const DayDetailView: React.FC<DayDetailViewProps> = ({ day, allDays, onBack }) => {
  const suitability = getSuitability(day);

  const availBadge: Record<DayAvailability, { icon: React.ReactNode; color: string; label: string }> = {
    historical: { icon: <History className="h-3 w-3" />, color: 'text-neutral-600 bg-white/30', label: 'Historical' },
    forecast:   { icon: <Radio className="h-3 w-3" />,   color: 'text-white bg-white/30',       label: 'Forecast' },
    unavailable:{ icon: <CloudOff className="h-3 w-3" />,color: 'text-white bg-white/20',       label: 'Not Available' },
  };
  const badge = availBadge[day.availability] ?? availBadge['historical'];

  // Build 7-day context window (±3 days) for charts
  const contextWindow = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const dateStr = addDaysStr(day.date, i - 3);
      const d = allDays[dateStr];
      const label = new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const isCurrent = dateStr === day.date;
      return d && d.availability !== 'unavailable'
        ? { label, high: d.tempMax, low: d.tempMin, rain: d.precipitationSum, isCurrent }
        : { label, high: null, low: null, rain: null, isCurrent };
    }).filter(d => d.high !== null);
  }, [day.date, allDays]);

  const uvPercent = Math.min(100, (day.uvIndexMax / 12) * 100);
  const uvColor = day.uvIndexMax >= 8 ? '#ef4444' : day.uvIndexMax >= 5 ? '#f97316' : '#22c55e';
  const radialData = [{ value: uvPercent, fill: uvColor }];

  if (day.availability === 'unavailable') {
    return (
      <div className="card-elevated overflow-hidden animate-in">
        <div className="flex items-center space-x-3 px-5 py-4 border-b border-neutral-100">
          <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors">
            <ArrowLeft className="h-4 w-4 text-neutral-600" />
          </button>
          <span className="text-sm font-semibold text-neutral-700">Back to Calendar</span>
        </div>
        <div className="px-5 py-10 text-center">
          <div className="text-5xl mb-4">🔮</div>
          <p className="font-semibold text-neutral-700 mb-2">
            {new Date(day.date + 'T00:00:00').toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric', year:'numeric' })}
          </p>
          <p className="text-sm text-neutral-500">Forecast data is not yet available for this date.</p>
          <p className="text-xs text-neutral-400 mt-1">Open-Meteo forecasts up to 16 days ahead.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card-elevated overflow-hidden animate-in">
      {/* Back button */}
      <div className="flex items-center space-x-3 px-5 py-3 border-b border-neutral-100 bg-neutral-50">
        <button
          onClick={onBack}
          className="flex items-center space-x-1.5 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Calendar</span>
        </button>
      </div>

      {/* Hero gradient banner */}
      <div className={`bg-gradient-to-br ${conditionGradient(day.weatherCode)} px-5 py-5 text-white`}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <span className={`inline-flex items-center space-x-1 text-xs font-medium px-2 py-0.5 rounded-full ${badge.color}`}>
                {badge.icon}<span>{badge.label}</span>
              </span>
            </div>
            <p className="text-white/80 text-xs mb-1">
              {new Date(day.date + 'T00:00:00').toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric', year:'numeric' })}
            </p>
            <div className="flex items-end space-x-2">
              <span className="text-5xl font-bold leading-none">{Math.round(day.tempMax)}°</span>
              <span className="text-2xl font-light text-white/70 mb-1">/ {Math.round(day.tempMin)}°C</span>
            </div>
            <p className="text-white font-semibold text-lg mt-1">{weatherLabel(day.weatherCode)}</p>
          </div>
          <span className="text-6xl leading-none">{weatherEmoji(day.weatherCode)}</span>
        </div>

        {/* Suitability badge */}
        <div className="mt-4 flex items-center space-x-2 bg-white/20 rounded-xl px-3 py-2 backdrop-blur-sm">
          <div className={`h-2 w-2 rounded-full animate-pulse ${suitability.dot}`} />
          <span className="text-sm font-semibold text-white">Farm Suitability: {suitability.label}</span>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Quick stats row */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-blue-50 rounded-xl p-3 text-center">
            <Droplets className="h-4 w-4 text-blue-500 mx-auto mb-1" />
            <p className="text-xs text-neutral-500">Rain</p>
            <p className="font-bold text-neutral-800 text-sm">{day.precipitationSum.toFixed(1)}mm</p>
            {day.precipitationProbability !== null && (
              <p className="text-xs text-blue-600">{day.precipitationProbability}%</p>
            )}
          </div>
          <div className="bg-teal-50 rounded-xl p-3 text-center">
            <Wind className="h-4 w-4 text-teal-500 mx-auto mb-1" />
            <p className="text-xs text-neutral-500">Wind</p>
            <p className="font-bold text-neutral-800 text-sm">{Math.round(day.windSpeedMax)}<span className="text-xs font-normal"> km/h</span></p>
            <p className="text-xs text-teal-600">{day.windSpeedMax > 35 ? 'Strong' : day.windSpeedMax > 20 ? 'Moderate' : 'Light'}</p>
          </div>
          <div className="bg-amber-50 rounded-xl p-3 text-center">
            <Sun className="h-4 w-4 text-amber-500 mx-auto mb-1" />
            <p className="text-xs text-neutral-500">UV Index</p>
            <p className="font-bold text-neutral-800 text-sm">{day.uvIndexMax.toFixed(1)}</p>
            <p className={`text-xs ${day.uvIndexMax >= 8 ? 'text-red-500' : day.uvIndexMax >= 5 ? 'text-orange-500' : 'text-green-600'}`}>
              {day.uvIndexMax >= 8 ? 'Very High' : day.uvIndexMax >= 5 ? 'Moderate' : 'Low'}
            </p>
          </div>
        </div>

        {/* Temperature area chart */}
        {contextWindow.length >= 3 && (
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <Thermometer className="h-4 w-4 text-orange-500" />
              <h4 className="text-sm font-semibold text-neutral-800">Temperature Context</h4>
              <span className="text-xs text-neutral-400">(±3 days)</span>
            </div>
            <ResponsiveContainer width="100%" height={140}>
              <AreaChart data={contextWindow} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="highGradCal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="lowGradCal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} unit="°" />
                <Tooltip content={<TempTooltip />} />
                <Area
                  type="monotone"
                  dataKey="high"
                  stroke="#f97316"
                  strokeWidth={2}
                  fill="url(#highGradCal)"
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  dot={(props: any) => {
                    const { cx = 0, cy = 0, payload } = props;
                    return (payload as { isCurrent: boolean }).isCurrent
                      ? <circle key={`hd-${cx}`} cx={cx} cy={cy} r={5} fill="#f97316" stroke="#fff" strokeWidth={2} />
                      : <circle key={`h-${cx}`} cx={cx} cy={cy} r={2.5} fill="#f97316" stroke="none" />;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="low"
                  stroke="#38bdf8"
                  strokeWidth={2}
                  fill="url(#lowGradCal)"
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  dot={(props: any) => {
                    const { cx = 0, cy = 0, payload } = props;
                    return (payload as { isCurrent: boolean }).isCurrent
                      ? <circle key={`ld-${cx}`} cx={cx} cy={cy} r={5} fill="#38bdf8" stroke="#fff" strokeWidth={2} />
                      : <circle key={`l-${cx}`} cx={cx} cy={cy} r={2.5} fill="#38bdf8" stroke="none" />;
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-center space-x-4 mt-1">
              <span className="flex items-center space-x-1 text-xs text-neutral-500"><span className="inline-block w-3 h-0.5 bg-orange-500 rounded" /><span>High</span></span>
              <span className="flex items-center space-x-1 text-xs text-neutral-500"><span className="inline-block w-3 h-0.5 bg-sky-400 rounded" /><span>Low</span></span>
              <span className="flex items-center space-x-1 text-xs text-neutral-500"><span className="inline-block w-2.5 h-2.5 rounded-full border-2 border-orange-500 bg-white" /><span>Selected</span></span>
            </div>
          </div>
        )}

        {/* Precipitation bar chart */}
        {contextWindow.length >= 3 && (
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <Droplets className="h-4 w-4 text-blue-500" />
              <h4 className="text-sm font-semibold text-neutral-800">Precipitation</h4>
              <span className="text-xs text-neutral-400">(mm, ±3 days)</span>
            </div>
            <ResponsiveContainer width="100%" height={110}>
              <BarChart data={contextWindow} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barSize={18}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} unit="mm" />
                <Tooltip content={<RainTooltip />} />
                <Bar dataKey="rain" radius={[4, 4, 0, 0]}>
                  {contextWindow.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.isCurrent ? '#3b82f6' : '#bfdbfe'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* UV radial gauge + Wind bar */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-amber-50/60 rounded-2xl p-3">
            <p className="text-xs font-semibold text-neutral-600 mb-1 text-center">UV Index</p>
            <div className="relative">
              <ResponsiveContainer width="100%" height={90}>
                <RadialBarChart
                  innerRadius="60%"
                  outerRadius="100%"
                  data={radialData}
                  startAngle={180}
                  endAngle={0}
                >
                  <RadialBar dataKey="value" cornerRadius={6} background={{ fill: '#fef3c7' }} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
                <p className="text-xl font-bold text-neutral-800">{day.uvIndexMax.toFixed(1)}</p>
                <p className={`text-xs font-semibold ${day.uvIndexMax >= 8 ? 'text-red-500' : day.uvIndexMax >= 5 ? 'text-orange-500' : 'text-green-600'}`}>
                  {day.uvIndexMax >= 8 ? 'Very High' : day.uvIndexMax >= 5 ? 'Moderate' : 'Low'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-teal-50/60 rounded-2xl p-3 flex flex-col justify-between">
            <div className="flex items-center space-x-1.5">
              <Wind className="h-4 w-4 text-teal-600" />
              <p className="text-xs font-semibold text-neutral-600">Wind Speed</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-800">
                {Math.round(day.windSpeedMax)}<span className="text-sm font-normal text-neutral-500"> km/h</span>
              </p>
              <div className="w-full bg-teal-100 rounded-full h-2 mt-2">
                <div
                  className="bg-gradient-to-r from-teal-400 to-teal-600 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (day.windSpeedMax / 80) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-neutral-400 mt-0.5">
                <span>Calm</span><span>Storm</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Calendar View ────────────────────────────────────────────────────────────

interface FarmWeatherCalendarProps {
  calendarData: WeatherCalendarData;
  onRefresh: () => void;
  loading?: boolean;
}

export const FarmWeatherCalendar: React.FC<FarmWeatherCalendarProps> = ({
  calendarData,
  onRefresh,
  loading = false,
}) => {
  const { days, plantingDate, harvestDate } = calendarData;

  const plantDate  = new Date(plantingDate + 'T00:00:00');
  const harvestDt  = new Date(harvestDate   + 'T00:00:00');
  const todayStr   = toDateStr(new Date());

  const [viewYear,  setViewYear]  = useState(plantDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(plantDate.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const plantYM   = { y: plantDate.getFullYear(), m: plantDate.getMonth() };
  const harvestYM = { y: harvestDt.getFullYear(), m: harvestDt.getMonth()  };

  const canGoPrev = viewYear > plantYM.y   || (viewYear === plantYM.y   && viewMonth > plantYM.m);
  const canGoNext = viewYear < harvestYM.y || (viewYear === harvestYM.y && viewMonth < harvestYM.m);

  function prevMonth() {
    if (!canGoPrev) return;
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (!canGoNext) return;
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }
  function jumpTo(dateStr: string) {
    const d = new Date(dateStr + 'T00:00:00');
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  }

  const grid = useMemo(() => buildMonthGrid(viewYear, viewMonth), [viewYear, viewMonth]);

  const monthStats = useMemo(() => {
    const monthDays = Object.values(days).filter(d => {
      const [y, m] = d.date.split('-').map(Number);
      return y === viewYear && m === viewMonth + 1 && d.availability !== 'unavailable';
    });
    if (monthDays.length === 0) return null;
    const goodDays = monthDays.filter(d => ['Excellent','Good'].includes(getSuitability(d).label)).length;
    const rainDays  = monthDays.filter(d => d.precipitationSum > 1).length;
    const avgMax    = Math.round(monthDays.reduce((s, d) => s + d.tempMax, 0) / monthDays.length);
    return { goodDays, rainDays, avgMax };
  }, [days, viewYear, viewMonth]);

  const selectedDay = selectedDate ? days[selectedDate] : null;

  // If a day is selected → switch to full detail view
  if (selectedDate && selectedDay) {
    return (
      <DayDetailView
        day={selectedDay}
        allDays={days}
        onBack={() => setSelectedDate(null)}
      />
    );
  }

  return (
    <div className="card-elevated overflow-hidden animate-in">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-neutral-100">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 bg-gradient-to-br from-sky-500 to-blue-600 rounded-xl flex items-center justify-center shadow-sm">
            <Calendar className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-base font-bold text-neutral-900">Growing Season Forecast</h3>
            <p className="text-xs text-neutral-500">
              {new Date(plantingDate + 'T00:00:00').toLocaleDateString('en-US', { month:'short', day:'numeric' })}
              {' → '}
              {new Date(harvestDate + 'T00:00:00').toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })}
            </p>
          </div>
        </div>
        <button onClick={onRefresh} disabled={loading} title="Refresh" className="p-2 rounded-xl hover:bg-neutral-100 transition-colors">
          <RefreshCw className={`h-4 w-4 text-neutral-500 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="p-5">
        {/* Month nav */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-1">
            <button onClick={prevMonth} disabled={!canGoPrev} className="p-1.5 rounded-lg hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <ChevronLeft className="h-4 w-4 text-neutral-600" />
            </button>
            <h4 className="text-sm font-bold text-neutral-900 min-w-[110px] text-center">{MONTHS[viewMonth]} {viewYear}</h4>
            <button onClick={nextMonth} disabled={!canGoNext} className="p-1.5 rounded-lg hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <ChevronRight className="h-4 w-4 text-neutral-600" />
            </button>
          </div>
          <div className="flex items-center space-x-1">
            <button onClick={() => jumpTo(plantingDate)} className="text-xs px-2 py-1 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 font-medium flex items-center space-x-1">
              <Sprout className="h-3 w-3" /><span>Sow</span>
            </button>
            <button onClick={() => jumpTo(harvestDate)} className="text-xs px-2 py-1 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 font-medium flex items-center space-x-1">
              <span>🌾</span><span>Harvest</span>
            </button>
          </div>
        </div>

        {/* Days-of-week header */}
        <div className="grid grid-cols-7 mb-1">
          {DOW.map(d => (
            <div key={d} className="text-center text-[10px] font-semibold text-neutral-400 py-1">{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="border border-neutral-200 rounded-xl overflow-hidden">
          {grid.map((row, ri) => (
            <div key={ri} className="grid grid-cols-7">
              {row.map((dateStr, ci) => {
                if (!dateStr) {
                  return <div key={ci} className={`border-r border-b border-neutral-100 h-12 ${ri === grid.length - 1 ? 'border-b-0' : ''} ${ci === 6 ? 'border-r-0' : ''}`} />;
                }

                const dt         = new Date(dateStr + 'T00:00:00');
                const inRange    = dt >= plantDate && dt <= harvestDt;
                const dayData    = days[dateStr];
                const isToday    = dateStr === todayStr;
                const isPlanting = dateStr === plantingDate;
                const isHarvest  = dateStr === harvestDate;
                const suitability = dayData ? getSuitability(dayData) : null;

                let cellBg = '';
                if (!inRange)    cellBg = 'bg-neutral-50';
                else if (dayData) cellBg = suitability?.cellBg ?? '';

                return (
                  <button
                    key={dateStr}
                    disabled={!inRange}
                    onClick={() => setSelectedDate(dateStr)}
                    className={`
                      relative h-12 flex flex-col items-center justify-start pt-0.5 overflow-hidden
                      border-r border-b border-neutral-100
                      ${ri === grid.length - 1 ? 'border-b-0' : ''}
                      ${ci === 6 ? 'border-r-0' : ''}
                      ${cellBg}
                      ${inRange ? 'hover:bg-blue-50/70 cursor-pointer active:bg-blue-100' : ''}
                      transition-colors duration-100
                    `}
                  >
                    <div className="flex items-center justify-center w-full">
                      <span className={`text-[10px] font-semibold w-4 h-4 flex items-center justify-center rounded-full flex-shrink-0
                        ${isToday ? 'bg-primary-600 text-white' : ''}
                        ${!inRange ? 'text-neutral-300' : !isToday ? 'text-neutral-700' : ''}
                      `}>
                        {dt.getDate()}
                      </span>
                    </div>
                    {isPlanting && <span className="absolute top-0 left-0 text-[7px] leading-none">🌱</span>}
                    {isHarvest  && <span className="absolute top-0 right-0 text-[7px] leading-none">🌾</span>}
                    {inRange && dayData && (
                      dayData.availability === 'unavailable'
                        ? <span className="text-[10px] leading-none">🔮</span>
                        : <>
                            <span className="text-[10px] leading-none">{weatherEmoji(dayData.weatherCode)}</span>
                            <span className="text-[8px] font-bold leading-none text-neutral-700">{Math.round(dayData.tempMax)}°</span>
                            {dayData.precipitationProbability !== null && dayData.precipitationProbability > 20 && (
                              <span className="text-[7px] leading-none text-blue-600 font-semibold truncate w-full text-center">{dayData.precipitationProbability}%</span>
                            )}
                            {dayData.precipitationProbability === null && dayData.precipitationSum > 1 && (
                              <span className="text-[7px] leading-none text-blue-500 font-semibold truncate w-full text-center">{dayData.precipitationSum.toFixed(0)}mm</span>
                            )}
                          </>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Month stats */}
        {monthStats && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            <span className="inline-flex items-center space-x-1 text-xs px-2 py-0.5 rounded-full font-medium bg-emerald-50 text-emerald-700">
              <Sprout className="h-3 w-3" /><span>{monthStats.goodDays} good days</span>
            </span>
            <span className="inline-flex items-center space-x-1 text-xs px-2 py-0.5 rounded-full font-medium bg-blue-50 text-blue-700">
              <Droplets className="h-3 w-3" /><span>{monthStats.rainDays} rain days</span>
            </span>
            <span className="inline-flex items-center space-x-1 text-xs px-2 py-0.5 rounded-full font-medium bg-amber-50 text-amber-700">
              <Sun className="h-3 w-3" /><span>Avg {monthStats.avgMax}°C</span>
            </span>
          </div>
        )}

        {/* Legend */}
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 items-center">
          <span className="text-xs text-neutral-400 font-medium">Legend:</span>
          <span className="flex items-center space-x-1 text-xs text-neutral-500"><History className="h-3 w-3" /><span>Historical</span></span>
          <span className="flex items-center space-x-1 text-xs text-neutral-500"><Radio className="h-3 w-3" /><span>Forecast</span></span>
          <span className="flex items-center space-x-1 text-xs text-neutral-500"><span className="text-[10px]">🔮</span><span>Unavailable</span></span>
        </div>
        <p className="text-[10px] text-neutral-400 mt-2 text-center">Tap any highlighted date for detailed charts</p>
      </div>
    </div>
  );
};
