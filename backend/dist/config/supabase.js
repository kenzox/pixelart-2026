"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supabase_js_1 = require("@supabase/supabase-js");
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Ortam değişkenlerini üst dizinden yükle (config/ dosyası backend kök dizininin altında olduğu için)
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../.env') });
// Veya kök dizinden çalışıyorsa sadece dotenv.config(); yeterlidir
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;
if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase URL or Key is missing in .env file');
}
// String değerlerin geçirildiğinden emin ol veya kritikse hata fırlat
const supabase = (0, supabase_js_1.createClient)(supabaseUrl || '', supabaseKey || '');
exports.default = supabase;
