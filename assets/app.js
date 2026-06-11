// ============================================================
// RentFlow — single-page rental management app
// Data persists in browser localStorage. No backend required.
// ============================================================

const STORE_KEY = "rentflow.v1";

// ---------- SEED DATA ----------
const seed = {
  owners: [
    { id: id(), name: "Mr. Tariq Mahmood",  phone: "+92 300 1112233", cnic: "42101-1234567-1", notes: "" },
    { id: id(), name: "Mrs. Ayesha Khan",   phone: "+92 321 4455667", cnic: "42101-2345678-2", notes: "" },
    { id: id(), name: "Mr. Imran Siddiqui", phone: "+92 333 9988776", cnic: "42101-3456789-3", notes: "" },
    { id: id(), name: "Mr. Yousuf Ali",     phone: "+92 345 1234567", cnic: "42101-4567890-4", notes: "" },
    { id: id(), name: "Mrs. Sana Rauf",     phone: "+92 312 7654321", cnic: "42101-5678901-5", notes: "" },
  ],
  properties: [],
  clients: [],
  payments: [],
};

// Build seed properties referencing owner IDs
(function seedProps() {
  const o = seed.owners;
  seed.properties = [
    { id: id(), title: "Shop 4, Bahadurabad",      addr: "Main Bahadurabad, Karachi",      rent: 35000, ownerId: o[0].id, status: "Occupied" },
    { id: id(), title: "House A-12, Gulshan",      addr: "Block 6, Gulshan-e-Iqbal",       rent: 55000, ownerId: o[1].id, status: "Occupied" },
    { id: id(), title: "Flat 3B, Defence Ph 6",    addr: "Khy-e-Shaheen, DHA",             rent: 48000, ownerId: o[2].id, status: "Occupied" },
    { id: id(), title: "Shop 12, Tariq Road",      addr: "Tariq Road, Karachi",            rent: 28000, ownerId: o[3].id, status: "Occupied" },
    { id: id(), title: "House 22, N. Nazimabad",   addr: "Block H, N. Nazimabad",          rent: 42000, ownerId: o[4].id, status: "Occupied" },
    { id: id(), title: "Flat 5A, Clifton Block 2", addr: "Clifton, Karachi",               rent: 65000, ownerId: o[3].id, status: "Occupied" },
    { id: id(), title: "Shop 9, Saddar",           addr: "Saddar, Karachi",                rent: 40000, ownerId: o[0].id, status: "Vacant" },
    { id: id(), title: "House C-3, Johar Town",    addr: "Block 13, Gulistan-e-Johar",     rent: 38000, ownerId: o[1].id, status: "Vacant" },
  ];

  const p = seed.properties;
  seed.clients = [
    { id: id(), name: "Ali Raza",     phone: "+92 300 1234567", propertyId: p[0].id, rent: 35000, cnic: "42201-1111111-1", joinDate: "2024-08-10" },
    { id: id(), name: "Fatima Noor",  phone: "+92 321 8889991", propertyId: p[1].id, rent: 55000, cnic: "42201-2222222-2", joinDate: "2023-11-01" },
    { id: id(), name: "Bilal Ahmed",  phone: "+92 333 2223344", propertyId: p[2].id, rent: 48000, cnic: "42201-3333333-3", joinDate: "2024-01-15" },
    { id: id(), name: "Hassan Tariq", phone: "+92 345 5556677", propertyId: p[3].id, rent: 28000, cnic: "42201-4444444-4", joinDate: "2024-04-20" },
    { id: id(), name: "Zainab Karim", phone: "+92 311 7778889", propertyId: p[4].id, rent: 42000, cnic: "42201-5555555-5", joinDate: "2024-03-05" },
    { id: id(), name: "Omar Sheikh",  phone: "+92 322 4445556", propertyId: p[5].id, rent: 65000, cnic: "42201-6666666-6", joinDate: "2024-06-12" },
  ];

  const c = seed.clients;
  seed.payments = [
    { id: id(), date: "2026-06-08", clientId: c[0].id, amount: 35000, method: "Bank Transfer", status: "paid",    note: "Jun rent" },
    { id: id(), date: "2026-06-07", clientId: c[2].id, amount: 48000, method: "Cash",          status: "paid",    note: "Jun rent" },
    { id: id(), date: "2026-06-06", clientId: c[4].id, amount: 42000, method: "JazzCash",      status: "paid",    note: "Jun rent" },
    { id: id(), date: "2026-06-05", clientId: c[1].id, amount: 55000, method: "—",             status: "pending", note: "Jun rent" },
    { id: id(), date: "2026-06-05", clientId: c[5].id, amount: 65000, method: "—",             status: "pending", note: "Jun rent" },
    { id: id(), date: "2026-05-28", clientId: c[3].id, amount: 28000, method: "—",             status: "overdue", note: "May rent" },
  ];
})();

