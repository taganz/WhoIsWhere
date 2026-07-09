// Configuración pública del cliente. La anon key de Supabase está diseñada
// para ser pública: la seguridad real la da RLS (ver sql/schema.sql), no el
// secreto de esta clave.
export const SUPABASE_URL = 'https://zbzrxqvcbfmpaoqsodvu.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_Xbl-a5ppfM7dYzk5e9i6Aw_SEpsCnad';

export const MAX_TURNOS = 4;
export const PUNTOS_POR_TURNO = [100, 85, 70, 55]; // índice 0 = turno 1
export const PENALIZACION_PISTA_AÑO = 10; // puntos que resta la primeras pista por ciudad
export const PENALIZACION_PISTA_ACTIVIDAD = 20; // puntos que resta la segunda pista por ciudad


export const RATE_LIMIT_MS = 10_000;
export const LOCALSTORAGE_KEYS = {
  ultimoPersonajeId: 'adivina.ultimoPersonajeId',
  ultimoGuardadoTs: 'adivina.ultimoGuardadoTs',
  alias: 'adivina.alias',
};
