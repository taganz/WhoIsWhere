import { MAX_TURNOS } from './config.js';
import { createGameState, ciudadesReveladas, puntosEnJuego, submitGuess, pasarTurno, actividadesFinales } from './game.js';
import { initMap, resetMap, addCiudad, invalidateSize } from './map.js';
import { fetchRandomPersonaje } from './data.js';
import { saveGame, getUltimoPersonajeId, setUltimoPersonajeId } from './persistence.js';
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
  listaFallos: document.getElementById('lista-fallos'),
  formRespuesta: document.getElementById('form-respuesta'),
  inputNombre: document.getElementById('input-nombre'),
  btnPaso: document.getElementById('btn-paso'),

  endResultado: document.getElementById('end-resultado'),
  endPersonajeNombre: document.getElementById('end-personaje-nombre'),
  endDetalle: document.getElementById('end-detalle'),
  endPuntos: document.getElementById('end-puntos'),
  formAlias: document.getElementById('form-alias'),
  inputAlias: document.getElementById('input-alias'),
  inputWebsite: document.getElementById('input-website'),
  guardarEstado: document.getElementById('guardar-estado'),
  btnGuardar: document.getElementById('btn-guardar'),

  historialLista: document.getElementById('historial-lista'),
};

let gameState = null;
let mapPintadoHasta = 0;
let mapInicializado = false;

function showScreen(name) {
  Object.entries(screens).forEach(([key, node]) => node.classList.toggle('hidden', key !== name));
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
    addCiudad(reveladas[mapPintadoHasta].ciudad);
    mapPintadoHasta += 1;
  }

  el.inputNombre.value = '';
  el.inputNombre.focus();
}

function renderFinDePartida() {
  const gano = gameState.acertado;
  el.endResultado.textContent = gano ? '¡Has acertado!' : 'Turnos agotados';
  el.endPersonajeNombre.textContent = gameState.personaje.nombre;
  el.endPuntos.textContent = gameState.puntos;

  el.endDetalle.innerHTML = '';
  if (!gano) {
    actividadesFinales(gameState).forEach((h) => {
      const li = document.createElement('li');
      li.textContent = `${h.ciudad.nombre} (${h.anio}): ${h.actividad}`;
      el.endDetalle.appendChild(li);
    });
  }

  el.inputAlias.value = '';
  el.inputWebsite.value = '';
  el.guardarEstado.textContent = '';
  el.btnGuardar.disabled = false;

  showScreen('end');
}

async function iniciarPartida() {
  showScreen('game');

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
      li.innerHTML = `<span>${alias} — ${p.personajeNombre}</span><span>${resultado} · ${formatFecha(p.fecha)}</span>`;
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

  el.formAlias.addEventListener('submit', async (event) => {
    event.preventDefault();
    el.btnGuardar.disabled = true;
    el.guardarEstado.textContent = 'Guardando…';
    try {
      const resultado = await saveGame(gameState, el.inputAlias.value, el.inputWebsite.value);
      if (resultado.saved) {
        el.guardarEstado.textContent = 'Partida guardada.';
      } else if (resultado.reason === 'rate-limit') {
        el.guardarEstado.textContent = 'Espera unos segundos antes de guardar otra partida.';
        el.btnGuardar.disabled = false;
      } else {
        el.guardarEstado.textContent = 'Partida guardada.';
      }
    } catch (err) {
      console.error(err);
      el.guardarEstado.textContent = 'No se ha podido guardar la partida.';
      el.btnGuardar.disabled = false;
    }
  });
}

export function initApp() {
  initListeners();
  showScreen('welcome');
}
