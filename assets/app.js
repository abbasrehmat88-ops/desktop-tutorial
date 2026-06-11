// ---------- SAMPLE DATA ----------
const owners = [
  { name: "Mr. Tariq Mahmood", phone: "+92 300 1112233", properties: 4, mtd: "PKR 96,000", pending: "PKR 0" },
  { name: "Mrs. Ayesha Khan",  phone: "+92 321 4455667", properties: 3, mtd: "PKR 72,000", pending: "PKR 18,000" },
  { name: "Mr. Imran Siddiqui", phone: "+92 333 9988776", properties: 2, mtd: "PKR 48,000", pending: "PKR 0" },
  { name: "Mr. Yousuf Ali",     phone: "+92 345 1234567", properties: 5, mtd: "PKR 120,000", pending: "PKR 24,000" },
  { name: "Mrs. Sana Rauf",     phone: "+92 312 7654321", properties: 2, mtd: "PKR 36,000", pending: "PKR 0" },
];

const clients = [
  { name: "Ali Raza",        property: "Shop 4, Bahadurabad",     phone: "+92 300 1234567", rent: "PKR 35,000", status: "paid" },
  { name: "Fatima Noor",     property: "House A-12, Gulshan",     phone: "+92 321 8889991", rent: "PKR 55,000", status: "pending" },
  { name: "Bilal Ahmed",     property: "Flat 3B, Defence Ph 6",   phone: "+92 333 2223344", rent: "PKR 48,000", status: "paid" },
  { name: "Hassan Tariq",    property: "Shop 12, Tariq Road",     phone: "+92 345 5556677", rent: "PKR 28,000", status: "overdue" },
  { name: "Zainab Karim",    property: "House 22, North Nazimabad", phone: "+92 311 7778889", rent: "PKR 42,000", status: "paid" },
  { name: "Omar Sheikh",     property: "Flat 5A, Clifton Block 2",phone: "+92 322 4445556", rent: "PKR 65,000", status: "pending" },
  { name: "Rabia Sultan",    property: "Shop 7, Bahadurabad",     phone: "+92 333 1112223", rent: "PKR 32,000", status: "paid" },
  { name: "Junaid Malik",    property: "House B-7, Gulistan",     phone: "+92 300 9990001", rent: "PKR 38,000", status: "overdue" },
];

const properties = [
  { title: "Shop 4, Bahadurabad",       addr: "Main Bahadurabad, Karachi",  rent: "PKR 35,000", owner: "Mr. Tariq",  status: "Occupied" },
  { title: "House A-12, Gulshan",       addr: "Block 6, Gulshan-e-Iqbal",   rent: "PKR 55,000", owner: "Mrs. Ayesha", status: "Occupied" },
  { title: "Flat 3B, Defence Ph 6",     addr: "Khy-e-Shaheen, DHA",         rent: "PKR 48,000", owner: "Mr. Imran",   status: "Occupied" },
  { title: "Shop 12, Tariq Road",       addr: "Tariq Road, Karachi",        rent: "PKR 28,000", owner: "Mr. Yousuf",  status: "Occupied" },
  { title: "House 22, N. Nazimabad",    addr: "Block H, N. Nazimabad",      rent: "PKR 42,000", owner: "Mrs. Sana",   status: "Occupied" },
  { title: "Flat 5A, Clifton Block 2",  addr: "Clifton, Karachi",           rent: "PKR 65,000", owner: "Mr. Yousuf",  status: "Occupied" },
  { title: "Shop 9, Saddar",            addr: "Saddar, Karachi",            rent: "PKR 40,000", owner: "Mr. Tariq",   status: "Vacant" },
  { title: "House C-3, Johar Town",     addr: "Block 13, Gulistan-e-Johar", rent: "PKR 38,000", owner: "Mrs. Ayesha", status: "Vacant" },
];

