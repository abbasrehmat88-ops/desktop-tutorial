// ============================================================
// RentFlow — UAE rental business management
// Currency: AED (Dirhams). Data persists in localStorage.
// ============================================================

const STORE_KEY = "rentflow.v2";

function id() { return Math.random().toString(36).slice(2, 10); }

// ---------- SEED DATA (UAE) ----------
const seed = { owners: [], properties: [], clients: [], payments: [] };
(function buildSeed() {
  seed.owners = [
    { id: id(), name: "Ahmed Al Maktoum",   phone: "+971 50 123 4567", emiratesId: "784-1990-1234567-1", notes: "" },
    { id: id(), name: "Fatima Al Nahyan",    phone: "+971 55 234 5678", emiratesId: "784-1985-2345678-2", notes: "" },
    { id: id(), name: "Khalid Al Rashid",    phone: "+971 52 345 6789", emiratesId: "784-1978-3456789-3", notes: "" },
    { id: id(), name: "Mariam Al Suwaidi",   phone: "+971 56 456 7890", emiratesId: "784-1992-4567890-4", notes: "" },
    { id: id(), name: "Yousef Al Falasi",    phone: "+971 54 567 8901", emiratesId: "784-1988-5678901-5", notes: "" },
  ];
  const o = seed.owners;
  seed.properties = [
    { id: id(), title: "Shop 4, Gold Souk",              addr: "Deira, Dubai",                    rent: 8500,  ownerId: o[0].id, status: "Occupied" },
    { id: id(), title: "Villa A-12, Arabian Ranches",    addr: "Arabian Ranches 2, Dubai",        rent: 18000, ownerId: o[1].id, status: "Occupied" },
    { id: id(), title: "Apt 3B, Marina Heights",         addr: "Dubai Marina, Dubai",             rent: 12000, ownerId: o[2].id, status: "Occupied" },
    { id: id(), title: "Office 12, Business Bay Tower",  addr: "Business Bay, Dubai",             rent: 7500,  ownerId: o[3].id, status: "Occupied" },
    { id: id(), title: "Flat 22, Al Reem Island",        addr: "Al Reem Island, Abu Dhabi",       rent: 9500,  ownerId: o[4].id, status: "Occupied" },
    { id: id(), title: "Penthouse 5A, JBR",              addr: "Jumeirah Beach Residence, Dubai", rent: 25000, ownerId: o[3].id, status: "Occupied" },
    { id: id(), title: "Shop 9, Meena Bazaar",           addr: "Bur Dubai, Dubai",                rent: 10000, ownerId: o[0].id, status: "Vacant" },
    { id: id(), title: "Studio C-3, Silicon Oasis",      addr: "Dubai Silicon Oasis, Dubai",      rent: 4500,  ownerId: o[1].id, status: "Vacant" },
  ];
  const p = seed.properties;
  seed.clients = [
    { id: id(), name: "Mohammed Rashid",   phone: "+971 50 111 2222", propertyId: p[0].id, rent: 8500,  emiratesId: "784-1995-1111111-1", joinDate: "2024-08-10" },
    { id: id(), name: "Sara Al Hammadi",   phone: "+971 55 222 3333", propertyId: p[1].id, rent: 18000, emiratesId: "784-1993-2222222-2", joinDate: "2023-11-01" },
    { id: id(), name: "Bilal Khan",        phone: "+971 52 333 4444", propertyId: p[2].id, rent: 12000, emiratesId: "784-1990-3333333-3", joinDate: "2024-01-15" },
    { id: id(), name: "Hassan Jaber",      phone: "+971 56 444 5555", propertyId: p[3].id, rent: 7500,  emiratesId: "784-1988-4444444-4", joinDate: "2024-04-20" },
    { id: id(), name: "Zainab Mirza",      phone: "+971 54 555 6666", propertyId: p[4].id, rent: 9500,  emiratesId: "784-1997-5555555-5", joinDate: "2024-03-05" },
    { id: id(), name: "Omar Farooq",       phone: "+971 50 666 7777", propertyId: p[5].id, rent: 25000, emiratesId: "784-1991-6666666-6", joinDate: "2024-06-12" },
  ];
  const c = seed.clients;
  seed.payments = [
    { id: id(), date: "2026-06-08", clientId: c[0].id, amount: 8500,  method: "Bank Transfer", status: "paid",    note: "Jun rent" },
    { id: id(), date: "2026-06-07", clientId: c[2].id, amount: 12000, method: "Cash",          status: "paid",    note: "Jun rent" },
    { id: id(), date: "2026-06-06", clientId: c[4].id, amount: 9500,  method: "Apple Pay",     status: "paid",    note: "Jun rent" },
    { id: id(), date: "2026-06-05", clientId: c[1].id, amount: 18000, method: "—",             status: "pending", note: "Jun rent" },
    { id: id(), date: "2026-06-05", clientId: c[5].id, amount: 25000, method: "—",             status: "pending", note: "Jun rent" },
    { id: id(), date: "2026-05-28", clientId: c[3].id, amount: 7500,  method: "—",             status: "overdue", note: "May rent" },
    { id: id(), date: "2026-05-08", clientId: c[0].id, amount: 8500,  method: "Bank Transfer", status: "paid",    note: "May rent" },
    { id: id(), date: "2026-05-07", clientId: c[2].id, amount: 12000, method: "Cash",          status: "paid",    note: "May rent" },
    { id: id(), date: "2026-05-06", clientId: c[4].id, amount: 9500,  method: "Apple Pay",     status: "paid",    note: "May rent" },
    { id: id(), date: "2026-05-05", clientId: c[1].id, amount: 18000, method: "Bank Transfer", status: "paid",    note: "May rent" },
    { id: id(), date: "2026-04-08", clientId: c[0].id, amount: 8500,  method: "Cash",          status: "paid",    note: "Apr rent" },
    { id: id(), date: "2026-04-06", clientId: c[4].id, amount: 9500,  method: "Apple Pay",     status: "paid",    note: "Apr rent" },
    { id: id(), date: "2026-04-05", clientId: c[1].id, amount: 18000, method: "Bank Transfer", status: "paid",    note: "Apr rent" },
    { id: id(), date: "2026-03-07", clientId: c[2].id, amount: 12000, method: "Cash",          status: "paid",    note: "Mar rent" },
    { id: id(), date: "2026-03-05", clientId: c[1].id, amount: 18000, method: "Bank Transfer", status: "paid",    note: "Mar rent" },
  ];
})();

