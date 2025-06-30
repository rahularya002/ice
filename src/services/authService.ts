import { supabase, supabaseAdmin, handleSupabaseError, handleSupabaseSuccess } from '../lib/supabase';
import { User } from '../types';

export const authService = {
  // Sign in with email and password
  async signIn(email: string, password: string) {
    console.log('🔐 Starting sign in process for:', email);
    
    try {
      console.log('📡 Attempting authentication...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ Authentication failed:', error.message);
        return handleSupabaseError(error);
      }

      if (!data.user) {
        console.error('❌ No user data returned');
        return handleSupabaseError(new Error('Authentication failed'));
      }

      console.log('✅ Authentication successful, user ID:', data.user.id);
      
      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError) {
        console.error('❌ Failed to fetch user profile:', profileError.message);
        return handleSupabaseError(profileError);
      }

      console.log('✅ User profile fetched successfully');
      
      return handleSupabaseSuccess({
        user: {
          id: profile.id,
          email: profile.email,
          name: profile.name,
          role: profile.role,
          designation: profile.designation,
          departmentId: profile.department_id,
          createdAt: new Date(profile.created_at)
        },
        session: data.session
      });
    } catch (error) {
      console.error('❌ Unexpected error during sign in:', error);
      return handleSupabaseError(error);
    }
  },

  // Sign out
  async signOut() {
    console.log('🚪 Starting sign out process...');
    
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('❌ Sign out failed:', error.message);
        return handleSupabaseError(error);
      }

      console.log('✅ Sign out successful');
      return handleSupabaseSuccess(null);
    } catch (error) {
      console.error('❌ Unexpected error during sign out:', error);
      return handleSupabaseError(error);
    }
  },

  // Get current session
  async getCurrentSession() {
    console.log('🔍 Checking current session...');
    
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('❌ Session check failed:', error.message);
        return handleSupabaseError(error);
      }

      if (!session) {
        console.log('ℹ️ No active session found');
        return handleSupabaseSuccess(null);
      }

      console.log('✅ Active session found, fetching profile...');
      
      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profileError) {
        console.error('❌ Failed to fetch user profile:', profileError.message);
        return handleSupabaseError(profileError);
      }

      console.log('✅ User profile fetched successfully');
      
      return handleSupabaseSuccess({
        user: {
          id: profile.id,
          email: profile.email,
          name: profile.name,
          role: profile.role,
          designation: profile.designation,
          departmentId: profile.department_id,
          createdAt: new Date(profile.created_at)
        },
        session
      });
    } catch (error) {
      console.error('❌ Session check failed:', error);
      return handleSupabaseError(error);
    }
  },

  // Create user using admin API (bypasses email confirmation completely)
  async createUser(userData: {
    email: string;
    password: string;
    name: string;
    role: User['role'];
    designation?: string;
    departmentId?: string;
  }) {
    console.log('👤 Creating user for:', userData.email);
    
    if (!supabaseAdmin) {
      console.error('❌ Admin client not available - service role key missing');
      return handleSupabaseError(new Error('Admin operations not available'));
    }
    
    try {
      // Use admin API to create user with email confirmed automatically
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true, // This bypasses email confirmation completely
        user_metadata: {
          name: userData.name,
          role: userData.role,
          designation: userData.designation,
          department_id: userData.departmentId
        }
      });

      if (authError) {
        console.error('❌ Failed to create auth user:', authError.message);
        return handleSupabaseError(authError);
      }

      if (!authData.user) {
        console.error('❌ No user data returned from auth creation');
        return handleSupabaseError(new Error('Failed to create user'));
      }

      console.log('✅ Auth user created with admin API, creating profile...');

      // Create user profile using admin client
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: userData.email,
          name: userData.name,
          role: userData.role,
          designation: userData.designation || null,
          department_id: userData.departmentId || null,
        })
        .select()
        .single();

      if (profileError) {
        console.error('❌ Failed to create user profile:', profileError.message);
        return handleSupabaseError(profileError);
      }

      console.log('✅ User profile created successfully');

      return handleSupabaseSuccess({
        user: {
          id: profile.id,
          email: profile.email,
          name: profile.name,
          role: profile.role,
          designation: profile.designation,
          departmentId: profile.department_id,
          createdAt: new Date(profile.created_at)
        }
      });
    } catch (error) {
      console.error('❌ Unexpected error creating user:', error);
      return handleSupabaseError(error);
    }
  },

  // Create initial admin user (for setup)
  async createInitialAdmin() {
    console.log('🔧 Creating initial admin user...');
    
    try {
      // Check if admin already exists
      const { data: existingAdmin } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'admin')
        .limit(1);

      if (existingAdmin && existingAdmin.length > 0) {
        console.log('ℹ️ Admin user already exists');
        return handleSupabaseError(new Error('Admin user already exists'));
      }

      const adminData = {
        email: 'admin@ice.org.in',
        password: 'admin123',
        name: 'System Administrator',
        role: 'admin' as User['role']
      };

      console.log('📋 Admin user data:', { ...adminData, password: '[HIDDEN]' });

      return await this.createUser(adminData);
    } catch (error) {
      console.error('❌ Unexpected error creating initial admin:', error);
      return handleSupabaseError(error);
    }
  }
};