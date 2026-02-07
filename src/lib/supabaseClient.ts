
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bjwdcffudfpxuepmznch.supabase.co';
const supabaseKey = 'sb_publishable_-BWH1pHQVdrXzJ3Ht-qZXg_nkZXNC6e'; 

export const supabase = createClient(supabaseUrl, supabaseKey);