// ---------- STORE ----------
const store = {
  data: null,
  load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      this.data = raw ? JSON.parse(raw) : structuredClone(seed);
    } catch { this.data = structuredClone(seed); }
    this.save();
  },
  save() { localStorage.setItem(STORE_KEY, JSON.stringify(this.data)); },
  reset() { this.data = structuredClone(seed); this.save(); },
  ownerName(id)    { return (this.data.owners.find(o => o.id === id) || {}).name || "—"; },
  propertyTitle(id){ return (this.data.properties.find(p => p.id === id) || {}).title || "—"; },
  clientName(id)   { return (this.data.clients.find(c => c.id === id) || {}).name || "—"; },
  add(kind, item)  { item.id = id(); this.data[kind].push(item); this.save(); },
  update(kind, id_, patch) {
    const i = this.data[kind].findIndex(x => x.id === id_);
    if (i >= 0) { this.data[kind][i] = { ...this.data[kind][i], ...patch }; this.save(); }
  },
  remove(kind, id_) { this.data[kind] = this.data[kind].filter(x => x.id !== id_); this.save(); },
};

// ---------- HELPERS ----------
const fmt = (n) => "AED " + Number(n || 0).toLocaleString("en-AE");
const fmtK = (n) => n >= 1000 ? (n / 1000).toFixed(n % 1000 === 0 ? 0 : 1) + "k" : String(n);
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "numeric" }) : "—";
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, m => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
function statusPill(s) {
  const label = { paid: "Paid", pending: "Pending", overdue: "Overdue" }[s] || s;
  return `<span class="status-pill ${s}">${label}</span>`;
}
function emptyRow(cols, msg) { return `<tr><td colspan="${cols}" class="empty">${esc(msg)}</td></tr>`; }