function id() { return Math.random().toString(36).slice(2, 10); }

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

  // helpers
  ownerName(id) { return (this.data.owners.find(o => o.id === id) || {}).name || "—"; },
  propertyTitle(id) { return (this.data.properties.find(p => p.id === id) || {}).title || "—"; },
  clientName(id) { return (this.data.clients.find(c => c.id === id) || {}).name || "—"; },

  add(kind, item) { item.id = id(); this.data[kind].push(item); this.save(); },
  update(kind, id_, patch) {
    const i = this.data[kind].findIndex(x => x.id === id_);
    if (i >= 0) { this.data[kind][i] = { ...this.data[kind][i], ...patch }; this.save(); }
  },
  remove(kind, id_) {
    this.data[kind] = this.data[kind].filter(x => x.id !== id_);
    this.save();
  },
};

// ---------- HELPERS ----------
const fmt = (n) => "PKR " + Number(n || 0).toLocaleString("en-PK");
const fmtDate = (d) => {
  if (!d) return "—";
  const dt = new Date(d);
  return dt.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
};
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, m => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[m]));

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

// ---------- NAV ----------
const viewTitles = {
  dashboard: ["Dashboard", "Overview of your rental business"],
  properties: ["Properties", "All your managed properties"],
  owners: ["Owners", "Landlords and property owners"],
  clients: ["Clients", "Tenants and renters"],
  payments: ["Payments", "Rent collections and dues"],
  whatsapp: ["WhatsApp", "Connected messaging and group sync"],
  reports: ["Reports", "Income, expenses and trends"],
};

function setView(name) {
  document.querySelectorAll(".nav-item").forEach(n => n.classList.toggle("active", n.dataset.view === name));
  document.querySelectorAll(".view").forEach(v => v.classList.add("hidden"));
  document.getElementById("view-" + name).classList.remove("hidden");
  document.getElementById("view-title").textContent = viewTitles[name][0];
  document.getElementById("view-sub").textContent = viewTitles[name][1];
  searchInput.value = "";
  renderAll();
}

document.addEventListener("click", (e) => {
  const link = e.target.closest("[data-view]");
  if (link) { e.preventDefault(); setView(link.dataset.view); }
});

// ---------- SEARCH ----------
const searchInput = document.querySelector(".search input");
let searchTerm = "";
searchInput.addEventListener("input", (e) => {
  searchTerm = e.target.value.toLowerCase().trim();
  renderAll();
});
function matchesSearch(...fields) {
  if (!searchTerm) return true;
  return fields.some(f => String(f || "").toLowerCase().includes(searchTerm));
}

