(() => {
'use strict';
const data=JSON.parse(document.getElementById('iceland-route-data').textContent);
document.querySelectorAll('.daily-inline-route').forEach(root => {
const canvas=root.querySelector('.route-canvas'), metric=root.querySelector('.route-estimate'), note=root.querySelector('.route-note'), status=root.querySelector('.route-status'), list=root.querySelector('.route-stop-list'), enable=root.querySelector('.route-enable');
const card=root.closest('.day-card');
let map=null,layer=null,markers=[],bounds=null,current=root.dataset.routeDay,drawn=null,active=false;
function setInteraction(on){if(!map)return;active=on;['dragging','touchZoom','doubleClickZoom','scrollWheelZoom'].forEach(k=>map[k][on?'enable':'disable']());enable.setAttribute('aria-pressed',String(on));enable.textContent=on?'完成地圖操作':'啟用拖曳／雙指縮放';canvas.classList.toggle('route-locked',!on)}
function createMap(){if(map)return true;if(!window.L){canvas.innerHTML='<p class="route-empty">地圖程式無法載入，仍可使用下方地點連結與道路／天氣資訊。</p>';return false;}
canvas.replaceChildren();map=L.map(canvas,{scrollWheelZoom:false,dragging:false,touchZoom:false,doubleClickZoom:false,keyboard:true,inertia:false,zoomAnimation:false,fadeAnimation:false,markerZoomAnimation:false});
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:18,referrerPolicy:'origin',attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors · <a href="https://www.openstreetmap.org/fixthemap" target="_blank" rel="noopener">修正地圖</a>'}).on('tileerror',()=>{status.textContent='底圖暫時無法載入；編號與路線仍保留，可使用地點連結。'}).addTo(map);
layer=L.layerGroup().addTo(map);return true;}
function popup(p,i){const el=document.createElement('div'),b=document.createElement('strong'),a=document.createElement('a');b.textContent=(i+1)+'. '+p.label;el.append(b,document.createElement('br'));a.href='https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(p.label+' Iceland');a.target='_blank';a.rel='noopener noreferrer';a.textContent='開啟地點 ↗';el.append(a);if(p.source){el.append(document.createElement('br'));const source=document.createElement('a');source.href=p.source;source.target='_blank';source.rel='noopener noreferrer';source.textContent='定位來源 ↗';el.append(source)}return el;}
function fit(){if(map&&bounds){map.closePopup();map.invalidateSize();map.fitBounds(bounds,{padding:[35,35],maxZoom:12,animate:false});}}
function draw(){if(!current||!createMap())return;const d=data.days[current];if(drawn===current){fit();return}drawn=current;layer.clearLayers();markers=[];
if(d.route&&d.route.geometry){L.geoJSON(d.route.geometry,{style:{color:'#242720',weight:5,opacity:.9}}).addTo(layer)}
const groups=new Map();d.points.forEach((p,i)=>{const k=p.lat.toFixed(5)+','+p.lon.toFixed(5);if(!groups.has(k))groups.set(k,[]);groups.get(k).push({p,i})});groups.forEach(group=>{const p=group[0].p, numbers=group.map(x=>x.i+1).join('/'),content=document.createElement('div');group.forEach(x=>content.append(popup(x.p,x.i)));if(group.length>1){const note=document.createElement('p');note.textContent='共用停車／道路入口；景點之間另需步行。';content.append(note)}const m=L.marker([p.lat,p.lon],{icon:L.divIcon({className:'route-number',html:numbers,iconSize:[group.length>1?44:36,36],iconAnchor:[group.length>1?22:18,18]}),title:group.map(x=>(x.i+1)+'. '+x.p.label).join(' / '),alt:numbers+' 地點',keyboard:true}).bindPopup(content,{autoPan:false}).addTo(layer);group.forEach(x=>markers[x.i]=m)});
const coordinates=d.route?.geometry?.coordinates?.map(p=>[p[1],p[0]])||d.points.map(p=>[p.lat,p.lon]);bounds=coordinates.length?L.latLngBounds(coordinates):null;if(bounds)fit();else map.setView([64.9,-19],6);setInteraction(false);}
function show(id){const d=data.days[id];if(!d)return;current=id;status.textContent='';list.replaceChildren();
if(d.route){const minutes=Math.round(d.route.duration/60);metric.textContent='已定位路段約 '+Math.round(d.route.distance/1000)+' km · '+Math.floor(minutes/60)+' 小時 '+minutes%60+' 分（開車估算）';}else metric.textContent=d.mode==='walk'?'市區散步日 · 不以開車時間代替步行估算':'未有可計算的完整道路區段';
note.textContent=d.note+' 距離／時間不含停留、天候、封路與交通；以當日道路公告為準。';
d.points.forEach((p,i)=>{const li=document.createElement('li'),b=document.createElement('button'),n=document.createElement('b');b.type='button';n.textContent=i+1;b.append(n,document.createTextNode(p.label));b.addEventListener('click',()=>{draw();if(markers[i]){map.setView(markers[i].getLatLng(),13,{animate:false});markers[i].openPopup();}});li.append(b);list.append(li)});
if(map)draw();}
new MutationObserver(()=>{if(card.hidden||card.style.display==='none'){card.querySelectorAll('.contact-disclosure').forEach(d=>d.open=false);if(map){map.closePopup();setInteraction(false)}}else if(map){requestAnimationFrame(()=>{map.invalidateSize();fit()})}}).observe(card,{attributes:true,attributeFilter:['hidden','style']});
root.querySelector('.route-reset').addEventListener('click',()=>{draw();fit();});enable.addEventListener('click',()=>{draw();setInteraction(!active);});
root.addEventListener('keydown',e=>{if(e.key==='Escape'){setInteraction(false);enable.focus();}});
new ResizeObserver(()=>{if(map)map.invalidateSize()}).observe(canvas);
show(current);
new IntersectionObserver((entries,observer)=>{if(entries.some(e=>e.isIntersecting)&&!card.hidden&&card.style.display!=='none'){draw();observer.disconnect()}},{rootMargin:'40px'}).observe(canvas);
});
})();