// ---------- AUTH ----------
const loginScreen = document.getElementById("login-screen");
const appShell = document.getElementById("app-shell");
document.getElementById("login-form").addEventListener("submit", (e) => {
  e.preventDefault();
  loginScreen.classList.add("hidden");
  appShell.classList.remove("hidden");
  store.load();
  renderAll();
});
document.getElementById("logout-btn").addEventListener("click", () => {
  appShell.classList.add("hidden");
  loginScreen.classList.remove("hidden");
});

// ---------- MOBILE MENU ----------
const sidebar = document.querySelector(".sidebar");
const overlay = document.getElementById("sidebar-overlay");
document.getElementById("mobile-menu-btn").addEventListener("click", () => {
  sidebar.classList.toggle("open"); overlay.classList.toggle("show");
});
overlay.addEventListener("click", () => { sidebar.classList.remove("open"); overlay.classList.remove("show"); });

// ---------- NAV ----------
const viewTitles = {
  dashboard:  ["Dashboard",  "Overview of your rental business"],
  properties: ["Properties", "All your managed properties"],
  owners:     ["Owners",     "Landlords and property owners"],
  clients:    ["Clients",    "Tenants and renters"],
  payments:   ["Payments",   "Rent collections and dues"],
  whatsapp:   ["WhatsApp",   "Connected messaging and group sync"],
  reports:    ["Reports",    "Income, expenses and trends"],
};
function setView(name) {
  document.querySelectorAll(".nav-item").forEach(n => n.classList.toggle("active", n.dataset.view === name));
  document.querySelectorAll(".view").forEach(v => v.classList.add("hidden"));
  document.getElementById("view-" + name).classList.remove("hidden");
  document.getElementById("view-title").textContent = viewTitles[name][0];
  document.getElementById("view-sub").textContent = viewTitles[name][1];
  searchInput.value = ""; searchTerm = "";
  sidebar.classList.remove("open"); overlay.classList.remove("show");
  renderAll();
}
document.addEventListener("click", (e) => {
  const link = e.target.closest("[data-view]");
  if (link) { e.preventDefault(); setView(link.dataset.view); }
});

// ---------- SEARCH ----------
const searchInput = document.querySelector(".search input");
let searchTerm = "";
searchInput.addEventListener("input", (e) => { searchTerm = e.target.value.toLowerCase().trim(); renderAll(); });
function matchesSearch(...fields) {
  if (!searchTerm) return true;
  return fields.some(f => String(f || "").toLowerCase().includes(searchTerm));
}

// ---------- TABS ----------
let propertyTab = "All", paymentTab = "All";
document.addEventListener("click", (e) => {
  const tab = e.target.closest(".tab");
  if (!tab) return;
  const group = tab.parentElement;
  group.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  tab.classList.add("active");
  if (group.dataset.tabs === "properties") propertyTab = tab.textContent;
  if (group.dataset.tabs === "payments")   paymentTab = tab.textContent;
  renderAll();
});

// ---------- SORTING ----------
const sortState = {
  owners:   { key: "name",   dir: 1 },
  clients:  { key: "name",   dir: 1 },
  payments: { key: "date",   dir: -1 },
};
document.addEventListener("click", (e) => {
  const th = e.target.closest("th.sortable");
  if (!th) return;
  const table = th.closest("table").id.replace("table-", "");
  const key = th.dataset.sort;
  const st = sortState[table];
  if (st.key === key) st.dir *= -1; else { st.key = key; st.dir = 1; }
  renderAll();
});
function applyAriaSort(tableId, state) {
  const table = document.getElementById(tableId);
  if (!table) return;
  table.querySelectorAll("th.sortable").forEach(th => {
    if (th.dataset.sort === state.key) th.setAttribute("aria-sort", state.dir === 1 ? "ascending" : "descending");
    else th.removeAttribute("aria-sort");
  });
}
function sortRows(rows, state) {
  const { key, dir } = state;
  return [...rows].sort((a, b) => {
    const va = a[key], vb = b[key];
    if (typeof va === "number" && typeof vb === "number") return (va - vb) * dir;
    return String(va).localeCompare(String(vb), undefined, { numeric: true }) * dir;
  });
}

