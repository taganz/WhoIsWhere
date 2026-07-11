// Public client configuration. Supabase's anon key is designed to be
// public: the real security comes from RLS (see sql/schema.sql), not
// from this key being secret.
export const SUPABASE_URL = 'https://zbzrxqvcbfmpaoqsodvu.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_Xbl-a5ppfM7dYzk5e9i6Aw_SEpsCnad';

// points decrease per turn, and each revealed hint is penalized
export const MAX_TURNOS = 4;
export const PUNTOS_POR_TURNO = [100, 90,80, 70]; // index 0 = turn 1
export const PENALIZACION_PISTA_AÑO = 10; // points subtracted by the first hint per city
export const PENALIZACION_PISTA_ACTIVIDAD = 10; // points subtracted by the second hint per city


export const RATE_LIMIT_MS = 10_000;
export const LOCALSTORAGE_KEYS = {
  ultimoPersonajeId: 'adivina.ultimoPersonajeId',
  ultimoGuardadoTs: 'adivina.ultimoGuardadoTs',
  alias: 'adivina.alias',
};
