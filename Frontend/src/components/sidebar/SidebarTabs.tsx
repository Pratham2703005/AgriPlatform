import React, { useState } from 'react';
import {
  Home,
  Activity,
  TrendingUp,
  Cloud,
  Download,
  Newspaper,
  Store,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import type { Farm, HeatmapData } from '@/types/farm';
import type { WeatherCalendarData } from '@/hooks/useWeatherCalendar';
import { FarmOverviewPanel } from './FarmInfoPanel';
import { AIAnalysisPanel } from './AIAnalysisPanel';
import { NDVITrendsPanel } from './NDVITrendsPanel';
import { FarmWeatherCalendar } from '../FarmWeatherCalendar';
import { ExportMapsPanel } from './ExportMapsPanel';
import { NewsPanel } from './NewsPanel';
import { MandiRatesPanel } from './MandiRatesPanel';
import {
  FarmOverviewSkeleton,
  AIAnalysisSkeleton,
  NDVITrendsSkeleton,
  NewsSkeleton,
  MandiRatesSkeleton,
} from './PanelSkeletons';

type TabId =
  | 'farm'
  | 'analysis'
  | 'trends'
  | 'weather'
  | 'news'
  | 'mandi'
  | 'export';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
  activeColor: string;
  activeBg: string;
}

interface SidebarTabsProps {
  farm: Farm;
  heatmapData?: HeatmapData | null;
  heatmapLoading?: boolean;
  weatherCalendarData?: WeatherCalendarData | null;
  canEdit: boolean;
  onDelete: () => void;
  onRefreshAnalysis: () => void;
  onRefreshWeather: () => void;
  onExportData?: () => void;
  onGenerateReport?: () => void;
  onDownloadMap?: () => void;
  analysisLoading?: boolean;
  weatherLoading?: boolean;
  exportLoading?: boolean;
  onViewFarmOnMap?: () => void;
  onViewStressMap?: () => void;
}

const TABS: Tab[] = [
  {
    id: 'farm',
    label: 'Overview',
    icon: <Home className='h-5 w-5' />,
    activeColor: 'text-primary-600',
    activeBg: 'bg-primary-50',
  },
  {
    id: 'analysis',
    label: 'AI Analysis',
    icon: <Activity className='h-5 w-5' />,
    activeColor: 'text-violet-600',
    activeBg: 'bg-violet-50',
  },
  {
    id: 'trends',
    label: 'NDVI Trends',
    icon: <TrendingUp className='h-5 w-5' />,
    activeColor: 'text-emerald-600',
    activeBg: 'bg-emerald-50',
  },
  {
    id: 'weather',
    label: 'Weather',
    icon: <Cloud className='h-5 w-5' />,
    activeColor: 'text-sky-600',
    activeBg: 'bg-sky-50',
  },
  {
    id: 'news',
    label: 'News',
    icon: <Newspaper className='h-5 w-5' />,
    activeColor: 'text-orange-600',
    activeBg: 'bg-orange-50',
  },
  {
    id: 'mandi',
    label: 'Mandi Rates',
    icon: <Store className='h-5 w-5' />,
    activeColor: 'text-rose-600',
    activeBg: 'bg-rose-50',
  },
  {
    id: 'export',
    label: 'Export',
    icon: <Download className='h-5 w-5' />,
    activeColor: 'text-amber-600',
    activeBg: 'bg-amber-50',
  },
];

