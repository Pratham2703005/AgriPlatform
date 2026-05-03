import { useParams, useNavigate, Link } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useFarms } from '../hooks/useFarms';
import { useHeatmap } from '../hooks/useHeatmap';
import { useWeatherCalendar } from '../hooks/useWeatherCalendar';
import { HeatmapOverlay } from '../components/map/HeatmapOverlay';
import { MapLayerSelector } from '../components/map/MapLayerSelector';
import { SidebarTabs } from '../components/sidebar/SidebarTabs';
import type { LayerType } from '../components/map/HeatmapOverlay';
import { ArrowLeft, Sprout, Lock } from 'lucide-react';
import type { Farm } from '@/types/farm';
import { toast } from 'robot-toast';

export default function FarmDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isGuestMode } = useAuth();
  const { getFarmById, deleteFarm, loading, farms } = useFarms();
  const {
    heatmapData,
    loading: heatmapLoading,
    error: heatmapError,
    fetchHeatmapData,
  } = useHeatmap(id);
  const {
    calendarData,
    loading: calendarLoading,
    fetchCalendar,
  } = useWeatherCalendar();

  const [farm, setFarm] = React.useState<Farm | null>(null);
  const [hasInitiallyFetchedHeatmap, setHasInitiallyFetchedHeatmap] =
    React.useState(false);
  const [activeLayer, setActiveLayer] = useState<LayerType>('ndvi');
  const [mapFocusRequestId, setMapFocusRequestId] = useState(0);
  const [maskOpacity, setMaskOpacity] = useState<Record<string, number>>({
    red: 0.7,
    yellow: 0.7,
    green: 0.7,
    brown: 0.7,
    light_blue: 0.7,
    purple: 0.7,
    pink: 0.7,
    light_green: 0.7,
    dark_green: 0.7,
    anomaly: 1.0,
  });

  // Set farm when farms are loaded
  useEffect(() => {
    if (!loading && id && farms.length > 0) {
      const foundFarm = getFarmById(id);
      setFarm(foundFarm ?? null);
    }
  }, [loading, id, getFarmById, farms]);

  // Fetch growing-season weather calendar when farm is loaded
  useEffect(() => {
    if (
      farm &&
      farm.coordinates &&
      farm.coordinates.length > 0 &&
      farm.plantingDate &&
      farm.harvestDate
    ) {
      const validCoords = farm.coordinates.filter(c => c.length >= 2);
      if (validCoords.length > 0) {
        const sumLng = validCoords.reduce((s, c) => s + (c[0] ?? 0), 0);
        const sumLat = validCoords.reduce((s, c) => s + (c[1] ?? 0), 0);
        const lat = sumLat / validCoords.length;
        const lon = sumLng / validCoords.length;
        const plantStr = farm.plantingDate.slice(0, 10);
        const harvestStr = farm.harvestDate.slice(0, 10);
        fetchCalendar(lat, lon, plantStr, harvestStr);
      }
    }
  }, [farm, fetchCalendar]);

  // Fetch heatmap data when farm is loaded (only once)
  useEffect(() => {
    if (
      farm &&
      farm.coordinates &&
      farm.coordinates.length > 0 &&
      !hasInitiallyFetchedHeatmap &&
      !heatmapData
    ) {
      const coordinates = farm.coordinates
        .filter(coord => coord.length >= 2)
        .map(coord => [coord[0]!, coord[1]!]);
      if (coordinates.length > 0) {
        fetchHeatmapData(
          coordinates,
          0.5,
          0.75,
          farm.plantingDate,
          farm.harvestDate,
          farm.crop
        );
        setHasInitiallyFetchedHeatmap(true);
      }
    }
  }, [farm, fetchHeatmapData, hasInitiallyFetchedHeatmap, heatmapData]);

  // Show error toast when heatmap error occurs
  useEffect(() => {
    if (heatmapError) {
      toast.error({
        message: heatmapError,
        robotVariant: '/corn-error.png',
        autoClose: 3000,
      });
    }
  }, [heatmapError]);

  // Display 7 toasts on page load with different types and custom styles
  useEffect(() => {
    const toastConfigs = [
      {
        type: 'success' as const,
        message: 'Rice Forecasting Enabled',
        robotVariant: '/rice-base.png',
        style: {
          background: 'linear-gradient(135deg, #6ee7b7 0%, #10b981 100%)',
          color: '#fff',
          borderLeft: '4px solid #059669',
          borderRadius: '14px',
          boxShadow: '0 10px 30px -10px rgba(16,185,129,0.5)',
        }
      },
      {
        type: 'success' as const,
        message: 'Wheat Predictions Active',
        robotVariant: '/wheat-base.png',
        style: {
          background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
          color: '#fff',
          borderLeft: '4px solid #92400e',
          borderRadius: '14px',
          boxShadow: '0 10px 30px -10px rgba(217,119,6,0.5)',
        }
      },
      {
        type: 'warning' as const,
        message: 'Carrot Risk Assessment',
        robotVariant: '/carrot-error.png',
        style: {
          background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
          color: '#fff',
          borderLeft: '4px solid #c2410c',
          borderRadius: '14px',
          boxShadow: '0 10px 30px -10px rgba(249,115,22,0.5)',
        }
      },
    ];

    toastConfigs.forEach((config, index) => {
      setTimeout(() => {
        const toastMethod = {
          success: toast.success,
          error: toast.error,
          warning: toast.warning,
          info: toast.info
        }[config.type];

        toastMethod({
          message: config.message,
          robotVariant: config.robotVariant,
          autoClose: 0,
          style: config.style
        });
      }, index * 200);
    });
  }, []);

  // Show loader if loading or farms not loaded
  if (loading || !id || farms.length === 0) {
    return (
      <div className='min-h-screen gradient-mesh flex items-center justify-center'>
        <div className='card p-8 flex flex-col items-center space-y-6 animate-in'>
          <div className='relative'>
            <div className='animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600'></div>
            <div className='absolute inset-0 flex items-center justify-center'>
              <Sprout className='h-5 w-5 text-primary-600 animate-pulse' />
            </div>
          </div>
          <div className='text-center'>
            <p className='text-lg font-medium text-neutral-900 mb-2'>
              Loading Farm Details
            </p>
            <p className='text-sm text-neutral-600'>Gathering information...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show 'Farm Not Found' only if farms loaded and farm missing
  if (!farm && id && farms.length > 0 && !loading) {
    return (
      <div className='min-h-screen gradient-mesh flex items-center justify-center'>
        <div className='card-elevated p-8 text-center max-w-md animate-in'>
          <div className='mb-6'>
            <div className='h-16 w-16 bg-gradient-to-br from-neutral-400 to-neutral-600 rounded-2xl flex items-center justify-center mx-auto'>
              <Sprout className='h-8 w-8 text-white' />
            </div>
          </div>
          <h2 className='text-2xl font-bold text-neutral-900 mb-3'>
            Farm Not Found
          </h2>
          <p className='text-neutral-600 mb-6 leading-relaxed'>
            The farm you're looking for doesn't exist or has been removed.
          </p>
          <Link
            to='/dashboard'
            className='btn-primary inline-flex items-center'
          >
            <ArrowLeft className='h-4 w-4 mr-2' />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const isGuestFarm =
    (farm as unknown as { isGuest?: boolean })?.isGuest === true;
  const canView =
    user?.role === 'admin' ||
    farm?.userId === user?.id ||
    isGuestFarm ||
    isGuestMode;
  const canEdit =
    user?.role === 'admin' ||
    farm?.userId === user?.id ||
    (isGuestFarm && isGuestMode);

  if (!canView) {
    return (
      <div className='min-h-screen gradient-mesh flex items-center justify-center'>
        <div className='card-elevated p-8 text-center max-w-md animate-in'>
          <div className='mb-6'>
            <div className='h-16 w-16 bg-gradient-to-br from-red-500 to-red-700 rounded-2xl flex items-center justify-center mx-auto shadow-glow-red'>
              <Lock className='h-8 w-8 text-white' />
            </div>
          </div>
          <h2 className='text-2xl font-bold text-neutral-900 mb-3'>
            Access Denied
          </h2>
          <p className='text-neutral-600 mb-6 leading-relaxed'>
            You don't have permission to view this farm.
          </p>
          <Link
            to='/dashboard'
            className='btn-primary inline-flex items-center'
          >
            <ArrowLeft className='h-4 w-4 mr-2' />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const handleDelete = async () => {
    if (
      confirm(
        `Are you sure you want to delete "${farm?.name}"? This action cannot be undone.`
      )
    ) {
      try {
        await deleteFarm(farm?.id || '');
        toast.success({
          message: 'Farm deleted successfully!',
          robotVariant: '/corn-base.png',
          autoClose: 3000,
        });
        setTimeout(() => navigate('/dashboard'), 500);
      } catch (error) {
        console.error('Error deleting farm:', error);
      }
    }
  };

  const handleRefreshAnalysis = () => {
    if (farm && farm.coordinates && farm.coordinates.length > 0) {
      const coordinates = farm.coordinates
        .filter(coord => coord.length >= 2)
        .map(coord => [coord[0]!, coord[1]!]);
      if (coordinates.length > 0) {
        toast.success({
          message: 'Refreshing analysis...',
          robotVariant: '/corn-base.png',
          autoClose: 3000,
        });
        fetchHeatmapData(
          coordinates,
          0.5,
          0.75,
          farm.plantingDate,
          farm.harvestDate,
          farm.crop
        );
      }
    }
  };

  const handleOpacityChange = (maskId: string, opacity: number) => {
    setMaskOpacity(prev => ({
      ...prev,
      [maskId]: opacity,
    }));
  };

  const anomalyTileUrl = heatmapData?.anomaly?.tile_urls?.anomaly_heatmap;

  return (
    <div className='flex h-screen bg-neutral-900 overflow-hidden'>
      {/* Back Button (fixed top-left, above map) */}
      <Link
        to='/dashboard'
        className='absolute top-4 left-4 z-50 p-2.5 rounded-lg bg-white text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-all shadow-lg'
        title='Back to Dashboard'
      >
        <ArrowLeft className='h-5 w-5' />
      </Link>

      {/* Full-Window Map */}
      <div className='flex-1 relative'>
        <HeatmapOverlay
          coordinates={farm?.coordinates || [[]]}
          heatmapData={heatmapData}
          height='100vh'
          className='w-full'
          activeLayer={activeLayer}
          onLayerChange={setActiveLayer}
          maskOpacity={maskOpacity}
          anomalyTileUrl={anomalyTileUrl}
          focusRequestId={mapFocusRequestId}
        />

        {/* Map Layer Selector (Bottom-Left) */}
        {!heatmapLoading && (
          <MapLayerSelector
            activeLayer={activeLayer}
            onLayerChange={setActiveLayer}
            maskOpacity={maskOpacity}
            onOpacityChange={handleOpacityChange}
          />
        )}

        {/* Error Banner removed - now using toast notifications */}
      </div>

      {/* Right Sidebar */}
      <div className='flex h-full overflow-hidden'>
        {heatmapLoading ? (
          <div className='w-[350px] bg-white border-l border-neutral-200 flex flex-col items-center justify-center p-4 space-y-4'>
            <div className='relative'>
              <div className='animate-spin rounded-full h-12 w-12 border-4 border-neutral-200 border-t-primary-600'></div>
            </div>
            <p className='text-sm text-neutral-600 text-center'>
              Analyzing field data...
            </p>
          </div>
        ) : farm ? (
          <SidebarTabs
            farm={farm}
            heatmapData={heatmapData ?? null}
            weatherCalendarData={calendarData}
            canEdit={canEdit}
            onDelete={handleDelete}
            onViewFarmOnMap={() => setMapFocusRequestId(prev => prev + 1)}
            onViewStressMap={() => {
              setActiveLayer('anomaly');
              setMapFocusRequestId(prev => prev + 1);
            }}
            onRefreshAnalysis={handleRefreshAnalysis}
            onRefreshWeather={() => {
              if (farm && farm.coordinates && farm.coordinates.length > 0) {
                const validCoords = farm.coordinates.filter(c => c.length >= 2);
                if (validCoords.length > 0) {
                  const sumLng = validCoords.reduce(
                    (s, c) => s + (c[0] ?? 0),
                    0
                  );
                  const sumLat = validCoords.reduce(
                    (s, c) => s + (c[1] ?? 0),
                    0
                  );
                  const lat = sumLat / validCoords.length;
                  const lon = sumLng / validCoords.length;
                  const plantStr = farm.plantingDate.slice(0, 10);
                  const harvestStr = farm.harvestDate.slice(0, 10);
                  fetchCalendar(lat, lon, plantStr, harvestStr);
                }
              }
            }}
            onExportData={() => {
              console.log('Export farm data');
            }}
            onGenerateReport={() => {
              console.log('Generate report');
            }}
            onDownloadMap={() => {
              console.log('Download map');
            }}
            analysisLoading={heatmapLoading}
            weatherLoading={calendarLoading}
            exportLoading={false}
          />
        ) : null}
      </div>
    </div>
  );
}
