/* Iceland-only daily itinerary controller. Shared Canada assets stay unchanged. */
(() => {
  'use strict';
  if (document.body.dataset.guide !== 'iceland') return;
  const $ = (s) => document.querySelector(s);
  const cards = [...document.querySelectorAll('.day-card')];
  if (!cards.length) return;
  const controls = {country: $('#country'), day: $('#day'), region: $('#region'), search: $('#search')};
  const weeks = [...document.querySelectorAll('.week-chip')];
  const weekIds = weeks.map(b => b.dataset.week).filter(v => v !== 'all');
  const dates = [...document.querySelectorAll('.date-chip')];
  const searchable = new Map(cards.map(c => [c, c.textContent.toLocaleLowerCase()]));
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  const motionKey = 'public-travel-guide-iceland-reduced-motion';
  let userReduced = false, activeWeek = 'all';
  try { userReduced = localStorage.getItem(motionKey) === 'true'; } catch {}
  function reduced() { return media.matches || userReduced; }
  function syncMotion() {
    document.body.classList.toggle('daily-reduced-motion', reduced());
    document.documentElement.classList.toggle('iceland-reduced-motion', reduced());
    $('#reduce-motion').checked = reduced();
    $('#reduce-motion').disabled = media.matches;
    $('#motion-label').textContent = media.matches ? '已依系統減少動態效果' : '減少動態效果';
    if (reduced()) document.querySelectorAll('.day-enter, .illustration-float').forEach(el => {
      el.classList.remove('day-enter', 'illustration-float');
    });
  }
  $('#reduce-motion').addEventListener('change', () => {
    userReduced = $('#reduce-motion').checked;
    try { localStorage.setItem(motionKey, String(userReduced)); } catch {}
    syncMotion();
  });
  if (media.addEventListener) media.addEventListener('change', syncMotion);
  else media.addListener(syncMotion);
  syncMotion();
  function floatOnce(el) {
    if (!el || reduced()) return;
    el.classList.remove('illustration-float');
    void el.offsetWidth;
    el.classList.add('illustration-float');
  }
  document.addEventListener('animationend', e => {
    if (e.animationName === 'iceland-day-arrive') e.target.classList.remove('day-enter');
    if (e.animationName === 'iceland-art-float') e.target.classList.remove('illustration-float');
  });
  function filter(animate = false) {
    const country = controls.country.value, day = controls.day.value, region = controls.region.value;
    const query = controls.search.value.trim().toLocaleLowerCase();
    const single = day !== 'all';
    document.body.classList.toggle('daily-single-view', single);
    let count = 0, selected;
    cards.forEach(c => {
      const show = (country === 'all' || c.dataset.country.split('|').includes(country)) &&
        (activeWeek === 'all' || c.dataset.week === activeWeek) &&
        (day === 'all' || c.dataset.day === day) &&
        (region === 'all' || c.dataset.region === region) &&
        (!query || searchable.get(c).includes(query));
      if (c.hidden === show) c.hidden = !show;
      c.classList.remove('day-enter');
      if (show) { count++; selected = c; }
    });
    document.querySelectorAll('.chapter-block').forEach(ch => {
      ch.hidden = ![...ch.querySelectorAll('.day-card')].some(c => !c.hidden);
    });
    dates.forEach(b => {
      const chosen = b.dataset.selectDay === day;
      b.setAttribute('aria-pressed', String(chosen));
      b.tabIndex = chosen || (!single && b === dates[0]) ? 0 : -1;
    });
    $('#all-days').setAttribute('aria-pressed', String(!single));
    weeks.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.week === activeWeek)));
    const index = weekIds.indexOf(activeWeek);
    $('#prev-week').disabled = index <= 0;
    $('#next-week').disabled = index === weekIds.length - 1;
    $('#active-week').textContent = activeWeek === 'all' ? '全部週次' : `第 ${activeWeek} 週`;
    $('#result-count').textContent = single && selected ?
      `${selected.dataset.date.replace('2026-', '').replace('-', '/')} · Day ${day} · ${selected.querySelector('h3').textContent}` :
      `顯示 ${count} / ${cards.length} 天行程${query ? ' · 搜尋所有日期' : ''}`;
    $('#no-results').hidden = count > 0;
    if (animate && single && selected && !reduced()) {
      void selected.offsetWidth;
      selected.classList.add('day-enter');
      floatOnce(selected.querySelector('.day-illustration'));
    }
  }
  function clearFields() {
    activeWeek = 'all';
    controls.country.value = controls.day.value = controls.region.value = 'all';
    controls.search.value = '';
  }
  function recordView(mode = 'push', hash = '#days') {
    const state = {icelandDaily:{day:controls.day.value, week:activeWeek, country:controls.country.value, region:controls.region.value, search:controls.search.value}};
    const same = JSON.stringify(window.history.state?.icelandDaily) === JSON.stringify(state.icelandDaily) && location.hash === hash;
    window.history[same || mode === 'replace' ? 'replaceState' : 'pushState'](state, '', hash);
  }
  function restoreView(state) {
    const view = state?.icelandDaily;
    if (!view) return false;
    clearFields();
    for (const key of ['country','day','region','search']) {
      if (typeof view[key] === 'string') controls[key].value = view[key];
      if (key !== 'search' && !controls[key].value) controls[key].value = 'all';
    }
    activeWeek = weekIds.includes(view.week) ? view.week : 'all';
    filter();
    return true;
  }
  function showDay(value, {animate = true, history = false, focus = false} = {}) {
    clearFields();
    controls.day.value = String(value);
    filter(animate);
    const button = dates.find(b => b.dataset.selectDay === String(value));
    if (button) {
      // Scroll only the date strip, never jerk the whole page during a switch.
      const strip = $('.date-strip');
      const left = button.offsetLeft - strip.offsetLeft - (strip.clientWidth - button.offsetWidth) / 2;
      strip.scrollTo({left, behavior: reduced() ? 'instant' : 'smooth'});
      if (focus) button.focus({preventScroll:true});
    }
    if (history) recordView('push', `#day-${value}`);
  }
  function clear() { clearFields(); filter(); recordView(); }
  dates.forEach((b, i) => {
    b.addEventListener('click', () => showDay(b.dataset.selectDay, {history:true}));
    b.addEventListener('keydown', e => {
      let next;
      if (e.key === 'ArrowRight') next = (i + 1) % dates.length;
      if (e.key === 'ArrowLeft') next = (i - 1 + dates.length) % dates.length;
      if (e.key === 'Home') next = 0;
      if (e.key === 'End') next = dates.length - 1;
      if (next === undefined) return;
      e.preventDefault();
      showDay(dates[next].dataset.selectDay, {history:true, focus:true});
    });
  });
  function chooseWeek(value) { activeWeek = value; controls.day.value = 'all'; filter(); recordView(); }
  weeks.forEach(b => b.addEventListener('click', () => chooseWeek(b.dataset.week)));
  $('#prev-week').addEventListener('click', () => {
    const i = weekIds.indexOf(activeWeek); if (i > 0) chooseWeek(weekIds[i - 1]);
  });
  $('#next-week').addEventListener('click', () => {
    const i = weekIds.indexOf(activeWeek); if (i < weekIds.length - 1) chooseWeek(weekIds[i + 1]);
  });
  ['country', 'region'].forEach(k => controls[k].addEventListener('change', () => { controls.day.value = 'all'; filter(); recordView(); }));
  controls.day.addEventListener('change', () => { activeWeek = 'all'; filter(true); recordView('push', controls.day.value === 'all' ? '#days' : `#day-${controls.day.value}`); });
  controls.search.addEventListener('input', () => {
    const wasSingle = controls.day.value !== 'all';
    activeWeek = 'all'; controls.day.value = 'all'; filter(); recordView(wasSingle ? 'push' : 'replace');
  });
  $('#show-results').addEventListener('click', () => $('#days').scrollIntoView({block:'start', behavior:reduced()?'instant':'smooth'}));
  $('#clear-filters').addEventListener('click', clear);
  $('#empty-reset').addEventListener('click', clear);
  $('#all-days').addEventListener('click', clear);
  $('#print').addEventListener('click', () => window.print());
  // CSS prints all ten days without mutating the selected date or filters.
  function revealHash(scroll = false) {
    let target;
    try { target = document.getElementById(decodeURIComponent(location.hash.slice(1))); } catch {}
    const card = target?.closest('.day-card');
    if (!card) return false;
    showDay(card.dataset.day, {animate:false});
    if (scroll) requestAnimationFrame(() => target.scrollIntoView({block:'start', behavior:'instant'}));
    return true;
  }
  document.addEventListener('click', e => {
    const link = e.target.closest('a[href^="#"]');
    if (!link || e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
    let target;
    try { target = document.getElementById(decodeURIComponent(link.getAttribute('href').slice(1))); } catch {}
    if (!target) return;
    e.preventDefault();
    const card = target.closest('.day-card');
    if (card) showDay(card.dataset.day, {animate:false});
    recordView('push', link.getAttribute('href'));
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({preventScroll:true});
    target.scrollIntoView({block:'start', behavior:reduced()?'instant':'smooth'});
  });
  window.addEventListener('hashchange', () => {
    if (window.history.state?.icelandDaily) return;
    if (revealHash(true)) recordView('replace', location.hash);
  });
  window.addEventListener('popstate', e => {
    if (!restoreView(e.state)) revealHash(true);
  });
  const boxes = [...document.querySelectorAll('input[data-save]')];
  const key = 'public-travel-guide-iceland-v1';
  let saved = {};
  try { const parsed = JSON.parse(localStorage.getItem(key) || '{}'); if (parsed && typeof parsed === 'object') saved = parsed; } catch {}
  function progress() { $('#packing-progress').textContent = `已勾選 ${boxes.filter(b => b.checked).length} / ${boxes.length} 項`; }
  function save() { try { localStorage.setItem(key, JSON.stringify(saved)); } catch { $('#packing-progress').textContent += ' · 此瀏覽器無法保存'; } }
  boxes.forEach(b => {
    b.checked = saved[b.dataset.save] === true;
    b.addEventListener('change', () => { saved[b.dataset.save] = b.checked; progress(); save(); });
  });
  $('#reset-packing').addEventListener('click', () => { saved = {}; boxes.forEach(b => b.checked = false); progress(); save(); });
  // Iceland is UTC year-round. Outside the trip, start with the first day.
  const today = new Date().toISOString().slice(0,10);
  const defaultDay = cards.find(c => c.dataset.date === today)?.dataset.day || '1';
  $('.daily-date-ui').hidden = false;
  document.body.classList.add('daily-enhanced');
  if (!restoreView(window.history.state) && !revealHash(true)) showDay(defaultDay, {animate:false});
  recordView('replace', location.hash || '#finder');
  progress();
  floatOnce($('.cover-illustration img'));
})();

