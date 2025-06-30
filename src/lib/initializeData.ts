// This file is no longer needed since we're using Supabase
// All initialization is handled through migrations and the auth service
export const initializeData = async () => {
  console.log('ℹ️ Data initialization is handled by Supabase migrations');
  return Promise.resolve();
};