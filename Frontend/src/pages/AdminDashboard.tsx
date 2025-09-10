import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { userService, farmService, cropService, type User, type Farm, type Crop } from '../services/fileDatabase';
import { useFarmStore } from '../stores/farmStore';
import { LogOut, Users, MapPin, Sprout, BarChart3, Settings, Plus } from 'lucide-react';

export default function AdminDashboard() {
    const { user, logout } = useAuth();
    const { getAllFarms, clearUserData } = useFarmStore();
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [allCrops, setAllCrops] = useState<Crop[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [showUserModal, setShowUserModal] = useState(false);

    // Get all farms from the new farm store
    const allFarms = getAllFarms();
    
    // Debug logging
    console.log('Admin Dashboard - Current user:', user);
    console.log('Admin Dashboard - All farms count:', allFarms.length);
    console.log('Admin Dashboard - All farms:', allFarms);

    useEffect(() => {
        const loadSystemData = async () => {
            try {
                // Load all users (admin can see all)
                const users = await userService.getAllUsers();
                setAllUsers(users);

                // Farms are now loaded from the farm store
                console.log('Admin Dashboard - All farms loaded:', allFarms.length);
                console.log('Admin Dashboard - Farms data:', allFarms);

                // Load all crops
                const crops = await cropService.getAllCrops();
                setAllCrops(crops);
            } catch (error) {
                console.error('Error loading system data:', error);
            }
            setIsLoading(false);
        };

        loadSystemData();
    }, [allFarms]);

    const handleLogout = () => {
        logout();
    };

    const handleViewUser = (userData: User) => {
        setSelectedUser(userData);
        setShowUserModal(true);
    };

    const handleDeleteUser = async (userData: User) => {
        // Don't allow deleting current user or admin users
        if (userData.id === user?.id) {
            alert("You cannot delete your own account!");
            return;
        }
        
        if (userData.role === 'admin') {
            alert("Admin users cannot be deleted!");
            return;
        }

        if (confirm(`Are you sure you want to delete user "${userData.name}"? This action cannot be undone.`)) {
            try {
                await userService.deleteUser(userData.id);
                // Refresh the users list
                const users = await userService.getAllUsers();
                setAllUsers(users);
                alert("User deleted successfully!");
            } catch (error) {
                console.error('Error deleting user:', error);
                alert("Failed to delete user. Please try again.");
            }
        }
    };

    const canDeleteUser = (userData: User) => {
        return userData.id !== user?.id && userData.role !== 'admin';
    };

    const totalUsers = allUsers.length;
    const totalFarms = allFarms.length;
    const totalArea = allFarms.reduce((sum, farm) => sum + farm.area, 0);
    const activeCrops = new Set(allFarms.map(farm => farm.crop)).size;

    if (isLoading) {
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
                            <p className="text-sm text-gray-600">System Overview - Welcome, {user?.name}</p>
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
                                            <dd className="text-lg font-medium text-gray-900">{totalUsers}</dd>
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

                    {/* Users Management */}
                    <div className="mt-8">
                        <div className="bg-white shadow rounded-lg">
                            <div className="px-4 py-5 sm:p-6">
                                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                                    User Management
                                </h3>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    User
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Role
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Farms
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Joined
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {allUsers.map((userData) => {
                                                const userFarms = allFarms.filter(f => f.userId === userData.id);
                                                return (
                                                    <tr key={userData.id}>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div>
                                                                <div className="text-sm font-medium text-gray-900">{userData.name}</div>
                                                                <div className="text-sm text-gray-500">{userData.email}</div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${userData.role === 'admin'
                                                                ? 'bg-purple-100 text-purple-800'
                                                                : 'bg-green-100 text-green-800'
                                                                }`}>
                                                                {userData.role}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                            {userFarms.length}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {new Date(userData.createdAt).toLocaleDateString()}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                            <button 
                                                                onClick={() => handleViewUser(userData)}
                                                                className="text-indigo-600 hover:text-indigo-900 mr-3"
                                                            >
                                                                View
                                                            </button>
                                                            {canDeleteUser(userData) && (
                                                                <button 
                                                                    onClick={() => handleDeleteUser(userData)}
                                                                    className="text-red-600 hover:text-red-900"
                                                                >
                                                                    Delete
                                                                </button>
                                                            )}
                                                            {!canDeleteUser(userData) && (
                                                                <span className="text-gray-400 cursor-not-allowed">
                                                                    {userData.id === user?.id ? 'Current User' : 'Protected'}
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
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
                                        My Farms ({allFarms.filter(f => f.userId === user?.id).length})
                                    </h3>
                                    <Link
                                        to="/create-farm"
                                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Create Farm
                                    </Link>
                                </div>
                                {allFarms.filter(f => f.userId === user?.id).length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {allFarms.filter(f => f.userId === user?.id).map((farm) => (
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

                    {/* All User Farms Management */}
                    <div className="mt-8">
                        <div className="bg-white shadow rounded-lg">
                            <div className="px-4 py-5 sm:p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                                        All User Farms ({allFarms.filter(f => f.userId !== user?.id).length} total)
                                    </h3>
                                    <div className="text-sm text-gray-500">
                                        Total System Farms: {allFarms.length}
                                    </div>
                                </div>
                                {allFarms.filter(f => f.userId !== user?.id).length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {allFarms.filter(f => f.userId !== user?.id).map((farm) => {
                                            const farmOwner = allUsers.find(u => u.id === farm.userId);
                                            return (
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
                                                                {farmOwner?.name || 'Unknown User'}
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
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <MapPin className="mx-auto h-12 w-12 text-gray-400" />
                                        <h3 className="mt-2 text-sm font-medium text-gray-900">No user farms yet</h3>
                                        <p className="mt-1 text-sm text-gray-500">
                                            Users haven't created any farms yet.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* User Details Modal */}
            {showUserModal && selectedUser && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-medium text-gray-900">User Details</h3>
                                <button
                                    onClick={() => setShowUserModal(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <span className="sr-only">Close</span>
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Name</label>
                                    <p className="mt-1 text-sm text-gray-900">{selectedUser.name}</p>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Email</label>
                                    <p className="mt-1 text-sm text-gray-900">{selectedUser.email}</p>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Role</label>
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                        selectedUser.role === 'admin' 
                                            ? 'bg-purple-100 text-purple-800' 
                                            : 'bg-green-100 text-green-800'
                                    }`}>
                                        {selectedUser.role}
                                    </span>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                                    <p className="mt-1 text-sm text-gray-900">{selectedUser.profile.phone}</p>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Address</label>
                                    <p className="mt-1 text-sm text-gray-900">{selectedUser.profile.address}</p>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Joined</label>
                                    <p className="mt-1 text-sm text-gray-900">
                                        {new Date(selectedUser.createdAt).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </p>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Number of Farms</label>
                                    <p className="mt-1 text-sm text-gray-900">
                                        {allFarms.filter(f => f.userId === selectedUser.id).length}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="mt-6 flex justify-end space-x-3">
                                <button
                                    onClick={() => setShowUserModal(false)}
                                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                                >
                                    Close
                                </button>
                                {canDeleteUser(selectedUser) && (
                                    <button
                                        onClick={() => {
                                            setShowUserModal(false);
                                            handleDeleteUser(selectedUser);
                                        }}
                                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                                    >
                                        Delete User
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}