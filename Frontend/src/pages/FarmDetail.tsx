import { useParams, useNavigate, Link } from 'react-router-dom';
import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { useFarms } from '../hooks/useFarms';
import { useHeatmap } from '../hooks/useHeatmap';
import { useWeatherCalendar } from '../hooks/useWeatherCalendar';
import { FarmWeatherCalendar } from '../components/FarmWeatherCalendar';
import { HeatmapOverlay } from '../components/map/HeatmapOverlay';
import type { LayerType } from '../components/map/HeatmapOverlay';
import { ArrowLeft, Sprout, Edit, Trash2, Download, FileText, Map, Lock, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Activity } from 'lucide-react';
import { useEffect } from 'react';
import { formatHectares } from '@/utils';
import type { Farm } from '@/types/farm';

export default function FarmDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isGuestMode } = useAuth();
  const { getFarmById, deleteFarm, loading, farms } = useFarms();
  const { heatmapData, loading: heatmapLoading, error: heatmapError, fetchHeatmapData } = useHeatmap();
  const { calendarData, loading: calendarLoading, fetchCalendar } = useWeatherCalendar();
  const [farm, setFarm] = React.useState<Farm | null>(null);
  const [hasInitiallyFetchedHeatmap, setHasInitiallyFetchedHeatmap] = React.useState(false);
  const [activeLayer, setActiveLayer] = React.useState<LayerType>('ndvi');

  // Set farm when farms are loaded
  useEffect(() => {
    if (!loading && id && farms.length > 0) {
      const foundFarm = getFarmById(id);
      setFarm(foundFarm ?? null);
    }
  }, [loading, id, getFarmById, farms]);

  // Fetch growing-season weather calendar when farm is loaded
  useEffect(() => {
    if (farm && farm.coordinates && farm.coordinates.length > 0 && farm.plantingDate && farm.harvestDate) {
      const validCoords = farm.coordinates.filter(c => c.length >= 2);
      if (validCoords.length > 0) {
        const sumLng = validCoords.reduce((s, c) => s + (c[0] ?? 0), 0);
        const sumLat = validCoords.reduce((s, c) => s + (c[1] ?? 0), 0);
        const lat = sumLat / validCoords.length;
        const lon = sumLng / validCoords.length;
        // Normalise dates to YYYY-MM-DD
        const plantStr = farm.plantingDate.slice(0, 10);
        const harvestStr = farm.harvestDate.slice(0, 10);
        fetchCalendar(lat, lon, plantStr, harvestStr);
      }
    }
  }, [farm, fetchCalendar]);

  // Fetch heatmap data when farm is loaded (only once)
  useEffect(() => {
    if (farm && farm.coordinates && farm.coordinates.length > 0 && !hasInitiallyFetchedHeatmap && !heatmapData) {
      // Convert coordinates to the format expected by the API
      const coordinates = farm.coordinates.filter(coord => coord.length >= 2).map(coord => [coord[0]!, coord[1]!]);
      if (coordinates.length > 0) {
        fetchHeatmapData(coordinates, 0.5, 0.75);
        setHasInitiallyFetchedHeatmap(true);
      }
    }
  }, [farm, fetchHeatmapData, hasInitiallyFetchedHeatmap, heatmapData]);

  // Show loader if loading or farms not loaded
  if (loading || !id || farms.length === 0) {
    return (
      <div className="min-h-screen gradient-mesh flex items-center justify-center">
        <div className="card p-8 flex flex-col items-center space-y-6 animate-in">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Sprout className="h-5 w-5 text-primary-600 animate-pulse" />
            </div>
          </div>
          <div className="text-center">
            <p className="text-lg font-medium text-neutral-900 mb-2">Loading Farm Details</p>
            <p className="text-sm text-neutral-600">Gathering information...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show 'Farm Not Found' only if farms loaded and farm missing
  if (!farm && id && farms.length > 0 && !loading) {
    return (
      <div className="min-h-screen gradient-mesh flex items-center justify-center">
        <div className="card-elevated p-8 text-center max-w-md animate-in">
          <div className="mb-6">
            <div className="h-16 w-16 bg-gradient-to-br from-neutral-400 to-neutral-600 rounded-2xl flex items-center justify-center mx-auto">
              <Sprout className="h-8 w-8 text-white" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-neutral-900 mb-3">Farm Not Found</h2>
          <p className="text-neutral-600 mb-6 leading-relaxed">
            The farm you're looking for doesn't exist or has been removed.
          </p>
          <Link to="/dashboard" className="btn-primary inline-flex items-center">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  console.log("FARM IN FarmDetail.tsx: ", farm);
  
  // Show loading indicator while farms are being fetched
  if (loading || !id || farms.length === 0) {
    return (
      <div className="min-h-screen gradient-mesh flex items-center justify-center">
        <div className="card p-8 flex flex-col items-center space-y-6 animate-in">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Sprout className="h-5 w-5 text-primary-600 animate-pulse" />
            </div>
          </div>
          <div className="text-center">
            <p className="text-lg font-medium text-neutral-900 mb-2">Loading Farm Details</p>
            <p className="text-sm text-neutral-600">Gathering information...</p>
          </div>
        </div>
      </div>
    );
  }

  // Only show Farm Not Found after farms are loaded and id is present
  if (!farm && id && farms.length > 0 && !loading) {
    return (
      <div className="min-h-screen gradient-mesh flex items-center justify-center">
        <div className="card-elevated p-8 text-center max-w-md animate-in">
          <div className="mb-6">
            <div className="h-16 w-16 bg-gradient-to-br from-neutral-400 to-neutral-600 rounded-2xl flex items-center justify-center mx-auto">
              <Sprout className="h-8 w-8 text-white" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-neutral-900 mb-3">Farm Not Found</h2>
          <p className="text-neutral-600 mb-6 leading-relaxed">
            The farm you're looking for doesn't exist or has been removed.
          </p>
          <Link to="/dashboard" className="btn-primary inline-flex items-center">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }
  console.log("FARM : ", farm);

  console.log("USER: ", user)

  // Check if user has permission to view this farm
  // Allow guest users to view guest farms
  const isGuestFarm = (farm as unknown as { isGuest?: boolean })?.isGuest === true;
  const canView = user?.role === 'admin' || (farm?.userId === user?.id) || isGuestFarm || isGuestMode;
  // Guest users can only edit/delete guest farms, authenticated users can edit their own farms
  const canEdit = user?.role === 'admin' || 
    (farm?.userId === user?.id) || 
    (isGuestFarm && isGuestMode);
  console.log("CAN EDIT : ", canEdit, "CAN View: ", canView)
  if (!canView) {
    return (
      <div className="min-h-screen gradient-mesh flex items-center justify-center">
        <div className="card-elevated p-8 text-center max-w-md animate-in">
          <div className="mb-6">
            <div className="h-16 w-16 bg-gradient-to-br from-red-500 to-red-700 rounded-2xl flex items-center justify-center mx-auto shadow-glow-red">
              <Lock className="h-8 w-8 text-white" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-neutral-900 mb-3">Access Denied</h2>
          <p className="text-neutral-600 mb-6 leading-relaxed">
            You don't have permission to view this farm.
          </p>
          <Link to="/dashboard" className="btn-primary inline-flex items-center">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete "${farm?.name}"? This action cannot be undone.`)) {
      try {
        await deleteFarm(farm?.id || '');
        navigate('/dashboard');
      } catch (error) {
        console.error('Error deleting farm:', error);
        // Error is handled by the store, no need for additional alert
      }
    }
  };

  return (
    <div className="min-h-screen gradient-mesh">
      {/* Enhanced Header */}
      <header className="glass border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center animate-in">
              <Link
                to="/dashboard"
                className="mr-4 p-2.5 rounded-xl text-neutral-400 hover:text-neutral-600 hover:bg-white/50 transition-all"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div className="flex items-start space-x-4">
                <div className="h-12 w-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-glow">
                  <Sprout className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-neutral-900">{farm?.name}</h1>
                  <div className="flex items-center space-x-3 mt-1">
                    <span className="badge-primary">{farm?.crop}</span>
                    <span className="text-sm text-neutral-600">{formatHectares(farm?.area)} hectares</span>
                  </div>
                </div>
              </div>
            </div>
            {canEdit && (
              <div className="flex items-center space-x-3 animate-in stagger-1">
                <Link
                  to={`/farm/${id}/edit`}
                  className="btn-secondary"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Farm
                </Link>
                <button
                  onClick={handleDelete}
                  className="btn-danger"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Farm
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Enhanced Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          {/* Full Width Map Section */}
          <div className="mb-8">
            <div className="card-elevated animate-in">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-gradient-to-br from-accent-500 to-accent-700 rounded-xl flex items-center justify-center">
                      <Map className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-neutral-900">Interactive Farm Analysis</h3>
                      <p className="text-sm text-neutral-600">Satellite view with AI-powered crop health overlay</p>
                    </div>
                  </div>
                  {heatmapData && (
                    <div className="flex items-center space-x-2 text-sm text-neutral-600">
                      <div className="flex items-center space-x-1">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span>Stressed</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        <span>Moderate</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span>Healthy</span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="rounded-xl overflow-hidden border border-neutral-200 shadow-soft">
                  <HeatmapOverlay
                    coordinates={farm?.coordinates || [[]]}
                    heatmapData={heatmapData}
                    height="600px"
                    className="w-full"
                    activeLayer={activeLayer}
                    onLayerChange={setActiveLayer}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Two Column Layout for Details and Analysis */}
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
            {/* Main Content - Farm Analysis */}
            <div className="xl:col-span-3 space-y-6">
              {/* AI Analysis Section */}
              {heatmapData && (
                <div className="card-elevated animate-in stagger-1">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center">
                          <Activity className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-neutral-900">AI Field Analysis</h3>
                          <p className="text-sm text-neutral-600">Satellite-based crop health assessment</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          if (farm && farm.coordinates && farm.coordinates.length > 0) {
                            const coordinates = farm.coordinates.filter(coord => coord.length >= 2).map(coord => [coord[0]!, coord[1]!]);
                            if (coordinates.length > 0) {
                              fetchHeatmapData(coordinates, 0.5, 0.75);
                            }
                          }
                        }}
                        disabled={heatmapLoading}
                        className="btn-secondary text-sm"
                      >
                        <Activity className="h-4 w-4 mr-2" />
                        {heatmapLoading ? 'Analyzing...' : 'Refresh Analysis'}
                      </button>
                    </div>
                    
                    {/* Overall Assessment */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 mb-6">
                      <h4 className="font-semibold text-blue-900 mb-2">Overall Assessment</h4>
                      <p className="text-blue-800">{heatmapData.suggestions.overall_assessment}</p>
                    </div>

                    {/* Yield Analysis */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div className="bg-white rounded-xl p-4 border border-neutral-200">
                        <h4 className="font-semibold text-neutral-900 mb-3 flex items-center">
                          <TrendingUp className="h-4 w-4 mr-2 text-green-600" />
                          Yield Prediction
                        </h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-neutral-600">Predicted:</span>
                            <span className="font-semibold text-green-700">{heatmapData.predicted_yield.toFixed(2)} tons</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-neutral-600">Previous:</span>
                            <span className="font-semibold text-neutral-700">{heatmapData.old_yield.toFixed(2)} tons</span>
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t">
                            <span className="text-sm text-neutral-600">Change:</span>
                            <span className={`font-semibold flex items-center ${heatmapData.growth.percentage >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                              {heatmapData.growth.percentage >= 0 ? (
                                <TrendingUp className="h-3 w-3 mr-1" />
                              ) : (
                                <TrendingDown className="h-3 w-3 mr-1" />
                              )}
                              {heatmapData.growth.percentage.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-xl p-4 border border-neutral-200">
                        <h4 className="font-semibold text-neutral-900 mb-3">Field Health Distribution</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm flex items-center">
                              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                              Healthy
                            </span>
                            <span className="font-semibold text-green-700">
                              {((heatmapData.pixel_counts.green / heatmapData.pixel_counts.valid) * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm flex items-center">
                              <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                              Moderate
                            </span>
                            <span className="font-semibold text-yellow-700">
                              {((heatmapData.pixel_counts.yellow / heatmapData.pixel_counts.valid) * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm flex items-center">
                              <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                              Stressed
                            </span>
                            <span className="font-semibold text-red-700">
                              {((heatmapData.pixel_counts.red / heatmapData.pixel_counts.valid) * 100).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Heatmap Masks — reacts to active layer */}
                    <div className="mb-6">
                      <h4 className="font-semibold text-neutral-900 mb-4">
                        {activeLayer === 'ndvi' ? 'Field Health Visualization' : activeLayer === 'ndwi' ? 'NDWI Visualization' : 'NDRE Visualization'}
                      </h4>
                      {(() => {
                        const maskSource =
                          activeLayer === 'ndwi' ? heatmapData['ndwi-masks'] :
                          activeLayer === 'ndre' ? heatmapData['ndre-masks'] :
                          heatmapData.masks;
                        if (!maskSource) return <p className="text-sm text-neutral-500">No mask data available for this layer.</p>;
                        return (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="text-center">
                              <h5 className="text-sm font-medium text-red-700 mb-2">Stressed Areas</h5>
                              <img 
                                src={`data:image/png;base64,${maskSource.red_mask_base64}`}
                                alt="Red mask - stressed areas"
                                className="w-full h-32 object-cover rounded-lg border"
                              />
                            </div>
                            <div className="text-center">
                              <h5 className="text-sm font-medium text-yellow-700 mb-2">Moderate Health</h5>
                              <img 
                                src={`data:image/png;base64,${maskSource.yellow_mask_base64}`}
                                alt="Yellow mask - moderate areas"
                                className="w-full h-32 object-cover rounded-lg border"
                              />
                            </div>
                            <div className="text-center">
                              <h5 className="text-sm font-medium text-green-700 mb-2">Healthy Areas</h5>
                              <img 
                                src={`data:image/png;base64,${maskSource.green_mask_base64}`}
                                alt="Green mask - healthy areas"
                                className="w-full h-32 object-cover rounded-lg border"
                              />
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Recommendations */}
                    <div className="space-y-4">
                      {heatmapData.suggestions.field_management.length > 0 && (
                        <div className="bg-green-50 rounded-xl p-4">
                          <h4 className="font-semibold text-green-900 mb-2 flex items-center">
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Field Management
                          </h4>
                          <ul className="text-sm text-green-800 space-y-1">
                            {heatmapData.suggestions.field_management.map((item, index) => (
                              <li key={index}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {heatmapData.suggestions.soil_recommendations.length > 0 && (
                        <div className="bg-amber-50 rounded-xl p-4">
                          <h4 className="font-semibold text-amber-900 mb-2 flex items-center">
                            <AlertTriangle className="h-4 w-4 mr-2" />
                            Soil Recommendations
                          </h4>
                          <ul className="text-sm text-amber-800 space-y-1">
                            {heatmapData.suggestions.soil_recommendations.map((item, index) => (
                              <li key={index}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {heatmapData.suggestions.immediate_actions.length > 0 && (
                        <div className="bg-blue-50 rounded-xl p-4">
                          <h4 className="font-semibold text-blue-900 mb-2">Immediate Actions</h4>
                          <ul className="text-sm text-blue-800 space-y-1">
                            {heatmapData.suggestions.immediate_actions.map((item, index) => (
                              <li key={index}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {heatmapData.suggestions.seasonal_planning.length > 0 && (
                        <div className="bg-purple-50 rounded-xl p-4">
                          <h4 className="font-semibold text-purple-900 mb-2">Seasonal Planning</h4>
                          <ul className="text-sm text-purple-800 space-y-1">
                            {heatmapData.suggestions.seasonal_planning.map((item, index) => (
                              <li key={index}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {heatmapLoading && (
                <div className="card-elevated animate-in stagger-1">
                  <div className="p-6 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
                    <p className="text-neutral-600">Analyzing field data...</p>
                  </div>
                </div>
              )}

              {heatmapError && (
                <div className="card-elevated animate-in stagger-1">
                  <div className="p-6 text-center">
                    <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-4" />
                    <p className="text-red-600 mb-4">Failed to load field analysis: {heatmapError}</p>
                    <button
                      onClick={() => {
                        if (farm && farm.coordinates && farm.coordinates.length > 0) {
                          const coordinates = farm.coordinates.filter(coord => coord.length >= 2).map(coord => [coord[0]!, coord[1]!]);
                          if (coordinates.length > 0) {
                            fetchHeatmapData(coordinates, 0.5, 0.75);
                          }
                        }
                      }}
                      className="btn-primary"
                    >
                      <Activity className="h-4 w-4 mr-2" />
                      Retry Analysis
                    </button>
                  </div>
                </div>
              )}

              {!heatmapData && !heatmapLoading && !heatmapError && (
                <div className="card-elevated animate-in stagger-1">
                  <div className="p-6 text-center">
                    <div className="h-16 w-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Activity className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-neutral-900 mb-2">AI Field Analysis</h3>
                    <p className="text-neutral-600 mb-6">Get detailed insights about your crop health using satellite imagery and AI analysis.</p>
                    <button
                      onClick={() => {
                        if (farm && farm.coordinates && farm.coordinates.length > 0) {
                          const coordinates = farm.coordinates.filter(coord => coord.length >= 2).map(coord => [coord[0]!, coord[1]!]);
                          if (coordinates.length > 0) {
                            fetchHeatmapData(coordinates, 0.5, 0.75);
                          }
                        }
                      }}
                      className="btn-primary"
                    >
                      <Activity className="h-4 w-4 mr-2" />
                      Generate Analysis
                    </button>
                  </div>
                </div>
              )}

              {/* Enhanced Farm Map View */}
              

             
            </div>

            {/* Enhanced Sidebar */}
            <div className="xl:col-span-2 space-y-6">
              {/* Growing Season Weather Calendar */}
              {calendarData && (
                <FarmWeatherCalendar
                  calendarData={calendarData}
                  loading={calendarLoading}
                  onRefresh={() => {
                    if (farm && farm.coordinates && farm.coordinates.length > 0) {
                      const validCoords = farm.coordinates.filter(c => c.length >= 2);
                      if (validCoords.length > 0) {
                        const sumLng = validCoords.reduce((s, c) => s + (c[0] ?? 0), 0);
                        const sumLat = validCoords.reduce((s, c) => s + (c[1] ?? 0), 0);
                        fetchCalendar(
                          sumLat / validCoords.length,
                          sumLng / validCoords.length,
                          farm.plantingDate.slice(0, 10),
                          farm.harvestDate.slice(0, 10)
                        );
                      }
                    }
                  }}
                />
              )}
              {calendarLoading && !calendarData && (
                <div className="card-elevated p-6 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-sky-200 border-t-sky-500 mx-auto mb-3" />
                  <p className="text-sm text-neutral-500">Loading season forecast…</p>
                </div>
              )}

              {/* Enhanced Farm Status */}
              <div className="card-elevated animate-in stagger-3">
                <div className="p-6">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="h-10 w-10 bg-gradient-to-br from-green-500 to-green-700 rounded-xl flex items-center justify-center">
                      <Sprout className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-neutral-900">Farm Status</h3>
                      <p className="text-sm text-neutral-600">Current cultivation status</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4">
                      <dt className="text-sm font-medium text-neutral-700 mb-2">Current Status</dt>
                      <dd className="flex items-center">
                        <div className="badge-success">
                          <div className="h-2 w-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                          Active & Growing
                        </div>
                      </dd>
                    </div>
                    
                    <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl p-4">
                      <dt className="text-sm font-medium text-neutral-700 mb-2">Days to Harvest</dt>
                      <dd className="text-lg font-bold text-orange-700">
                        {(() => {
                          const daysToHarvest = Math.ceil((new Date(farm?.harvestDate|| 0).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                          if (daysToHarvest < 0) {
                            return (
                              <span className="text-green-700">
                                Harvested {Math.abs(daysToHarvest)} days ago ✓
                              </span>
                            );
                          } else if (daysToHarvest === 0) {
                            return <span className="text-red-600">Harvest today! 🌾</span>;
                          } else {
                            return `${daysToHarvest} days remaining`;
                          }
                        })()}
                      </dd>
                    </div>
                    
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4">
                      <dt className="text-sm font-medium text-neutral-700 mb-2">Growing Period</dt>
                      <dd className="text-lg font-semibold text-blue-700">
                        {Math.ceil((new Date(farm?.harvestDate || 0).getTime() - new Date(farm?.plantingDate || 0).getTime()) / (1000 * 60 * 60 * 24))} days
                        <span className="text-sm text-blue-600 block">cultivation cycle</span>
                      </dd>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-3">
                      <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-3">
                        <dt className="text-xs font-medium text-neutral-700 mb-1">Created</dt>
                        <dd className="text-sm font-semibold text-purple-700">
                          {new Date(farm?.createdAt || 0).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </dd>
                      </div>
                      
                      <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-xl p-3">
                        <dt className="text-xs font-medium text-neutral-700 mb-1">Last Updated</dt>
                        <dd className="text-sm font-semibold text-indigo-700">
                          {new Date(farm?.updatedAt || 0).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </dd>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Heatmap Statistics */}
              {heatmapData && (
                <div className="card-elevated animate-in stagger-3">
                  <div className="p-6">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="h-10 w-10 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl flex items-center justify-center">
                        <Activity className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-neutral-900">Field Health Overview</h3>
                        <p className="text-sm text-neutral-600">AI-powered analysis results</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      {/* Yield Comparison */}
                      <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-xl p-4">
                        <dt className="text-sm font-medium text-neutral-700 mb-2">Yield Prediction</dt>
                        <dd className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-emerald-700">Current Estimate</span>
                            <span className="font-bold text-emerald-800">{heatmapData.predicted_yield.toFixed(2)} tons</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-neutral-600">Previous Yield</span>
                            <span className="font-semibold text-neutral-700">{heatmapData.old_yield.toFixed(2)} tons</span>
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t border-emerald-200">
                            <span className="text-sm text-neutral-600">Change</span>
                            <span className={`font-bold flex items-center text-sm ${heatmapData.growth.percentage >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                              {heatmapData.growth.percentage >= 0 ? (
                                <TrendingUp className="h-3 w-3 mr-1" />
                              ) : (
                                <TrendingDown className="h-3 w-3 mr-1" />
                              )}
                              {heatmapData.growth.percentage.toFixed(1)}%
                            </span>
                          </div>
                        </dd>
                      </div>

                      {/* Health Distribution */}
                      <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl p-4">
                        <dt className="text-sm font-medium text-neutral-700 mb-3">Field Health Distribution</dt>
                        <dd className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                              <span className="text-sm text-neutral-700">Healthy Areas</span>
                            </div>
                            <span className="font-semibold text-green-700">
                              {((heatmapData.pixel_counts.green / heatmapData.pixel_counts.valid) * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                              <span className="text-sm text-neutral-700">Moderate Health</span>
                            </div>
                            <span className="font-semibold text-yellow-700">
                              {((heatmapData.pixel_counts.yellow / heatmapData.pixel_counts.valid) * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                              <span className="text-sm text-neutral-700">Stressed Areas</span>
                            </div>
                            <span className="font-semibold text-red-700">
                              {((heatmapData.pixel_counts.red / heatmapData.pixel_counts.valid) * 100).toFixed(1)}%
                            </span>
                          </div>
                        </dd>
                      </div>

                      {/* Overall Assessment */}
                      <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4">
                        <dt className="text-sm font-medium text-neutral-700 mb-2">Overall Assessment</dt>
                        <dd className="text-sm text-blue-800 font-medium">
                          {heatmapData.suggestions.overall_assessment}
                        </dd>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Enhanced Quick Actions */}
              <div className="card-elevated animate-in stagger-4">
                <div className="p-6">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="h-10 w-10 bg-gradient-to-br from-accent-500 to-accent-700 rounded-xl flex items-center justify-center">
                      <Sprout className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-neutral-900">Quick Actions</h3>
                      <p className="text-sm text-neutral-600">Manage farm operations</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <button 
                      onClick={() => {
                        const mapElement = document.querySelector('.leaflet-container');
                        if (mapElement) {
                          mapElement.scrollIntoView({ behavior: 'smooth' });
                        }
                      }}
                      className="w-full group relative overflow-hidden bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 border border-blue-200 text-blue-800 rounded-xl px-4 py-4 text-sm font-medium transition-all duration-200 hover:shadow-soft"
                    >
                      <div className="flex items-center">
                        <div className="h-8 w-8 bg-blue-500 rounded-lg flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
                          <Map className="h-4 w-4 text-white" />
                        </div>
                        <div className="text-left">
                          <div className="font-semibold">View on Map</div>
                          <div className="text-xs text-blue-600">Scroll to interactive map</div>
                        </div>
                      </div>
                    </button>
                    
                    <button 
                      onClick={() => {
                        const reportData = {
                          farmName: farm?.name || '',
                          crop: farm?.crop || '',
                          area: farm?.area || 0,
                          plantingDate: farm?.plantingDate || '',
                          harvestDate: farm?.harvestDate || '',
                          coordinates: farm?.coordinates || [],
                          createdAt: farm?.createdAt || ''
                        };
                        console.log('Generating report for:', reportData);
                        alert('Report generation feature coming soon!');
                      }}
                      className="w-full group relative overflow-hidden bg-gradient-to-r from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 border border-purple-200 text-purple-800 rounded-xl px-4 py-4 text-sm font-medium transition-all duration-200 hover:shadow-soft"
                    >
                      <div className="flex items-center">
                        <div className="h-8 w-8 bg-purple-500 rounded-lg flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
                          <FileText className="h-4 w-4 text-white" />
                        </div>
                        <div className="text-left">
                          <div className="font-semibold">Generate Report</div>
                          <div className="text-xs text-purple-600">Farm analysis & insights</div>
                        </div>
                      </div>
                    </button>
                    
                    <button 
                      onClick={() => {
                        const farmData = {
                          id: farm?.id || '',
                          name: farm?.name || '',
                          crop: farm?.crop || '',
                          area: farm?.area || 0,
                          plantingDate: farm?.plantingDate || '',
                          harvestDate: farm?.harvestDate || '',
                          description: farm?.description || '',
                          coordinates: farm?.coordinates || [],
                          createdAt: farm?.createdAt || '',
                          updatedAt: farm?.updatedAt || ''
                        };
                        
                        const dataStr = JSON.stringify(farmData, null, 2);
                        const dataBlob = new Blob([dataStr], { type: 'application/json' });
                        const url = URL.createObjectURL(dataBlob);
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = `${farm?.name.replace(/\s+/g, '_')}_farm_data.json`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        URL.revokeObjectURL(url);
                      }}
                      className="w-full group relative overflow-hidden bg-gradient-to-r from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 border border-green-200 text-green-800 rounded-xl px-4 py-4 text-sm font-medium transition-all duration-200 hover:shadow-soft"
                    >
                      <div className="flex items-center">
                        <div className="h-8 w-8 bg-green-500 rounded-lg flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
                          <Download className="h-4 w-4 text-white" />
                        </div>
                        <div className="text-left">
                          <div className="font-semibold">Export Data</div>
                          <div className="text-xs text-green-600">Download JSON file</div>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}