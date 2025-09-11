import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { AuthAPI, type User } from '../services/authApi';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, name: string, phone: string, address: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored user session and verify token
    const initAuth = async () => {
      console.log('🔍 Initializing authentication...');
      
      try {
        const isAuth = AuthAPI.isAuthenticated();
        console.log('🔑 Is authenticated:', isAuth);
        
        if (isAuth) {
          const currentUser = AuthAPI.getCurrentUser();
          console.log('👤 Current user from storage:', currentUser);
          
          if (currentUser) {
            setUser(currentUser);
            console.log('✅ User set in context:', currentUser);
            
            // Optionally verify token with backend
            try {
              await AuthAPI.verifyToken();
              console.log('✅ Token verified successfully');
            } catch (error) {
              console.error('❌ Token verification failed:', error);
              // Clear invalid session
              AuthAPI.logout();
              setUser(null);
            }
          } else {
            console.log('❌ No current user found in storage');
          }
        } else {
          console.log('❌ User is not authenticated');
        }
      } catch (error) {
        console.error('❌ Error during auth initialization:', error);
      } finally {
        setIsLoading(false);
        console.log('🏁 Auth initialization complete');
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log('🔐 Attempting login for:', email);
      const response = await AuthAPI.login({ email, password });
      console.log('📥 Login response:', response);
      
      if (response.code === 1 && response.result?.user) {
        setUser(response.result.user);
        console.log('✅ Login successful, user set:', response.result.user);
        return { success: true };
      } else {
        console.log('❌ Login failed:', response.message);
        return { success: false, error: response.message || 'Invalid email or password' };
      }
    } catch (error: any) {
      console.error('❌ Login error:', error);
      return { 
        success: false, 
        error: error.message || 'Login failed. Please try again.' 
      };
    }
  };

  const register = async (email: string, password: string, name: string, phone: string, address: string) => {
    try {
      console.log('📝 Attempting registration for:', email);
      const response = await AuthAPI.register({
        fullName: name,
        email,
        password,
        phone,
        address
      });
      console.log('📥 Registration response:', response);

      if (response.code === 1 && response.result?.user) {
        setUser(response.result.user);
        console.log('✅ Registration successful, user set:', response.result.user);
        return { success: true };
      } else {
        console.log('❌ Registration failed:', response.message);
        return { success: false, error: response.message || 'Registration failed' };
      }
    } catch (error: any) {
      console.error('❌ Registration error:', error);
      return { 
        success: false, 
        error: error.message || 'Registration failed. Please try again.' 
      };
    }
  };

  const logout = async () => {
    try {
      console.log('🚪 Logging out...');
      await AuthAPI.logout();
      console.log('✅ Logout successful');
    } catch (error) {
      console.error('❌ Logout error:', error);
    } finally {
      setUser(null);
      console.log('👤 User cleared from context');
      // Redirect to login page after logout
      window.location.href = '/login';
    }
  };

  // Debug current auth state
  console.log('🔍 Current auth state:', {
    user: user,
    isAuthenticated: !!user,
    isLoading: isLoading
  });

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Enhanced Protected Route Component with debugging
interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'admin' | 'user';
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();

  // Debug logs
  console.log('🛡️ ProtectedRoute check:', {
    isLoading,
    isAuthenticated,
    user,
    requiredRole,
    currentPath: window.location.pathname
  });

  if (isLoading) {
    console.log('⏳ Auth is loading, showing spinner...');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          <p className="text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('❌ User not authenticated, showing access denied...');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Access Denied</h2>
            <p className="text-gray-600 mb-4">Please log in to access this page.</p>
            <div className="mb-4 p-3 bg-gray-100 rounded text-sm text-left">
              <strong>Debug Info:</strong><br/>
              isLoading: {isLoading.toString()}<br/>
              isAuthenticated: {isAuthenticated.toString()}<br/>
              user: {user ? 'exists' : 'null'}<br/>
              token exists: {localStorage.getItem('token') ? 'yes' : 'no'}
            </div>
            <button
              onClick={() => window.location.href = '/login'}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (requiredRole && user?.role !== requiredRole) {
    console.log('❌ User role mismatch:', user?.role, 'required:', requiredRole);
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Access Denied</h2>
            <p className="text-gray-600 mb-4">
              You don't have permission to access this page. Required role: {requiredRole}
            </p>
            <button
              onClick={() => window.history.back()}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  console.log('✅ Access granted, rendering protected content');
  return <>{children}</>;
}