// ---------- TABS (Properties + Payments filters) ----------
let propertyTab = "All";
let paymentTab = "All";
document.addEventListener("click", (e) => {
  const tab = e.target.closest(".tab");
  if (!tab) return;
  const group = tab.parentElement;
  group.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  tab.classList.add("active");
  if (group.dataset.tabs === "properties") propertyTab = tab.textContent;
  if (group.dataset.tabs === "payments") paymentTab = tab.textContent;
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
          <button class="modal-close" aria-label="Close">×</button>
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
  // autofocus first input
  setTimeout(() => form.querySelector("input, select, textarea")?.focus(), 50);
}
function confirmDelete(label, onYes) {
  if (window.confirm(`Delete ${label}? This cannot be undone.`)) onYes();
}

// ---------- FORM TEMPLATES ----------
function ownerOptions(selectedId) {
  return store.data.owners.map(o =>
    `<option value="${o.id}" ${o.id === selectedId ? "selected" : ""}>${esc(o.name)}</option>`).join("");
}
function propertyOptions(selectedId) {
  return store.data.properties.map(p =>
    `<option value="${p.id}" ${p.id === selectedId ? "selected" : ""}>${esc(p.title)}</option>`).join("");
}
function clientOptions(selectedId) {
  return store.data.clients.map(c =>
    `<option value="${c.id}" ${c.id === selectedId ? "selected" : ""}>${esc(c.name)} — ${esc(c.phone)}</option>`).join("");
}

function ownerForm(o = {}) {
  return `
    <label><span>Name *</span><input name="name" required value="${esc(o.name || "")}"></label>
    <label><span>Phone *</span><input name="phone" required value="${esc(o.phone || "")}"></label>
    <label><span>CNIC</span><input name="cnic" value="${esc(o.cnic || "")}"></label>
    <label><span>Notes</span><textarea name="notes" rows="2">${esc(o.notes || "")}</textarea></label>`;
}
function propertyForm(p = {}) {
  return `
    <label><span>Title *</span><input name="title" required value="${esc(p.title || "")}"></label>
    <label><span>Address</span><input name="addr" value="${esc(p.addr || "")}"></label>
    <div class="form-row">
      <label><span>Monthly Rent (PKR) *</span><input name="rent" type="number" required value="${p.rent || ""}"></label>
      <label><span>Status</span>
        <select name="status">
          <option ${p.status === "Occupied" ? "selected" : ""}>Occupied</option>
          <option ${p.status === "Vacant" ? "selected" : ""}>Vacant</option>
        </select>
      </label>
    </div>
    <label><span>Owner *</span><select name="ownerId" required>${ownerOptions(p.ownerId)}</select></label>`;
}
function clientForm(c = {}) {
  return `
    <label><span>Name *</span><input name="name" required value="${esc(c.name || "")}"></label>
    <label><span>Phone *</span><input name="phone" required value="${esc(c.phone || "")}"></label>
    <label><span>CNIC</span><input name="cnic" value="${esc(c.cnic || "")}"></label>
    <label><span>Property *</span><select name="propertyId" required>${propertyOptions(c.propertyId)}</select></label>
    <div class="form-row">
      <label><span>Monthly Rent (PKR) *</span><input name="rent" type="number" required value="${c.rent || ""}"></label>
      <label><span>Join Date</span><input name="joinDate" type="date" value="${c.joinDate || ""}"></label>
    </div>`;
}
function paymentForm(p = {}) {
  return `
    <label><span>Client *</span><select name="clientId" required>${clientOptions(p.clientId)}</select></label>
    <div class="form-row">
      <label><span>Amount (PKR) *</span><input name="amount" type="number" required value="${p.amount || ""}"></label>
      <label><span>Date *</span><input name="date" type="date" required value="${p.date || new Date().toISOString().slice(0,10)}"></label>
    </div>
    <div class="form-row">
      <label><span>Method</span>
        <select name="method">
          <option>Cash</option><option>Bank Transfer</option><option>JazzCash</option><option>EasyPaisa</option><option>Cheque</option>
        </select>
      </label>
      <label><span>Status</span>
        <select name="status">
          <option value="paid" ${p.status === "paid" ? "selected" : ""}>Paid</option>
          <option value="pending" ${p.status === "pending" ? "selected" : ""}>Pending</option>
          <option value="overdue" ${p.status === "overdue" ? "selected" : ""}>Overdue</option>
        </select>
      </label>
    </div>
    <label><span>Note</span><input name="note" value="${esc(p.note || "")}"></label>`;
}

// ---------- ACTIONS ----------
window.addOwner = () => openModal("Add Owner", ownerForm(), d => { store.add("owners", d); renderAll(); });
window.editOwner = (id_) => {
  const o = store.data.owners.find(x => x.id === id_);
  openModal("Edit Owner", ownerForm(o), d => { store.update("owners", id_, d); renderAll(); });
};
window.delOwner = (id_) => confirmDelete("this owner", () => { store.remove("owners", id_); renderAll(); });

window.addProperty = () => openModal("Add Property", propertyForm(), d => {
  d.rent = Number(d.rent); store.add("properties", d); renderAll();
});
window.editProperty = (id_) => {
  const p = store.data.properties.find(x => x.id === id_);
  openModal("Edit Property", propertyForm(p), d => { d.rent = Number(d.rent); store.update("properties", id_, d); renderAll(); });
};
window.delProperty = (id_) => confirmDelete("this property", () => { store.remove("properties", id_); renderAll(); });

window.addClient = () => openModal("Add Client", clientForm(), d => {
  d.rent = Number(d.rent); store.add("clients", d); renderAll();
});
window.editClient = (id_) => {
  const c = store.data.clients.find(x => x.id === id_);
  openModal("Edit Client", clientForm(c), d => { d.rent = Number(d.rent); store.update("clients", id_, d); renderAll(); });
};
window.delClient = (id_) => confirmDelete("this client", () => { store.remove("clients", id_); renderAll(); });

window.addPayment = (clientId) => openModal("Record Payment", paymentForm({ clientId }), d => {
  d.amount = Number(d.amount); store.add("payments", d); renderAll();
});
window.editPayment = (id_) => {
  const p = store.data.payments.find(x => x.id === id_);
  openModal("Edit Payment", paymentForm(p), d => { d.amount = Number(d.amount); store.update("payments", id_, d); renderAll(); });
};
window.delPayment = (id_) => confirmDelete("this payment", () => { store.remove("payments", id_); renderAll(); });

window.resetData = () => {
  if (window.confirm("Reset all data back to the demo sample? Your changes will be lost.")) {
    store.reset(); renderAll();
  }
};

// ---------- RENDER ----------
function renderAll() {
  renderDashboard();
  renderProperties();
  renderOwners();
  renderClients();
  renderPayments();
  renderWhatsapp();
  renderReports();
}

function renderDashboard() {
  const d = store.data;
  const now = new Date();
  const mtdPayments = d.payments.filter(p => {
    const dt = new Date(p.date);
    return p.status === "paid" && dt.getMonth() === now.getMonth() && dt.getFullYear() === now.getFullYear();
  });
  const monthlyIncome = mtdPayments.reduce((s, p) => s + p.amount, 0);
  const pendingDues = d.payments.filter(p => p.status !== "paid").reduce((s, p) => s + p.amount, 0);
  const overdueCount = d.payments.filter(p => p.status === "overdue").length;
  const vacant = d.properties.filter(p => p.status === "Vacant").length;

  document.getElementById("stat-income").textContent = fmt(monthlyIncome);
  document.getElementById("stat-pending").textContent = fmt(pendingDues);
  document.getElementById("stat-pending-sub").textContent = `${overdueCount} clients overdue`;
  document.getElementById("stat-properties").textContent = d.properties.length;
  document.getElementById("stat-properties-sub").textContent = `${vacant} vacant`;
  document.getElementById("stat-clients").textContent = d.clients.length;

  // Recent payments
  const recent = [...d.payments].sort((a,b) => b.date.localeCompare(a.date)).slice(0, 5);
  document.getElementById("recent-payments").innerHTML = recent.map(p => {
    const client = d.clients.find(c => c.id === p.clientId);
    const prop = client ? d.properties.find(pr => pr.id === client.propertyId) : null;
    return `<tr>
      <td>${esc(client?.name || "—")}</td>
      <td>${esc(prop?.title || "—")}</td>
      <td><strong>${fmt(p.amount)}</strong></td>
      <td>${statusPill(p.status)}</td>
    </tr>`;
  }).join("") || `<tr><td colspan="4" class="empty">No payments yet</td></tr>`;

  // WhatsApp activity (static demo feed)
  const waMessages = [
    { author: "Tariq Uncle", time: "10:42 AM", text: "Ali Raza ne shop 4 ka kiraya 35000 bhej diya hai aaj.", tag: "Matched: Ali Raza — PKR 35,000" },
    { author: "Ayesha Aunty", time: "Yesterday", text: "House A-12 wale kiraya next week tak denge.", tag: "Note added: Fatima Noor" },
    { author: "Bilal Tenant", time: "2 days ago", text: "Rent paid via bank transfer, reference 9921.", tag: "Matched: Bilal Ahmed — PKR 48,000" },
    { author: "Zainab Tenant", time: "3 days ago", text: "JazzCash kar diya hai 42000.", tag: "Matched: Zainab Karim — PKR 42,000" },
  ];
  document.getElementById("wa-feed").innerHTML = waMessages.map(m => waMsgHtml(m)).join("");
  document.getElementById("wa-feed-2").innerHTML = waMessages.map(m => waMsgHtml(m)).join("");

  // Chart — last 6 months actual paid totals
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const dt = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = dt.toISOString().slice(0, 7);
    const total = d.payments.filter(p => p.status === "paid" && p.date.startsWith(key)).reduce((s, p) => s + p.amount, 0);
    months.push({ m: dt.toLocaleDateString("en-US", { month: "short" }), v: total });
  }
  const max = Math.max(1, ...months.map(x => x.v));
  document.getElementById("chart").innerHTML = months.map(d => `
    <div class="bar">
      <div class="bar-value">${d.v ? (d.v/1000).toFixed(0) + "k" : "—"}</div>
      <div class="bar-fill" style="height:${(d.v/max)*180}px"></div>
      <div class="bar-label">${d.m}</div>
    </div>`).join("");
}

