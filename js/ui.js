import { MAX_TURNOS } from './config.js';
import {
  createGameState,
  ciudadesReveladas,
  puntosEnJuego,
  submitGuess,
  pasarTurno,
  revelarPista,
  nivelPista,
} from './game.js';
import { initMap, resetMap, addCiudad, invalidateSize, mostrarTodasLasPistas } from './map.js';
import { fetchRandomPersonaje } from './data.js';
import {
  saveGame,
  getUltimoPersonajeId,
  setUltimoPersonajeId,
  getAlias,
  setAlias,
  fetchPuntosTotales,
} from './persistence.js';
import { fetchHistorial } from './history.js';

const screens = {
  welcome: document.getElementById('screen-welcome'),
  game: document.getElementById('screen-game'),
  end: document.getElementById('screen-end'),
  history: document.getElementById('screen-history'),
};

const el = {
  btnEmpezar: document.getElementById('btn-empezar'),
  btnNavHistorial: document.getElementById('btn-nav-historial'),
  btnVolverHistorial: document.getElementById('btn-volver-desde-historial'),
  btnJugarDeNuevo: document.getElementById('btn-jugar-de-nuevo'),

  turnoActual: document.getElementById('turno-actual'),
  turnoMax: document.getElementById('turno-max'),
  puntosActuales: document.getElementById('puntos-actuales'),
  puntosEnJuego: document.getElementById('puntos-en-juego'),
  inputAliasJugador: document.getElementById('input-alias-jugador'),
  listaFallos: document.getElementById('lista-fallos'),
  formRespuesta: document.getElementById('form-respuesta'),
  inputNombre: document.getElementById('input-nombre'),
  btnPaso: document.getElementById('btn-paso'),
  mapSlotGame: document.getElementById('map-slot-game'),

  endResultado: document.getElementById('end-resultado'),
  endPersonajeNombre: document.getElementById('end-personaje-nombre'),
  mapSlotEnd: document.getElementById('map-slot-end'),
  endPuntos: document.getElementById('end-puntos'),
  guardarEstado: document.getElementById('guardar-estado'),

  historialLista: document.getElementById('historial-lista'),
};

let gameState = null;
let mapPintadoHasta = 0;
let mapInicializado = false;

// On mobile, forcing focus() opens the keyboard and eats up half the
// screen (covering the map) right when the player just wants to look at it.
// We only autofocus on devices with a fine pointer (mouse).
const esDispositivoTactil = window.matchMedia('(pointer: coarse)').matches;

function showScreen(name) {
  Object.entries(screens).forEach(([key, node]) => node.classList.toggle('hidden', key !== name));
}

function formatearTooltipCiudad(hecho, nivel) {
  if (nivel <= 0) return hecho.ciudad.nombre;
  if (nivel === 1) return `${hecho.ciudad.nombre} — ${hecho.anio}`;
  return `${hecho.ciudad.nombre} — ${hecho.anio}: ${hecho.actividad}`;
}

// Called on every click on a map marker: raises the hint level for that
// city (with a points penalty) and returns the text the tooltip should show.
function onClickCiudad(indice) {
  const hecho = gameState.personaje.hechos[indice];
  gameState = revelarPista(gameState, indice);
  el.puntosEnJuego.textContent = puntosEnJuego(gameState);
  renderListaFallos();
  const nivel = gameState.terminada ? 2 : nivelPista(gameState, indice);
  return formatearTooltipCiudad(hecho, nivel);
}

function renderListaFallos() {
  el.listaFallos.innerHTML = '';
  gameState.intentosFallidos.forEach((nombre) => {
    const li = document.createElement('li');
    li.textContent = nombre;
    el.listaFallos.appendChild(li);
  });

  if (gameState.pistaAñoRevelada != null) {
    const li = document.createElement('li');
    li.className = 'hint';
    li.textContent = gameState.pistaAñoRevelada;
    el.listaFallos.appendChild(li);
  }

  gameState.palabrasClaveReveladas.forEach((palabra) => {
    const li = document.createElement('li');
    li.className = 'hint';
    li.textContent = palabra;
    el.listaFallos.appendChild(li);
  });
}

async function actualizarPuntosTotales() {
  try {
    const alias = el.inputAliasJugador.value.trim() || getAlias();
    el.puntosActuales.textContent = await fetchPuntosTotales(alias);
  } catch (err) {
    console.error(err);
  }
}

function renderTurno() {
  el.turnoActual.textContent = gameState.turno;
  el.turnoMax.textContent = MAX_TURNOS;
  el.puntosEnJuego.textContent = puntosEnJuego(gameState);

  renderListaFallos();

  const reveladas = ciudadesReveladas(gameState);
  while (mapPintadoHasta < reveladas.length) {
    addCiudad(reveladas[mapPintadoHasta], mapPintadoHasta, onClickCiudad);
    mapPintadoHasta += 1;
  }

  el.inputNombre.value = '';
  if (!esDispositivoTactil) {
    el.inputNombre.focus();
  }
}

