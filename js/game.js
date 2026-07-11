// Lógica pura de turnos: no toca el DOM ni Leaflet.
// personaje esperado: { id, nombre, nombres_alternativos, hechos }
// hechos: array de 4 elementos ordenados por `orden`, cada uno
// { ciudad: { nombre, lat, lon }, anio, actividad }

import { MAX_TURNOS, PUNTOS_POR_TURNO, PENALIZACION_PISTA_AÑO, PENALIZACION_PISTA_ACTIVIDAD  } from './config.js';
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
    pistaAñoUsada: false,
    pistaAñoRevelada: null,
    palabrasClaveReveladas: [],
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

// El primer clic en una ciudad, en toda la partida, revela solo el año de esa
// ciudad. A partir de ese momento, cualquier clic en una ciudad no revelada
// del todo (la misma u otra) muestra directamente año + hecho. Un segundo
// clic sobre una ciudad ya revelada del todo no hace nada.
export function revelarPista(state, indiceCiudad) {
  if (state.terminada) return state;

  const nivelActual = nivelPista(state, indiceCiudad);
  if (nivelActual >= 2) return state;

  if (!state.pistaAñoUsada) {
    return {
      ...state,
      pistasUsadas: { ...state.pistasUsadas, [indiceCiudad]: 1 },
      pistaAñoUsada: true,
      pistaAñoRevelada: state.personaje.hechos[indiceCiudad].anio,
      penalizacionPistas: state.penalizacionPistas + PENALIZACION_PISTA_AÑO,
    };
  }

  return {
    ...state,
    pistasUsadas: { ...state.pistasUsadas, [indiceCiudad]: 2 },
    palabrasClaveReveladas: [...state.palabrasClaveReveladas, state.personaje.hechos[indiceCiudad].palabra_clave],
    penalizacionPistas: state.penalizacionPistas + PENALIZACION_PISTA_ACTIVIDAD,
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
