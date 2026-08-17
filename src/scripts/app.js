// Data loaded from external JSON
let laborLawData = [];
let aiMonitorData = [];
let countryNameMap = {};
let countryDetailPages = {};

async function loadData() {
  try {
    const res = await fetch('./data/laws.json');
    const data = await res.json();
    laborLawData = data.laborLawData;
    aiMonitorData = data.aiMonitorData;
    countryNameMap = data.countryNameMap;
    countryDetailPages = data.countryDetailPages;
  } catch (e) {
    console.error('Failed to load law data:', e);
  }
}

const i18n={
  zh:{title:"全球劳动法规智能监控",heroTitle:"全球劳动法规智能监控",notifications:"通知中心",close:"关闭",all:"全部",sortDate:"按更新日期",sortCountry:"按国家",libTitle:"就业法规库",libSub:"所选国家/地区的全部就业法规",searchPlaceholder:"🔍 搜索法规、国家或HR主题...",globeInfo:"点击国家放大 · 滚轮缩放 · 返回世界视图",backToWorld:"返回世界视图",resetFilters:"重置筛选",countryRegion:"国家/地区",regulationType:"法规类型",updated:"排序方式",viewDetails:"查看详情 →",viewAll:"查看全部更新 →",regulationTimeline:"── 法规时间线 ──",regulationLibrary:"── 法规库 ──",regulatoryInsights:"法规洞察",upcomingDates:"即将生效日期",aiImpactSummary:"AI影响摘要"},
  en:{title:"Global Labor Law Intelligence",heroTitle:"Global Labor Law Intelligence",notifications:"Notifications",close:"Close",all:"All",sortDate:"By Update Date",sortCountry:"By Country",libTitle:"Regulation Library",libSub:"All employment regulations for selected countries",searchPlaceholder:"🔍 Search regulations, countries or HR topics...",globeInfo:"Click country to zoom · Scroll to zoom · Return to world view",backToWorld:"Return to World View",resetFilters:"Reset filters",countryRegion:"Country / Region",regulationType:"Regulation Type",updated:"Sort",viewDetails:"View Details →",viewAll:"View All Updates →",regulationTimeline:"── REGULATORY TIMELINE ──",regulationLibrary:"── REGULATION LIBRARY ──",regulatoryInsights:"REGULATORY INSIGHTS",upcomingDates:"UPCOMING EFFECTIVE DATES",aiImpactSummary:"AI IMPACT SUMMARY"},
  es:{title:"Inteligencia Laboral Global",heroTitle:"Inteligencia Laboral Global",notifications:"Notificaciones",close:"Cerrar",all:"Todos",sortDate:"Por Fecha",sortCountry:"Por País",libTitle:"Biblioteca de Regulaciones",libSub:"Todas las regulaciones laborales",searchPlaceholder:"🔍 Buscar regulaciones, países o temas de RRHH...",globeInfo:"Haga clic para ampliar · Rueda del ratón para zoom",backToWorld:"Vista Mundial",resetFilters:"Restablecer filtros",countryRegion:"País / Región",regulationType:"Tipo de Regulación",updated:"Ordenar",viewDetails:"Ver Detalles →",viewAll:"Ver Todas las Actualizaciones →",regulationTimeline:"── LÍNEA DE TIEMPO ──",regulationLibrary:"── BIBLIOTECA ──",regulatoryInsights:"PERSPECTIVAS",upcomingDates:"FECHAS PRÓXIMAS",aiImpactSummary:"RESUMEN DE IMPACTO IA"}
};

let currentLang='zh',currentRegion='',currentSort='date',mapInstance=null,geoLayer=null,geoData=null,currentZoom=2,selectedCountry=null,filteredData=[...laborLawData];

function switchLang(lang){currentLang=lang;applyFilters();updateLangButton();renderNotifPanel();updateI18nText();populateRegionTabs()}
function updateLangButton(){const b=document.getElementById('langBtn');b.textContent=currentLang==='zh'?'🌐 中文':currentLang==='en'?'🌐 English':'🌐 Español'}
function updateI18nText(){const t=i18n[currentLang];document.querySelectorAll('[data-i18n]').forEach(el=>{const k=el.getAttribute('data-i18n');if(t[k])el.textContent=t[k]});document.querySelectorAll('[data-i18n-ph]').forEach(el=>{const k=el.getAttribute('data-i18n-ph');if(t[k])el.placeholder=t[k]})}
function toggleDD(id){document.getElementById(id).classList.toggle('open')}
function toggleTheme(){const h=document.documentElement;const d=h.getAttribute('data-theme')==='dark';h.setAttribute('data-theme',d?'light':'dark');document.getElementById('themeBtn').textContent=d?'☀️':'🌙'}
function toggleNotifPanel(){document.getElementById('notifPanel').classList.toggle('open')}
function showToast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2500)}

