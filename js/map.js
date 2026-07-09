// Envoltorio de Leaflet: marcadores de ciudades reveladas unidos por una curva.

let map = null;
let markers = [];
let curves = [];
let revealedLatLngs = [];

export function initMap(elementId) {
  map = L.map(elementId, { zoomAnimation: false }).setView([20, 0], 2);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 18,
  }).addTo(map);
  return map;
}

export function invalidateSize() {
  if (map) map.invalidateSize();
}

export function resetMap() {
  markers.forEach((m) => map.removeLayer(m));
  curves.forEach((c) => map.removeLayer(c));
  markers = [];
  curves = [];
  revealedLatLngs = [];
  map.setView([20, 0], 2, { animate: false });
}

function bezierPoints(p0, p1, curvature = 0.2, segments = 40) {
  const midLat = (p0.lat + p1.lat) / 2;
  const midLon = (p0.lon + p1.lon) / 2;
  const dx = p1.lon - p0.lon;
  const dy = p1.lat - p0.lat;
  const controlLat = midLat + dx * curvature;
  const controlLon = midLon - dy * curvature;

  const points = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const lat = (1 - t) ** 2 * p0.lat + 2 * (1 - t) * t * controlLat + t ** 2 * p1.lat;
    const lon = (1 - t) ** 2 * p0.lon + 2 * (1 - t) * t * controlLon + t ** 2 * p1.lon;
    points.push([lat, lon]);
  }
  return points;
}

// hecho: { ciudad: { nombre, lat, lon }, anio, actividad }
// onClickCiudad(indice) se llama en cada clic sobre el marcador y debe
// devolver el texto a mostrar en el tooltip para ese momento.
export function addCiudad(hecho, indice, onClickCiudad) {
  const ciudad = hecho.ciudad;
  // autoClose/closeOnClick a false: al terminar la partida se abren los
  // popups de las 4 ciudades a la vez y deben permanecer todos visibles.
  const marker = L.marker([ciudad.lat, ciudad.lon])
    .addTo(map)
    .bindPopup(ciudad.nombre, { autoClose: false, closeOnClick: false });

  // Leaflet, por defecto, alterna abrir/cerrar el popup en cada clic sobre el
  // marcador. Sustituimos ese comportamiento para que cada clic actualice el
  // contenido (nombre -> año -> año + hecho) y lo mantenga siempre abierto.
  marker.off('click');
  marker.on('click', () => {
    marker.setPopupContent(onClickCiudad(indice));
    marker.openPopup();
  });

  markers.push(marker);

  if (revealedLatLngs.length > 0) {
    const prev = revealedLatLngs[revealedLatLngs.length - 1];
    const curve = L.polyline(bezierPoints(prev, ciudad), {
      color: '#2a6f6f',
      weight: 3,
      opacity: 0.8,
    }).addTo(map);
    curves.push(curve);
  }

  revealedLatLngs.push(ciudad);

  if (markers.length === 1) {
    map.setView([ciudad.lat, ciudad.lon], 5, { animate: false });
  } else {
    const group = L.featureGroup(markers);
    map.fitBounds(group.getBounds(), { padding: [40, 40], animate: false });
  }
}

// Al terminar la partida: abre a la vez el tooltip de todas las ciudades
// reveladas. formatear(indice) debe devolver el texto final para cada una.
export function mostrarTodasLasPistas(formatear) {
  markers.forEach((marker, indice) => {
    marker.setPopupContent(formatear(indice));
    marker.openPopup();
  });
}