function waMsgHtml(m) {
  return `<div class="wa-msg">
    <span class="wa-author">${esc(m.author)}</span>
    <span class="wa-time">${esc(m.time)}</span>
    <div class="wa-text">${esc(m.text)}</div>
    <span class="wa-tag">✓ ${esc(m.tag)}</span>
  </div>`;
}

function renderProperties() {
  let list = store.data.properties.filter(p =>
    matchesSearch(p.title, p.addr, store.ownerName(p.ownerId)));
  if (propertyTab === "Occupied") list = list.filter(p => p.status === "Occupied");
  if (propertyTab === "Vacant")   list = list.filter(p => p.status === "Vacant");

  const houseSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 12L12 3l9 9"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/></svg>`;
  const grid = document.getElementById("property-cards");
  grid.innerHTML = list.length ? list.map(p => `
    <div class="property-card">
      <div class="property-img">${houseSvg}</div>
      <div class="property-body">
        <h4 class="property-title">${esc(p.title)}</h4>
        <p class="property-addr">${esc(p.addr || "—")}</p>
        <div class="property-meta">
          <span>Owner: <strong>${esc(store.ownerName(p.ownerId))}</strong></span>
          <span><strong>${fmt(p.rent)}</strong>/mo</span>
        </div>
        <div class="property-meta" style="border:none; padding-top:8px; justify-content:space-between;">
          <span class="status-pill ${p.status === "Occupied" ? "paid" : "pending"}">${esc(p.status)}</span>
          <span class="row-actions">
            <button class="link" onclick="editProperty('${p.id}')">Edit</button>
            <button class="link danger" onclick="delProperty('${p.id}')">Delete</button>
          </span>
        </div>
      </div>
    </div>`).join("") : `<div class="empty-state">No properties match.</div>`;
}

