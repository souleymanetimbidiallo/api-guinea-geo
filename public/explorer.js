(() => {
  const types = {
    regions: { label: 'Régions', singular: 'Région', child: 'prefectures', relation: 'region' },
    prefectures: { label: 'Préfectures', singular: 'Préfecture', parent: 'regions', field: 'region', child: 'sous-prefectures', relation: 'prefecture' },
    'sous-prefectures': { label: 'Sous-préfectures', singular: 'Sous-préfecture', parent: 'prefectures', field: 'prefecture' },
    communes: { label: 'Communes', singular: 'Commune', parent: 'regions', field: 'region', child: 'quartiers', relation: 'commune' },
    quartiers: { label: 'Quartiers', singular: 'Quartier', parent: 'communes', field: 'commune' }
  };
  const get = id => document.getElementById(id);
  const cache = new Map();
  const normalize = text => String(text || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('fr').trim();
  const number = new Intl.NumberFormat('fr-FR');
  const pageSize = 12;
  let category = 'regions', trail = [], query = '', page = 1, results = [], selected, revision = 0;
  function element(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
  }
  function button(text, handler, className = 'small-button') {
    const el = element('button', className, text);
    el.type = 'button';
    el.addEventListener('click', handler);
    return el;
  }
  async function load(route) {
    if (!cache.has(route)) {
      const request = fetch(`/${route}`, { signal: AbortSignal.timeout(12000) }).then(async response => {
        if (!response.ok) throw new Error('API indisponible');
        const data = await response.json();
        if (!Array.isArray(data)) throw new Error('Format inattendu');
        return data.map(record => ({ route, record }));
      }).catch(error => { cache.delete(route); throw error; });
      cache.set(route, request);
    }
    return cache.get(route);
  }
  const relationName = value => value && typeof value === 'object' ? value.name : null;
  function populationReference(record) {
    if (!Number.isSafeInteger(record.population) || !record.populationSource || !record.populationReferenceYear || !['preliminary', 'final'].includes(record.populationStatus)) return null;
    return {
      population: record.population, year: record.populationReferenceYear,
      geographicReference: record.populationGeographicReference,
      publicationStatus: record.populationStatus,
      sourcePdfPage: record.populationSource.pdfPage, sourcePrintedPage: record.populationSource.printedPage
    };
  }
  function renderTrail() {
    get('data-breadcrumb').replaceChildren();
    if (!trail.length) return;
    get('data-breadcrumb').append(button(`Toutes les ${types[trail[0].route].label.toLocaleLowerCase('fr')}`, () => navigate(trail[0].route)));
    trail.forEach((step, index) => {
      get('data-breadcrumb').append(element('span', '', '›'), button(step.name, () => {
        category = step.route;
        trail = trail.slice(0, index);
        resetSearch();
        refresh();
      }));
    });
    get('data-breadcrumb').append(element('span', '', '›'), element('span', '', types[category].label));
  }
  function resetSearch() { query = ''; page = 1; get('data-search').value = ''; get('data-category').value = category; }
  function navigate(route, nextTrail = []) {
    category = route; trail = nextTrail; resetSearch(); refresh();
    get('data-browser').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
  }
  async function refresh() {
    const current = ++revision;
    get('data-results').setAttribute('aria-busy', 'true');
    get('result-status').textContent = 'Chargement des données…';
    get('data-results').replaceChildren();
    get('data-pagination').replaceChildren();
    get('export-status').textContent = '';
    get('export-copy').disabled = get('export-download').disabled = true;
    get('coverage-note').hidden = !['communes', 'quartiers', 'all'].includes(category);
    renderTrail();
    try {
      let records = category === 'all' ? (await Promise.all(Object.keys(types).map(load))).flat() : await load(category);
      if (current !== revision) return;
      if (trail.length) {
        const parent = trail[trail.length - 1];
        const field = types[category].field;
        records = records.filter(({ record }) => record.parentStatus !== 'pending' && relationName(record[field]) === parent.name);
      }
      results = records.filter(({ record }) => normalize(record.name).includes(normalize(query)))
        .sort((a, b) => a.record.name.localeCompare(b.record.name, 'fr'));
      renderResults();
    } catch {
      if (current !== revision) return;
      results = [];
      get('result-status').textContent = 'Les données sont momentanément indisponibles.';
      const error = element('div', 'browser-empty');
      error.append(element('p', '', 'Impossible de charger cette liste. Vous pouvez réessayer.'), button('Réessayer', refresh));
      get('data-results').append(error);
    } finally {
      if (current === revision) get('data-results').setAttribute('aria-busy', 'false');
    }
  }
  function renderResults() {
    const totalPages = Math.max(1, Math.ceil(results.length / pageSize));
    page = Math.min(page, totalPages);
    get('result-status').textContent = `${number.format(results.length)} résultat${results.length === 1 ? '' : 's'}${query ? ` pour « ${query} »` : ''}`;
    get('export-copy').disabled = get('export-download').disabled = !results.length;
    get('data-results').replaceChildren();
    if (!results.length) {
      get('data-results').append(element('div', 'browser-empty', 'Aucun résultat actuel confirmé dans la base pour cette sélection. Les rattachements en attente de vérification ne sont pas attribués à leur ancien parent. Vous pouvez rechercher le lieu dans la liste générale.'));
    }
    results.slice((page - 1) * pageSize, page * pageSize).forEach(item => {
      const card = button('', () => showPlace(item), 'place-card');
      card.append(element('span', 'place-kind', types[item.route].singular), element('h3', '', item.record.name));
      const parent = relationName(item.record[types[item.route].field]);
      if (parent) card.append(element('p', 'place-parent', item.record.parentStatus === 'pending' ? `Ancien rattachement : ${parent}` : parent));
      if (item.record.parentStatus === 'pending') card.append(element('span', 'quality-tag', 'Rattachement à confirmer'));
      if (item.record.effectiveFrom === '2026-08-20') card.append(element('span', 'quality-tag', 'Création · août 2026'));
      const stats = element('span', 'place-stats');
      const observation = populationReference(item.record);
      stats.textContent = observation ? `${number.format(observation.population)} habitants · ${observation.year}` : 'Population vérifiée non disponible';
      card.append(stats);
      if (observation) card.append(element('span', 'quality-tag', `Population sourcée · ${observation.year}`));
      card.append(element('span', 'place-arrow', 'Voir la fiche ↗'));
      get('data-results').append(card);
    });
    get('data-pagination').replaceChildren();
    if (totalPages > 1) {
      const change = delta => { page += delta; renderResults(); get('result-status').scrollIntoView({ block: 'center' }); };
      const previous = button('← Précédent', () => change(-1)); previous.disabled = page === 1;
      const next = button('Suivant →', () => change(1)); next.disabled = page === totalPages;
      get('data-pagination').append(previous, element('span', '', `Page ${page} / ${totalPages}`), next);
    }
  }
  function showPlace(item) {
    selected = item;
    const config = types[item.route];
    get('place-category').textContent = config.singular;
    get('place-title').textContent = item.record.name;
    get('place-details').replaceChildren();
    const dl = element('dl', 'place-facts');
    const observation = populationReference(item.record);
    const facts = [
      [observation ? `Population — référence ${observation.year}` : 'Population actuelle', observation ? `${number.format(observation.population)} habitants` : 'Non disponible'],
      ['Superficie actuelle', item.record.metricsStatus === 'verified' && typeof item.record.area === 'number' ? `${number.format(item.record.area)} km²` : 'Non disponible']
    ];
    if (observation) {
      facts.push(['Référence territoriale', observation.geographicReference || 'À vérifier'], ['Publication', observation.publicationStatus === 'final' ? 'Résultats définitifs' : 'Résultats préliminaires']);
    }
    if (item.record.zone) facts.push(['Zone', item.record.zone]);
    const parent = relationName(item.record[config.field]);
    if (config.parent) facts.push([item.record.parentStatus === 'pending' ? 'Ancien rattachement (à confirmer)' : types[config.parent].singular, parent || 'Lien non renseigné']);
    if (item.record.administrativeType === 'special-zone') facts.push(['Statut', 'Zone spéciale']);
    if (item.record.effectiveFrom) facts.push(['Création administrative', new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(item.record.effectiveFrom))]);
    facts.forEach(([label, value]) => { const group = element('div'); group.append(element('dt', '', label), element('dd', '', value)); dl.append(group); });
    get('place-details').append(dl);
    if (observation) {
      get('place-details').append(element('p', 'record-note', `Dernière population vérifiée : référence ${observation.year}. ${item.record.populationBoundaryCompatibility === 'verified' ? 'Périmètre actuel confirmé.' : 'La correspondance avec le périmètre actuel reste à vérifier.'}${observation.sourcePrintedPage ? ` Source : page ${observation.sourcePrintedPage} du rapport (page PDF ${observation.sourcePdfPage}).` : ''}`));
      const link = element('a', 'text-link census-link', `Consulter la référence de population ${observation.year} ↗`);
      link.href = observation.year === 2025 ? '/populations/rgph4-2025' : item.record.populationSource.url; link.target = '_blank'; link.rel = 'noopener noreferrer';
      get('place-details').append(link);
    }
    if (item.record.notes) get('place-details').append(element('p', 'record-note', item.record.notes));
    if (item.record.metricsStatus !== 'verified' && typeof item.record.area === 'number') {
      const history = element('details', 'historical-metrics');
      history.append(element('summary', '', 'Ancienne superficie non vérifiée'));
      if (typeof item.record.area === 'number') history.append(element('p', '', `Superficie héritée : ${number.format(item.record.area)} km²`));
      history.append(element('p', '', 'Date, source et périmètre non validés. Cette superficie n’est pas une statistique actuelle.'));
      get('place-details').append(history);
    }
    if (item.record.sources?.length) {
      const sources = element('div', 'record-sources');
      sources.append(element('h3', '', 'Sources'));
      for (const source of item.record.sources) {
        try {
          const url = new URL(source.url);
          if (!['http:', 'https:'].includes(url.protocol)) continue;
          const link = element('a', 'text-link', source.title);
          link.href = url.href; link.target = '_blank'; link.rel = 'noopener noreferrer';
          sources.append(link);
        } catch { /* Ignorer une URL invalide. */ }
      }
      get('place-details').append(sources);
    }
    get('place-relations').replaceChildren();
    const child = item.route === 'regions' && item.record.administrativeType === 'special-zone' ? 'communes' : config.child;
    if (child) {
      get('place-relations').append(button(`Explorer les ${types[child].label.toLocaleLowerCase('fr')} →`, () => {
        get('place-dialog').close();
        // Conserver le parcours seulement si la fiche appartient à la liste courante.
        navigate(child, [...(item.route === category ? trail : []), { route: item.route, name: item.record.name }]);
      }, 'button primary'));
    }
    if (config.parent && parent) {
      get('place-relations').append(button(`${item.record.parentStatus === 'pending' ? 'Voir l’ancien parent' : 'Voir'} ${parent} ↑`, async () => {
        get('place-status').textContent = 'Chargement de la subdivision parente…';
        try {
          const records = await load(config.parent);
          if (!get('place-dialog').open || selected !== item) return;
          const found = records.find(entry => entry.record.name === parent);
          if (found) showPlace(found);
          else get('place-status').textContent = 'Cette subdivision parente n’est pas disponible dans la base.';
        } catch { get('place-status').textContent = 'Impossible de charger la subdivision parente.'; }
      }));
    }
    get('place-api').href = `/${item.route}/search?name=${encodeURIComponent(item.record.name)}`;
    get('place-api').target = '_blank'; get('place-api').rel = 'noopener noreferrer';
    get('place-status').textContent = '';
    if (!get('place-dialog').open) get('place-dialog').showModal();
  }
  function payload() { return results.map(({ record }) => record); }
  async function copy(data, statusId) {
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      get(statusId).textContent = 'Données JSON copiées.';
    } catch { get(statusId).textContent = 'Copie indisponible dans ce navigateur. Utilisez le téléchargement JSON.'; }
  }
  function download(data, name) {
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
    const link = element('a'); link.href = url;
    link.download = `guinee-${name.replace(/[^a-z0-9-]/gi, '-')}.json`;
    document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  get('search-form').addEventListener('submit', event => { event.preventDefault(); query = get('data-search').value.trim(); page = 1; refresh(); });
  get('data-search').addEventListener('input', () => { query = get('data-search').value.trim(); page = 1; refresh(); });
  get('data-category').addEventListener('change', () => {
    category = get('data-category').value; trail = []; page = 1; refresh();
  });
  get('place-close').addEventListener('click', () => get('place-dialog').close());
  get('export-copy').addEventListener('click', () => copy(payload(), 'export-status'));
  get('export-download').addEventListener('click', () => { download(payload(), category); get('export-status').textContent = 'Téléchargement JSON lancé pour tous les résultats filtrés.'; });
  get('place-copy').addEventListener('click', () => copy(selected.record, 'place-status'));
  get('place-download').addEventListener('click', () => download(selected.record, selected.record.name));
  document.addEventListener('click', async event => {
    const categoryLink = event.target.closest('[data-category]');
    if (categoryLink) { event.preventDefault(); navigate(categoryLink.dataset.category); }
    const regionLink = event.target.closest('[data-open-region]');
    if (regionLink) {
      event.preventDefault();
      navigate('regions');
      try {
        const records = await load('regions');
        const found = records.find(item => item.record.name === regionLink.dataset.openRegion);
        if (found) showPlace(found);
      } catch { /* Le message d'erreur de la liste est déjà affiché. */ }
    }
  });
  refresh();
})();
