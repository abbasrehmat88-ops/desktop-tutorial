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
const fmtDate = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "numeric" });
};
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, m => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
function statusPill(s) {
  const label = { paid: "Paid", pending: "Pending", overdue: "Overdue" }[s] || s;
  return `<span class="status-pill ${s}">${label}</span>`;
}

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
  sidebar.classList.toggle("open");
  overlay.classList.toggle("show");
});
overlay.addEventListener("click", () => {
  sidebar.classList.remove("open");
  overlay.classList.remove("show");
});

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
  sidebar.classList.remove("open");
  overlay.classList.remove("show");
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
let propertyTab = "All";
let paymentTab = "All";
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

// ---------- MODAL ----------
const modalRoot = document.getElementById("modal-root");
function openModal(title, contentHtml, onSubmit) {
  modalRoot.innerHTML = `
    <div class="modal-backdrop">
      <div class="modal">
        <div class="modal-head">
          <h3>${esc(title)}</h3>
          <button class="modal-close" aria-label="Close">&times;</button>
        </div>
        <form class="modal-body">${contentHtml}
          <div class="modal-actions">
            <button type="button" class="btn-secondary" data-close>Cancel</button>
            <button type="submit" class="btn-primary">Save</button>
          </div>
        </form>
      </div>
    </div>`;
  modalRoot.classList.remove("hidden");
  const form = modalRoot.querySelector("form");
  const close = () => { modalRoot.classList.add("hidden"); modalRoot.innerHTML = ""; };
  modalRoot.querySelector(".modal-close").onclick = close;
  modalRoot.querySelector("[data-close]").onclick = close;
  modalRoot.querySelector(".modal-backdrop").addEventListener("click", (e) => {
    if (e.target.classList.contains("modal-backdrop")) close();
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
function ownerOptions(sel) { return store.data.owners.map(o => `<option value="${o.id}" ${o.id===sel?"selected":""}>${esc(o.name)}</option>`).join(""); }
function propertyOptions(sel) { return store.data.properties.map(p => `<option value="${p.id}" ${p.id===sel?"selected":""}>${esc(p.title)}</option>`).join(""); }
function clientOptions(sel) { return store.data.clients.map(c => `<option value="${c.id}" ${c.id===sel?"selected":""}>${esc(c.name)} — ${esc(c.phone)}</option>`).join(""); }

function ownerForm(o = {}) {
  return `
    <label><span>Name *</span><input name="name" required value="${esc(o.name||"")}"></label>
    <label><span>Phone *</span><input name="phone" required value="${esc(o.phone||"")}"></label>
    <label><span>Emirates ID</span><input name="emiratesId" value="${esc(o.emiratesId||"")}" placeholder="784-YYYY-NNNNNNN-N"></label>
    <label><span>Notes</span><textarea name="notes" rows="2">${esc(o.notes||"")}</textarea></label>`;
}
function propertyForm(p = {}) {
  return `
    <label><span>Title *</span><input name="title" required value="${esc(p.title||"")}"></label>
    <label><span>Address</span><input name="addr" value="${esc(p.addr||"")}"></label>
    <div class="form-row">
      <label><span>Monthly Rent (AED) *</span><input name="rent" type="number" required value="${p.rent||""}"></label>
      <label><span>Status</span>
        <select name="status"><option ${p.status==="Occupied"?"selected":""}>Occupied</option><option ${p.status==="Vacant"?"selected":""}>Vacant</option></select>
      </label>
    </div>
    <label><span>Owner *</span><select name="ownerId" required>${ownerOptions(p.ownerId)}</select></label>`;
}
function clientForm(c = {}) {
  return `
    <label><span>Name *</span><input name="name" required value="${esc(c.name||"")}"></label>
    <label><span>Phone *</span><input name="phone" required value="${esc(c.phone||"")}"></label>
    <label><span>Emirates ID</span><input name="emiratesId" value="${esc(c.emiratesId||"")}" placeholder="784-YYYY-NNNNNNN-N"></label>
    <label><span>Property *</span><select name="propertyId" required>${propertyOptions(c.propertyId)}</select></label>
    <div class="form-row">
      <label><span>Monthly Rent (AED) *</span><input name="rent" type="number" required value="${c.rent||""}"></label>
      <label><span>Join Date</span><input name="joinDate" type="date" value="${c.joinDate||""}"></label>
    </div>`;
}
function paymentForm(p = {}) {
  return `
    <label><span>Client *</span><select name="clientId" required>${clientOptions(p.clientId)}</select></label>
    <div class="form-row">
      <label><span>Amount (AED) *</span><input name="amount" type="number" required value="${p.amount||""}"></label>
      <label><span>Date *</span><input name="date" type="date" required value="${p.date || new Date().toISOString().slice(0,10)}"></label>
    </div>
    <div class="form-row">
      <label><span>Method</span>
        <select name="method"><option>Cash</option><option>Bank Transfer</option><option>Apple Pay</option><option>Cheque</option></select>
      </label>
      <label><span>Status</span>
        <select name="status">
          <option value="paid" ${p.status==="paid"?"selected":""}>Paid</option>
          <option value="pending" ${p.status==="pending"?"selected":""}>Pending</option>
          <option value="overdue" ${p.status==="overdue"?"selected":""}>Overdue</option>
        </select>
      </label>
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

// ---------- RENDER ----------
function renderAll() {
  renderDashboard(); renderProperties(); renderOwners();
  renderClients(); renderPayments(); renderWhatsapp(); renderReports();
}

function renderDashboard() {
  const d = store.data;
  const now = new Date();
  const mtdPaid = d.payments.filter(p => { const dt=new Date(p.date); return p.status==="paid" && dt.getMonth()===now.getMonth() && dt.getFullYear()===now.getFullYear(); });
  const income = mtdPaid.reduce((s,p)=>s+p.amount,0);
  const pending = d.payments.filter(p=>p.status!=="paid").reduce((s,p)=>s+p.amount,0);
  const overdue = d.payments.filter(p=>p.status==="overdue").length;
  const vacant = d.properties.filter(p=>p.status==="Vacant").length;

  document.getElementById("stat-income").textContent = fmt(income);
  document.getElementById("stat-pending").textContent = fmt(pending);
  document.getElementById("stat-pending-sub").textContent = `${overdue} client${overdue!==1?"s":""} overdue`;
  document.getElementById("stat-properties").textContent = d.properties.length;
  document.getElementById("stat-properties-sub").textContent = `${vacant} vacant`;
  document.getElementById("stat-clients").textContent = d.clients.length;

  const recent = [...d.payments].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,5);
  document.getElementById("recent-payments").innerHTML = recent.map(p => {
    const c = d.clients.find(x=>x.id===p.clientId);
    const pr = c ? d.properties.find(x=>x.id===c.propertyId) : null;
    return `<tr><td>${esc(c?.name||"—")}</td><td>${esc(pr?.title||"—")}</td><td><strong>${fmt(p.amount)}</strong></td><td>${statusPill(p.status)}</td></tr>`;
  }).join("") || `<tr><td colspan="4" class="empty">No payments yet</td></tr>`;

  const waMessages = [
    { author: "Ahmed (Owner)", time: "10:42 AM", text: "Mohammed paid Shop 4 rent AED 8,500 today via bank transfer.", tag: "Matched: Mohammed Rashid — AED 8,500" },
    { author: "Fatima (Owner)", time: "Yesterday", text: "Villa tenant will pay next week, confirmed.", tag: "Note: Sara Al Hammadi" },
    { author: "Bilal (Tenant)", time: "2 days ago", text: "Rent transferred, ref TXN-99210.", tag: "Matched: Bilal Khan — AED 12,000" },
    { author: "Zainab (Tenant)", time: "3 days ago", text: "Paid via Apple Pay, AED 9500.", tag: "Matched: Zainab Mirza — AED 9,500" },
  ];
  document.getElementById("wa-feed").innerHTML = waMessages.map(m => waMsgHtml(m)).join("");
  document.getElementById("wa-feed-2").innerHTML = waMessages.map(m => waMsgHtml(m)).join("");

  const months = [];
  for (let i=5; i>=0; i--) {
    const dt = new Date(now.getFullYear(), now.getMonth()-i, 1);
    const key = dt.toISOString().slice(0,7);
    const total = d.payments.filter(p=>p.status==="paid"&&p.date.startsWith(key)).reduce((s,p)=>s+p.amount,0);
    months.push({ m: dt.toLocaleDateString("en-US",{month:"short"}), v: total });
  }
  const max = Math.max(1,...months.map(x=>x.v));
  document.getElementById("chart").innerHTML = months.map(d => `
    <div class="bar"><div class="bar-value">${d.v?(d.v/1000).toFixed(0)+"k":"—"}</div>
    <div class="bar-fill" style="height:${(d.v/max)*170}px"></div>
    <div class="bar-label">${d.m}</div></div>`).join("");
}

function waMsgHtml(m) {
  return `<div class="wa-msg"><span class="wa-author">${esc(m.author)}</span><span class="wa-time">${esc(m.time)}</span><div class="wa-text">${esc(m.text)}</div><span class="wa-tag">&#10003; ${esc(m.tag)}</span></div>`;
}

function renderProperties() {
  let list = store.data.properties.filter(p => matchesSearch(p.title, p.addr, store.ownerName(p.ownerId)));
  if (propertyTab==="Occupied") list = list.filter(p=>p.status==="Occupied");
  if (propertyTab==="Vacant")   list = list.filter(p=>p.status==="Vacant");
  const svg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 12L12 3l9 9"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/></svg>`;
  document.getElementById("property-cards").innerHTML = list.length ? list.map(p => `
    <div class="property-card">
      <div class="property-img">${svg}<span class="status-tag">${esc(p.status)}</span></div>
      <div class="property-body">
        <h4 class="property-title">${esc(p.title)}</h4>
        <p class="property-addr">${esc(p.addr||"—")}</p>
        <div class="property-meta">
          <span>Owner: <strong>${esc(store.ownerName(p.ownerId))}</strong></span>
          <span><strong>${fmt(p.rent)}</strong>/mo</span>
        </div>
        <div class="property-meta" style="border:none;padding-top:8px;">
          <span class="row-actions">
            <button class="link-btn" onclick="editProperty('${p.id}')">Edit</button>
            <button class="link-btn danger" onclick="delProperty('${p.id}')">Delete</button>
          </span>
        </div>
      </div>
    </div>`).join("") : `<div class="empty-state">No properties match.</div>`;
}

function renderOwners() {
  const now = new Date();
  const list = store.data.owners.filter(o => matchesSearch(o.name, o.phone));
  document.getElementById("owners-rows").innerHTML = list.length ? list.map(o => {
    const props = store.data.properties.filter(p=>p.ownerId===o.id);
    const mtd = store.data.payments.filter(p => {
      if (p.status!=="paid") return false;
      const c = store.data.clients.find(x=>x.id===p.clientId);
      if (!c) return false;
      const pr = store.data.properties.find(x=>x.id===c.propertyId);
      const dt = new Date(p.date);
      return pr?.ownerId===o.id && dt.getMonth()===now.getMonth() && dt.getFullYear()===now.getFullYear();
    }).reduce((s,p)=>s+p.amount,0);
    const pend = store.data.payments.filter(p => {
      if (p.status==="paid") return false;
      const c = store.data.clients.find(x=>x.id===p.clientId);
      if (!c) return false;
      return store.data.properties.find(x=>x.id===c.propertyId)?.ownerId===o.id;
    }).reduce((s,p)=>s+p.amount,0);
    return `<tr><td><strong>${esc(o.name)}</strong></td><td>${esc(o.phone)}</td><td>${props.length}</td><td>${fmt(mtd)}</td><td>${fmt(pend)}</td>
    <td class="row-actions"><button class="link-btn" onclick="editOwner('${o.id}')">Edit</button><button class="link-btn danger" onclick="delOwner('${o.id}')">Delete</button></td></tr>`;
  }).join("") : `<tr><td colspan="6" class="empty">No owners yet</td></tr>`;
}

function renderClients() {
  const list = store.data.clients.filter(c => matchesSearch(c.name, c.phone, store.propertyTitle(c.propertyId)));
  document.getElementById("clients-rows").innerHTML = list.length ? list.map(c => {
    const last = [...store.data.payments].filter(p=>p.clientId===c.id).sort((a,b)=>b.date.localeCompare(a.date))[0];
    return `<tr><td><strong>${esc(c.name)}</strong></td><td>${esc(store.propertyTitle(c.propertyId))}</td><td>${esc(c.phone)}</td><td>${fmt(c.rent)}</td>
    <td>${statusPill(last?.status||"pending")}</td>
    <td class="row-actions"><button class="link-btn" onclick="addPayment('${c.id}')">+ Payment</button><button class="link-btn" onclick="editClient('${c.id}')">Edit</button><button class="link-btn danger" onclick="delClient('${c.id}')">Delete</button></td></tr>`;
  }).join("") : `<tr><td colspan="6" class="empty">No clients yet</td></tr>`;
}

function renderPayments() {
  let list = [...store.data.payments].sort((a,b)=>b.date.localeCompare(a.date));
  if (paymentTab==="Paid")    list = list.filter(p=>p.status==="paid");
  if (paymentTab==="Pending") list = list.filter(p=>p.status==="pending");
  if (paymentTab==="Overdue") list = list.filter(p=>p.status==="overdue");
  list = list.filter(p => matchesSearch(store.clientName(p.clientId), p.method, p.note));
  document.getElementById("payments-rows").innerHTML = list.length ? list.map(p => {
    const c = store.data.clients.find(x=>x.id===p.clientId);
    const pr = c ? store.data.properties.find(x=>x.id===c.propertyId) : null;
    return `<tr><td>${fmtDate(p.date)}</td><td><strong>${esc(c?.name||"—")}</strong></td><td>${esc(pr?.title||"—")}</td><td>${fmt(p.amount)}</td><td>${esc(p.method||"—")}</td><td>${statusPill(p.status)}</td>
    <td class="row-actions"><button class="link-btn" onclick="editPayment('${p.id}')">Edit</button><button class="link-btn danger" onclick="delPayment('${p.id}')">Delete</button></td></tr>`;
  }).join("") : `<tr><td colspan="7" class="empty">No payments match</td></tr>`;
}

function renderWhatsapp() {
  document.getElementById("wa-to").innerHTML = store.data.clients.map(c => `<option>${esc(c.name)} — ${esc(c.phone)}</option>`).join("");
}

function renderReports() {
  const d = store.data;
  const now = new Date();
  const months = [];
  for (let i=5; i>=0; i--) {
    const dt = new Date(now.getFullYear(), now.getMonth()-i, 1);
    const key = dt.toISOString().slice(0,7);
    const inc = d.payments.filter(p=>p.status==="paid"&&p.date.startsWith(key)).reduce((s,p)=>s+p.amount,0);
    months.push({ m: dt.toLocaleDateString("en-US",{month:"short"}), inc, exp: Math.floor(inc*0.2) });
  }
  const max = Math.max(1,...months.map(x=>x.inc));
  document.getElementById("chart-2").innerHTML = months.map(m => `
    <div class="bar"><div class="bar-value">${(m.inc/1000).toFixed(0)}k / ${(m.exp/1000).toFixed(0)}k</div>
    <div style="display:flex;gap:3px;align-items:flex-end;width:100%;max-width:48px;">
      <div class="bar-fill" style="height:${(m.inc/max)*155}px;flex:1;"></div>
      <div class="bar-fill" style="height:${(m.exp/max)*155}px;flex:1;background:linear-gradient(180deg,#c8963e,#a67530);"></div>
    </div><div class="bar-label">${m.m}</div></div>`).join("");

  const yearStart = `${now.getFullYear()}-01`;
  const totals = d.properties.map(p => {
    const clients = d.clients.filter(c=>c.propertyId===p.id);
    const total = d.payments.filter(pay => pay.status==="paid"&&pay.date>=yearStart&&clients.some(c=>c.id===pay.clientId)).reduce((s,x)=>s+x.amount,0);
    return { title: p.title, owner: store.ownerName(p.ownerId), total };
  }).sort((a,b)=>b.total-a.total).slice(0,5);
  document.getElementById("top-properties").innerHTML = totals.length ? totals.map(t =>
    `<tr><td><strong>${esc(t.title)}</strong></td><td>${esc(t.owner)}</td><td>${fmt(t.total)}</td></tr>`
  ).join("") : `<tr><td colspan="3" class="empty">No data yet</td></tr>`;
}