// ---------- MODAL ----------
const modalRoot = document.getElementById("modal-root");
function openModal(title, contentHtml, onSubmit) {
  modalRoot.innerHTML = `
    <div class="modal-backdrop">
      <div class="modal" role="dialog" aria-modal="true" aria-label="${esc(title)}">
        <div class="modal-head"><h3>${esc(title)}</h3><button class="modal-close" aria-label="Close">&times;</button></div>
        <form class="modal-body">${contentHtml}
          <div class="modal-actions"><button type="button" class="btn-secondary" data-close>Cancel</button><button type="submit" class="btn-primary">Save</button></div>
        </form>
      </div>
    </div>`;
  modalRoot.classList.remove("hidden");
  const form = modalRoot.querySelector("form");
  const close = () => { modalRoot.classList.add("hidden"); modalRoot.innerHTML = ""; };
  modalRoot.querySelector(".modal-close").onclick = close;
  modalRoot.querySelector("[data-close]").onclick = close;
  modalRoot.querySelector(".modal-backdrop").addEventListener("click", (e) => { if (e.target.classList.contains("modal-backdrop")) close(); });
  document.addEventListener("keydown", function esc(e){ if(e.key==="Escape"){ close(); document.removeEventListener("keydown", esc);} });
  // inline validation on blur
  form.querySelectorAll("[required]").forEach(inp => {
    inp.addEventListener("blur", () => { inp.style.borderColor = inp.value.trim() ? "" : "var(--bad)"; });
  });
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    if (onSubmit(data) !== false) close();
  });
  setTimeout(() => form.querySelector("input, select, textarea")?.focus(), 50);
}
function confirmDelete(label, onYes) { if (confirm(`Delete ${label}? This cannot be undone.`)) onYes(); }

// ---------- FORM BUILDERS ----------
const ownerOptions = (sel) => store.data.owners.map(o => `<option value="${o.id}" ${o.id===sel?"selected":""}>${esc(o.name)}</option>`).join("");
const propertyOptions = (sel) => store.data.properties.map(p => `<option value="${p.id}" ${p.id===sel?"selected":""}>${esc(p.title)}</option>`).join("");
const clientOptions = (sel) => store.data.clients.map(c => `<option value="${c.id}" ${c.id===sel?"selected":""}>${esc(c.name)} — ${esc(c.phone)}</option>`).join("");

function ownerForm(o = {}) {
  return `
    <label><span>Name *</span><input name="name" required value="${esc(o.name||"")}"></label>
    <label><span>Phone *</span><input name="phone" type="tel" required value="${esc(o.phone||"")}"></label>
    <label><span>Emirates ID</span><input name="emiratesId" value="${esc(o.emiratesId||"")}" placeholder="784-YYYY-NNNNNNN-N"></label>
    <label><span>Notes</span><textarea name="notes" rows="2">${esc(o.notes||"")}</textarea></label>`;
}
function propertyForm(p = {}) {
  return `
    <label><span>Title *</span><input name="title" required value="${esc(p.title||"")}"></label>
    <label><span>Address</span><input name="addr" value="${esc(p.addr||"")}"></label>
    <div class="form-row">
      <label><span>Monthly Rent (AED) *</span><input name="rent" type="number" inputmode="numeric" required value="${p.rent||""}"></label>
      <label><span>Status</span><select name="status"><option ${p.status==="Occupied"?"selected":""}>Occupied</option><option ${p.status==="Vacant"?"selected":""}>Vacant</option></select></label>
    </div>
    <label><span>Owner *</span><select name="ownerId" required>${ownerOptions(p.ownerId)}</select></label>`;
}
function clientForm(c = {}) {
  return `
    <label><span>Name *</span><input name="name" required value="${esc(c.name||"")}"></label>
    <label><span>Phone *</span><input name="phone" type="tel" required value="${esc(c.phone||"")}"></label>
    <label><span>Emirates ID</span><input name="emiratesId" value="${esc(c.emiratesId||"")}" placeholder="784-YYYY-NNNNNNN-N"></label>
    <label><span>Property *</span><select name="propertyId" required>${propertyOptions(c.propertyId)}</select></label>
    <div class="form-row">
      <label><span>Monthly Rent (AED) *</span><input name="rent" type="number" inputmode="numeric" required value="${c.rent||""}"></label>
      <label><span>Join Date</span><input name="joinDate" type="date" value="${c.joinDate||""}"></label>
    </div>`;
}
function paymentForm(p = {}) {
  return `
    <label><span>Client *</span><select name="clientId" required>${clientOptions(p.clientId)}</select></label>
    <div class="form-row">
      <label><span>Amount (AED) *</span><input name="amount" type="number" inputmode="numeric" required value="${p.amount||""}"></label>
      <label><span>Date *</span><input name="date" type="date" required value="${p.date || new Date().toISOString().slice(0,10)}"></label>
    </div>
    <div class="form-row">
      <label><span>Method</span><select name="method"><option>Cash</option><option>Bank Transfer</option><option>Apple Pay</option><option>Cheque</option></select></label>
      <label><span>Status</span><select name="status">
        <option value="paid" ${p.status==="paid"?"selected":""}>Paid</option>
        <option value="pending" ${p.status==="pending"?"selected":""}>Pending</option>
        <option value="overdue" ${p.status==="overdue"?"selected":""}>Overdue</option></select></label>
    </div>
    <label><span>Note</span><input name="note" value="${esc(p.note||"")}"></label>`;
}

