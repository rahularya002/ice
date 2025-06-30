import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';
import { LogIn, Eye, EyeOff, Shield, AlertCircle, UserPlus } from 'lucide-react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { login } = useAuth();

  console.log('🔐 Login component rendered');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('📝 Login form submitted for:', email);
    
    setIsLoading(true);
    setError('');

    const success = await login(email, password);
    if (!success) {
      console.error('❌ Login failed in component');
      setError('Invalid email or password. Please check your credentials and try again.');
    } else {
      console.log('✅ Login successful in component');
    }
    
    setIsLoading(false);
  };

  const handleCreateAdmin = async () => {
    console.log('🔧 Creating admin user...');
    
    setIsCreatingAdmin(true);
    setError('');
    setSuccess('');

    try {
      const result = await authService.createInitialAdmin();
      console.log('📋 Admin creation result:', result);
      
      if (result.success) {
        console.log('✅ Admin user created successfully');
        setSuccess('Admin user created successfully! You can now login with admin@ice.org.in / admin123');
        setEmail('admin@ice.org.in');
        setPassword('admin123');
      } else {
        console.error('❌ Admin creation failed:', result.error);
        setError(result.error || 'Failed to create admin user');
      }
    } catch (error) {
      console.error('❌ Unexpected error creating admin:', error);
      setError('Failed to create admin user. Please try again.');
    }

    setIsCreatingAdmin(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto h-20 w-20 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
            <span className="text-white font-bold text-2xl">ICE</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to ICE Portal</h1>
          <p className="text-gray-600 mb-1">The Institute of Civil Engineers, India</p>
          <p className="text-sm text-gray-500">Professional Task Management & Collaboration Platform</p>
        </div>

        {/* Debug Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-xs">
          <p className="font-medium text-blue-900 mb-1">Debug Info:</p>
          <p className="text-blue-800">Environment: {import.meta.env.MODE}</p>
          <p className="text-blue-800">Supabase URL: {import.meta.env.VITE_SUPABASE_URL ? '✅ Set' : '❌ Missing'}</p>
          <p className="text-blue-800">Anon Key: {import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}</p>
          <p className="text-blue-800">Service Key: {import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing'}</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 mb-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                  <span className="text-red-700 text-sm">{error}</span>
                </div>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span className="text-green-700 text-sm">{success}</span>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 px-4 rounded-xl font-medium hover:from-amber-600 hover:to-orange-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Signing in...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <LogIn className="h-5 w-5" />
                  <span>Sign In</span>
                </div>
              )}
            </button>
          </form>
        </div>

        {/* Setup Admin Button */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-6">
          <div className="text-center">
            <UserPlus className="h-8 w-8 text-amber-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">First Time Setup</h3>
            <p className="text-sm text-gray-600 mb-4">
              If this is your first time accessing the system, create an admin account to get started.
            </p>
            <button
              onClick={handleCreateAdmin}
              disabled={isCreatingAdmin}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-2 px-4 rounded-xl font-medium hover:from-blue-600 hover:to-purple-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isCreatingAdmin ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Creating Admin...</span>
                </div>
              ) : (
                'Create Admin Account'
              )}
            </button>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
          <div className="text-center">
            <Shield className="h-8 w-8 text-amber-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Secure Access</h3>
            <p className="text-sm text-gray-600 mb-4">
              Access is restricted to authorized ICE members only. Users are added by administrators.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-xs text-amber-800">
                <strong>No Email Verification Required</strong><br />
                Users can login immediately after account creation.<br />
                Contact your administrator for account setup.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-xs text-gray-500">
            © 2024 The Institute of Civil Engineers, India. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;