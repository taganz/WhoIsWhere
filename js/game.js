// Lógica pura de turnos: no toca el DOM ni Leaflet.
// personaje esperado: { id, nombre, nombres_alternativos, hechos }
// hechos: array de 4 elementos ordenados por `orden`, cada uno
// { ciudad: { nombre, lat, lon }, anio, actividad }

import { MAX_TURNOS, PUNTOS_POR_TURNO } from './config.js';
import { isNameMatch } from './matching.js';

export function createGameState(personaje) {
  return {
    personaje,
    turno: 1,
    puntos: 0,
    acertado: false,
    terminada: false,
    intentosFallidos: [],
    respuestas: [],
  };
}

// Ciudades visibles en el turno actual. A partir del turno 2 se muestra el
// año de todas las ciudades ya reveladas (incluida la del turno 1).
export function ciudadesReveladas(state) {
  const conAnio = state.turno >= 2;
  return state.personaje.hechos.slice(0, state.turno).map((h) => ({
    ciudad: h.ciudad,
    anio: conAnio ? h.anio : null,
  }));
}

export function puntosEnJuego(state) {
  return PUNTOS_POR_TURNO[state.turno - 1];
}

export function submitGuess(state, texto) {
  if (state.terminada) return state;

  const acertada = isNameMatch(texto, state.personaje);
  const respuestas = [...state.respuestas, { turno: state.turno, respuesta_texto: texto.trim(), acertada }];

  if (acertada) {
    return {
      ...state,
      acertado: true,
      terminada: true,
      puntos: PUNTOS_POR_TURNO[state.turno - 1],
      respuestas,
    };
  }

  const intentosFallidos = [...state.intentosFallidos, texto.trim()];

  if (state.turno >= MAX_TURNOS) {
    return { ...state, terminada: true, acertado: false, puntos: 0, intentosFallidos, respuestas };
  }

  return { ...state, turno: state.turno + 1, intentosFallidos, respuestas };
}

export function pasarTurno(state) {
  if (state.terminada) return state;

  const respuestas = [...state.respuestas, { turno: state.turno, respuesta_texto: null, acertada: false }];

  if (state.turno >= MAX_TURNOS) {
    return { ...state, terminada: true, acertado: false, puntos: 0, respuestas };
  }

  return { ...state, turno: state.turno + 1, respuestas };
}

// Actividades junto a cada ciudad revelada, para la pantalla final cuando se
// agotan los turnos sin acertar.
export function actividadesFinales(state) {
  return state.personaje.hechos.slice(0, state.turno).map((h) => ({
    ciudad: h.ciudad,
    anio: h.anio,
    actividad: h.actividad,
  }));
}