function renderOwners() {
  const list = store.data.owners.filter(o => matchesSearch(o.name, o.phone, o.cnic));
  const rows = list.map(o => {
    const props = store.data.properties.filter(p => p.ownerId === o.id);
    const mtd = store.data.payments.filter(p => {
      if (p.status !== "paid") return false;
      const c = store.data.clients.find(x => x.id === p.clientId);
      if (!c) return false;
      const prop = store.data.properties.find(x => x.id === c.propertyId);
      const now = new Date();
      const dt = new Date(p.date);
      return prop?.ownerId === o.id && dt.getMonth() === now.getMonth() && dt.getFullYear() === now.getFullYear();
    }).reduce((s, p) => s + p.amount, 0);
    const pending = store.data.payments.filter(p => {
      if (p.status === "paid") return false;
      const c = store.data.clients.find(x => x.id === p.clientId);
      if (!c) return false;
      const prop = store.data.properties.find(x => x.id === c.propertyId);
      return prop?.ownerId === o.id;
    }).reduce((s, p) => s + p.amount, 0);
    return `<tr>
      <td><strong>${esc(o.name)}</strong></td>
      <td>${esc(o.phone)}</td>
      <td>${props.length}</td>
      <td>${fmt(mtd)}</td>
      <td>${fmt(pending)}</td>
      <td class="row-actions">
        <button class="link" onclick="editOwner('${o.id}')">Edit</button>
        <button class="link danger" onclick="delOwner('${o.id}')">Delete</button>
      </td>
    </tr>`;
  }).join("");
  document.getElementById("owners-rows").innerHTML = rows || `<tr><td colspan="6" class="empty">No owners yet</td></tr>`;
}

