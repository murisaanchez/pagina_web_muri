/* Municipalidad de Chaitén · comportamiento del sitio (sin librerías)
   1. Menú móvil y buscador del encabezado
   2. Filtros de documentos de transparencia
   3. Filtros y orden de noticias
   4. Buscador del sitio */
(() => {
  'use strict';

  const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const checked = (form, name) => [...form.querySelectorAll(`input[name="${name}"]:checked`)].map((i) => i.value);

  /* 1) Encabezado: menú móvil y buscador */
  const menuBtn = document.querySelector('.menu-btn');
  const menu = document.getElementById('menu-principal');
  const searchBox = document.querySelector('.search-toggle');
  const searchInput = document.getElementById('q-cabecera');

  const setMenu = (open) => {
    if (!menuBtn || !menu) return;
    menu.classList.toggle('is-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.querySelector('.visually-hidden').textContent = open ? 'Cerrar menú' : 'Abrir menú';
  };
  if (menuBtn && menu) {
    menuBtn.addEventListener('click', () => setMenu(!menu.classList.contains('is-open')));
    window.matchMedia('(min-width: 1024px)').addEventListener('change', () => setMenu(false));
  }
  if (searchBox) {
    searchBox.addEventListener('toggle', () => { if (searchBox.open && searchInput) searchInput.focus(); });
  }
  document.addEventListener('keydown', (ev) => {
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(ev.target.tagName) || ev.target.isContentEditable;
    if (ev.key === 'Escape') {
      if (searchBox && searchBox.open) { searchBox.open = false; searchBox.querySelector('summary').focus(); }
      if (menu && menu.classList.contains('is-open')) { setMenu(false); menuBtn.focus(); }
    } else if (ev.key === '/' && !typing && !ev.ctrlKey && !ev.metaKey && !ev.altKey && searchBox) {
      ev.preventDefault();
      searchBox.open = true;
      if (searchInput) searchInput.focus();
    }
  });
  document.addEventListener('click', (ev) => {
    if (searchBox && searchBox.open && !searchBox.contains(ev.target)) searchBox.open = false;
    if (menu && menu.classList.contains('is-open') && !menu.contains(ev.target) && !menuBtn.contains(ev.target)) setMenu(false);
  });

  /* 2) Documentos de transparencia */
  const docsForm = document.getElementById('filtros-docs');
  if (docsForm) {
    const items = document.querySelectorAll('.doc-result');
    const counter = document.getElementById('contador');
    const empty = document.getElementById('sin-resultados');
    const applyDocs = () => {
      const tipos = checked(docsForm, 'tipo');
      const anios = checked(docsForm, 'anio');
      let n = 0;
      items.forEach((item) => {
        const ok = (!tipos.length || tipos.includes(item.dataset.tipo)) && (!anios.length || anios.includes(item.dataset.anio));
        item.hidden = !ok;
        if (ok) n += 1;
      });
      counter.textContent = `${n} ${n === 1 ? 'documento' : 'documentos'}`;
      empty.hidden = n > 0;
    };
    docsForm.addEventListener('change', applyDocs);
    docsForm.addEventListener('reset', () => setTimeout(applyDocs, 0));
    applyDocs();
  }

  /* 3) Noticias: filtro por categoría y orden */
  const newsGrid = document.getElementById('grilla-noticias');
  if (newsGrid) {
    const pills = document.querySelectorAll('.filter-pill');
    const order = document.getElementById('orden-noticias');
    const counter = document.getElementById('contador-noticias');
    const none = document.getElementById('sin-noticias');
    const cards = [...newsGrid.querySelectorAll('.news-item')];
    let category = 'Todas';
    const renderNews = () => {
      cards.sort((a, b) => {
        if (order.value === 'az') return a.querySelector('h3').textContent.localeCompare(b.querySelector('h3').textContent, 'es');
        return order.value === 'asc' ? a.dataset.fecha.localeCompare(b.dataset.fecha) : b.dataset.fecha.localeCompare(a.dataset.fecha);
      });
      let n = 0;
      cards.forEach((card) => {
        newsGrid.appendChild(card);
        const ok = category === 'Todas' || card.dataset.cat === category;
        card.hidden = !ok;
        if (ok) n += 1;
      });
      counter.textContent = `${n} ${n === 1 ? 'noticia' : 'noticias'}`;
      none.hidden = n > 0;
    };
    pills.forEach((pill) => pill.addEventListener('click', () => {
      category = pill.dataset.cat;
      pills.forEach((p) => p.setAttribute('aria-pressed', String(p === pill)));
      renderNews();
    }));
    order.addEventListener('change', renderNews);
    renderNews();
  }

  /* 4) Buscador del sitio */
  const results = document.getElementById('resultados');
  if (results && window.INDICE) {
    const query = new URLSearchParams(location.search).get('q') || '';
    const input = document.getElementById('q');
    if (input) input.value = query;
    const filters = document.getElementById('filtros-busqueda');
    const order = document.getElementById('orden-busqueda');
    const counter = document.getElementById('contador-busqueda');
    const none = document.getElementById('sin-busqueda');
    const terms = norm(query).split(/\s+/).filter(Boolean);

    const score = (it) => {
      const text = norm(`${it.t} ${it.s} ${it.c}`);
      const title = norm(it.t);
      let sc = 1;
      for (const term of terms) {
        if (!text.includes(term)) return 0;
        sc += 1 + (title.includes(term) ? 2 : 0);
      }
      return sc;
    };
    const mark = (text) => {
      const n = norm(text);
      const ranges = [];
      terms.filter((t) => t.length > 1).forEach((t) => {
        for (let i = n.indexOf(t); i > -1; i = n.indexOf(t, i + t.length)) ranges.push([i, i + t.length]);
      });
      ranges.sort((a, b) => a[0] - b[0]);
      let out = '';
      let pos = 0;
      ranges.forEach(([from, to]) => {
        if (from < pos) return;
        out += `${esc(text.slice(pos, from))}<mark>${esc(text.slice(from, to))}</mark>`;
        pos = to;
      });
      return out + esc(text.slice(pos));
    };
    const renderSearch = () => {
      const cats = checked(filters, 'cat');
      const list = window.INDICE.map((it) => ({ it, s: score(it) }))
        .filter((x) => x.s > 0 && (!cats.length || cats.includes(x.it.c)));
      list.sort((a, b) => {
        if (order.value === 'az') return a.it.t.localeCompare(b.it.t, 'es');
        if (order.value === 'desc') return b.it.f.localeCompare(a.it.f);
        return b.s - a.s || a.it.t.localeCompare(b.it.t, 'es');
      });
      results.innerHTML = list.map(({ it }) => {
        const external = /^https?:/.test(it.u) ? ' target="_blank" rel="noopener"' : '';
        return `<article class="result"><span class="tag">${esc(it.c)}</span><h3><a href="${esc(it.u)}"${external}>${mark(it.t)}</a></h3><p>${mark(it.s)}</p></article>`;
      }).join('');
      counter.textContent = `${list.length} ${list.length === 1 ? 'resultado' : 'resultados'}${query ? ` para «${query}»` : ''}`;
      none.hidden = list.length > 0;
    };
    filters.addEventListener('change', renderSearch);
    filters.addEventListener('reset', () => setTimeout(renderSearch, 0));
    order.addEventListener('change', renderSearch);
    renderSearch();
  }
})();
