/**
 * Shared base map for the server-location maps.
 *
 * OpenStreetMap's public tiles need no API key (CartoDB's free tiles now do, which showed an
 * "API KEY REQUIRED" watermark). The attribution below is required by the OSM tile policy.
 * Dark mode inverts the tile pane in CSS (styles/console-dark.css).
 */
export const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

export function addBaseMap(L, map) {
  L.tileLayer(TILE_URL, {
    maxZoom: 18,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
  }).addTo(map);
  L.control.attribution({ prefix: false, position: 'bottomright' }).addTo(map);
}
