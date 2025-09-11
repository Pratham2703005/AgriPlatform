import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useFarmStore } from '../stores/farmStore';
import { FarmMapView } from '../components/map/FarmMapView';
import { ArrowLeft, MapPin, Calendar, Sprout, Edit, Trash2, Download, FileText, Map } from 'lucide-react';

export default function FarmDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getFarmById, deleteFarm } = useFarmStore();

  const farm = id ? getFarmById(id) : null;

  if (!farm) {
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
  console.log("FARM : ", farm);
  // Check if user has permission to view this farm
  // userId is a string, not an object
  const canView = user?.role === 'admin' || farm.userId === user?.id;
  const canEdit = user?.role === 'admin' || farm.userId === user?.id;
  console.log("CAN EDIT : ", canEdit, "CAN View: ", canView) 
  if (!canView) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-6">You don't have permission to view this farm.</p>
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

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete "${farm.name}"? This action cannot be undone.`)) {
      deleteFarm(farm.id);
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link
                to="/dashboard"
                className="mr-4 p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{farm.name}</h1>
                <p className="text-sm text-gray-600">Farm Details</p>
              </div>
            </div>
            {canEdit && (
              <div className="flex items-center space-x-3">
                <Link
                  to={`/farm/${id}/edit`}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Farm
                </Link>
                <button
                  onClick={handleDelete}
                  className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Farm Information */}
            <div className="lg:col-span-2">
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Farm Information</h3>
                </div>
                <div className="px-6 py-4">
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Farm Name</dt>
                      <dd className="mt-1 text-sm text-gray-900">{farm.name}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Crop Type</dt>
                      <dd className="mt-1 flex items-center text-sm text-gray-900">
                        <Sprout className="h-4 w-4 mr-2 text-green-500" />
                        {farm.crop}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Total Area</dt>
                      <dd className="mt-1 flex items-center text-sm text-gray-900">
                        <MapPin className="h-4 w-4 mr-2 text-blue-500" />
                        {farm.area} hectares
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Boundary Points</dt>
                      <dd className="mt-1 text-sm text-gray-900">{farm.coordinates.length} points</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Planting Date</dt>
                      <dd className="mt-1 flex items-center text-sm text-gray-900">
                        <Calendar className="h-4 w-4 mr-2 text-green-500" />
                        {new Date(farm.plantingDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Expected Harvest</dt>
                      <dd className="mt-1 flex items-center text-sm text-gray-900">
                        <Calendar className="h-4 w-4 mr-2 text-orange-500" />
                        {new Date(farm.harvestDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </dd>
                    </div>
                    {farm.description && (
                      <div className="sm:col-span-2">
                        <dt className="text-sm font-medium text-gray-500">Description</dt>
                        <dd className="mt-1 text-sm text-gray-900">{farm.description}</dd>
                      </div>
                    )}
                  </dl>
                </div>
              </div>

              {/* Farm Map View */}
              <div className="mt-6 bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Farm Location & Boundary</h3>
                </div>
                <div className="p-6">
                  <FarmMapView
                    coordinates={farm.coordinates}
                    farmName={farm.name}
                    height="400px"
                    className="w-full"
                  />
                </div>
              </div>

              {/* Coordinates Information */}
              <div className="mt-6 bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Boundary Coordinates</h3>
                </div>
                <div className="px-6 py-4">
                  <div className="max-h-60 overflow-y-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Point
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Longitude
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Latitude
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {/* coordinates is number[][], not { coordinates: ... } */}
                        {Array.isArray(farm.coordinates) && Array.isArray(farm.coordinates[0]) && farm.coordinates[0].map((coord, index) => (
                          Array.isArray(coord) ? (
                            <tr key={index}>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                {index + 1}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                {typeof coord[0] === 'number' ? coord[0].toFixed(6) : ''}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                {typeof coord[1] === 'number' ? coord[1].toFixed(6) : ''}
                              </td>
                            </tr>
                          ) : null
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              {/* Farm Status */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Farm Status</h3>
                </div>
                <div className="px-6 py-4">
                  <div className="space-y-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Current Status</dt>
                      <dd className="mt-1">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Active
                        </span>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Days to Harvest</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {(() => {
                          const daysToHarvest = Math.ceil((new Date(farm.harvestDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                          if (daysToHarvest < 0) {
                            return `Harvested ${Math.abs(daysToHarvest)} days ago`;
                          } else if (daysToHarvest === 0) {
                            return 'Harvest today!';
                          } else {
                            return `${daysToHarvest} days`;
                          }
                        })()}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Growing Period</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {Math.ceil((new Date(farm.harvestDate).getTime() - new Date(farm.plantingDate).getTime()) / (1000 * 60 * 60 * 24))} days
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Created</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {new Date(farm.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {new Date(farm.updatedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </dd>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="mt-6 bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
                </div>
                <div className="px-6 py-4">
                  <div className="space-y-3">
                    <button 
                      onClick={() => {
                        const mapElement = document.querySelector('.leaflet-container');
                        if (mapElement) {
                          mapElement.scrollIntoView({ behavior: 'smooth' });
                        }
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md border border-gray-200 flex items-center"
                    >
                      <Map className="h-4 w-4 mr-2" />
                      View on Map
                    </button>
                    <button 
                      onClick={() => {
                        const reportData = {
                          farmName: farm.name,
                          crop: farm.crop,
                          area: farm.area,
                          plantingDate: farm.plantingDate,
                          harvestDate: farm.harvestDate,
                          coordinates: farm.coordinates,
                          createdAt: farm.createdAt
                        };
                        console.log('Generating report for:', reportData);
                        alert('Report generation feature coming soon!');
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md border border-gray-200 flex items-center"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Generate Report
                    </button>
                    <button 
                      onClick={() => {
                        const farmData = {
                          id: farm.id,
                          name: farm.name,
                          crop: farm.crop,
                          area: farm.area,
                          plantingDate: farm.plantingDate,
                          harvestDate: farm.harvestDate,
                          description: farm.description,
                          coordinates: farm.coordinates,
                          createdAt: farm.createdAt,
                          updatedAt: farm.updatedAt
                        };
                        
                        const dataStr = JSON.stringify(farmData, null, 2);
                        const dataBlob = new Blob([dataStr], { type: 'application/json' });
                        const url = URL.createObjectURL(dataBlob);
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = `${farm.name.replace(/\s+/g, '_')}_farm_data.json`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        URL.revokeObjectURL(url);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md border border-gray-200 flex items-center"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export Data
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