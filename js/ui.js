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
import { saveGame, getUltimoPersonajeId, setUltimoPersonajeId, getAlias, setAlias } from './persistence.js';
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

function showScreen(name) {
  Object.entries(screens).forEach(([key, node]) => node.classList.toggle('hidden', key !== name));
}

function formatearTooltipCiudad(hecho, nivel) {
  if (nivel <= 0) return hecho.ciudad.nombre;
  if (nivel === 1) return `${hecho.ciudad.nombre} — ${hecho.anio}`;
  return `${hecho.ciudad.nombre} — ${hecho.anio}: ${hecho.actividad}`;
}

// Se invoca en cada clic sobre un marcador del mapa: sube el nivel de pista
// de esa ciudad (con penalización de puntos las 2 primeras veces) y devuelve
// el texto que debe mostrar el tooltip.
function onClickCiudad(indice) {
  const hecho = gameState.personaje.hechos[indice];
  gameState = revelarPista(gameState, indice);
  el.puntosEnJuego.textContent = puntosEnJuego(gameState);
  const nivel = gameState.terminada ? 2 : nivelPista(gameState, indice);
  return formatearTooltipCiudad(hecho, nivel);
}

function renderTurno() {
  el.turnoActual.textContent = gameState.turno;
  el.turnoMax.textContent = MAX_TURNOS;
  el.puntosActuales.textContent = gameState.puntos;
  el.puntosEnJuego.textContent = puntosEnJuego(gameState);

  el.listaFallos.innerHTML = '';
  gameState.intentosFallidos.forEach((nombre) => {
    const li = document.createElement('li');
    li.textContent = nombre;
    el.listaFallos.appendChild(li);
  });

  const reveladas = ciudadesReveladas(gameState);
  while (mapPintadoHasta < reveladas.length) {
    addCiudad(reveladas[mapPintadoHasta], mapPintadoHasta, onClickCiudad);
    mapPintadoHasta += 1;
  }

  el.inputNombre.value = '';
  el.inputNombre.focus();
}

async function guardarPartidaAutomaticamente() {
  el.guardarEstado.textContent = 'Guardando…';
  try {
    const resultado = await saveGame(gameState, el.inputAliasJugador.value.trim() || getAlias());
    if (resultado.saved) {
      el.guardarEstado.textContent = 'Partida guardada.';
    } else if (resultado.reason === 'rate-limit') {
      el.guardarEstado.textContent = 'Espera unos segundos antes de guardar otra partida.';
    }
  } catch (err) {
    console.error(err);
    el.guardarEstado.textContent = 'No se ha podido guardar la partida.';
  }
}

function renderFinDePartida() {
  const gano = gameState.acertado;
  el.endResultado.textContent = gano ? '¡Has acertado!' : 'Turnos agotados';
  el.endPersonajeNombre.textContent = gameState.personaje.nombre;
  el.endPuntos.textContent = gameState.puntos;

  el.mapSlotEnd.appendChild(document.getElementById('map'));
  showScreen('end');
  invalidateSize();

  // Si se ha acertado antes del último turno, aún faltan ciudades por pintar
  // en el mapa: al terminar la partida se muestran las 4 siempre.
  const hechos = gameState.personaje.hechos;
  while (mapPintadoHasta < hechos.length) {
    addCiudad(hechos[mapPintadoHasta], mapPintadoHasta, onClickCiudad);
    mapPintadoHasta += 1;
  }
  // Solo año por defecto; el hecho se revela al hacer clic en la ciudad (ver onClickCiudad).
  mostrarTodasLasPistas((indice) => formatearTooltipCiudad(hechos[indice], 1));

  guardarPartidaAutomaticamente();
}

async function iniciarPartida() {
  showScreen('game');

  // El div del mapa se mueve a la pantalla final al terminar la partida
  // (para mostrar las 4 ciudades allí); lo devolvemos a la de juego.
  el.mapSlotGame.appendChild(document.getElementById('map'));

  // Inicializar Leaflet solo cuando el contenedor ya es visible: si se crea
  // el mapa dentro de un contenedor con display:none, Leaflet calcula mal
  // su tamaño interno y invalidateSize() no lo corrige del todo.
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
    alert('No se ha podido cargar un personaje. Comprueba la configuración de Supabase en js/config.js.');
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
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

async function mostrarHistorial() {
  showScreen('history');
  el.historialLista.innerHTML = '<li>Cargando…</li>';
  try {
    const partidas = await fetchHistorial();
    el.historialLista.innerHTML = '';
    if (partidas.length === 0) {
      el.historialLista.innerHTML = '<li>Todavía no hay partidas jugadas.</li>';
      return;
    }
    partidas.forEach((p) => {
      const li = document.createElement('li');
      const alias = p.alias ? p.alias : 'Anónimo';
      const resultado = p.acertado
        ? `<span class="history-outcome-win">Acertó (${p.puntos} pts)</span>`
        : '<span class="history-outcome-lose">No acertó</span>';
      li.innerHTML = `<span>${alias}</span><span>${resultado} · ${formatFecha(p.fecha)}</span>`;
      el.historialLista.appendChild(li);
    });
  } catch (err) {
    console.error(err);
    el.historialLista.innerHTML = '<li>No se ha podido cargar el historial.</li>';
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
  });
}

export function initApp() {
  el.inputAliasJugador.value = getAlias();
  initListeners();
  showScreen('welcome');
}
