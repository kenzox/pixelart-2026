import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Ortam değişkenlerini üst dizinden yükle (config/ dosyası backend kök dizininin altında olduğu için)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
// Veya kök dizinden çalışıyorsa sadece dotenv.config(); yeterlidir

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase URL or Key is missing in .env file');
}

// String değerlerin geçirildiğinden emin ol veya kritikse hata fırlat
const supabase = createClient(supabaseUrl || '', supabaseKey || '');

export default supabase;
