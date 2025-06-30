import React from 'react';

const LoadingSpinner: React.FC = () => {
  console.log('⏳ LoadingSpinner component rendered');
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 flex items-center justify-center">
      <div className="text-center">
        <div className="mx-auto h-16 w-16 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg animate-pulse">
          <span className="text-white font-bold text-xl">ICE</span>
        </div>
        <div className="w-8 h-8 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600 font-medium">Loading ICE Portal...</p>
        <p className="text-sm text-gray-500 mt-2">Connecting to secure database</p>
        
        {/* Debug info */}
        <div className="mt-6 p-4 bg-white rounded-lg shadow-sm border border-gray-200 text-left max-w-md">
          <p className="text-xs font-medium text-gray-700 mb-2">Debug Information:</p>
          <div className="text-xs text-gray-600 space-y-1">
            <p>Environment: {import.meta.env.MODE}</p>
            <p>Supabase URL: {import.meta.env.VITE_SUPABASE_URL ? '✅ Configured' : '❌ Missing'}</p>
            <p>Anon Key: {import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Configured' : '❌ Missing'}</p>
            <p>Service Key: {import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY ? '✅ Configured' : '❌ Missing'}</p>
            <p className="mt-2 text-blue-600">Check browser console for detailed logs</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner;