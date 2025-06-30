import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthContextType } from '../types';
import { authService } from '../services/authService';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🚀 AuthProvider: Initializing...');
    
    let mounted = true;
    
    // Set maximum timeout for auth initialization
    const maxTimeout = setTimeout(() => {
      if (mounted) {
        console.log('⏰ Auth initialization timed out, setting loading to false');
        setLoading(false);
      }
    }, 5000); // 5 second maximum timeout

    // Get initial session
    const getInitialSession = async () => {
      console.log('🔍 AuthProvider: Getting initial session...');
      
      try {
        const result = await authService.getCurrentSession();
        console.log('📋 AuthProvider: Session result:', result);
        
        if (!mounted) return;
        
        if (result.success && result.data) {
          const userData = result.data.user;
          console.log('👤 AuthProvider: Setting user from session:', userData);
          
          const mappedUser: User = {
            id: userData.id,
            email: userData.email,
            name: userData.name,
            role: userData.role,
            designation: userData.designation,
            departmentId: userData.departmentId,
            createdAt: userData.createdAt
          };
          
          setUser(mappedUser);
          console.log('✅ AuthProvider: User set successfully');
        } else {
          console.log('ℹ️ AuthProvider: No active session found');
          setUser(null);
        }
      } catch (error) {
        console.error('❌ AuthProvider: Error getting initial session:', error);
        if (mounted) {
          setUser(null);
        }
      } finally {
        if (mounted) {
          console.log('🏁 AuthProvider: Initial session check complete, setting loading to false');
          clearTimeout(maxTimeout);
          setLoading(false);
        }
      }
    };

    getInitialSession();

    return () => {
      console.log('🧹 AuthProvider: Cleaning up');
      mounted = false;
      clearTimeout(maxTimeout);
    };
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    console.log('🔐 AuthProvider: Login attempt for:', email);
    
    try {
      const result = await authService.signIn(email, password);
      if (result.success) {
        console.log('✅ AuthProvider: Login successful');
        const userData = result.data.user;
        
        const mappedUser: User = {
          id: userData.id,
          email: userData.email,
          name: userData.name,
          role: userData.role,
          designation: userData.designation,
          departmentId: userData.departmentId,
          createdAt: userData.createdAt
        };
        
        setUser(mappedUser);
        return true;
      }
      console.error('❌ AuthProvider: Login failed:', result.error);
      return false;
    } catch (error) {
      console.error('❌ AuthProvider: Login error:', error);
      return false;
    }
  };

  const logout = async () => {
    console.log('🚪 AuthProvider: Logout attempt');
    
    try {
      await authService.signOut();
      setUser(null);
      console.log('✅ AuthProvider: Logout successful');
    } catch (error) {
      console.error('❌ AuthProvider: Logout error:', error);
    }
  };

  const register = async (userData: Omit<User, 'id' | 'createdAt'> & { password: string }): Promise<boolean> => {
    console.log('👤 AuthProvider: Register attempt for:', userData.email);
    
    try {
      const result = await authService.createUser({
        email: userData.email,
        password: userData.password,
        name: userData.name,
        role: userData.role,
        designation: userData.designation,
        departmentId: userData.departmentId
      });
      
      console.log('📋 AuthProvider: Register result:', result.success ? 'Success' : 'Failed');
      return result.success;
    } catch (error) {
      console.error('❌ AuthProvider: Register error:', error);
      return false;
    }
  };

  console.log('📊 AuthProvider: Current state - Loading:', loading, 'User:', user?.email || 'None');

  const value: AuthContextType = {
    user,
    login,
    logout,
    register,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};