import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { useFarmStore } from '../stores/farmStore';
import type { FarmFormData } from '../types/farm';
import { CROP_OPTIONS } from '../types/farm';
import { LeafletMap } from '../components/map/LeafletMap';
import { ArrowLeft } from 'lucide-react';

export default function EditFarm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getFarmById, updateFarm, fetchFarms, loading, error } = useFarmStore();
  const [coordinates, setCoordinates] = useState<number[][]>([]);
  const [area, setArea] = useState<number>(0);
  const [showMap, setShowMap] = useState(false);
  
  // Fetch farms when component mounts to ensure data is available on page reload
  useEffect(() => {
    if (user && id) {
      fetchFarms();
    }
  }, [user, id, fetchFarms]);

  const farm = id ? getFarmById(id) : null;

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue
  } = useForm<FarmFormData>();

  const plantingDate = watch('plantingDate');

  // Check permissions
  const canEdit = user?.role === 'admin' || farm?.userId?._id === user?.id;

  useEffect(() => {
    if (farm) {
      // Populate form with existing farm data
      setValue('name', farm.name);
      setValue('crop', farm.crop);
      
      // Format dates properly for the date input (YYYY-MM-DD)
      const formatDateForInput = (dateString: string) => {
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
      };
      
      setValue('plantingDate', formatDateForInput(farm.plantingDate));
      setValue('harvestDate', formatDateForInput(farm.harvestDate));
      setValue('description', farm.description || '');
      
      // Set coordinates and area
      setCoordinates(farm.coordinates);
      setArea(farm.area);
    }
  }, [farm, setValue]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading farm details...</p>
        </div>
      </div>
    );
  }
  
  // Only show Farm Not Found after loading is complete
  if (!farm && !loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Farm Not Found</h2>
          <p className="text-gray-600 mb-6">The farm you're looking for doesn't exist or has been removed.</p>
          <Link
            to="/dashboard"
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!canEdit) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-6">You don't have permission to edit this farm.</p>
          <Link
            to={`/farm/${id}`}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Farm Details
          </Link>
        </div>
      </div>
    );
  }

  const onSubmit = async (data: FarmFormData) => {
    if (coordinates.length === 0) {
      alert('Please draw your farm boundary on the map');
      return;
    }

    try {
      await updateFarm(farm.id, {
        ...data,
        coordinates,
        area
      });
      
      // Only navigate after the update is complete
      navigate(`/farm/${farm.id}`);
    } catch (error) {
      console.error('Error updating farm:', error);
      // Error is already handled by the store
    }
  };

  const handlePolygonComplete = (coords: number[][], calculatedArea: number) => {
    setCoordinates(coords);
    setArea(calculatedArea);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-blue-600 text-white px-6 py-4">
            <div className="flex items-center">
              <Link
                to={`/farm/${id}`}
                className="mr-4 p-2 rounded-md text-blue-200 hover:text-white hover:bg-blue-700"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold">Edit Farm</h1>
                <p className="text-blue-100 mt-1">
                  Update your farm details and boundary
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
            {/* Farm Details Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Farm Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Farm Name *
                </label>
                <input
                  type="text"
                  {...register('name', { 
                    required: 'Farm name is required',
                    minLength: { value: 2, message: 'Name must be at least 2 characters' }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter farm name"
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                )}
              </div>

              {/* Crop Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Crop Type *
                </label>
                <select
                  {...register('crop', { required: 'Please select a crop type' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select crop type</option>
                  {CROP_OPTIONS.map(crop => (
                    <option key={crop} value={crop}>{crop}</option>
                  ))}
                </select>
                {errors.crop && (
                  <p className="text-red-500 text-sm mt-1">{errors.crop.message}</p>
                )}
              </div>

              {/* Planting Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Planting Date *
                </label>
                <input
                  type="date"
                  {...register('plantingDate', { required: 'Planting date is required' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.plantingDate && (
                  <p className="text-red-500 text-sm mt-1">{errors.plantingDate.message}</p>
                )}
              </div>

              {/* Harvest Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Harvest Date *
                </label>
                <input
                  type="date"
                  {...register('harvestDate', { 
                    required: 'Harvest date is required',
                    validate: value => {
                      if (plantingDate && value <= plantingDate) {
                        return 'Harvest date must be after planting date';
                      }
                      return true;
                    }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.harvestDate && (
                  <p className="text-red-500 text-sm mt-1">{errors.harvestDate.message}</p>
                )}
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  {...register('description')}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter any additional details about your farm"
                />
              </div>
            </div>

            {/* Map Section */}
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Farm Boundary</h3>
                  <p className="text-gray-600 text-sm">
                    Update your farm boundary on the map to recalculate the area
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowMap(!showMap)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {showMap ? 'Hide Map' : 'Show Map'}
                </button>
              </div>

              {showMap && (
                <div className="space-y-4">
                  <LeafletMap
                    onPolygonComplete={handlePolygonComplete}
                    initialCoordinates={coordinates}
                    height="500px"
                    className="border rounded-lg"
                  />
                  
                  {coordinates.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center space-x-4">
                        <div className="text-blue-800">
                          <span className="font-semibold">Area:</span> {area} hectares
                        </div>
                        <div className="text-blue-800">
                          <span className="font-semibold">Points:</span> {coordinates.length}
                        </div>
                        <div className="text-blue-600 text-sm">
                          ✓ Boundary updated
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!showMap && coordinates.length === 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-800 text-sm">
                    ⚠️ Please mark your farm boundary on the map before saving
                  </p>
                </div>
              )}
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-between pt-6 border-t">
              <Link
                to={`/farm/${id}`}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </Link>
              
              <button
                type="submit"
                disabled={loading || coordinates.length === 0}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Updating Farm...' : 'Update Farm'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}