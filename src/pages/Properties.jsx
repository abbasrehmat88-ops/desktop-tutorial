import { useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Building2,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Zap,
  Home,
  DoorOpen,
  Wallet,
  ChevronRight,
} from 'lucide-react';
import businessData from '../data/businessData.json';

// The app shell (<main>) is the scroll container, not the window —
// must scroll it explicitly when switching views.
function scrollAppToTop() {
  const main = document.querySelector('main');
  if (main) main.scrollTo({ top: 0, behavior: 'instant' });
  window.scrollTo(0, 0);
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// ---------- helpers ----------

const fmt = (n) => {
  if (n === null || n === undefined || Number.isNaN(n)) return '–';
  return Math.round(n).toLocaleString();
};

const fmtSigned = (n) => {
  if (n === null || n === undefined || Number.isNaN(n)) return '–';
  const v = Math.round(n);
  return v < 0 ? `−${Math.abs(v).toLocaleString()}` : v.toLocaleString();
};

// Year keys can be "2018" or "2023-24" — plain string sort orders them correctly.
const sortedYears = (yearsObj) => Object.keys(yearsObj || {}).sort();

const sumNonNull = (arr) =>
  (arr || []).reduce((s, v) => (v === null || v === undefined ? s : s + v), 0);

const profitClass = (n) => (n !== null && n !== undefined && n < 0 ? 'text-rust-600' : 'text-emerald2-600');

// In-progress years sometimes lack the Total cell — derive it from
// the monthly values or room totals so cards never show "–".
const hasVal = (n) => n !== null && n !== undefined && !Number.isNaN(n);
function effIncome(yd) {
  if (hasVal(yd?.incomeTotal)) return yd.incomeTotal;
  if (Array.isArray(yd?.incomeMonthly) && yd.incomeMonthly.some(hasVal)) return sumNonNull(yd.incomeMonthly);
  if (Array.isArray(yd?.rooms) && yd.rooms.length) return yd.rooms.reduce((s, r) => s + (hasVal(r.total) ? r.total : sumNonNull(r.monthly)), 0);
  return null;
}
function effExpense(yd) {
  if (hasVal(yd?.expenseTotal)) return yd.expenseTotal;
  if (Array.isArray(yd?.expenseMonthly) && yd.expenseMonthly.some(hasVal)) return sumNonNull(yd.expenseMonthly);
  return null;
}
function effProfit(yd) {
  if (hasVal(yd?.profitTotal)) return yd.profitTotal;
  const inc = effIncome(yd), exp = effExpense(yd);
  if (inc !== null && exp !== null) return inc - exp;
  return null;
}

// ---------- small pieces ----------

function ProfitSparkline({ monthly }) {
  const data = Array.isArray(monthly) ? monthly : Array(12).fill(null);
  const maxAbs = Math.max(1, ...data.map((v) => Math.abs(v || 0)));
  return (
    <div className="flex items-end gap-[3px] h-10 mt-3" aria-hidden="true">
      {data.map((v, i) => {
        const val = v || 0;
        const h = Math.max(2, Math.round((Math.abs(val) / maxAbs) * 36));
        return (
          <div key={i} className="flex-1 flex items-end justify-center h-full">
            <div
              className={`w-full rounded-sm ${val < 0 ? 'bg-rust-600/70' : 'bg-emerald2-600/70'}`}
              style={{ height: `${h}px` }}
              title={`${MONTHS[i]}: ${fmtSigned(v)}`}
            />
          </div>
        );
      })}
    </div>
  );
}

function MiniStat({ icon: Icon, label, value, sub, valueClass = 'text-charcoal-900' }) {
  return (
    <div className="stat-card !p-4 sm:!p-5">
      <div className="flex items-center gap-2 text-gray-500 text-[11px] uppercase font-semibold tracking-wide">
        <span className="w-7 h-7 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
          <Icon size={14} className="text-primary-600" />
        </span>
        {label}
      </div>
      <div className={`mt-2.5 text-lg sm:text-xl font-bold tabular-nums ${valueClass}`}>{value}</div>
      {sub && <div className="mt-0.5 text-[11px] text-gray-400 truncate">{sub}</div>}
    </div>
  );
}

const thBase = 'px-2 py-2 text-left whitespace-nowrap';
const tdBase = 'px-2 py-2 whitespace-nowrap tabular-nums';

function MonthlyHeader({ first, second }) {
  return (
    <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] font-semibold">
      <tr>
        <th className={thBase}>{first}</th>
        {second !== undefined && <th className={thBase}>{second}</th>}
        {MONTHS.map((m) => (
          <th key={m} className={`${thBase} text-right`}>
            {m}
          </th>
        ))}
        <th className={`${thBase} text-right`}>Total</th>
      </tr>
    </thead>
  );
}

// ---------- detail view ----------

