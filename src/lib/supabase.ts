import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDUxOTI4MDAsImV4cCI6MTk2MDc2ODgwMH0.placeholder';

// Verifica se as credenciais são placeholders
export const isSupabaseConfigured = 
  supabaseUrl !== 'https://placeholder.supabase.co' && 
  !supabaseAnonKey.includes('placeholder');

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const signUp = async (email: string, password: string, fullName: string) => {
  if (!isSupabaseConfigured) {
    return { 
      data: null, 
      error: new Error('Supabase não configurado. Por favor, configure suas credenciais no arquivo .env') 
    };
  }
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });
  return { data, error };
};

export const signIn = async (email: string, password: string) => {
  if (!isSupabaseConfigured) {
    return { 
      data: null, 
      error: new Error('Supabase não configurado. Por favor, configure suas credenciais no arquivo .env') 
    };
  }
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getCurrentUser = async () => {
  if (!isSupabaseConfigured) {
    return null;
  }
  
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};