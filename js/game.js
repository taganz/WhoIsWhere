// Pure turn logic: doesn't touch the DOM or Leaflet.
// expected personaje: { id, nombre, nombres_alternativos, hechos }
// hechos: array of 4 elements ordered by `orden`, each one
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

// Cities (with their full fact) visible in the current turn. The year and
// the fact for each are only revealed when clicking the map marker.
export function ciudadesReveladas(state) {
  return state.personaje.hechos.slice(0, state.turno);
}

// Hint level revealed for a city: 0 = name only, 1 = + year, 2 = + fact.
export function nivelPista(state, indiceCiudad) {
  return state.pistasUsadas[indiceCiudad] || 0;
}

// The first click on a city, in the whole game, reveals only that city's
// year. From that point on, any click on a not-fully-revealed city (the
// same one or another) directly shows year + fact. A second click on a
// city that's already fully revealed does nothing.
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
