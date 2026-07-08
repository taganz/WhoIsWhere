import { supabase } from './supabaseClient.js';
import { RATE_LIMIT_MS, LOCALSTORAGE_KEYS } from './config.js';

export function getUltimoPersonajeId() {
  const raw = localStorage.getItem(LOCALSTORAGE_KEYS.ultimoPersonajeId);
  return raw ? Number(raw) : null;
}

export function setUltimoPersonajeId(id) {
  localStorage.setItem(LOCALSTORAGE_KEYS.ultimoPersonajeId, String(id));
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
// alias: string o vacío. honeypot: valor del campo oculto (debe llegar vacío).
export async function saveGame(state, alias, honeypot) {
  if (honeypot) {
    // Relleno solo por bots: se descarta el guardado silenciosamente.
    return { saved: false, reason: 'honeypot' };
  }
  if (!puedeGuardar()) {
    return { saved: false, reason: 'rate-limit' };
  }

  const { data: partida, error } = await supabase
    .from('partidas')
    .insert({
      alias: alias && alias.trim() ? alias.trim() : null,
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