;(() => {
  'use strict';
  document.querySelectorAll('.travel-tools').forEach(tool => {
    const details=tool.querySelector('.map-disclosure'), select=tool.querySelector('.travel-stop'), load=tool.querySelector('.load-map'), hide=tool.querySelector('.hide-map'), slot=tool.querySelector('.travel-map'), status=tool.querySelector('.travel-status');
    if(!details) return;
    const mapLink=tool.querySelector('.open-map'), nav=tool.querySelector('.open-navigation'), copy=tool.querySelector('.copy-place');
    let loaded=false;
    function clearMap(){slot.replaceChildren();loaded=false;hide.hidden=true;load.hidden=false;}
    function update(){const q=select.value;mapLink.href='https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(q);nav.href='https://www.google.com/maps/dir/?api=1&destination='+encodeURIComponent(q);clearMap();status.textContent='';}
    select.addEventListener('change',update);
    load.addEventListener('click',()=>{if(loaded)return;const frame=document.createElement('iframe');frame.title='地圖：'+select.selectedOptions[0].textContent;frame.referrerPolicy='no-referrer';frame.loading='lazy';frame.src='https://maps.google.com/maps?q='+encodeURIComponent(select.value)+'&output=embed';slot.replaceChildren(frame);loaded=true;hide.hidden=false;load.hidden=true;status.textContent='地圖由 Google 提供；若未顯示，可使用「在 Google Maps 開啟」。';});
    hide.addEventListener('click',()=>{clearMap();load.focus();status.textContent='地圖已關閉。';});
    details.addEventListener('toggle',()=>{if(!details.open)clearMap();});
    copy.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(select.value);status.textContent='已複製地點名稱。';}catch{status.textContent='請長按複製：'+select.value;}});
    const card=tool.closest('.day-card');new MutationObserver(()=>{if(card.hidden || card.style.display==='none'){details.open=false;tool.querySelectorAll('details').forEach(d=>d.open=false);clearMap();}}).observe(card,{attributes:true,attributeFilter:['hidden','style']});
    update();
  });
})();
