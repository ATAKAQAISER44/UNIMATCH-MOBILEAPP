// src/services/supabase.js
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jacffialyatqzvdxowjn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImphY2ZmaWFseWF0cXp2ZHhvd2puIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4NjE5NjcsImV4cCI6MjA4ODQzNzk2N30.M53Dd-nEpjiDtlKTlLcGxoxTkVwRG9bhSGD4gzHkuGY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
