// Lógica pura de turnos: no toca el DOM ni Leaflet.
// personaje esperado: { id, nombre, nombres_alternativos, hechos }
// hechos: array de 4 elementos ordenados por `orden`, cada uno
// { ciudad: { nombre, lat, lon }, anio, actividad }

import { MAX_TURNOS, PUNTOS_POR_TURNO, PENALIZACION_PISTA } from './config.js';
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
    pistasUsadas: {},
    penalizacionPistas: 0,
  };
}

// Ciudades (con su hecho completo) visibles en el turno actual. El año y el
// hecho de cada una solo se revelan al hacer clic en el marcador del mapa.
export function ciudadesReveladas(state) {
  return state.personaje.hechos.slice(0, state.turno);
}

// Nivel de pista revelado para una ciudad: 0 = solo nombre, 1 = + año, 2 = + hecho.
export function nivelPista(state, indiceCiudad) {
  return state.pistasUsadas[indiceCiudad] || 0;
}

// Cada clic sobre una ciudad sube su nivel de pista un escalón (hasta 2). Las
// dos primeras veces penaliza los puntos en juego; a partir de la tercera, no.
export function revelarPista(state, indiceCiudad) {
  if (state.terminada) return state;

  const nivelActual = nivelPista(state, indiceCiudad);
  if (nivelActual >= 2) return state;

  return {
    ...state,
    pistasUsadas: { ...state.pistasUsadas, [indiceCiudad]: nivelActual + 1 },
    penalizacionPistas: state.penalizacionPistas + PENALIZACION_PISTA,
  };
}

export function puntosEnJuego(state) {
  return Math.max(0, PUNTOS_POR_TURNO[state.turno - 1] - state.penalizacionPistas);
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
      puntos: puntosEnJuego(state),
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
  return ciudadesReveladas(state);
}