function VillaDetail({ villa, onBack }) {
  const years = sortedYears(villa.years);
  const [year, setYear] = useState(years[years.length - 1]);
  const yd = villa.years[year] || {};

  const fewaMonthly =
    yd.expenses?.['Electricity (FEWA)']?.monthly || villa.fewaConsumption?.[year] || null;
  const fewaTotal = fewaMonthly ? sumNonNull(fewaMonthly) : null;
  const fewaStrip = villa.fewaConsumption?.[year];
  const fewaStripMax = fewaStrip ? Math.max(1, ...fewaStrip.map((v) => v || 0)) : 1;

  const expenseTypes = Object.keys(yd.expenses || {});

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto animate-fade-up">
      <button
        onClick={onBack}
        className="btn-secondary inline-flex items-center gap-2 mb-5 text-sm"
      >
        <ArrowLeft size={16} />
        All Properties
      </button>

      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 text-charcoal-900 flex items-center justify-center font-display font-bold text-xl shadow-glow-sm shrink-0">
          {villa.num}
        </div>
        <div>
          <p className="section-label mb-0.5">Villa Portfolio</p>
          <h1 className="page-title">{villa.name}</h1>
          <span className="gold-rule" />
        </div>
      </div>

      {/* year pills */}
      <div className="flex items-center gap-2 mt-6">
        <span className="section-label hidden sm:inline-block mr-1">Year</span>
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Select year">
          {years.map((y) => (
            <button
              key={y}
              role="tab"
              aria-selected={y === year}
              onClick={() => setYear(y)}
              className={`px-4 py-2 rounded-full text-xs font-bold tabular-nums transition-all duration-300 ${
                y === year
                  ? 'bg-charcoal-900 text-primary-400 shadow-card'
                  : 'bg-white border border-gray-200 text-charcoal-700 hover:border-primary-400 hover:text-primary-700'
              }`}
            >
              {y}
            </button>
          ))}
        </div>
      </div>

      {/* stat mini-cards — keyed by year so switching years re-animates */}
      <div key={year} className="animate-fade-up">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-5">
        <MiniStat icon={TrendingUp} label="Income" value={`AED ${fmt(effIncome(yd))}`} />
        <MiniStat icon={TrendingDown} label="Expenses" value={`AED ${fmt(effExpense(yd))}`} />
        <MiniStat
          icon={Wallet}
          label="Net Profit"
          value={`AED ${fmtSigned(effProfit(yd))}`}
          valueClass={profitClass(effProfit(yd))}
        />
        <MiniStat
          icon={Zap}
          label="FEWA Total"
          value={fewaTotal !== null ? `AED ${fmt(fewaTotal)}` : '–'}
        />
      </div>

      {/* room income table */}
      <div className="card mt-6 !p-0 overflow-hidden">
        <div className="px-4 py-3.5 border-b border-gray-100 flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
            <DoorOpen size={16} className="text-primary-600" />
          </span>
          <h2 className="font-display text-base text-charcoal-900">Room Income <span className="text-gray-400 font-sans text-sm tabular-nums">· {year}</span></h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <MonthlyHeader first="Room" second="Tenant" />
            <tbody className="divide-y divide-gray-100">
              {(yd.rooms || []).map((r, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className={`${tdBase} font-medium text-charcoal-900`}>{r.room}</td>
                  <td className={`${tdBase} text-gray-600 max-w-[140px] truncate`}>{r.tenant}</td>
                  {(r.monthly || Array(12).fill(null)).map((v, j) => (
                    <td key={j} className={`${tdBase} text-right text-gray-700`}>
                      {fmt(v)}
                    </td>
                  ))}
                  <td className={`${tdBase} text-right font-semibold text-charcoal-900`}>
                    {fmt(r.total)}
                  </td>
                </tr>
              ))}
              <tr className="bg-primary-50 font-bold text-charcoal-900">
                <td className={tdBase} colSpan={2}>
                  Total Income
                </td>
                {(yd.incomeMonthly || Array(12).fill(null)).map((v, j) => (
                  <td key={j} className={`${tdBase} text-right`}>
                    {fmt(v)}
                  </td>
                ))}
                <td className={`${tdBase} text-right`}>{fmt(yd.incomeTotal)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* expenses table */}
      <div className="card mt-6 !p-0 overflow-hidden">
        <div className="px-4 py-3.5 border-b border-gray-100 flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-lg bg-rust-50 flex items-center justify-center flex-shrink-0">
            <TrendingDown size={16} className="text-rust-600" />
          </span>
          <h2 className="font-display text-base text-charcoal-900">Expenses <span className="text-gray-400 font-sans text-sm tabular-nums">· {year}</span></h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <MonthlyHeader first="Expense" />
            <tbody className="divide-y divide-gray-100">
              {expenseTypes.map((name) => {
                const e = yd.expenses[name];
                return (
                  <tr key={name} className="hover:bg-gray-50">
                    <td className={`${tdBase} font-medium text-charcoal-900`}>{name}</td>
                    {(e.monthly || Array(12).fill(null)).map((v, j) => (
                      <td key={j} className={`${tdBase} text-right text-gray-700`}>
                        {fmt(v)}
                      </td>
                    ))}
                    <td className={`${tdBase} text-right font-semibold text-charcoal-900`}>
                      {fmt(e.total)}
                    </td>
                  </tr>
                );
              })}
              <tr className="bg-rust-50 font-bold text-charcoal-900">
                <td className={tdBase}>Total Expenses</td>
                {(yd.expenseMonthly || Array(12).fill(null)).map((v, j) => (
                  <td key={j} className={`${tdBase} text-right`}>
                    {fmt(v)}
                  </td>
                ))}
                <td className={`${tdBase} text-right`}>{fmt(yd.expenseTotal)}</td>
              </tr>
              <tr className="bg-gray-50 font-bold">
                <td className={`${tdBase} text-charcoal-900`}>Net Profit</td>
                {(yd.profitMonthly || Array(12).fill(null)).map((v, j) => (
                  <td
                    key={j}
                    className={`${tdBase} text-right ${
                      v === null || v === undefined ? 'text-gray-400' : profitClass(v)
                    }`}
                  >
                    {fmtSigned(v)}
                  </td>
                ))}
                <td className={`${tdBase} text-right ${profitClass(yd.profitTotal)}`}>
                  {fmtSigned(yd.profitTotal)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* FEWA consumption strip */}
      {fewaStrip && (
        <div className="card mt-6">
          <div className="flex items-center gap-2.5 mb-4">
            <span className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
              <Zap size={16} className="text-primary-600" />
            </span>
            <h2 className="font-display text-base text-charcoal-900">
              FEWA Consumption <span className="text-gray-400 font-sans text-sm tabular-nums">· {year} · AED</span>
            </h2>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-2">
            {fewaStrip.map((v, i) => (
              <div
                key={i}
                className="rounded-xl border border-gray-100 bg-gray-50 p-2 flex flex-col items-center transition-colors hover:border-primary-200"
              >
                <span className="text-[10px] uppercase font-semibold text-gray-400">
                  {MONTHS[i]}
                </span>
                <span className="text-xs font-semibold text-charcoal-900 mt-0.5 tabular-nums">{fmt(v)}</span>
                <div className="w-full h-8 flex items-end mt-1">
                  <div
                    className="w-full rounded-sm bg-gradient-to-t from-amber-500 to-primary-400"
                    style={{
                      height: `${Math.max(2, Math.round(((v || 0) / fewaStripMax) * 32))}px`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* year-over-year table */}
      <div className="card mt-6 !p-0 overflow-hidden">
        <div className="px-4 py-3.5 border-b border-gray-100 flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
            <TrendingUp size={16} className="text-primary-600" />
          </span>
          <h2 className="font-display text-base text-charcoal-900">Year over Year</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] font-semibold">
              <tr>
                <th className={thBase}>Year</th>
                <th className={`${thBase} text-right`}>Income</th>
                <th className={`${thBase} text-right`}>Expenses</th>
                <th className={`${thBase} text-right`}>Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {years.map((y) => {
                const d = villa.years[y];
                return (
                  <tr
                    key={y}
                    className={`hover:bg-gray-50 cursor-pointer ${y === year ? 'bg-primary-50' : ''}`}
                    onClick={() => setYear(y)}
                  >
                    <td className={`${tdBase} font-semibold text-charcoal-900`}>{y}</td>
                    <td className={`${tdBase} text-right text-gray-700`}>{fmt(effIncome(d))}</td>
                    <td className={`${tdBase} text-right text-gray-700`}>{fmt(effExpense(d))}</td>
                    <td
                      className={`${tdBase} text-right font-semibold ${
                        effProfit(d) === null ? 'text-gray-400' : profitClass(effProfit(d))
                      }`}
                    >
                      {fmtSigned(effProfit(d))}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      </div>
    </div>
  );
}

// ---------- portfolio grid ----------

function VillaCard({ villa, onSelect }) {
  const years = sortedYears(villa.years);
  const latest = years[years.length - 1];
  const yd = villa.years[latest] || {};
  const maxRooms = Math.max(0, ...years.map((y) => (villa.years[y].rooms || []).length));
  const income = effIncome(yd);
  const expense = effExpense(yd);
  const profit = effProfit(yd);

  return (
    <button
      onClick={onSelect}
      aria-label={`View ${villa.name}`}
      className="card p-5 text-left w-full hover:shadow-float hover:-translate-y-1.5 active:scale-[0.97] active:bg-primary-50/40 transition-all duration-300 cursor-pointer group"
    >
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 text-charcoal-900 flex items-center justify-center font-display font-bold text-lg shadow-card shrink-0 group-hover:scale-110 group-hover:shadow-glow-sm transition-all duration-300">
          {villa.num}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-base text-charcoal-900 leading-snug truncate">
            {villa.name}
          </h3>
          <p className="text-[11px] text-gray-400 mt-0.5 tabular-nums">
            {years[0]} – {latest}
          </p>
          <p className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-1">
            <Home size={11} className="text-primary-600" />
            {maxRooms} room{maxRooms === 1 ? '' : 's'}
          </p>
        </div>
        <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-primary-700 bg-primary-50 group-hover:bg-primary-100 px-2.5 py-1.5 rounded-full transition-colors shrink-0">
          View <ChevronRight size={11} className="group-hover:translate-x-0.5 transition-transform" />
        </span>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100 space-y-2 text-xs">
        <div className="flex justify-between items-center">
          <span className="text-gray-500 flex items-center gap-1.5"><TrendingUp size={12} className="text-emerald2-500" />Income {latest}</span>
          <span className="font-semibold text-charcoal-900 tabular-nums">AED {fmt(income)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-500 flex items-center gap-1.5"><TrendingDown size={12} className="text-rust-500" />Expenses {latest}</span>
          <span className="font-semibold text-charcoal-900 tabular-nums">AED {fmt(expense)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-500 flex items-center gap-1.5"><Wallet size={12} className="text-primary-600" />Net Profit {latest}</span>
          <span className={`font-bold tabular-nums ${profitClass(profit)}`}>
            AED {fmtSigned(profit)}
          </span>
        </div>
      </div>

      <ProfitSparkline monthly={yd.profitMonthly} />
    </button>
  );
}

export default function Properties() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get('villa');
  const villas = businessData.villas || [];

  function setSelectedId(id) {
    const next = new URLSearchParams(searchParams);
    if (id) next.set('villa', id);
    else next.delete('villa');
    setSearchParams(next);   // pushState — phone back button returns to the list
  }

  // New view = start at the top, not wherever the list was scrolled to
  useEffect(() => {
    scrollAppToTop();
  }, [selectedId]);

  const stats = useMemo(() => {
    let best = null; // { villa, year, profit }
    villas.forEach((v) => {
      Object.entries(v.years).forEach(([y, d]) => {
        if (d.profitTotal !== null && d.profitTotal !== undefined) {
          if (!best || d.profitTotal > best.profit) {
            best = { villa: v.name, year: y, profit: d.profitTotal };
          }
        }
      });
    });

    // most recent year (across all villas) that has any profit data
    const allYears = new Set();
    villas.forEach((v) =>
      Object.entries(v.years).forEach(([y, d]) => {
        if (d.profitTotal !== null && d.profitTotal !== undefined) allYears.add(y);
      })
    );
    const latestYear = [...allYears].sort().pop() || null;
    const latestCombined = latestYear
      ? villas.reduce((s, v) => {
          const p = v.years[latestYear]?.profitTotal;
          return p === null || p === undefined ? s : s + p;
        }, 0)
      : null;

    return { best, latestYear, latestCombined };
  }, [villas]);

  const selected = villas.find((v) => v.id === selectedId);
  if (selected) {
    return <VillaDetail key={selected.id} villa={selected} onBack={() => setSelectedId(null)} />;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto animate-fade-up">
      <p className="section-label mb-1">Villa Portfolio</p>
      <h1 className="page-title">Properties</h1>
      <span className="gold-rule" />
      <p className="text-gray-500 text-sm mt-3">14 villas — full income &amp; expense history</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-6">
        <MiniStat icon={Building2} label="Total Villas" value={villas.length} />
        <MiniStat
          icon={TrendingUp}
          label="Best Year Profit"
          value={stats.best ? `AED ${fmtSigned(stats.best.profit)}` : '–'}
          sub={stats.best ? `${stats.best.villa} · ${stats.best.year}` : undefined}
          valueClass={stats.best ? profitClass(stats.best.profit) : 'text-charcoal-900'}
        />
        <MiniStat
          icon={Wallet}
          label={`Combined Profit ${stats.latestYear || ''}`}
          value={stats.latestCombined !== null ? `AED ${fmtSigned(stats.latestCombined)}` : '–'}
          sub={stats.latestYear ? `All villas · ${stats.latestYear}` : undefined}
          valueClass={
            stats.latestCombined !== null ? profitClass(stats.latestCombined) : 'text-charcoal-900'
          }
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 mt-6">
        {villas.map((v) => (
          <VillaCard key={v.id} villa={v} onSelect={() => setSelectedId(v.id)} />
        ))}
      </div>
    </div>
  );
}
