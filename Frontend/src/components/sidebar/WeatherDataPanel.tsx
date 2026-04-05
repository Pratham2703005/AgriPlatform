import React from 'react';
import { Cloud, Droplets, Wind, Sun } from 'lucide-react';
import type { WeatherData } from '@/types/farm';

interface ExtendedWeatherData extends WeatherData {
  humidity?: number;
  wind_speed?: number;
}

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
  // Calculate summary statistics
  const getWeatherStats = () => {
    if (calendarData.length === 0) {
      return {
        avgTemp: 0,
        totalPrecip: 0,
        avgHumidity: 0,
        avgWindSpeed: 0,
      };
    }

    const temps = calendarData.filter(d => d.temperature !== undefined).map(d => d.temperature as number);
    const precips = calendarData.filter(d => d.precipitation !== undefined).map(d => d.precipitation as number);
    const extendedData = calendarData as ExtendedWeatherData[];
    const humidity = extendedData.filter(d => d.humidity !== undefined).map(d => d.humidity as number);
    const windSpeed = extendedData.filter(d => d.wind_speed !== undefined).map(d => d.wind_speed as number);

    return {
      avgTemp: temps.length > 0 ? temps.reduce((a, b) => a + b, 0) / temps.length : 0,
      totalPrecip: precips.length > 0 ? precips.reduce((a, b) => a + b, 0) : 0,
      avgHumidity: humidity.length > 0 ? humidity.reduce((a, b) => a + b, 0) / humidity.length : 0,
      avgWindSpeed: windSpeed.length > 0 ? windSpeed.reduce((a, b) => a + b, 0) / windSpeed.length : 0,
    };
  };

  const stats = getWeatherStats();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-neutral-900 flex items-center">
            <Cloud className="h-4 w-4 mr-2" />
            Weather Data
          </h3>
          <p className="text-xs text-neutral-600 mt-1">Season forecast & historical data</p>
        </div>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="btn-secondary text-xs p-2"
          title="Refresh weather"
        >
          <Cloud className="h-4 w-4" />
        </button>
      </div>

      {/* Season Dates */}
      {(plantingDate || harvestDate) && (
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-3 border border-blue-200">
          <h4 className="text-xs font-semibold text-blue-900 mb-2">Growing Season</h4>
          <div className="space-y-1 text-xs text-blue-800">
            {plantingDate && (
              <p>📅 <span className="font-semibold">Planting:</span> {new Date(plantingDate).toLocaleDateString()}</p>
            )}
            {harvestDate && (
              <p>📅 <span className="font-semibold">Harvest:</span> {new Date(harvestDate).toLocaleDateString()}</p>
            )}
          </div>
        </div>
      )}

      {/* Weather Summary Stats */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-white rounded-lg p-3 border border-neutral-200">
          <div className="flex items-center space-x-2 mb-1">
            <Sun className="h-4 w-4 text-orange-500" />
            <span className="text-xs text-neutral-600">Avg Temperature</span>
          </div>
          <p className="text-lg font-bold text-neutral-900">{stats.avgTemp.toFixed(1)}°C</p>
        </div>

        <div className="bg-white rounded-lg p-3 border border-neutral-200">
          <div className="flex items-center space-x-2 mb-1">
            <Droplets className="h-4 w-4 text-blue-500" />
            <span className="text-xs text-neutral-600">Total Rainfall</span>
          </div>
          <p className="text-lg font-bold text-neutral-900">{stats.totalPrecip.toFixed(1)} mm</p>
        </div>

        <div className="bg-white rounded-lg p-3 border border-neutral-200">
          <div className="flex items-center space-x-2 mb-1">
            <Cloud className="h-4 w-4 text-gray-500" />
            <span className="text-xs text-neutral-600">Avg Humidity</span>
          </div>
          <p className="text-lg font-bold text-neutral-900">{stats.avgHumidity.toFixed(1)}%</p>
        </div>

        <div className="bg-white rounded-lg p-3 border border-neutral-200">
          <div className="flex items-center space-x-2 mb-1">
            <Wind className="h-4 w-4 text-teal-500" />
            <span className="text-xs text-neutral-600">Avg Wind Speed</span>
          </div>
          <p className="text-lg font-bold text-neutral-900">{stats.avgWindSpeed.toFixed(1)} m/s</p>
        </div>
      </div>

      {/* Recent Weather Timeline (last 7 days) */}
      {calendarData.length > 0 && (
        <div className="bg-white rounded-lg p-3 border border-neutral-200">
          <h4 className="text-sm font-semibold text-neutral-900 mb-3">Recent Weather</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {calendarData.slice(0, 7).map((data, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs py-2 border-b border-neutral-100 last:border-b-0">
                <div>
                  <p className="font-semibold text-neutral-900">
                    {new Date(data.date).toLocaleDateString(undefined, {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                  <p className="text-neutral-600">{data.weather_description || 'Clear'}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-neutral-900">{data.temperature?.toFixed(0)}°C</p>
                  <p className="text-blue-600">{data.precipitation?.toFixed(1)}mm</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info Note */}
      <div className="bg-green-50 rounded-lg p-3 border border-green-200">
        <p className="text-xs text-green-800">
          🌦️ Weather data includes historical records and forecasts. Use for irrigation and fertilizer planning.
        </p>
      </div>
    </div>
  );
};