// ---------- ACTIONS ----------
window.addOwner = () => openModal("Add Owner", ownerForm(), d => { store.add("owners", d); renderAll(); });
window.editOwner = (id_) => { const o = store.data.owners.find(x=>x.id===id_); openModal("Edit Owner", ownerForm(o), d => { store.update("owners",id_,d); renderAll(); }); };
window.delOwner = (id_) => confirmDelete("this owner", () => { store.remove("owners",id_); renderAll(); });

window.addProperty = () => openModal("Add Property", propertyForm(), d => { d.rent=Number(d.rent); store.add("properties",d); renderAll(); });
window.editProperty = (id_) => { const p = store.data.properties.find(x=>x.id===id_); openModal("Edit Property", propertyForm(p), d => { d.rent=Number(d.rent); store.update("properties",id_,d); renderAll(); }); };
window.delProperty = (id_) => confirmDelete("this property", () => { store.remove("properties",id_); renderAll(); });

window.addClient = () => openModal("Add Client", clientForm(), d => { d.rent=Number(d.rent); store.add("clients",d); renderAll(); });
window.editClient = (id_) => { const c = store.data.clients.find(x=>x.id===id_); openModal("Edit Client", clientForm(c), d => { d.rent=Number(d.rent); store.update("clients",id_,d); renderAll(); }); };
window.delClient = (id_) => confirmDelete("this client", () => { store.remove("clients",id_); renderAll(); });

window.addPayment = (clientId) => openModal("Record Payment", paymentForm({ clientId }), d => { d.amount=Number(d.amount); store.add("payments",d); renderAll(); });
window.editPayment = (id_) => { const p = store.data.payments.find(x=>x.id===id_); openModal("Edit Payment", paymentForm(p), d => { d.amount=Number(d.amount); store.update("payments",id_,d); renderAll(); }); };
window.delPayment = (id_) => confirmDelete("this payment", () => { store.remove("payments",id_); renderAll(); });

window.resetData = () => { if (confirm("Reset all data back to demo? Your changes will be lost.")) { store.reset(); renderAll(); } };

// ---------- MONTH HELPERS ----------
function lastMonths(n) {
  const now = new Date(), out = [];
  for (let i = n - 1; i >= 0; i--) {
    const dt = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({ key: dt.toISOString().slice(0, 7), label: dt.toLocaleDateString("en-US", { month: "short" }) });
  }
  return out;
}
function paidInMonth(key) {
  return store.data.payments.filter(p => p.status === "paid" && p.date.startsWith(key)).reduce((s, p) => s + p.amount, 0);
}