const payments = [
  { date: "Jun 08, 2026", client: "Ali Raza",     property: "Shop 4, Bahadurabad",   amount: "PKR 35,000", method: "Bank Transfer", status: "paid" },
  { date: "Jun 07, 2026", client: "Bilal Ahmed",  property: "Flat 3B, Defence",      amount: "PKR 48,000", method: "Cash",          status: "paid" },
  { date: "Jun 06, 2026", client: "Zainab Karim", property: "House 22, N. Nazim.",   amount: "PKR 42,000", method: "JazzCash",      status: "paid" },
  { date: "Jun 05, 2026", client: "Rabia Sultan", property: "Shop 7, Bahadurabad",   amount: "PKR 32,000", method: "Bank Transfer", status: "paid" },
  { date: "Jun 05, 2026", client: "Fatima Noor",  property: "House A-12, Gulshan",   amount: "PKR 55,000", method: "—",             status: "pending" },
  { date: "Jun 05, 2026", client: "Omar Sheikh",  property: "Flat 5A, Clifton",      amount: "PKR 65,000", method: "—",             status: "pending" },
  { date: "May 28, 2026", client: "Hassan Tariq", property: "Shop 12, Tariq Road",   amount: "PKR 28,000", method: "—",             status: "overdue" },
  { date: "May 26, 2026", client: "Junaid Malik", property: "House B-7, Gulistan",   amount: "PKR 38,000", method: "—",             status: "overdue" },
];

const waMessages = [
  { author: "Tariq Uncle", time: "10:42 AM", text: "Ali Raza ne shop 4 ka kiraya 35000 bhej diya hai aaj.", tag: "Matched: Ali Raza — PKR 35,000" },
  { author: "Ayesha Aunty", time: "Yesterday", text: "House A-12 wale kiraya next week tak denge.", tag: "Note added: Fatima Noor" },
  { author: "Bilal Tenant", time: "2 days ago", text: "Rent paid via bank transfer, reference 9921.", tag: "Matched: Bilal Ahmed — PKR 48,000" },
  { author: "Zainab Tenant", time: "3 days ago", text: "JazzCash kar diya hai 42000.", tag: "Matched: Zainab Karim — PKR 42,000" },
  { author: "Rabia Tenant", time: "4 days ago", text: "Shop 7 kiraya bhej diya.", tag: "Matched: Rabia Sultan — PKR 32,000" },
];

const chartData = [
  { m: "Jan", v: 145000 },
  { m: "Feb", v: 158000 },
  { m: "Mar", v: 162000 },
  { m: "Apr", v: 171000 },
  { m: "May", v: 165000 },
  { m: "Jun", v: 184500 },
];

const topProps = [
  { title: "Flat 5A, Clifton", owner: "Mr. Yousuf", annual: "PKR 7,80,000" },
  { title: "House A-12, Gulshan", owner: "Mrs. Ayesha", annual: "PKR 6,60,000" },
  { title: "Flat 3B, Defence Ph 6", owner: "Mr. Imran", annual: "PKR 5,76,000" },
  { title: "House 22, N. Nazimabad", owner: "Mrs. Sana", annual: "PKR 5,04,000" },
  { title: "Shop 4, Bahadurabad", owner: "Mr. Tariq", annual: "PKR 4,20,000" },
];

