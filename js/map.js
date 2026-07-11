// Leaflet wrapper: markers for revealed cities joined by a curve.

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
// onClickCiudad(indice) is called on every click on the marker and must
// return the text to show in the tooltip at that moment.
export function addCiudad(hecho, indice, onClickCiudad) {
  const ciudad = hecho.ciudad;
  // autoClose/closeOnClick set to false: when the game ends, the popups
  // for all 4 cities open at once and must all stay visible.
  const marker = L.marker([ciudad.lat, ciudad.lon])
    .addTo(map)
    .bindPopup(ciudad.nombre, { autoClose: false, closeOnClick: false });

  // By default, Leaflet toggles the popup open/closed on every click on
  // the marker. We replace that behavior so each click updates the
  // content (name -> year -> year + fact) and keeps it always open.
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

// When the game ends: opens the tooltip for all revealed cities at once.
// formatear(indice) must return the final text for each one.
export function mostrarTodasLasPistas(formatear) {
  markers.forEach((marker, indice) => {
    marker.setPopupContent(formatear(indice));
    marker.openPopup();
  });
}