// ---------- SVG LINE/AREA CHART ----------
function renderLineChart(containerId, series) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const W = 720, H = 240, padL = 46, padR = 16, padT = 18, padB = 30;
  const max = Math.max(1, ...series.map(s => s.v));
  const niceMax = Math.ceil(max / 5000) * 5000 || 5000;
  const ix = (i) => padL + (i * (W - padL - padR)) / Math.max(1, series.length - 1);
  const iy = (v) => padT + (1 - v / niceMax) * (H - padT - padB);

  const linePts = series.map((s, i) => `${ix(i)},${iy(s.v)}`).join(" ");
  const areaPts = `${padL},${H - padB} ${linePts} ${ix(series.length - 1)},${H - padB}`;

  // y gridlines (4)
  let grid = "", ylabels = "";
  for (let g = 0; g <= 4; g++) {
    const val = (niceMax / 4) * g;
    const y = iy(val);
    grid += `<line class="grid-line" x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}"/>`;
    ylabels += `<text class="y-label" x="${padL - 8}" y="${y + 3}" text-anchor="end">${fmtK(val)}</text>`;
  }
  const xlabels = series.map((s, i) => `<text class="axis-label" x="${ix(i)}" y="${H - 8}" text-anchor="middle">${s.label}</text>`).join("");
  const dots = series.map((s, i) => `<circle class="dot" cx="${ix(i)}" cy="${iy(s.v)}" r="3.5"/>`).join("");
  const hits = series.map((s, i) => `<rect class="dot-hit" x="${ix(i) - 18}" y="${padT}" width="36" height="${H - padT - padB}" data-label="${esc(s.label)}" data-val="${s.v}"/>`).join("");

  el.innerHTML = `
    <div style="position:relative;">
      <svg class="linechart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Revenue last 6 months">
        <defs><linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#0f766e" stop-opacity="0.22"/><stop offset="100%" stop-color="#0f766e" stop-opacity="0"/>
        </linearGradient></defs>
        ${grid}${ylabels}
        <polygon class="area" points="${areaPts}"/>
        <polyline class="line" points="${linePts}"/>
        ${dots}${hits}${xlabels}
      </svg>
      <div class="chart-tip" id="${containerId}-tip"></div>
    </div>`;

  const svg = el.querySelector("svg");
  const tip = el.querySelector(".chart-tip");
  el.querySelectorAll(".dot-hit").forEach(r => {
    r.addEventListener("mouseenter", () => {
      const rect = svg.getBoundingClientRect();
      const cx = (parseFloat(r.getAttribute("x")) + 18) / W * rect.width;
      const i = [...el.querySelectorAll(".dot-hit")].indexOf(r);
      const cy = iy(series[i].v) / H * rect.height;
      tip.style.left = cx + "px"; tip.style.top = cy + "px"; tip.style.opacity = "1";
      tip.innerHTML = `${fmt(r.dataset.val)}<span class="tip-sub">${r.dataset.label}</span>`;
    });
    r.addEventListener("mouseleave", () => { tip.style.opacity = "0"; });
  });
}

// ---------- RENDER ----------
function renderAll() {
  renderDashboard(); renderProperties(); renderOwners();
  renderClients(); renderPayments(); renderWhatsapp(); renderReports();
}

function renderDashboard() {
  const d = store.data;
  const now = new Date();
  const thisKey = now.toISOString().slice(0, 7);
  const income = paidInMonth(thisKey);
  const pending = d.payments.filter(p => p.status !== "paid").reduce((s, p) => s + p.amount, 0);
  const overdue = d.payments.filter(p => p.status === "overdue").length;
  const vacant = d.properties.filter(p => p.status === "Vacant").length;

  document.getElementById("stat-income").textContent = fmt(income);
  document.getElementById("stat-pending").textContent = fmt(pending);
  document.getElementById("stat-pending-sub").textContent = `${overdue} client${overdue!==1?"s":""} overdue`;
  document.getElementById("stat-properties").textContent = d.properties.length;
  document.getElementById("stat-properties-sub").textContent = `${vacant} vacant`;
  document.getElementById("stat-clients").textContent = d.clients.length;

  const recent = [...d.payments].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,5);
  document.getElementById("recent-payments").innerHTML = recent.length ? recent.map(p => {
    const c = d.clients.find(x=>x.id===p.clientId);
    const pr = c ? d.properties.find(x=>x.id===c.propertyId) : null;
    return `<tr><td>${esc(c?.name||"—")}</td><td>${esc(pr?.title||"—")}</td><td><strong>${fmt(p.amount)}</strong></td><td>${statusPill(p.status)}</td></tr>`;
  }).join("") : emptyRow(4, "No payments yet");

  const waMessages = [
    { author: "Ahmed (Owner)", time: "10:42 AM", text: "Mohammed paid Shop 4 rent AED 8,500 today via bank transfer.", tag: "Matched: Mohammed Rashid — AED 8,500" },
    { author: "Fatima (Owner)", time: "Yesterday", text: "Villa tenant will pay next week, confirmed.", tag: "Note: Sara Al Hammadi" },
    { author: "Bilal (Tenant)", time: "2 days ago", text: "Rent transferred, ref TXN-99210.", tag: "Matched: Bilal Khan — AED 12,000" },
    { author: "Zainab (Tenant)", time: "3 days ago", text: "Paid via Apple Pay, AED 9500.", tag: "Matched: Zainab Mirza — AED 9,500" },
  ];
  const waHtml = waMessages.map(waMsgHtml).join("");
  document.getElementById("wa-feed").innerHTML = waHtml;
  document.getElementById("wa-feed-2").innerHTML = waHtml;

  renderLineChart("chart", lastMonths(6).map(m => ({ label: m.label, v: paidInMonth(m.key) })));
}

