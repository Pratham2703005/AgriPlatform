import React from 'react';
import { Link } from 'react-router-dom';
import { Edit, Trash2, Sprout, Leaf, MapPin, Calendar } from 'lucide-react';
import type { Farm } from '@/types/farm';
import { formatHectares } from '@/utils';

interface FarmInfoPanelProps {
  farm: Farm;
  canEdit: boolean;
  onDelete: () => void;
}

export const FarmInfoPanel: React.FC<FarmInfoPanelProps> = ({ farm, canEdit, onDelete }) => {
  return (
    <div className="space-y-4">
      {/* Farm Header */}
      <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg p-4 border border-primary-200">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <div className="h-10 w-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center flex-shrink-0">
              <Sprout className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold text-primary-900 truncate">{farm.name}</h2>
              <p className="text-sm text-primary-700 mt-1">{farm.crop}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Farm Details Grid */}
      <div className="space-y-3">
        {/* Area */}
        <div className="flex items-center space-x-3 p-3 bg-neutral-50 rounded-lg">
          <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Leaf className="h-4 w-4 text-blue-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-neutral-600">Farm Area</p>
            <p className="text-sm font-semibold text-neutral-900">{formatHectares(farm.area)} hectares</p>
          </div>
        </div>

        {/* Description */}
        {farm.description && (
          <div className="flex items-center space-x-3 p-3 bg-neutral-50 rounded-lg">
            <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <MapPin className="h-4 w-4 text-green-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-neutral-600">Description</p>
              <p className="text-sm font-semibold text-neutral-900 truncate">{farm.description}</p>
            </div>
          </div>
        )}

        {/* Planting Date */}
        {farm.plantingDate && (
          <div className="flex items-center space-x-3 p-3 bg-neutral-50 rounded-lg">
            <div className="h-8 w-8 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Calendar className="h-4 w-4 text-yellow-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-neutral-600">Planting Date</p>
              <p className="text-sm font-semibold text-neutral-900">
                {new Date(farm.plantingDate).toLocaleDateString()}
              </p>
            </div>
          </div>
        )}

        {/* Harvest Date */}
        {farm.harvestDate && (
          <div className="flex items-center space-x-3 p-3 bg-neutral-50 rounded-lg">
            <div className="h-8 w-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Calendar className="h-4 w-4 text-orange-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-neutral-600">Harvest Date</p>
              <p className="text-sm font-semibold text-neutral-900">
                {new Date(farm.harvestDate).toLocaleDateString()}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      {canEdit && (
        <div className="space-y-2 pt-2 border-t border-neutral-200">
          <Link
            to={`/farm/${farm.id}/edit`}
            className="w-full btn-secondary text-sm flex items-center justify-center"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Farm
          </Link>
          <button
            onClick={onDelete}
            className="w-full btn-danger text-sm flex items-center justify-center"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Farm
          </button>
        </div>
      )}
    </div>
  );
};