function populateCountryFilter(){const sel=document.getElementById('filterCountry');const countries=[...new Set(laborLawData.map(d=>d.country))].sort();sel.innerHTML='<option value="">'+i18n[currentLang].all+'</option>';countries.forEach(c=>{const o=document.createElement('option');o.value=c;o.textContent=c;sel.appendChild(o)})}

const regions=[{key:'',label:{zh:'全球',en:'Global',es:'Global'}},{key:'Asia',label:{zh:'亚洲',en:'Asia',es:'Asia'}},{key:'Europe',label:{zh:'欧洲',en:'Europe',es:'Europa'}},{key:'Americas',label:{zh:'美洲',en:'Americas',es:'Américas'}},{key:'Africa',label:{zh:'非洲',en:'Africa',es:'África'}},{key:'Oceania',label:{zh:'大洋洲',en:'Oceania',es:'Oceanía'}}];
let currentTabRegion='';

function populateRegionTabs(){const el=document.getElementById('heroChips');el.innerHTML='';regions.forEach(r=>{const btn=document.createElement('button');btn.className='tab-btn'+(r.key===currentTabRegion?' active':'');btn.textContent=r.label[currentLang];btn.onclick=()=>{currentTabRegion=r.key;document.getElementById('filterRegion').value=r.key;applyFilters();populateRegionTabs()};el.appendChild(btn)})}

function onBizChange(){applyFilters()}
function onCountrySelectChange(){applyFilters()}

function applyFilters(){
  const region=document.getElementById('filterRegion').value||currentTabRegion;
  const country=document.getElementById('filterCountry').value;
  const biz=document.getElementById('filterBiz').value;
  const sort=document.getElementById('sortBy').value;
  const search=document.getElementById('searchInput').value.toLowerCase().trim();
  currentRegion=region;currentSort=sort;currentTabRegion=region;
  let d=[...laborLawData];
  if(region)d=d.filter(r=>r.region===region);
  if(country)d=d.filter(r=>r.country===country);
  if(biz)d=d.filter(r=>r.category===biz||r.subCategory===biz);
  if(search)d=d.filter(r=>(r.country+' '+r.law+' '+r.category+' '+r.summary+' '+r.summaryZh+' '+r.flag+' '+r.modules.join(' ')).toLowerCase().includes(search));
  if(sort==='date')d.sort((a,b)=>new Date(b.lastUpdated)-new Date(a.lastUpdated));
  else d.sort((a,b)=>a.country.localeCompare(b.country));
  filteredData=d;
  renderTimeline();renderLawCards();updateKPIs();renderUpcoming();renderAISummary();renderTicker();
  document.getElementById('libCount').textContent='Showing '+d.length+' regulations';
}

function resetFilters(){document.getElementById('filterRegion').value='';document.getElementById('filterCountry').value='';document.getElementById('filterBiz').value='';document.getElementById('sortBy').value='date';document.getElementById('searchInput').value='';currentTabRegion='';applyFilters();populateRegionTabs()}