export const SidebarTabs: React.FC<SidebarTabsProps> = ({
  farm,
  heatmapData,
  heatmapLoading = false,
  weatherCalendarData,
  canEdit,
  onDelete,
  onRefreshAnalysis,
  onRefreshWeather,
  onExportData,
  onGenerateReport,
  onDownloadMap,
  analysisLoading = false,
  weatherLoading = false,
  exportLoading = false,
  onViewFarmOnMap,
  onViewStressMap,
}) => {
  const [activeTab, setActiveTab] = useState<TabId | null>('farm');

  const handleOpenAnalysis = () => {
    setActiveTab('analysis');
  };

  const handleOpenTrends = () => {
    setActiveTab('trends');
  };

  const handleViewOnMap = () => {
    onViewFarmOnMap?.();
    setActiveTab(null);
  };

  const handleViewStressMap = () => {
    onViewStressMap?.();
    setActiveTab(null);
  };

  const handleTabClick = (tabId: TabId) => {
    setActiveTab(activeTab === tabId ? null : tabId);
  };

  const isOpen = activeTab !== null;

  return (
    <div className='flex h-full'>
      {/* Vertical Icon Strip */}
      <div className='flex flex-col items-center bg-white py-3 px-1.5 space-y-1 z-10'>
        {TABS.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              title={tab.label}
              className={`
                relative w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 group
                ${
                  isActive
                    ? `${tab.activeBg} ${tab.activeColor} shadow-sm`
                    : 'border text-neutral-800 hover:text-neutral-700 hover:bg-gray-100'
                }
              `}
            >
              {tab.icon}
              {/* Active indicator dot */}
              {isActive && (
                <span className='absolute right-0.5 top-0.5 w-1.5 h-1.5 rounded-full bg-current' />
              )}
              {/* Tooltip */}
              <span className='absolute right-full mr-2 px-2 py-1 text-xs font-medium text-white bg-neutral-800 rounded-md whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-lg'>
                {tab.label}
              </span>
            </button>
          );
        })}

        {/* Spacer */}
        <div className='flex-1' />

        {/* Collapse/Expand toggle */}
        <button
          onClick={() => setActiveTab(isOpen ? null : 'farm')}
          title={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          className='w-10 h-10 rounded-lg flex items-center justify-center text-neutral-500 hover:text-white hover:bg-neutral-700/60 transition-all duration-200'
        >
          {isOpen ? (
            <ChevronRight className='h-4 w-4' />
          ) : (
            <ChevronLeft className='h-4 w-4' />
          )}
        </button>
      </div>

      {/* Sliding Panel */}
      <div
        className={`
          bg-white overflow-hidden transition-all duration-300 ease-in-out
          ${isOpen ? 'w-[310px] opacity-100' : 'w-0 opacity-0'}
        `}
      >
        <div className='w-[310px] h-full flex flex-col overflow-hidden'>
          {/* Panel Header */}
          {activeTab && (
            <div className='px-4 py-3 border-b border-neutral-200 bg-neutral-50 flex-shrink-0'>
              <div className='flex items-center space-x-2'>
                {TABS.find(t => t.id === activeTab)?.icon}
                <h3 className='text-sm font-bold text-neutral-900'>
                  {TABS.find(t => t.id === activeTab)?.label}
                </h3>
              </div>
            </div>
          )}

          {/* Panel Content */}
          <div className='flex-1 overflow-y-auto p-3'>
            {activeTab === 'farm' &&
              (heatmapLoading && !heatmapData ? (
                <FarmOverviewSkeleton />
              ) : (
                <FarmOverviewPanel
                  farm={farm}
                  heatmapData={heatmapData ?? null}
                  canEdit={canEdit}
                  onDelete={onDelete}
                  onOpenAnalysis={handleOpenAnalysis}
                  onOpenTrends={handleOpenTrends}
                  onViewOnMap={handleViewOnMap}
                />
              ))}

            {activeTab === 'analysis' &&
              (heatmapData ? (
                <AIAnalysisPanel
                  heatmapData={heatmapData}
                  onRefresh={onRefreshAnalysis}
                  isLoading={analysisLoading}
                />
              ) : heatmapLoading ? (
                <AIAnalysisSkeleton />
              ) : (
                <div className='flex flex-col items-center justify-center py-8 text-center'>
                  <Activity className='h-12 w-12 text-neutral-300 mb-3' />
                  <p className='text-sm text-neutral-600'>
                    No analysis data available
                  </p>
                </div>
              ))}

            {activeTab === 'trends' &&
              (heatmapData ? (
                <NDVITrendsPanel
                  heatmapData={heatmapData}
                  onViewStressMap={handleViewStressMap}
                />
              ) : heatmapLoading ? (
                <NDVITrendsSkeleton />
              ) : (
                <div className='flex flex-col items-center justify-center py-8 text-center'>
                  <TrendingUp className='h-12 w-12 text-neutral-300 mb-3' />
                  <p className='text-sm text-neutral-600'>
                    No trend data available
                  </p>
                </div>
              ))}

            {activeTab === 'weather' && weatherCalendarData && (
              <FarmWeatherCalendar
                calendarData={weatherCalendarData}
                onRefresh={onRefreshWeather}
                loading={weatherLoading}
              />
            )}

            {activeTab === 'weather' && !weatherCalendarData && (
              <div className='flex flex-col items-center justify-center py-8 text-center'>
                <Cloud className='h-12 w-12 text-neutral-300 mb-3' />
                <p className='text-sm text-neutral-600'>
                  {weatherLoading
                    ? 'Loading weather data...'
                    : 'No weather data available'}
                </p>
              </div>
            )}

            {activeTab === 'news' &&
              (heatmapData ? (
                <NewsPanel
                  news={heatmapData?.news ?? []}
                  {...(heatmapData?.news_ai_analysis !== undefined && {
                    aiAnalysis: heatmapData.news_ai_analysis,
                  })}
                />
              ) : heatmapLoading ? (
                <NewsSkeleton />
              ) : (
                <NewsPanel news={[]} />
              ))}

            {activeTab === 'mandi' &&
              (heatmapData ? (
                <MandiRatesPanel
                  govdata={heatmapData?.rate?.govdata ?? []}
                  {...(heatmapData?.rate?.agmarknet !== undefined && {
                    agmarknet: heatmapData.rate.agmarknet,
                  })}
                  {...(heatmapData?.mandi_ai_analysis !== undefined && {
                    aiAnalysis: heatmapData.mandi_ai_analysis,
                  })}
                />
              ) : heatmapLoading ? (
                <MandiRatesSkeleton />
              ) : (
                <MandiRatesPanel govdata={[]} />
              ))}

            {activeTab === 'export' && (
              <ExportMapsPanel
                farmName={farm.name}
                onExportData={onExportData}
                onGenerateReport={onGenerateReport}
                onDownloadMap={onDownloadMap}
                isLoading={exportLoading}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
