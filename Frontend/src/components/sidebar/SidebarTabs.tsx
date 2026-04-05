import React, { useState } from 'react';
import { Home, Activity, TrendingUp, Cloud, Download } from 'lucide-react';
import type { Farm, HeatmapData, WeatherData } from '@/types/farm';
import { FarmInfoPanel } from './FarmInfoPanel';
import { AIAnalysisPanel } from './AIAnalysisPanel';
import { NDVITrendsPanel } from './NDVITrendsPanel';
import { WeatherDataPanel } from './WeatherDataPanel';
import { ExportMapsPanel } from './ExportMapsPanel';

type TabId = 'farm' | 'analysis' | 'trends' | 'weather' | 'export';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

interface SidebarTabsProps {
  farm: Farm;
  heatmapData?: HeatmapData | null;
  calendarData: WeatherData[];
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
}

const TABS: Tab[] = [
  { id: 'farm', label: 'Farm Info', icon: <Home className="h-4 w-4" /> },
  { id: 'analysis', label: 'AI Analysis', icon: <Activity className="h-4 w-4" /> },
  { id: 'trends', label: 'NDVI Trends', icon: <TrendingUp className="h-4 w-4" /> },
  { id: 'weather', label: 'Weather', icon: <Cloud className="h-4 w-4" /> },
  { id: 'export', label: 'Export', icon: <Download className="h-4 w-4" /> },
];

export const SidebarTabs: React.FC<SidebarTabsProps> = ({
  farm,
  heatmapData,
  calendarData,
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
}) => {
  const [activeTab, setActiveTab] = useState<TabId>('farm');

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Tab Navigation */}
      <div className="border-b border-neutral-200 bg-white sticky top-0 z-10">
        <div className="flex overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-max px-3 py-3 text-xs font-semibold transition-all whitespace-nowrap border-b-2 flex items-center justify-center space-x-1.5 ${
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-600 bg-primary-50'
                  : 'border-transparent text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'farm' && (
          <FarmInfoPanel
            farm={farm}
            canEdit={canEdit}
            onDelete={onDelete}
          />
        )}

        {activeTab === 'analysis' && heatmapData && (
          <AIAnalysisPanel
            heatmapData={heatmapData}
            onRefresh={onRefreshAnalysis}
            isLoading={analysisLoading}
          />
        )}

        {activeTab === 'analysis' && !heatmapData && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Activity className="h-12 w-12 text-neutral-300 mb-3" />
            <p className="text-sm text-neutral-600">Loading analysis data...</p>
          </div>
        )}

        {activeTab === 'trends' && heatmapData && (
          <NDVITrendsPanel heatmapData={heatmapData} />
        )}

        {activeTab === 'trends' && !heatmapData && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <TrendingUp className="h-12 w-12 text-neutral-300 mb-3" />
            <p className="text-sm text-neutral-600">Loading trend data...</p>
          </div>
        )}

        {activeTab === 'weather' && (
          <WeatherDataPanel
            calendarData={calendarData}
            plantingDate={farm.plantingDate}
            harvestDate={farm.harvestDate}
            onRefresh={onRefreshWeather}
            isLoading={weatherLoading}
          />
        )}

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
  );
};