function waMsgHtml(m) {
  const check = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M20 6L9 17l-5-5"/></svg>`;
  return `<div class="wa-msg"><span class="wa-author">${esc(m.author)}</span><span class="wa-time">${esc(m.time)}</span><div class="wa-text">${esc(m.text)}</div><span class="wa-tag">${check}${esc(m.tag)}</span></div>`;
}

function renderProperties() {
  let list = store.data.properties.filter(p => matchesSearch(p.title, p.addr, store.ownerName(p.ownerId)));
  if (propertyTab==="Occupied") list = list.filter(p=>p.status==="Occupied");
  if (propertyTab==="Vacant")   list = list.filter(p=>p.status==="Vacant");
  const house = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M3 11.5L12 4l9 7.5"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/></svg>`;
  const pin = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg>`;
  const grid = document.getElementById("property-cards");
  grid.innerHTML = list.length ? list.map(p => `
    <div class="property-card">
      <div class="property-img">${house}<span class="status-tag">${esc(p.status)}</span></div>
      <div class="property-body">
        <h4 class="property-title">${esc(p.title)}</h4>
        <p class="property-addr">${pin}${esc(p.addr||"—")}</p>
        <div class="property-meta">
          <span>Owner · <strong>${esc(store.ownerName(p.ownerId))}</strong></span>
          <span class="property-rent"><strong>${fmt(p.rent)}</strong></span>
        </div>
        <div class="property-meta" style="border:none;padding-top:10px;justify-content:flex-end;">
          <span class="row-actions"><button class="link-btn" onclick="editProperty('${p.id}')">Edit</button><button class="link-btn danger" onclick="delProperty('${p.id}')">Delete</button></span>
        </div>
      </div>
    </div>`).join("") : `<div class="empty-state" style="grid-column:1/-1;"><strong>No properties found</strong>Try a different search or add a property.</div>`;
}

function renderOwners() {
  const now = new Date(), thisKey = now.toISOString().slice(0, 7);
  let rows = store.data.owners.filter(o => matchesSearch(o.name, o.phone)).map(o => {
    const props = store.data.properties.filter(p=>p.ownerId===o.id);
    const ownerPays = (cond) => store.data.payments.filter(p => {
      const c = store.data.clients.find(x=>x.id===p.clientId); if (!c) return false;
      return store.data.properties.find(x=>x.id===c.propertyId)?.ownerId===o.id && cond(p);
    }).reduce((s,p)=>s+p.amount,0);
    const mtd = ownerPays(p => p.status==="paid" && p.date.startsWith(thisKey));
    const pending = ownerPays(p => p.status!=="paid");
    return { id:o.id, name:o.name, phone:o.phone, props:props.length, mtd, pending };
  });
  rows = sortRows(rows, sortState.owners);
  applyAriaSort("table-owners", sortState.owners);
  document.getElementById("owners-rows").innerHTML = rows.length ? rows.map(o =>
    `<tr><td><strong>${esc(o.name)}</strong></td><td>${esc(o.phone)}</td><td>${o.props}</td><td><strong>${fmt(o.mtd)}</strong></td><td>${fmt(o.pending)}</td>
    <td class="row-actions"><button class="link-btn" onclick="editOwner('${o.id}')">Edit</button><button class="link-btn danger" onclick="delOwner('${o.id}')">Delete</button></td></tr>`
  ).join("") : emptyRow(6, "No owners yet");
}

function renderClients() {
  let rows = store.data.clients.filter(c => matchesSearch(c.name, c.phone, store.propertyTitle(c.propertyId))).map(c => {
    const last = [...store.data.payments].filter(p=>p.clientId===c.id).sort((a,b)=>b.date.localeCompare(a.date))[0];
    return { ...c, status: last?.status || "pending", property: store.propertyTitle(c.propertyId) };
  });
  rows = sortRows(rows, sortState.clients);
  applyAriaSort("table-clients", sortState.clients);
  document.getElementById("clients-rows").innerHTML = rows.length ? rows.map(c =>
    `<tr><td><strong>${esc(c.name)}</strong></td><td>${esc(c.property)}</td><td>${esc(c.phone)}</td><td><strong>${fmt(c.rent)}</strong></td><td>${statusPill(c.status)}</td>
    <td class="row-actions"><button class="link-btn" onclick="addPayment('${c.id}')">+ Pay</button><button class="link-btn" onclick="editClient('${c.id}')">Edit</button><button class="link-btn danger" onclick="delClient('${c.id}')">Delete</button></td></tr>`
  ).join("") : emptyRow(6, "No clients yet");
}

function renderPayments() {
  let rows = store.data.payments.map(p => {
    const c = store.data.clients.find(x=>x.id===p.clientId);
    const pr = c ? store.data.properties.find(x=>x.id===c.propertyId) : null;
    return { ...p, client: c?.name || "—", property: pr?.title || "—" };
  });
  if (paymentTab!=="All") rows = rows.filter(p => p.status === paymentTab.toLowerCase());
  rows = rows.filter(p => matchesSearch(p.client, p.method, p.note));
  rows = sortRows(rows, sortState.payments);
  applyAriaSort("table-payments", sortState.payments);
  document.getElementById("payments-rows").innerHTML = rows.length ? rows.map(p =>
    `<tr><td>${fmtDate(p.date)}</td><td><strong>${esc(p.client)}</strong></td><td>${esc(p.property)}</td><td><strong>${fmt(p.amount)}</strong></td><td>${esc(p.method||"—")}</td><td>${statusPill(p.status)}</td>
    <td class="row-actions"><button class="link-btn" onclick="editPayment('${p.id}')">Edit</button><button class="link-btn danger" onclick="delPayment('${p.id}')">Delete</button></td></tr>`
  ).join("") : emptyRow(7, "No payments match");
}

function renderWhatsapp() {
  document.getElementById("wa-to").innerHTML = store.data.clients.map(c => `<option>${esc(c.name)} — ${esc(c.phone)}</option>`).join("");
}

function renderReports() {
  const months = lastMonths(6).map(m => { const inc = paidInMonth(m.key); return { label: m.label, inc, exp: Math.round(inc * 0.2) }; });
  const max = Math.max(1, ...months.map(m => m.inc));
  document.getElementById("chart-2").innerHTML = `<div class="barchart">` + months.map(m => `
    <div class="bar">
      <div class="bar-value">${fmtK(m.inc)}</div>
      <div class="bar-cluster">
        <div class="bar-fill inc" style="height:${Math.max(2,(m.inc/max)*100)}%" title="Income ${fmt(m.inc)}"></div>
        <div class="bar-fill exp" style="height:${Math.max(2,(m.exp/max)*100)}%" title="Expenses ${fmt(m.exp)}"></div>
      </div>
      <div class="bar-label">${m.label}</div>
    </div>`).join("") + `</div>`;

  const now = new Date(), yearStart = `${now.getFullYear()}-01`;
  const totals = store.data.properties.map(p => {
    const clients = store.data.clients.filter(c=>c.propertyId===p.id);
    const total = store.data.payments.filter(pay => pay.status==="paid" && pay.date>=yearStart && clients.some(c=>c.id===pay.clientId)).reduce((s,x)=>s+x.amount,0);
    return { title: p.title, owner: store.ownerName(p.ownerId), total };
  }).filter(t => t.total > 0).sort((a,b)=>b.total-a.total).slice(0,5);
  document.getElementById("top-properties").innerHTML = totals.length ? totals.map(t =>
    `<tr><td><strong>${esc(t.title)}</strong></td><td>${esc(t.owner)}</td><td><strong>${fmt(t.total)}</strong></td></tr>`
  ).join("") : emptyRow(3, "No collections yet this year");
}
