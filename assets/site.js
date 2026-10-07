(() => {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const cards = [...document.querySelectorAll('.day-card')];
  if (!cards.length) return;
  const controls = {country: $('#country'), day: $('#day'), region: $('#region'), search: $('#search')};
  const weeks = [...document.querySelectorAll('.week-chip')];
  const weekIds = weeks.map(b => b.dataset.week).filter(v => v !== 'all');
  const searchable = new Map(cards.map(c => [c, c.textContent.toLocaleLowerCase()]));
  let activeWeek = 'all';
  function filter() {
    const country = controls.country.value, day = controls.day.value, region = controls.region.value;
    const query = controls.search.value.trim().toLocaleLowerCase();
    let count = 0;
    cards.forEach(c => {
      const show = (country === 'all' || c.dataset.country.split('|').includes(country)) &&
        (activeWeek === 'all' || c.dataset.week === activeWeek) &&
        (day === 'all' || c.dataset.day === day) &&
        (region === 'all' || c.dataset.region === region) &&
        (!query || searchable.get(c).includes(query));
      c.hidden = !show;
      if (show) count++;
    });
    document.querySelectorAll('.chapter-block').forEach(ch => {
      ch.hidden = ![...ch.querySelectorAll('.day-card')].some(c => !c.hidden);
    });
    weeks.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.week === activeWeek)));
    const index = weekIds.indexOf(activeWeek);
    $('#prev-week').disabled = index <= 0;
    $('#next-week').disabled = index === weekIds.length - 1;
    $('#active-week').textContent = activeWeek === 'all' ? '全部週次' : `第 ${activeWeek} 週`;
    $('#result-count').textContent = `顯示 ${count} / ${cards.length} 張示例日程卡`;
    $('#no-results').hidden = count > 0;
  }
  function chooseWeek(value) {
    activeWeek = value;
    controls.day.value = 'all';
    filter();
  }
  function clear() {
    activeWeek = 'all';
    controls.country.value = controls.day.value = controls.region.value = 'all';
    controls.search.value = '';
    filter();
  }
  weeks.forEach(b => b.addEventListener('click', () => chooseWeek(b.dataset.week)));
  $('#prev-week').addEventListener('click', () => {
    const i = weekIds.indexOf(activeWeek); if (i > 0) chooseWeek(weekIds[i - 1]);
  });
  $('#next-week').addEventListener('click', () => {
    const i = weekIds.indexOf(activeWeek); if (i < weekIds.length - 1) chooseWeek(weekIds[i + 1]);
  });
  ['country', 'region'].forEach(k => controls[k].addEventListener('change', filter));
  controls.day.addEventListener('change', () => { activeWeek = 'all'; filter(); });
  controls.search.addEventListener('input', filter);
  $('#show-results').addEventListener('click', () => $('#days').scrollIntoView({block:'start'}));
  $('#clear-filters').addEventListener('click', clear);
  $('#empty-reset').addEventListener('click', clear);
  $('#print').addEventListener('click', () => window.print());
  const boxes = [...document.querySelectorAll('input[data-save]')];
  const key = `public-travel-guide-${document.body.dataset.guide}-v1`;
  let saved = {};
  try { const parsed = JSON.parse(localStorage.getItem(key) || '{}'); if (parsed && typeof parsed === 'object') saved = parsed; } catch {}
  function progress() { $('#packing-progress').textContent = `已勾選 ${boxes.filter(b => b.checked).length} / ${boxes.length} 項`; }
  function save() { try { localStorage.setItem(key, JSON.stringify(saved)); } catch { $('#packing-progress').textContent += ' · 此瀏覽器無法保存'; } }
  boxes.forEach(b => {
    b.checked = saved[b.dataset.save] === true;
    b.addEventListener('change', () => { saved[b.dataset.save] = b.checked; progress(); save(); });
  });
  $('#reset-packing').addEventListener('click', () => { saved = {}; boxes.forEach(b => b.checked = false); progress(); save(); });
  filter(); progress();
})();
