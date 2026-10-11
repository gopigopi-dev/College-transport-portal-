/* ---------- 1. DATA: every bus with its stops (24-hour time) ---------- */
const buses = [
  {no:"B01", name:"Green Line", color:"#4ade80", back:"16:45",
   stops:[["Tambaram","06:45"],["Chromepet","06:55"],["Pallavaram","07:05"],["Guindy","07:25"],["College Campus","08:15"]]},
  {no:"B02", name:"Sunrise Express", color:"#fbbf24", back:"16:50",
   stops:[["Poonamallee","06:30"],["Porur","06:50"],["Vadapalani","07:15"],["Kodambakkam","07:30"],["College Campus","08:10"]]},
  {no:"B03", name:"Northern Star", color:"#38bdf8", back:"17:00",
   stops:[["Avadi","06:40"],["Ambattur","06:58"],["Anna Nagar","07:20"],["Koyambedu","07:40"],["College Campus","08:15"]]},
  {no:"B04", name:"Coastal Rider", color:"#f472b6", back:"17:10",
   stops:[["Velachery","07:00"],["Adyar","07:15"],["Saidapet","07:30"],["T. Nagar","07:45"],["College Campus","08:20"]]},
  {no:"B05", name:"Riverside Route", color:"#a78bfa", back:"16:55",
   stops:[["Ponneri","06:20"],["Red Hills","06:45"],["Madhavaram","07:05"],["Perambur","07:30"],["College Campus","08:15"]]},
  {no:"B06", name:"Southern Comet", color:"#fb923c", back:"17:05",
   stops:[["Chengalpattu","06:15"],["Maraimalai Nagar","06:35"],["Guduvanchery","06:55"],["Urapakkam","07:10"],["College Campus","08:10"]]}
];

// Flat list of pickup points (the last stop is the college, so it is skipped)
const pickups = buses.flatMap(b => b.stops.slice(0, -1).map(([place, time]) => ({place, time, bus:b})));

/* ---------- 2. HELPERS ---------- */
const $  = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const pad = n => String(n).padStart(2, "0");
const fmt = t => { const [h, m] = t.split(":").map(Number); return `${h % 12 || 12}:${pad(m)} ${h < 12 ? "AM" : "PM"}`; };
const safe = s => s.replace(/[&<>]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]));

/* ---------- 3. NAVIGATION (single page, tab style) ---------- */
function showView(name) {
  $$(".view").forEach(v => v.classList.toggle("active", v.id === name));
  $$("#nav button").forEach(b => b.classList.toggle("active", b.dataset.view === name));
  window.scrollTo({top:0, behavior:"smooth"});
}
$$("#nav button").forEach(b => b.onclick = () => showView(b.dataset.view));
$$("[data-go]").forEach(b => b.onclick = () => showView(b.dataset.go));

/* ---------- 4. BUS ROUTES: ticket cards + animated timeline ---------- */
function renderRoutes() {
  $("#routeGrid").innerHTML = buses.map(b => `
    <article class="ticket" style="--c:${b.color}">
      <div class="t-head">
        <span class="badge">${b.no}</span>
        <div><h3>${b.name}</h3><p>${b.stops[0][0]} → ${b.stops.at(-1)[0]}</p></div>
      </div>
      <div class="meta">
        <span>🕐 ${fmt(b.stops[0][1])}</span>
        <span>📍 ${b.stops.length - 1} pickups</span>
        <span>🌆 ${fmt(b.back)}</span>
      </div>
      <button class="btn ghost">View route ▾</button>
      <ol class="timeline">
        ${b.stops.map(([p, t], i) => `<li style="--i:${i}"><i></i><b>${p}</b><time>${fmt(t)}</time></li>`).join("")}
      </ol>
    </article>`).join("");

  $$(".ticket .btn").forEach(btn => btn.onclick = () => {
    const card = btn.closest(".ticket");
    card.classList.toggle("open");
    btn.textContent = card.classList.contains("open") ? "Hide route ▴" : "View route ▾";
  });
}

/* ---------- 5. PICKUP POINTS TABLE with bus filter ---------- */
function renderPickup() {
  const f = $("#busFilter").value;
  const rows = pickups.filter(p => f === "all" || p.bus.no === f)
                      .sort((a, b) => a.time.localeCompare(b.time));
  $("#pickupBody").innerHTML = rows.map(p => `
    <tr>
      <td>${p.place}</td>
      <td><span class="pill" style="--c:${p.bus.color}">${p.bus.no}</span></td>
      <td>${p.bus.name}</td>
      <td class="time">${fmt(p.time)}</td>
    </tr>`).join("");
}

