import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Username -> email ya ndani (Supabase Auth inahitaji email, lakini
// watumiaji wetu wanaingia kwa username tu)
export const usernameToEmail = (username) =>
  `${username.trim().toLowerCase()}@loanmanager.internal`;
