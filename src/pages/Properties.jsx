import { useMemo, useState } from 'react';
import {
  Building2,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Zap,
  Home,
  DoorOpen,
  Wallet,
} from 'lucide-react';
import businessData from '../data/businessData.json';

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
        <Icon size={14} className="text-primary-600" />
        {label}
      </div>
      <div className={`mt-1.5 text-lg sm:text-xl font-bold ${valueClass}`}>{value}</div>
      {sub && <div className="mt-0.5 text-[11px] text-gray-400 truncate">{sub}</div>}
    </div>
  );
}

const thBase = 'px-2 py-1.5 text-left whitespace-nowrap';
const tdBase = 'px-2 py-1.5 whitespace-nowrap';

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

      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-charcoal-900 flex items-center justify-center font-bold text-lg shadow-card shrink-0">
          {villa.num}
        </div>
        <div>
          <h1 className="page-title">{villa.name}</h1>
          <span className="gold-rule" />
        </div>
      </div>

      {/* year pills */}
      <div className="flex flex-wrap gap-2 mt-6">
        {years.map((y) => (
          <button
            key={y}
            onClick={() => setYear(y)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              y === year
                ? 'bg-charcoal-900 text-primary-400 shadow-card'
                : 'bg-primary-50 text-charcoal-900 hover:bg-primary-100'
            }`}
          >
            {y}
          </button>
        ))}
      </div>

      {/* stat mini-cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-5">
        <MiniStat icon={TrendingUp} label="Income" value={`AED ${fmt(yd.incomeTotal)}`} />
        <MiniStat icon={TrendingDown} label="Expenses" value={`AED ${fmt(yd.expenseTotal)}`} />
        <MiniStat
          icon={Wallet}
          label="Net Profit"
          value={`AED ${fmtSigned(yd.profitTotal)}`}
          valueClass={profitClass(yd.profitTotal)}
        />
        <MiniStat
          icon={Zap}
          label="FEWA Total"
          value={fewaTotal !== null ? `AED ${fmt(fewaTotal)}` : '–'}
        />
      </div>

      {/* room income table */}
      <div className="card mt-6 !p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
          <DoorOpen size={16} className="text-primary-600" />
          <h2 className="font-semibold text-charcoal-900 text-sm">Room Income — {year}</h2>
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
        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
          <TrendingDown size={16} className="text-rust-600" />
          <h2 className="font-semibold text-charcoal-900 text-sm">Expenses — {year}</h2>
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
          <div className="flex items-center gap-2 mb-3">
            <Zap size={16} className="text-amber-500" />
            <h2 className="font-semibold text-charcoal-900 text-sm">
              FEWA Consumption — {year} (AED)
            </h2>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-2">
            {fewaStrip.map((v, i) => (
              <div
                key={i}
                className="rounded-lg border border-gray-100 bg-gray-50 p-2 flex flex-col items-center"
              >
                <span className="text-[10px] uppercase font-semibold text-gray-400">
                  {MONTHS[i]}
                </span>
                <span className="text-xs font-semibold text-charcoal-900 mt-0.5">{fmt(v)}</span>
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
        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
          <TrendingUp size={16} className="text-primary-600" />
          <h2 className="font-semibold text-charcoal-900 text-sm">Year over Year</h2>
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
                    <td className={`${tdBase} text-right text-gray-700`}>{fmt(d.incomeTotal)}</td>
                    <td className={`${tdBase} text-right text-gray-700`}>{fmt(d.expenseTotal)}</td>
                    <td
                      className={`${tdBase} text-right font-semibold ${
                        d.profitTotal === null || d.profitTotal === undefined
                          ? 'text-gray-400'
                          : profitClass(d.profitTotal)
                      }`}
                    >
                      {fmtSigned(d.profitTotal)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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

  return (
    <button
      onClick={onSelect}
      className="card text-left w-full hover:shadow-float hover:-translate-y-1 transition-all duration-300 cursor-pointer"
    >
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-charcoal-900 flex items-center justify-center font-bold shadow-card shrink-0">
          {villa.num}
        </div>
        <div className="min-w-0">
          <h3 className="font-semibold text-charcoal-900 text-sm leading-snug truncate">
            {villa.name}
          </h3>
          <p className="text-[11px] text-gray-400 mt-0.5">
            {years[0]} – {latest}
          </p>
          <p className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-1">
            <Home size={11} className="text-primary-600" />
            {maxRooms} room{maxRooms === 1 ? '' : 's'}
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-1.5 text-xs">
        <div className="flex justify-between">
          <span className="text-gray-500">Income {latest}</span>
          <span className="font-semibold text-charcoal-900">AED {fmt(yd.incomeTotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Expenses {latest}</span>
          <span className="font-semibold text-charcoal-900">AED {fmt(yd.expenseTotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Net Profit {latest}</span>
          <span className={`font-bold ${profitClass(yd.profitTotal)}`}>
            AED {fmtSigned(yd.profitTotal)}
          </span>
        </div>
      </div>

      <ProfitSparkline monthly={yd.profitMonthly} />
    </button>
  );
}

export default function Properties() {
  const [selectedId, setSelectedId] = useState(null);
  const villas = businessData.villas || [];

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
