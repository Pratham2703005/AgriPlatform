import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { useFarmStore } from '../stores/farmStore';
import type { FarmFormData } from '../types/farm';
import { CROP_OPTIONS } from '../types/farm';
import { LeafletMap } from '../components/map/LeafletMap';

export const CreateFarm: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addFarm, loading, error } = useFarmStore();
  const [coordinates, setCoordinates] = useState<number[][]>([]);
  const [area, setArea] = useState<number>(0);
  const [showMap, setShowMap] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm<FarmFormData>();

  const plantingDate = watch('plantingDate');

  const onSubmit = (data: FarmFormData) => {
    if (coordinates.length === 0) {
      alert('Please draw your farm boundary on the map');
      return;
    }

    // Pass the current user's ID when creating the farm
    addFarm(data, coordinates, area, user?.id);
    navigate('/dashboard');
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
          <div className="bg-green-600 text-white px-6 py-4">
            <h1 className="text-2xl font-bold">Create New Farm</h1>
            <p className="text-green-100 mt-1">
              Fill in your farm details and mark your farm boundary on the map
            </p>
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                    Draw your farm boundary on the map to calculate the area
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
                    height="500px"
                    className="border rounded-lg"
                  />
                  
                  {coordinates.length > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center space-x-4">
                        <div className="text-green-800">
                          <span className="font-semibold">Area:</span> {area} hectares
                        </div>
                        <div className="text-green-800">
                          <span className="font-semibold">Points:</span> {coordinates.length}
                        </div>
                        <div className="text-green-600 text-sm">
                          ✓ Boundary marked successfully
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!showMap && coordinates.length === 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-800 text-sm">
                    ⚠️ Please mark your farm boundary on the map before submitting
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
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              
              <button
                type="submit"
                disabled={loading || coordinates.length === 0}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Creating Farm...' : 'Create Farm'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};