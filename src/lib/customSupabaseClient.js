import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zgihvphmwzseqhwcdckz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpnaWh2cGhtd3pzZXFod2NkY2t6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1NTI5NjgsImV4cCI6MjA3MDEyODk2OH0.fPz5GHSL4NJn7-r9t4VnVD0CfgmNMLoxmeyxmCum4j8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);