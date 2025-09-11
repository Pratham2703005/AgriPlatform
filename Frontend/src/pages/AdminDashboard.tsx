import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useFarmStore } from '../stores/farmStore';
import { LogOut, Users, MapPin, Sprout, BarChart3, Settings, Plus } from 'lucide-react';

export default function AdminDashboard() {
    const { user, logout } = useAuth();
    const { farms, loading, error, fetchFarms, clearError } = useFarmStore();

    // Fetch farms when component mounts
    useEffect(() => {
        if (user) {
            fetchFarms();
        }
    }, [user, fetchFarms]);

    // Clear any errors when component unmounts
    useEffect(() => {
        return () => {
            clearError();
        };
    }, [clearError]);

    const handleLogout = () => {
        logout();
    };

    const totalFarms = farms.length;
    const totalArea = farms.reduce((sum, farm) => sum + farm.area, 0);
    const activeCrops = new Set(farms.map(farm => farm.crop)).size;
        const myFarms = farms.filter(f =>
            f.userId === user?.id ||
            (f.userId && typeof f.userId === 'object' && '_id' in f.userId && (f.userId as any)._id === user?.id)
        );

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center space-y-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                    <p className="text-sm text-gray-600">Loading admin dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                            <p className="text-sm text-gray-600">System Overview - Welcome, {user?.fullName}</p>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                                <Settings className="h-4 w-4 mr-2" />
                                Settings
                            </button>
                            <button
                                onClick={handleLogout}
                                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                            >
                                <LogOut className="h-4 w-4 mr-2" />
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    {/* Error State */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
                            <div className="flex">
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-red-800">
                                        Error loading admin data
                                    </h3>
                                    <div className="mt-2 text-sm text-red-700">
                                        <p>{error}</p>
                                    </div>
                                    <div className="mt-4">
                                        <button
                                            onClick={() => fetchFarms()}
                                            className="bg-red-100 px-3 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-red-200"
                                        >
                                            Try Again
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* System Stats Grid */}
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <Users className="h-6 w-6 text-blue-400" />
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">
                                                Total Users
                                            </dt>
                                            <dd className="text-lg font-medium text-gray-900">Coming Soon</dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <MapPin className="h-6 w-6 text-green-400" />
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">
                                                Total Farms
                                            </dt>
                                            <dd className="text-lg font-medium text-gray-900">{totalFarms}</dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <BarChart3 className="h-6 w-6 text-purple-400" />
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">
                                                Total Area
                                            </dt>
                                            <dd className="text-lg font-medium text-gray-900">{totalArea.toFixed(1)} hectares</dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <Sprout className="h-6 w-6 text-green-500" />
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">
                                                Crop Types
                                            </dt>
                                            <dd className="text-lg font-medium text-gray-900">{activeCrops}</dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Users Management - Coming Soon */}
                    <div className="mt-8">
                        <div className="bg-white shadow rounded-lg">
                            <div className="px-4 py-5 sm:p-6">
                                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                                    User Management
                                </h3>
                                <div className="text-center py-8 bg-gray-50 rounded-lg">
                                    <Users className="mx-auto h-12 w-12 text-gray-400" />
                                    <h3 className="mt-2 text-sm font-medium text-gray-900">User Management Coming Soon</h3>
                                    <p className="mt-1 text-sm text-gray-500">
                                        User management features will be available in a future update.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Admin's Own Farms */}
                    <div className="mt-8">
                        <div className="bg-white shadow rounded-lg">
                            <div className="px-4 py-5 sm:p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                                        My Farms ({myFarms.length})
                                    </h3>
                                    <Link
                                        to="/create-farm"
                                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Create Farm
                                    </Link>
                                </div>
                                {myFarms.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {myFarms.map((farm) => (
                                            <div key={farm.id} className="border-2 border-blue-200 bg-blue-50 rounded-lg p-4 hover:shadow-md transition-shadow">
                                                <div className="flex justify-between items-start mb-3">
                                                    <h4 className="text-md font-medium text-gray-900">{farm.name}</h4>
                                                    <div className="flex flex-col items-end space-y-1">
                                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                            {farm.crop}
                                                        </span>
                                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                            Admin
                                                        </span>
                                                    </div>
                                                </div>
                                                
                                                <div className="space-y-2 text-sm text-gray-600">
                                                    <div className="flex justify-between">
                                                        <span>Area:</span>
                                                        <span className="font-medium">{farm.area} hectares</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>Planting:</span>
                                                        <span className="font-medium">
                                                            {new Date(farm.plantingDate).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>Harvest:</span>
                                                        <span className="font-medium">
                                                            {new Date(farm.harvestDate).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </div>

                                                {farm.description && (
                                                    <p className="mt-2 text-xs text-gray-500 line-clamp-2">
                                                        {farm.description}
                                                    </p>
                                                )}

                                                <div className="mt-3 flex justify-between items-center text-xs">
                                                    <span className="text-gray-400">Created {new Date(farm.createdAt).toLocaleDateString()}</span>
                                                    <Link 
                                                        to={`/farm/${farm.id}`}
                                                        className="text-green-600 hover:text-green-700 font-medium"
                                                    >
                                                        View Details →
                                                    </Link>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-6 bg-gray-50 rounded-lg">
                                        <MapPin className="mx-auto h-8 w-8 text-gray-400" />
                                        <h3 className="mt-2 text-sm font-medium text-gray-900">No personal farms yet</h3>
                                        <p className="mt-1 text-sm text-gray-500">
                                            Create your first farm as an admin.
                                        </p>
                                        <div className="mt-4">
                                            <Link
                                                to="/create-farm"
                                                className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                                            >
                                                <Plus className="h-4 w-4 mr-2" />
                                                Create Farm
                                            </Link>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* All System Farms */}
                    <div className="mt-8">
                        <div className="bg-white shadow rounded-lg">
                            <div className="px-4 py-5 sm:p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                                        All System Farms ({farms.length} total)
                                    </h3>
                                </div>
                                {farms.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {farms.map((farm) => (
                                            <div key={farm.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                                <div className="flex justify-between items-start mb-3">
                                                    <h4 className="text-md font-medium text-gray-900">{farm.name}</h4>
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        {farm.crop}
                                                    </span>
                                                </div>
                                                
                                                <div className="space-y-2 text-sm text-gray-600">
                                                    <div className="flex justify-between">
                                                        <span>Owner:</span>
                                                        <span className="font-medium text-blue-600">
                                                            {farm.userId === user?.id ? 'You' : 'User'}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>Area:</span>
                                                        <span className="font-medium">{farm.area} hectares</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>Planting:</span>
                                                        <span className="font-medium">
                                                            {new Date(farm.plantingDate).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>Harvest:</span>
                                                        <span className="font-medium">
                                                            {new Date(farm.harvestDate).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </div>

                                                {farm.description && (
                                                    <p className="mt-2 text-xs text-gray-500 line-clamp-2">
                                                        {farm.description}
                                                    </p>
                                                )}

                                                <div className="mt-3 flex justify-between items-center text-xs">
                                                    <span className="text-gray-400">Created {new Date(farm.createdAt).toLocaleDateString()}</span>
                                                    <Link 
                                                        to={`/farm/${farm.id}`}
                                                        className="text-green-600 hover:text-green-700 font-medium"
                                                    >
                                                        View Details →
                                                    </Link>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <MapPin className="mx-auto h-12 w-12 text-gray-400" />
                                        <h3 className="mt-2 text-sm font-medium text-gray-900">No farms in system yet</h3>
                                        <p className="mt-1 text-sm text-gray-500">
                                            No users have created farms yet.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}                           