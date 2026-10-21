/* Municipalidad de Chaitén · comportamiento de filtros y buscador (sin librerías) */
(function () {
  'use strict';
  var norm = function (s) { return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var checked = function (form, name) { return Array.prototype.slice.call(form.querySelectorAll('input[name="' + name + '"]:checked')).map(function (i) { return i.value; }); };

  /* 1) Documentos de transparencia */
  var fd = document.getElementById('filtros-docs');
  if (fd) {
    var items = document.querySelectorAll('.doc-result');
    var cnt = document.getElementById('contador');
    var empty = document.getElementById('sin-resultados');
    var applyDocs = function () {
      var t = checked(fd, 'tipo'), a = checked(fd, 'anio'), n = 0;
      items.forEach(function (it) {
        var ok = (!t.length || t.indexOf(it.dataset.tipo) > -1) && (!a.length || a.indexOf(it.dataset.anio) > -1);
        it.hidden = !ok; if (ok) n++;
      });
      cnt.textContent = n + (n === 1 ? ' documento' : ' documentos');
      empty.hidden = n > 0;
    };
    fd.addEventListener('change', applyDocs);
    fd.addEventListener('reset', function () { setTimeout(applyDocs, 0); });
    applyDocs();
  }

  /* 2) Noticias: filtro por categoría y orden */
  var grid = document.getElementById('grilla-noticias');
  if (grid) {
    var pills = document.querySelectorAll('.filter-pill');
    var sel = document.getElementById('orden-noticias');
    var cn = document.getElementById('contador-noticias');
    var none = document.getElementById('sin-noticias');
    var cat = 'Todas';
    var cards = Array.prototype.slice.call(grid.querySelectorAll('.news-item'));
    var renderNews = function () {
      var dir = sel.value;
      cards.sort(function (a, b) {
        if (dir === 'az') return a.querySelector('h3').textContent.localeCompare(b.querySelector('h3').textContent, 'es');
        return dir === 'asc' ? a.dataset.fecha.localeCompare(b.dataset.fecha) : b.dataset.fecha.localeCompare(a.dataset.fecha);
      });
      var n = 0;
      cards.forEach(function (c) {
        grid.appendChild(c);
        var ok = cat === 'Todas' || c.dataset.cat === cat;
        c.hidden = !ok; if (ok) n++;
      });
      cn.textContent = n + (n === 1 ? ' noticia' : ' noticias');
      none.hidden = n > 0;
    };
    pills.forEach(function (p) {
      p.addEventListener('click', function () {
        cat = p.dataset.cat;
        pills.forEach(function (x) { x.removeAttribute('aria-current'); });
        p.setAttribute('aria-current', 'true');
        renderNews();
      });
    });
    sel.addEventListener('change', renderNews);
    renderNews();
  }

  /* 3) Buscador del sitio */
  var box = document.getElementById('resultados');
  if (box && window.INDICE) {
    var q = new URLSearchParams(location.search).get('q') || '';
    var input = document.getElementById('q');
    if (input) input.value = q;
    var fs = document.getElementById('filtros-busqueda');
    var ord = document.getElementById('orden-busqueda');
    var cb = document.getElementById('contador-busqueda');
    var sn = document.getElementById('sin-busqueda');
    var terms = norm(q).split(/\s+/).filter(Boolean);
    var score = function (it) {
      var hay = norm(it.t + ' ' + it.s + ' ' + it.c), tt = norm(it.t), sc = 1;
      for (var i = 0; i < terms.length; i++) {
        if (hay.indexOf(terms[i]) < 0) return 0;
        sc += 1 + (tt.indexOf(terms[i]) > -1 ? 2 : 0);
      }
      return sc;
    };
    var mark = function (text) {
      var n = norm(text), r = [];
      terms.forEach(function (t) {
        if (t.length < 2) return;
        var i = 0;
        while ((i = n.indexOf(t, i)) > -1) { r.push([i, i + t.length]); i += t.length; }
      });
      r.sort(function (a, b) { return a[0] - b[0]; });
      var out = '', pos = 0;
      r.forEach(function (x) {
        if (x[0] < pos) return;
        out += esc(text.slice(pos, x[0])) + '<mark>' + esc(text.slice(x[0], x[1])) + '</mark>';
        pos = x[1];
      });
      return out + esc(text.slice(pos));
    };
    var renderSearch = function () {
      var cats = checked(fs, 'cat');
      var list = window.INDICE.map(function (it) { return { it: it, s: score(it) }; })
        .filter(function (x) { return x.s > 0 && (!cats.length || cats.indexOf(x.it.c) > -1); });
      var o = ord.value;
      list.sort(function (a, b) {
        if (o === 'az') return a.it.t.localeCompare(b.it.t, 'es');
        if (o === 'desc') return b.it.f.localeCompare(a.it.f);
        return b.s - a.s || a.it.t.localeCompare(b.it.t, 'es');
      });
      box.innerHTML = list.map(function (x) {
        var it = x.it, ex = /^https?:/.test(it.u) ? ' target="_blank" rel="noopener"' : '';
        return '<article class="result"><span class="tag">' + esc(it.c) + '</span><h3><a href="' + esc(it.u) + '"' + ex + '>' + mark(it.t) + '</a></h3><p>' + mark(it.s) + '</p></article>';
      }).join('');
      cb.textContent = list.length + (list.length === 1 ? ' resultado' : ' resultados') + (q ? ' para «' + q + '»' : '');
      sn.hidden = list.length > 0;
    };
    fs.addEventListener('change', renderSearch);
    fs.addEventListener('reset', function () { setTimeout(renderSearch, 0); });
    ord.addEventListener('change', renderSearch);
    renderSearch();
  }
})();