function renderTimeline(){
  const el=document.getElementById('timeline');
  const sorted=[...filteredData].sort((a,b)=>new Date(b.lastUpdated)-new Date(a.lastUpdated));
  const groups={};
  sorted.forEach(item=>{const d=new Date(item.lastUpdated);const y=d.getFullYear();if(!groups[y])groups[y]=[];groups[y].push(item)});
  let html='';
  Object.keys(groups).sort((a,b)=>b-a).forEach(year=>{
    html+='<div class="tl-group"><div class="tl-year">'+year+'</div>';
    groups[year].forEach(item=>{
      const d=new Date(item.lastUpdated);const months=['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
      const dateStr=months[d.getMonth()]+' '+String(d.getDate()).padStart(2,'0');
      html+='<div class="tl-entry" onclick="openDetail(\''+item.id+'\')">';
      html+='<div class="tl-left"><div class="tl-dot"></div><div class="tl-date">'+dateStr+'</div></div>';
      html+='<div class="tl-right"><div class="tl-meta"><span class="tl-flag">'+item.flag+'</span><span class="tl-country">'+item.country+'</span><span class="tl-cat">'+item.category+'</span></div>';
      html+='<div class="tl-law">'+item.law+'</div>';
      html+='<div class="tl-summary">'+(currentLang==='zh'?item.summaryZh:item.summary)+'</div>';
      html+='<div class="tl-link">'+i18n[currentLang].viewDetails+'</div></div></div>';
    });
    html+='</div>';
  });
  if(!html)html='<div style="padding:20px;text-align:center;color:var(--text3)">No regulations match your filters.</div>';
  el.innerHTML=html;
}

function renderLawCards(){
  const el=document.getElementById('lawCards');let html='';
  filteredData.forEach(item=>{
    const sc=item.status==='effective'?'effective':item.status==='upcoming'?'upcoming':item.status==='action-required'?'action-required':'active';
    const sl=item.status==='effective'?'Effective':item.status==='upcoming'?'Upcoming':item.status==='action-required'?'Action Required':'Active';
    html+='<div class="law-card" onclick="openDetail(\''+item.id+'\')">';
    html+='<div class="lc-top"><span class="lc-flag">'+item.flag+'</span><span class="lc-country">'+item.country+'</span></div>';
    html+='<div class="lc-title">'+item.law+'</div>';
    html+='<div class="lc-cat">'+item.category+'</div>';
    html+='<div class="lc-date">· '+item.lastUpdated+'</div>';
    html+='<div class="lc-summary">'+(currentLang==='zh'?item.summaryZh:item.summary)+'</div>';
    html+='<div class="lc-footer"><span class="lc-status '+sc+'">'+sl+'</span><span class="lc-link">'+i18n[currentLang].viewDetails+'</span></div>';
    html+='</div>';
  });
  if(!html)html='<div class="lib-empty">No regulations match your filters.</div>';
  el.innerHTML=html;
}

function updateKPIs(){
  document.getElementById('kTotal').textContent=laborLawData.length;
  document.getElementById('kCountries').textContent=[...new Set(laborLawData.map(d=>d.country))].length;
  const thirty=new Date();thirty.setDate(thirty.getDate()-30);
  document.getElementById('kUpdated30').textContent=laborLawData.filter(d=>new Date(d.lastUpdated)>=thirty).length;
  document.getElementById('kAction').textContent=laborLawData.filter(d=>d.status==='action-required'||d.status==='upcoming').length;
}

function renderUpcoming(){
  const el=document.getElementById('upcomingList');
  const upcoming=laborLawData.filter(d=>d.effectiveDate).sort((a,b)=>new Date(a.effectiveDate)-new Date(b.effectiveDate)).slice(0,6);
  let html='';
  upcoming.forEach(item=>{
    html+='<div class="upcoming-item" onclick="openDetail(\''+item.id+'\')">';
    html+='<div class="upcoming-date">'+item.effectiveDate+' · '+item.flag+' '+item.country+'</div>';
    html+='<div class="upcoming-title">'+item.law.substring(0,50)+(item.law.length>50?'...':'')+'</div>';
    html+='</div>';
  });
  el.innerHTML=html;
}

function renderAISummary(){
  const el=document.getElementById('aiSummary');
  const thirty=new Date();thirty.setDate(thirty.getDate()-30);
  const recent=laborLawData.filter(d=>new Date(d.lastUpdated)>=thirty);
  const byCat={};recent.forEach(d=>{byCat[d.category]=(byCat[d.category]||0)+1});
  const actionR=recent.filter(d=>d.status==='upcoming'||d.status==='action-required').length;
  let html='过去 30 天共有 <strong>'+recent.length+'</strong> 项法规更新:<br>';
  Object.entries(byCat).forEach(([cat,count])=>{html+='• '+count+' 项影响 '+cat+'<br>'});
  if(actionR)html+='• '+actionR+' 项需要 HR Policy Update<br>';
  html+='• '+(recent.length-actionR)+' 项仅为信息更新';
  el.innerHTML=html;
}

function renderTicker(){
  const el=document.getElementById('tickerTrack');
  const sorted=[...laborLawData].sort((a,b)=>new Date(b.lastUpdated)-new Date(a.lastUpdated)).slice(0,12);
  let html='';const months=['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  const build=()=>{sorted.forEach(item=>{const d=new Date(item.lastUpdated);const ds=months[d.getMonth()]+' '+String(d.getDate()).padStart(2,'0');const isNew=(Date.now()-new Date(item.lastUpdated).getTime())<7*86400000;html+='<div class="tc-item" onclick="openDetail(\''+item.id+'\')"><span class="flag">'+item.flag+'</span><span class="name">'+item.country+'</span><span class="sep">·</span><span class="cat">'+item.category+'</span><span class="title">'+item.law.substring(0,30)+(item.law.length>30?'...':'')+'</span><span class="date">'+ds+'</span>'+(isNew?'<span class="new-tag">NEW</span>':'')+'</div>'})};
  build();build();
  html+='<div class="ticker-viewall" onclick="document.getElementById(\'libraryLabel\').scrollIntoView({behavior:\'smooth\'})">View All Updates →</div>';
  el.innerHTML=html;el.classList.add('auto');
}

function renderNotifPanel(){
  const el=document.getElementById('notifBody');
  let html='<div class="notif-group-label">RECENT UPDATES</div>';
  aiMonitorData.forEach(n=>{
    html+='<div class="notif-item"><span class="ni-flag">'+n.flag+'</span><div class="ni-body">';
    html+='<div class="ni-title">'+n.title+'</div><div class="ni-sub">'+n.country+' · '+n.category+'</div>';
    html+='<div class="ni-date">'+n.date+'</div></div>';
    if(n.severity==='high')html+='<span class="ni-badge">!</span>';
    html+='</div>';
  });
  el.innerHTML=html;
  document.getElementById('notifBadge').textContent=aiMonitorData.filter(n=>n.severity==='high').length||aiMonitorData.length;
}

function openDetail(id){
  const item=laborLawData.find(d=>d.id===id);if(!item)return;
  const tl=currentLang==='zh';
  let html='<h2 style="font-size:16px;font-weight:700;margin-bottom:16px;display:flex;align-items:center;gap:8px">'+item.flag+' '+item.country+' — '+item.law+'</h2>';
  html+='<div class="dp-grid"><div class="dp-section"><h4>📋 Basic Info</h4>';
  html+='<div class="dp-row"><div class="dp-label">Category</div><div class="dp-val"><span class="dp-tag mod">'+item.category+'</span></div></div>';
  html+='<div class="dp-row"><div class="dp-label">Status</div><div class="dp-val" style="text-transform:capitalize">'+item.status+'</div></div>';
  html+='<div class="dp-row"><div class="dp-label">Effective Date</div><div class="dp-val">'+item.effectiveDate+'</div></div>';
  html+='<div class="dp-row"><div class="dp-label">Last Updated</div><div class="dp-val">'+item.lastUpdated+'</div></div>';
  html+='<div class="dp-row"><div class="dp-label">Country</div><div class="dp-val">'+item.country+(countryNameMap[item.country]?' ('+countryNameMap[item.country]+')':'')+'</div></div>';
  html+='</div><div class="dp-section"><h4>📝 Summary</h4>';
  html+='<div class="dp-row"><div class="dp-label">'+(tl?'English原文':'English')+'</div><div class="dp-val">'+item.summary+'</div></div>';
  html+='<div class="dp-row"><div class="dp-label">'+(tl?'中文翻译':'Chinese')+'</div><div class="dp-val">'+item.summaryZh+'</div></div>';
  html+='</div></div>';
  html+='<div class="dp-section" style="margin-top:16px"><h4>🔄 Key Changes</h4>';
  item.changes.forEach(c=>{html+='<div style="margin-bottom:4px;font-size:12px;color:var(--text)">• '+c+'</div>'});
  html+='</div><div class="dp-section" style="margin-top:16px"><h4>💼 HR Impact Assessment</h4>';
  item.hrImpact.forEach(h=>{html+='<div style="margin-bottom:4px;font-size:12px;color:var(--text)">• '+h+'</div>'});
  html+='</div><div class="dp-section" style="margin-top:16px"><h4>🔗 Official Source</h4><div class="dp-val"><a href="'+item.source+'" target="_blank">'+item.source+'</a></div></div>';
  if(countryDetailPages[item.country])html+='<button class="btn-fullview" onclick="openCountryPage(\''+item.country+'\')">📖 '+i18n[currentLang].viewDetails+'</button>';
  document.getElementById('detailContent').innerHTML=html;
  document.getElementById('detailOverlay').classList.add('open');
  document.getElementById('detailPanel').classList.add('open');
}
function closeDetail(){document.getElementById('detailOverlay').classList.remove('open');document.getElementById('detailPanel').classList.remove('open')}
function closeDrawer(){document.getElementById('drawerOverlay').classList.remove('open');document.getElementById('drawer').classList.remove('open')}
function openCountryPage(country){const url=countryDetailPages[country];if(!url){showToast('No detail page available');return}document.getElementById('countryModalTitle').innerHTML='📖 '+country+' ('+(countryNameMap[country]||country)+')';document.getElementById('countryModalIframe').src=url;document.getElementById('countryModal').classList.add('open')}
function closeCountryPage(){document.getElementById('countryModal').classList.remove('open');document.getElementById('countryModalIframe').src=''}

function initMap(){
  if (typeof L === 'undefined' || !L) { console.warn('Leaflet not available'); return; }
  try{
    mapInstance=L.map('leafletMap',{zoomControl:true,scrollWheelZoom:true}).setView([20,0],2);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',{attribution:'',maxZoom:18}).addTo(mapInstance);
    fetch('https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson')
      .then(r=>r.json()).then(data=>{
        geoData=data;
        const cc={};laborLawData.forEach(d=>{cc[d.country]=(cc[d.country]||0)+1});
        geoLayer=L.geoJSON(data,{style:f=>{const n=f.properties.ADMIN;const c=cc[n]||0;return{fillColor:c>3?'#2563eb':c>1?'#3b82f6':c>0?'#60a5fa':'#e2e8f0',fillOpacity:c>0?0.7:0.1,weight:1,color:'#fff',opacity:0.5}},onEachFeature:(f,l)=>{
          const n=f.properties.ADMIN;const c=cc[n]||0;
          if(c>0){l.bindTooltip(n+' ('+c+')',{className:'map-tip',direction:'top',offset:[0,-5]});l.on('click',()=>zoomToCountry(n,c));l.on('mouseover',function(){this.setStyle({fillOpacity:0.9,weight:2})});l.on('mouseout',function(){geoLayer.resetStyle(this)})}
        }}).addTo(mapInstance);
        renderLegend(cc);
      }).catch(()=>{});
  }catch(e){console.error('Map init error',e)}
}

function zoomToCountry(name,count){
  selectedCountry=name;currentZoom=6;
  mapInstance.eachLayer(layer=>{if(layer.feature&&layer.feature.properties.ADMIN===name){mapInstance.fitBounds(layer.getBounds(),{maxZoom:6})}});
  document.getElementById('mapReturnBtn').classList.add('show');
  document.getElementById('mapChip').classList.add('show');
  const cd=laborLawData.filter(d=>d.country===name);
  document.getElementById('mcName').innerHTML=(cd[0]?cd[0].flag+' ':'')+name+(countryNameMap[name]?' ('+countryNameMap[name]+')':'');
  document.getElementById('mcCount').textContent=count+' regulation'+(count>1?'s':'');
  document.getElementById('filterCountry').value=name;
  applyFilters();
}

function returnToWorldView(){
  selectedCountry=null;currentZoom=2;mapInstance.setView([20,0],2);
  document.getElementById('mapReturnBtn').classList.remove('show');
  document.getElementById('mapChip').classList.remove('show');
  document.getElementById('filterCountry').value='';applyFilters();
}

function renderLegend(counts){
  const el=document.getElementById('globeLegend');
  el.innerHTML='<div class="gleg"><span class="gdot" style="background:#2563eb"></span>3+ regulations</div><div class="gleg"><span class="gdot" style="background:#3b82f6"></span>2 regulations</div><div class="gleg"><span class="gdot" style="background:#60a5fa"></span>1 regulation</div>';
}

function applyURLParams(){
  const p=new URLSearchParams(window.location.search);
  const lang=p.get('lang');if(lang&&i18n[lang])currentLang=lang;
  const region=p.get('region');if(region)document.getElementById('filterRegion').value=region;
  const country=p.get('country');if(country)document.getElementById('filterCountry').value=country;
  const search=p.get('q');if(search)document.getElementById('searchInput').value=search;
}

document.addEventListener('click',e=>{if(!e.target.closest('.dd-wrap'))document.querySelectorAll('.dd-menu').forEach(m=>m.classList.remove('open'))});
window.addEventListener('DOMContentLoaded', async () => {
  await loadData();
  applyURLParams();
  populateCountryFilter();
  populateRegionTabs();
  updateLangButton();
  applyFilters();
  renderNotifPanel();
  initMap();
  updateI18nText();
});
