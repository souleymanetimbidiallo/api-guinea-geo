const themeButton = document.getElementById('theme-toggle');
const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
let chosenTheme;
try { chosenTheme = localStorage.getItem('guinea-geo-theme'); } catch {}
if (!['light', 'dark'].includes(chosenTheme)) chosenTheme = null;
function applyTheme(theme) {
  const dark = theme === 'dark';
  document.documentElement.dataset.theme = theme;
  themeButton.setAttribute('aria-pressed', String(dark));
  const label = dark ? 'Activer le thème clair' : 'Activer le thème sombre';
  themeButton.setAttribute('aria-label', label);
  themeButton.title = label;
  document.getElementById('theme-icon').textContent = dark ? '☀' : '☾';
  themeButton.querySelector('.theme-label').textContent = dark ? 'Thème clair' : 'Thème sombre';
  document.querySelector('meta[name="theme-color"]').content = dark ? '#101e19' : '#173f35';
}
applyTheme(document.documentElement.dataset.theme || 'light');
themeButton.addEventListener('click', () => {
  chosenTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  applyTheme(chosenTheme);
  try { localStorage.setItem('guinea-geo-theme', chosenTheme); } catch {}
});
systemTheme.addEventListener('change', event => {
  if (!chosenTheme) applyTheme(event.matches ? 'dark' : 'light');
});

/* La page reste navigable sans JavaScript ; seules la carte et les requêtes sont enrichies. */
const locations = [
  ['Conakry', 9.5092, -13.7122], ['Labé', 11.3181, -12.2915],
  ['Kindia', 10.062, -12.871], ['Boké', 10.94, -14.3],
  ['Nzérékoré', 7.75, -8.83], ['Kankan', 10.39, -9.31],
  ['Mamou', 10.38, -12.08], ['Faranah', 10.05, -10.74],
  // Positions des chefs-lieux issues de Natural Earth Populated Places.
  ['Beyla', 8.686998, -8.657001], ['Siguiri', 11.417093, -9.166635]
];
if (window.L) {
  const map = L.map('map', { scrollWheelZoom: false, zoomSnap: 0.25 }).setView([10.35, -10.9], 6);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>', maxZoom: 18
  }).addTo(map);
  // Le contour est servi localement ; les tuiles restent fournies par OpenStreetMap.
  fetchJson('/guinea.geojson').then(country => {
    const polygons = country.geometry.type === 'MultiPolygon' ? country.geometry.coordinates : [country.geometry.coordinates];
    const outer = [[-180, -85], [180, -85], [180, 85], [-180, 85], [-180, -85]];
    L.geoJSON({ type: 'Feature', geometry: { type: 'Polygon', coordinates: [outer, ...polygons.map(polygon => polygon[0])] } }, {
      interactive: false, style: { className: 'country-mask', stroke: false, fillOpacity: 0.65, fillRule: 'evenodd' }
    }).addTo(map);
    const border = L.geoJSON(country, {
      interactive: false, style: { className: 'country-border', weight: 2, fillOpacity: 0.09 }
    }).addTo(map);
    const frame = () => map.fitBounds(border.getBounds(), { padding: [24, 24] });
    frame();
    map.on('resize', frame);
  }).catch(() => {
    document.querySelector('.map-credit').textContent = 'Contour indisponible';
  });
  locations.forEach(([name, lat, lon]) => {
    const content = document.createElement('div');
    const heading = document.createElement('strong');
    heading.textContent = name;
    const link = document.createElement('a');
    link.href = `/regions/search?name=${encodeURIComponent(name)}`;
    link.textContent = 'Explorer cette région →';
    link.dataset.openRegion = name;
    content.append(heading, document.createElement('br'), link);
    const marker = L.marker([lat, lon], { title: name, alt: name, icon: L.divIcon({ className: 'region-marker', iconSize: [14, 14], iconAnchor: [7, 7] }) }).addTo(map).bindPopup(content)
      .bindTooltip(name, { direction: 'top', offset: [0, -9], className: 'region-tooltip' });
    const element = marker.getElement();
    element.setAttribute('aria-label', `Explorer la région de ${name}`);
    element.addEventListener('focus', () => marker.openTooltip());
    element.addEventListener('blur', () => marker.closeTooltip());
  });
} else {
  document.getElementById('map').hidden = true;
  document.getElementById('map-fallback').hidden = false;
}
async function fetchJson(path) {
  const response = await fetch(path, { signal: AbortSignal.timeout(12000) });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}
async function loadCounts() {
  const results = await Promise.allSettled(['regions', 'prefectures', 'sous-prefectures'].map(async route => {
    const data = await fetchJson(`/${route}`);
    if (!Array.isArray(data)) throw new Error('Format inattendu');
    document.querySelector(`[data-count="${route}"]`).textContent = new Intl.NumberFormat('fr-FR').format(data.length);
  }));
  document.getElementById('data-status').textContent = results.every(result => result.status === 'fulfilled')
    ? 'Couverture de la base, incluant la réforme de 2026. Listes partielles au niveau local.'
    : 'Certaines données sont indisponibles. Réessayez plus tard.';
}
loadCounts();
const endpoint = document.getElementById('endpoint');
const run = document.getElementById('run');
const output = document.getElementById('response');
const status = document.getElementById('response-status');
run.addEventListener('click', async () => {
  run.disabled = true;
  endpoint.disabled = true;
  output.setAttribute('aria-busy', 'true');
  status.textContent = 'Chargement…';
  run.classList.add('loading');
  try {
    const data = await fetchJson(endpoint.value);
    output.textContent = JSON.stringify(data, null, 2);
    status.textContent = '200 OK';
    output.animate([{ opacity: 0.4 }, { opacity: 1 }], { duration: matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 250 });
  } catch (error) {
    output.textContent = 'La requête n’a pas abouti. Vérifiez la disponibilité de l’API et réessayez.';
    status.textContent = error.name === 'TimeoutError' ? 'Délai dépassé' : 'Indisponible';
  } finally {
    run.classList.remove('loading');
    run.disabled = false;
    endpoint.disabled = false;
    output.removeAttribute('aria-busy');
  }
});
endpoint.addEventListener('change', () => {
  output.textContent = 'Cliquez sur la flèche pour exécuter cette requête.';
  status.textContent = 'Prêt à explorer';
});
document.getElementById('copy').addEventListener('click', async () => {
  const command = `curl '${location.origin}${endpoint.value}'`;
  try {
    await navigator.clipboard.writeText(command);
    document.getElementById('copy-status').textContent = 'Requête curl copiée.';
  } catch {
    document.getElementById('copy-status').textContent = `Copiez cette requête : ${command}`;
  }
});