/* ---------- 6. SEARCH: results update while typing ---------- */
let searchType = "all";
function doSearch() {
  const q = $("#q").value.trim().toLowerCase();
  const safeQ = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp("(" + safeQ + ")", "gi");
  const mark = s => q ? safe(s).replace(re, "<mark>$1</mark>") : safe(s);
  const out = [];

  if (searchType !== "stops") {
    buses.filter(b => [b.no, b.name, ...b.stops.map(s => s[0])].join(" ").toLowerCase().includes(q))
         .forEach(b => out.push(`
      <div class="result" style="--c:${b.color}"><small>BUS</small>
        <h3>${mark(b.no)} · ${mark(b.name)}</h3>
        <p>${b.stops.map(s => mark(s[0])).join(" → ")}</p></div>`));
  }
  if (searchType !== "buses") {
    pickups.filter(p => (p.place + " " + p.bus.no + " " + p.bus.name).toLowerCase().includes(q))
           .forEach(p => out.push(`
      <div class="result" style="--c:${p.bus.color}"><small>PICKUP POINT</small>
        <h3>${mark(p.place)}</h3>
        <p>Bus ${mark(p.bus.no)} (${mark(p.bus.name)}) · ${fmt(p.time)}</p></div>`));
  }
  $("#results").innerHTML = out.join("") || `<p class="empty">No results found for “${safe(q)}”. Try another word.</p>`;
  $("#count").textContent = out.length + " result(s) found";
}
$("#q").oninput = doSearch;
$$(".chip").forEach(c => c.onclick = () => {
  $$(".chip").forEach(x => x.classList.remove("on"));
  c.classList.add("on");
  searchType = c.dataset.type;
  doSearch();
});

/* ---------- 7. INTERACTION: "Find My Bus" boarding pass + live countdown ---------- */
let current = null;
function updatePass() {
  const place = $("#myStop").value;
  current = pickups.find(p => p.place === place);
  if (!current) {
    $("#passBody").innerHTML = `<p class="hint">Choose your pickup point to see your bus.</p>`;
    return;
  }
  const b = current.bus, last = b.stops.at(-1);
  $("#passBody").innerHTML = `
    <div class="pass-row" style="--c:${b.color}">
      <div><small>BUS NUMBER</small><big>${b.no}</big></div>
      <div style="text-align:right"><small>ROUTE</small><b>${b.name}</b></div>
    </div>
    <div class="pass-row" style="margin-top:12px">
      <div><small>PICKUP</small><b>${current.place} · ${fmt(current.time)}</b></div>
      <div style="text-align:right"><small>CAMPUS ARRIVAL</small><b>${fmt(last[1])}</b></div>
    </div>
    <small style="margin-top:14px">NEXT PICKUP IN</small>
    <div class="countdown" id="cd">--:--:--</div>`;
  tick();
}

// Runs every second: updates the clock and the countdown
function tick() {
  const now = new Date();
  $("#clock").textContent = now.toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"});
  if (!current || !$("#cd")) return;
  const [h, m] = current.time.split(":").map(Number);
  const target = new Date(now);
  target.setHours(h, m, 0, 0);
  if (target < now) target.setDate(target.getDate() + 1);   // already left today → tomorrow
  const s = Math.floor((target - now) / 1000);
  $("#cd").textContent = `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s % 3600 / 60))}:${pad(s % 60)}`;
}

/* ---------- 8. START-UP ---------- */
function init() {
  $("#sBuses").textContent = $("#sBuses2").textContent = buses.length;
  $("#sStops").textContent = $("#sStops2").textContent = pickups.length;
  $("#myStop").innerHTML = `<option value="">📍 Select your pickup point</option>` +
    [...pickups].sort((a, b) => a.place.localeCompare(b.place)).map(p => `<option>${p.place}</option>`).join("");
  $("#busFilter").innerHTML = `<option value="all">All buses</option>` + buses.map(b => `<option value="${b.no}">${b.no} – ${b.name}</option>`).join("");
  $("#myStop").onchange = updatePass;
  $("#busFilter").onchange = renderPickup;
  renderRoutes(); renderPickup(); doSearch(); updatePass();
  setInterval(tick, 1000); tick();
}
init();
