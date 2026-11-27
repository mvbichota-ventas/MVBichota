// MV Bichota - Configuración y cliente Supabase compartido.
// La clave publishable/anon es pública por diseño; los permisos se aplican mediante RLS.
window.MV_SUPABASE_URL = "https://iknrxivzhllwsylczppm.supabase.co";
window.MV_SUPABASE_KEY = "sb_publishable_66Yx0LpNA5V547NlM6mcfA_oFydyn6D";

(function () {
  'use strict';
  window.MV_getSupabaseClient = function () {
    if (window.MV_SUPABASE_CLIENT) return window.MV_SUPABASE_CLIENT;
    if (!window.supabase || typeof window.supabase.createClient !== 'function') {
      throw new Error('No está disponible la biblioteca de Supabase.');
    }
    if (!window.MV_SUPABASE_URL || !window.MV_SUPABASE_KEY) {
      throw new Error('Falta la configuración pública de Supabase.');
    }
    window.MV_SUPABASE_CLIENT = window.supabase.createClient(
      window.MV_SUPABASE_URL,
      window.MV_SUPABASE_KEY,
      { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }
    );
    return window.MV_SUPABASE_CLIENT;
  };
})();