// ---------- LOGIN ----------
const loginScreen = document.getElementById("login-screen");
const appShell = document.getElementById("app-shell");
document.getElementById("login-form").addEventListener("submit", (e) => {
  e.preventDefault();
  loginScreen.classList.add("hidden");
  appShell.classList.remove("hidden");
  render();
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
}

document.addEventListener("click", (e) => {
  const link = e.target.closest("[data-view]");
  if (link) {
    e.preventDefault();
    setView(link.dataset.view);
  }
});

// ---------- RENDER ----------
function statusPill(s) {
  const label = { paid: "Paid", pending: "Pending", overdue: "Overdue" }[s];
  return `<span class="status-pill ${s}">${label}</span>`;
}

function render() {
  // Recent payments (first 5)
  document.getElementById("recent-payments").innerHTML = payments.slice(0, 5).map(p => `
    <tr>
      <td>${p.client}</td>
      <td>${p.property}</td>
      <td><strong>${p.amount}</strong></td>
      <td>${statusPill(p.status)}</td>
    </tr>
  `).join("");

  // WhatsApp feed
  const waHtml = waMessages.map(m => `
    <div class="wa-msg">
      <span class="wa-author">${m.author}</span>
      <span class="wa-time">${m.time}</span>
      <div class="wa-text">${m.text}</div>
      <span class="wa-tag">✓ ${m.tag}</span>
    </div>
  `).join("");
  document.getElementById("wa-feed").innerHTML = waHtml;
  document.getElementById("wa-feed-2").innerHTML = waHtml;

  // Chart
  const max = Math.max(...chartData.map(d => d.v));
  document.getElementById("chart").innerHTML = chartData.map(d => `
    <div class="bar">
      <div class="bar-value">${(d.v/1000).toFixed(0)}k</div>
      <div class="bar-fill" style="height:${(d.v/max)*180}px"></div>
      <div class="bar-label">${d.m}</div>
    </div>
  `).join("");

  // Properties cards
  const houseSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 12L12 3l9 9"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/></svg>`;
  document.getElementById("property-cards").innerHTML = properties.map(p => `
    <div class="property-card">
      <div class="property-img">${houseSvg}</div>
      <div class="property-body">
        <h4 class="property-title">${p.title}</h4>
        <p class="property-addr">${p.addr}</p>
        <div class="property-meta">
          <span>Owner: <strong>${p.owner}</strong></span>
          <span><strong>${p.rent}</strong>/mo</span>
        </div>
        <div class="property-meta" style="border:none; padding-top:8px;">
          <span class="status-pill ${p.status === "Occupied" ? "paid" : "pending"}">${p.status}</span>
        </div>
      </div>
    </div>
  `).join("");

  // Owners
  document.getElementById("owners-rows").innerHTML = owners.map(o => `
    <tr>
      <td><strong>${o.name}</strong></td>
      <td>${o.phone}</td>
      <td>${o.properties}</td>
      <td>${o.mtd}</td>
      <td>${o.pending}</td>
      <td><a class="link" href="#">View</a></td>
    </tr>
  `).join("");

  // Clients
  document.getElementById("clients-rows").innerHTML = clients.map(c => `
    <tr>
      <td><strong>${c.name}</strong></td>
      <td>${c.property}</td>
      <td>${c.phone}</td>
      <td>${c.rent}</td>
      <td>${statusPill(c.status)}</td>
      <td><a class="link" href="#">View</a></td>
    </tr>
  `).join("");

  // Payments
  document.getElementById("payments-rows").innerHTML = payments.map(p => `
    <tr>
      <td>${p.date}</td>
      <td><strong>${p.client}</strong></td>
      <td>${p.property}</td>
      <td>${p.amount}</td>
      <td>${p.method}</td>
      <td>${statusPill(p.status)}</td>
    </tr>
  `).join("");

  // WhatsApp recipient dropdown
  document.getElementById("wa-to").innerHTML = clients.map(c => `<option>${c.name} — ${c.phone}</option>`).join("");

  // Reports
  document.getElementById("chart-2").innerHTML = ["Jan","Feb","Mar","Apr","May","Jun"].map((m, i) => {
    const inc = chartData[i].v;
    const exp = Math.floor(inc * 0.3);
    return `
      <div class="bar">
        <div class="bar-value">${(inc/1000).toFixed(0)}k / ${(exp/1000).toFixed(0)}k</div>
        <div style="display:flex; gap:4px; align-items:flex-end; width:100%; max-width:56px;">
          <div class="bar-fill" style="height:${(inc/max)*160}px; flex:1;"></div>
          <div class="bar-fill" style="height:${(exp/max)*160}px; flex:1; background:linear-gradient(180deg,#f59e0b,#ef4444);"></div>
        </div>
        <div class="bar-label">${m}</div>
      </div>
    `;
  }).join("");

  document.getElementById("top-properties").innerHTML = topProps.map(t => `
    <tr>
      <td><strong>${t.title}</strong></td>
      <td>${t.owner}</td>
      <td>${t.annual}</td>
    </tr>
  `).join("");
}