async function guardarPartidaAutomaticamente() {
  el.guardarEstado.textContent = 'Saving…';
  try {
    const resultado = await saveGame(gameState, el.inputAliasJugador.value.trim() || getAlias());
    if (resultado.saved) {
      el.guardarEstado.textContent = '';
      actualizarPuntosTotales();
    } else if (resultado.reason === 'rate-limit') {
      el.guardarEstado.textContent = 'Wait a few seconds before saving another game.';
    }
  } catch (err) {
    console.error(err);
    el.guardarEstado.textContent = 'Could not save the game.';
  }
}

function renderFinDePartida() {
  const gano = gameState.acertado;
  el.endResultado.textContent = gano ? 'You got it!' : 'Out of turns';
  el.endPersonajeNombre.textContent = gameState.personaje.nombre;
  el.endPuntos.textContent = gameState.puntos;

  el.mapSlotEnd.appendChild(document.getElementById('map'));
  showScreen('end');
  invalidateSize();

  // If the player guessed before the last turn, some cities are still
  // unrendered on the map: at the end of the game all 4 are always shown.
  const hechos = gameState.personaje.hechos;
  while (mapPintadoHasta < hechos.length) {
    addCiudad(hechos[mapPintadoHasta], mapPintadoHasta, onClickCiudad);
    mapPintadoHasta += 1;
  }
  // Year only by default; the fact is revealed on clicking the city (see onClickCiudad).
  mostrarTodasLasPistas((indice) => formatearTooltipCiudad(hechos[indice], 1));

  guardarPartidaAutomaticamente();
}

async function iniciarPartida() {
  showScreen('game');

  // The map div is moved to the end screen when the game finishes
  // (to show the 4 cities there); we return it to the game screen.
  el.mapSlotGame.appendChild(document.getElementById('map'));

  // Only initialize Leaflet once the container is already visible: if the
  // map is created inside a container with display:none, Leaflet miscalculates
  // its internal size and invalidateSize() doesn't fully fix it.
  if (!mapInicializado) {
    initMap('map');
    mapInicializado = true;
  }

  el.formRespuesta.querySelectorAll('input, button').forEach((n) => (n.disabled = true));
  el.turnoActual.textContent = '…';

  try {
    const excludeId = getUltimoPersonajeId();
    const personaje = await fetchRandomPersonaje(excludeId);
    setUltimoPersonajeId(personaje.id);

    gameState = createGameState(personaje);
    mapPintadoHasta = 0;
    resetMap();
    invalidateSize();

    el.formRespuesta.querySelectorAll('input, button').forEach((n) => (n.disabled = false));
    renderTurno();
  } catch (err) {
    console.error(err);
    el.turnoActual.textContent = '-';
    alert('Could not load a character. Check the Supabase configuration in js/config.js.');
  }
}

function avanzar(nuevoEstado) {
  gameState = nuevoEstado;
  if (gameState.terminada) {
    renderFinDePartida();
  } else {
    renderTurno();
  }
}

function formatFecha(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

async function mostrarHistorial() {
  showScreen('history');
  el.historialLista.innerHTML = '<li>Loading…</li>';
  try {
    const partidas = await fetchHistorial();
    el.historialLista.innerHTML = '';
    if (partidas.length === 0) {
      el.historialLista.innerHTML = '<li>No games played yet.</li>';
      return;
    }
    partidas.forEach((p) => {
      const li = document.createElement('li');
      const alias = p.alias ? p.alias : 'Anonymous';
      const resultado = p.acertado
        ? `<span class="history-outcome-win">Got it (${p.puntos} pts)</span>`
        : '<span class="history-outcome-lose">Missed it</span>';
      li.innerHTML = `<span>${alias}</span><span>${resultado} · ${formatFecha(p.fecha)}</span>`;
      el.historialLista.appendChild(li);
    });
  } catch (err) {
    console.error(err);
    el.historialLista.innerHTML = '<li>Could not load the history.</li>';
  }
}

function initListeners() {
  el.btnEmpezar.addEventListener('click', iniciarPartida);
  el.btnJugarDeNuevo.addEventListener('click', iniciarPartida);
  el.btnNavHistorial.addEventListener('click', mostrarHistorial);
  el.btnVolverHistorial.addEventListener('click', () => showScreen('welcome'));

  el.formRespuesta.addEventListener('submit', (event) => {
    event.preventDefault();
    const texto = el.inputNombre.value.trim();
    if (!texto) return;
    avanzar(submitGuess(gameState, texto));
  });

  el.btnPaso.addEventListener('click', () => {
    avanzar(pasarTurno(gameState));
  });

  el.inputAliasJugador.addEventListener('change', () => {
    const alias = el.inputAliasJugador.value.trim();
    if (alias) {
      setAlias(alias);
    } else {
      el.inputAliasJugador.value = getAlias();
    }
    actualizarPuntosTotales();
  });
}

export function initApp() {
  el.inputAliasJugador.value = getAlias();
  initListeners();
  showScreen('welcome');
  actualizarPuntosTotales();
}