function renderClients() {
  const list = store.data.clients.filter(c => matchesSearch(c.name, c.phone, store.propertyTitle(c.propertyId)));
  const rows = list.map(c => {
    const lastPayment = [...store.data.payments]
      .filter(p => p.clientId === c.id)
      .sort((a,b) => b.date.localeCompare(a.date))[0];
    const status = lastPayment?.status || "pending";
    return `<tr>
      <td><strong>${esc(c.name)}</strong></td>
      <td>${esc(store.propertyTitle(c.propertyId))}</td>
      <td>${esc(c.phone)}</td>
      <td>${fmt(c.rent)}</td>
      <td>${statusPill(status)}</td>
      <td class="row-actions">
        <button class="link" onclick="addPayment('${c.id}')">+ Payment</button>
        <button class="link" onclick="editClient('${c.id}')">Edit</button>
        <button class="link danger" onclick="delClient('${c.id}')">Delete</button>
      </td>
    </tr>`;
  }).join("");
  document.getElementById("clients-rows").innerHTML = rows || `<tr><td colspan="6" class="empty">No clients yet</td></tr>`;
}

function renderPayments() {
  let list = [...store.data.payments].sort((a,b) => b.date.localeCompare(a.date));
  if (paymentTab === "Paid")    list = list.filter(p => p.status === "paid");
  if (paymentTab === "Pending") list = list.filter(p => p.status === "pending");
  if (paymentTab === "Overdue") list = list.filter(p => p.status === "overdue");
  list = list.filter(p => matchesSearch(store.clientName(p.clientId), p.method, p.note));

  const rows = list.map(p => {
    const c = store.data.clients.find(x => x.id === p.clientId);
    const prop = c ? store.data.properties.find(pr => pr.id === c.propertyId) : null;
    return `<tr>
      <td>${fmtDate(p.date)}</td>
      <td><strong>${esc(c?.name || "—")}</strong></td>
      <td>${esc(prop?.title || "—")}</td>
      <td>${fmt(p.amount)}</td>
      <td>${esc(p.method || "—")}</td>
      <td>${statusPill(p.status)}</td>
      <td class="row-actions">
        <button class="link" onclick="editPayment('${p.id}')">Edit</button>
        <button class="link danger" onclick="delPayment('${p.id}')">Delete</button>
      </td>
    </tr>`;
  }).join("");
  document.getElementById("payments-rows").innerHTML = rows || `<tr><td colspan="7" class="empty">No payments match</td></tr>`;
}

function renderWhatsapp() {
  document.getElementById("wa-to").innerHTML = store.data.clients
    .map(c => `<option>${esc(c.name)} — ${esc(c.phone)}</option>`).join("");
}

function renderReports() {
  const d = store.data;
  const now = new Date();
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const dt = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = dt.toISOString().slice(0, 7);
    const inc = d.payments.filter(p => p.status === "paid" && p.date.startsWith(key)).reduce((s, p) => s + p.amount, 0);
    const exp = Math.floor(inc * 0.25);
    months.push({ m: dt.toLocaleDateString("en-US", { month: "short" }), inc, exp });
  }
  const max = Math.max(1, ...months.map(x => x.inc));
  document.getElementById("chart-2").innerHTML = months.map(m => `
    <div class="bar">
      <div class="bar-value">${(m.inc/1000).toFixed(0)}k / ${(m.exp/1000).toFixed(0)}k</div>
      <div style="display:flex; gap:4px; align-items:flex-end; width:100%; max-width:56px;">
        <div class="bar-fill" style="height:${(m.inc/max)*160}px; flex:1;"></div>
        <div class="bar-fill" style="height:${(m.exp/max)*160}px; flex:1; background:linear-gradient(180deg,#f59e0b,#ef4444);"></div>
      </div>
      <div class="bar-label">${m.m}</div>
    </div>`).join("");

  // Top properties: total paid this year
  const yearStart = `${now.getFullYear()}-01`;
  const totals = d.properties.map(p => {
    const clients = d.clients.filter(c => c.propertyId === p.id);
    const total = d.payments
      .filter(pay => pay.status === "paid" && pay.date >= yearStart && clients.some(c => c.id === pay.clientId))
      .reduce((s, x) => s + x.amount, 0);
    return { title: p.title, owner: store.ownerName(p.ownerId), total };
  }).sort((a,b) => b.total - a.total).slice(0, 5);
  document.getElementById("top-properties").innerHTML = totals.map(t => `
    <tr><td><strong>${esc(t.title)}</strong></td><td>${esc(t.owner)}</td><td>${fmt(t.total)}</td></tr>
  `).join("") || `<tr><td colspan="3" class="empty">No data yet</td></tr>`;
}
