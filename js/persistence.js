import { supabase } from './supabaseClient.js';
import { RATE_LIMIT_MS, LOCALSTORAGE_KEYS } from './config.js';

export function getUltimoPersonajeId() {
  const raw = localStorage.getItem(LOCALSTORAGE_KEYS.ultimoPersonajeId);
  return raw ? Number(raw) : null;
}

export function setUltimoPersonajeId(id) {
  localStorage.setItem(LOCALSTORAGE_KEYS.ultimoPersonajeId, String(id));
}

function generarAliasAleatorio() {
  const numero = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
  return `anonimo${numero}`;
}

// Alias del jugador en este navegador. Si es la primera vez, se genera uno
// aleatorio ("anonimoNNN") y se guarda en caché para las próximas partidas.
export function getAlias() {
  const guardado = localStorage.getItem(LOCALSTORAGE_KEYS.alias);
  if (guardado) return guardado;

  const alias = generarAliasAleatorio();
  localStorage.setItem(LOCALSTORAGE_KEYS.alias, alias);
  return alias;
}

export function setAlias(alias) {
  localStorage.setItem(LOCALSTORAGE_KEYS.alias, alias);
}

// true si ya se puede guardar (han pasado >= RATE_LIMIT_MS desde el último guardado).
export function puedeGuardar() {
  const ultimo = Number(localStorage.getItem(LOCALSTORAGE_KEYS.ultimoGuardadoTs) || 0);
  return Date.now() - ultimo >= RATE_LIMIT_MS;
}

function marcarGuardado() {
  localStorage.setItem(LOCALSTORAGE_KEYS.ultimoGuardadoTs, String(Date.now()));
}

// state: resultado final de game.js (createGameState procesado).
export async function saveGame(state, alias) {
  if (!puedeGuardar()) {
    return { saved: false, reason: 'rate-limit' };
  }

  const { data: partida, error } = await supabase
    .from('partidas')
    .insert({
      alias,
      personaje_id: state.personaje.id,
      acertado: state.acertado,
      puntos: state.puntos,
      turnos_usados: state.turno,
    })
    .select()
    .single();
  if (error) throw error;

  if (state.respuestas.length > 0) {
    const filas = state.respuestas.map((r) => ({
      partida_id: partida.id,
      turno: r.turno,
      respuesta_texto: r.respuesta_texto,
      acertada: r.acertada,
    }));
    const { error: errorRespuestas } = await supabase.from('respuestas_partida').insert(filas);
    if (errorRespuestas) throw errorRespuestas;
  }

  marcarGuardado();
  return { saved: true, partidaId: partida.id };
}
