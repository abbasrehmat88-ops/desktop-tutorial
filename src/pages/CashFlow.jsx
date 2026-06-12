import { useMemo, useState } from 'react';
import {
  Banknote,
  Zap,
  Landmark,
  ArrowDownToLine,
  ArrowUpFromLine,
  Calendar,
  Wallet,
  ShieldCheck,
  Flame,
} from 'lucide-react';
import businessData from '../data/businessData.json';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const fmt = (n) => (n && n !== 0 ? Number(n).toLocaleString() : '–');
const fmtAlways = (n) => Number(n || 0).toLocaleString();

// ---------- shared tiny components ----------

function Pill({ active, disabled, onClick, children }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
        active
          ? 'bg-charcoal-900 text-primary-400 shadow-card'
          : disabled
          ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
          : 'bg-white text-gray-600 border border-gray-200 hover:border-primary-500 hover:text-primary-700'
      }`}
    >
      {children}
    </button>
  );
}

function MiniStat({ icon: Icon, label, value, tone = 'plain' }) {
  const tones = {
    gold: 'text-primary-600 bg-primary-50',
    green: 'text-emerald2-600 bg-emerald2-50',
    red: 'text-rust-600 bg-rust-50',
    plain: 'text-charcoal-900 bg-gray-100',
  };
  const valueTones = {
    gold: 'text-primary-600',
    green: 'text-emerald2-600',
    red: 'text-rust-600',
    plain: 'text-charcoal-900',
  };
  return (
    <div className="stat-card !p-4 flex items-center gap-3">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${tones[tone]}`}>
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wide font-semibold text-gray-500">{label}</p>
        <p className={`text-lg font-bold leading-tight truncate ${valueTones[tone]}`}>{value}</p>
      </div>
    </div>
  );
}

const TH = ({ children, right }) => (
  <th className={`px-2 py-1.5 whitespace-nowrap ${right ? 'text-right' : 'text-left'}`}>{children}</th>
);

// ---------- Tab 1: Monthly Cash Flow ----------

function MonthlyCashFlow({ cashflow }) {
  const years = useMemo(
    () => [...new Set(cashflow.map((b) => b.year))].sort((a, b) => a - b),
    [cashflow]
  );
  const [year, setYear] = useState(years[0]);
  const monthsWithData = useMemo(
    () => new Set(cashflow.filter((b) => b.year === year && b.entries?.length).map((b) => b.month)),
    [cashflow, year]
  );
  const defaultMonth = monthsWithData.size ? Math.min(...monthsWithData) : 1;
  const [month, setMonth] = useState(defaultMonth);

  const block = cashflow.find((b) => b.year === year && b.month === month);
  const entries = block?.entries || [];

  const totals = entries.reduce(
    (acc, e) => ({
      incoming: acc.incoming + (e.incoming || 0),
      fewa: acc.fewa + (e.fewa || 0),
      ejaar: acc.ejaar + (e.ejaar || 0),
      others: acc.others + (e.others || 0),
    }),
    { incoming: 0, fewa: 0, ejaar: 0, others: 0 }
  );
  const net = totals.incoming - totals.fewa - totals.ejaar - totals.others;

  // year overview: per-month incoming vs outgoing
  const overview = MONTHS.map((label, i) => {
    const b = cashflow.find((x) => x.year === year && x.month === i + 1);
    if (!b || !b.entries?.length) return { label, month: i + 1, noData: true };
    const inc = b.entries.reduce((s, e) => s + (e.incoming || 0), 0);
    const out = b.entries.reduce((s, e) => s + (e.fewa || 0) + (e.ejaar || 0) + (e.others || 0), 0);
    return { label, month: i + 1, incoming: inc, outgoing: out, net: inc - out };
  });
  const maxBar = Math.max(1, ...overview.flatMap((m) => (m.noData ? [0] : [m.incoming, m.outgoing])));

  const selectYear = (y) => {
    setYear(y);
    const m = cashflow.filter((b) => b.year === y && b.entries?.length).map((b) => b.month);
    if (m.length && !m.includes(month)) setMonth(Math.min(...m));
  };

  return (
    <div className="space-y-6">
      {/* selectors */}
      <div className="flex flex-wrap items-center gap-2">
        {years.map((y) => (
          <Pill key={y} active={y === year} onClick={() => selectYear(y)}>
            <span className="inline-flex items-center gap-1">
              <Calendar size={12} /> {y}
            </span>
          </Pill>
        ))}
        <span className="w-px h-5 bg-gray-200 mx-1 hidden sm:block" />
        <div className="flex flex-wrap gap-1.5">
          {MONTHS.map((m, i) => (
            <Pill
              key={m}
              active={month === i + 1}
              disabled={!monthsWithData.has(i + 1)}
              onClick={() => setMonth(i + 1)}
            >
              {m}
            </Pill>
          ))}
        </div>
      </div>

      {/* stat mini-cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MiniStat icon={ArrowDownToLine} label="Total Incoming" value={`AED ${fmtAlways(totals.incoming)}`} tone="gold" />
        <MiniStat icon={Zap} label="Total FEWA" value={`AED ${fmtAlways(totals.fewa)}`} />
        <MiniStat icon={Landmark} label="Total Ejaar" value={`AED ${fmtAlways(totals.ejaar)}`} />
        <MiniStat
          icon={Wallet}
          label="Net Kept"
          value={`AED ${fmtAlways(net)}`}
          tone={net >= 0 ? 'green' : 'red'}
        />
      </div>

      {/* table */}
      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
          <Banknote size={16} className="text-primary-600" />
          <h3 className="font-semibold text-sm text-charcoal-900">
            {MONTHS[month - 1]} {year} — per villa
          </h3>
        </div>
        {entries.length === 0 ? (
          <p className="p-6 text-sm text-gray-400 text-center">No data for this month.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] font-semibold">
                <tr>
                  <TH>Villa</TH>
                  <TH right>Incoming</TH>
                  <TH right>FEWA</TH>
                  <TH right>Ejaar</TH>
                  <TH>Ejaar Date</TH>
                  <TH right>Others</TH>
                  <TH>Details</TH>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {entries.map((e, i) => (
                  <tr key={i} className="hover:bg-gray-50/60">
                    <td className="px-2 py-1.5 font-medium text-charcoal-900 whitespace-nowrap">{e.villa}</td>
                    <td className="px-2 py-1.5 text-right font-semibold text-primary-700 bg-primary-50/40 whitespace-nowrap">
                      {fmt(e.incoming)}
                    </td>
                    <td className="px-2 py-1.5 text-right text-gray-700 whitespace-nowrap">{fmt(e.fewa)}</td>
                    <td className="px-2 py-1.5 text-right text-gray-700 whitespace-nowrap">{fmt(e.ejaar)}</td>
                    <td className="px-2 py-1.5 text-gray-500 whitespace-nowrap">{e.ejaarDate || '–'}</td>
                    <td className="px-2 py-1.5 text-right text-gray-700 whitespace-nowrap">{fmt(e.others)}</td>
                    <td className="px-2 py-1.5 text-gray-500">{e.details || '–'}</td>
                  </tr>
                ))}
                <tr className="bg-gray-50 font-bold text-charcoal-900">
                  <td className="px-2 py-1.5">Total</td>
                  <td className="px-2 py-1.5 text-right text-primary-700">{fmtAlways(totals.incoming)}</td>
                  <td className="px-2 py-1.5 text-right">{fmtAlways(totals.fewa)}</td>
                  <td className="px-2 py-1.5 text-right">{fmtAlways(totals.ejaar)}</td>
                  <td className="px-2 py-1.5" />
                  <td className="px-2 py-1.5 text-right">{fmtAlways(totals.others)}</td>
                  <td className={`px-2 py-1.5 whitespace-nowrap ${net >= 0 ? 'text-emerald2-600' : 'text-rust-600'}`}>
                    Net {fmtAlways(net)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 12-month overview strip */}
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Calendar size={16} className="text-primary-600" />
          <h3 className="font-semibold text-sm text-charcoal-900">{year} at a glance</h3>
          <span className="ml-auto flex items-center gap-3 text-[10px] text-gray-500">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-primary-500 inline-block" /> In
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-charcoal-900 inline-block" /> Out
            </span>
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3">
          {overview.map((m) => (
            <button
              key={m.label}
              type="button"
              disabled={m.noData}
              onClick={() => !m.noData && setMonth(m.month)}
              className={`text-left rounded-lg px-2 py-1.5 transition-colors ${
                month === m.month ? 'bg-primary-50' : 'hover:bg-gray-50'
              } ${m.noData ? 'cursor-default' : ''}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-semibold uppercase text-gray-500 w-8">{m.label}</span>
                {m.noData ? (
                  <span className="text-[10px] text-gray-300">no data</span>
                ) : (
                  <span
                    className={`text-[11px] font-bold ${m.net >= 0 ? 'text-emerald2-600' : 'text-rust-600'}`}
                  >
                    {m.net >= 0 ? '+' : ''}
                    {m.net.toLocaleString()}
                  </span>
                )}
              </div>
              {!m.noData && (
                <div className="space-y-0.5">
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full"
                      style={{ width: `${(m.incoming / maxBar) * 100}%` }}
                    />
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-charcoal-900 rounded-full"
                      style={{ width: `${(m.outgoing / maxBar) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------- Tab 2: FEWA Bills ----------

function FewaBills({ villas }) {
  const years = useMemo(() => {
    const set = new Set();
    villas.forEach((v) => Object.keys(v.fewaConsumption || {}).forEach((y) => set.add(y)));
    return [...set].sort();
  }, [villas]);
  const [year, setYear] = useState(years.includes('2025') ? '2025' : years[years.length - 1]);

  const rows = useMemo(
    () =>
      villas
        .filter((v) => {
          const arr = v.fewaConsumption?.[year];
          return Array.isArray(arr) && arr.some((x) => x != null && x !== 0);
        })
        .map((v) => {
          const arr = v.fewaConsumption[year];
          const total = arr.reduce((s, x) => s + (x || 0), 0);
          const max = Math.max(...arr.map((x) => x || 0));
          return { villa: v, arr, total, max };
        }),
    [villas, year]
  );

  const grandTotal = rows.reduce((s, r) => s + r.total, 0);
  const colTotals = MONTHS.map((_, i) => rows.reduce((s, r) => s + (r.arr[i] || 0), 0));

  let peak = null;
  rows.forEach((r) => {
    r.arr.forEach((val, i) => {
      if (val != null && (!peak || val > peak.value)) {
        peak = { value: val, villa: r.villa.name, month: MONTHS[i] };
      }
    });
  });

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-500 -mt-2">Electricity &amp; water (FEWA) cost per villa per month</p>

      <div className="flex flex-wrap gap-1.5">
        {years.map((y) => (
          <Pill key={y} active={y === year} onClick={() => setYear(y)}>
            {y}
          </Pill>
        ))}
      </div>

      {/* summary card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <MiniStat icon={Zap} label={`Total FEWA spend ${year}`} value={`AED ${fmtAlways(grandTotal)}`} tone="gold" />
        <MiniStat
          icon={Flame}
          label="Most expensive bill"
          value={peak ? `${peak.villa} — ${peak.month} (AED ${fmtAlways(peak.value)})` : '–'}
          tone="red"
        />
      </div>

      <div className="card overflow-hidden">
        {rows.length === 0 ? (
          <p className="p-6 text-sm text-gray-400 text-center">No FEWA data for {year}.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] font-semibold">
                <tr>
                  <TH>Villa</TH>
                  {MONTHS.map((m) => (
                    <TH key={m} right>
                      {m}
                    </TH>
                  ))}
                  <TH right>Total</TH>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((r) => (
                  <tr key={r.villa.id} className="hover:bg-gray-50/60">
                    <td className="px-2 py-1.5 font-medium text-charcoal-900 whitespace-nowrap">{r.villa.name}</td>
                    {r.arr.map((val, i) => (
                      <td
                        key={i}
                        className={`px-2 py-1.5 text-right whitespace-nowrap ${
                          val != null && val !== 0 && val === r.max
                            ? 'bg-amber-50 text-amber-700 font-semibold'
                            : 'text-gray-700'
                        }`}
                      >
                        {val != null && val !== 0 ? val.toLocaleString() : '–'}
                      </td>
                    ))}
                    <td className="px-2 py-1.5 text-right font-bold text-charcoal-900 whitespace-nowrap">
                      {fmtAlways(r.total)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-gray-50 font-bold text-charcoal-900">
                  <td className="px-2 py-1.5">Total</td>
                  {colTotals.map((t, i) => (
                    <td key={i} className="px-2 py-1.5 text-right whitespace-nowrap">
                      {t ? t.toLocaleString() : '–'}
                    </td>
                  ))}
                  <td className="px-2 py-1.5 text-right text-primary-700 whitespace-nowrap">
                    {fmtAlways(grandTotal)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- Tab 3: Deposit History ----------

function DepositHistory({ deposits }) {
  const isHeld = (s) => (s || '').trim().toLowerCase().startsWith('still');
  const totalHeld = deposits.filter((d) => isHeld(d.status)).reduce((s, d) => s + (d.amount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <MiniStat
          icon={ShieldCheck}
          label="Total currently held"
          value={`AED ${fmtAlways(totalHeld)}`}
          tone="green"
        />
        <MiniStat icon={Banknote} label="Deposit records" value={deposits.length.toLocaleString()} />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] font-semibold">
              <tr>
                <TH>Villa / Room</TH>
                <TH>Name</TH>
                <TH right>Amount</TH>
                <TH>Date</TH>
                <TH>Status</TH>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {deposits.map((d, i) => (
                <tr key={i} className="hover:bg-gray-50/60">
                  <td className="px-2 py-1.5 font-medium text-charcoal-900 whitespace-nowrap">
                    {d.villa || d.room || '–'}
                  </td>
                  <td className="px-2 py-1.5 text-gray-700">{d.name || '–'}</td>
                  <td className="px-2 py-1.5 text-right font-semibold text-charcoal-900 whitespace-nowrap">
                    {fmt(d.amount)}
                  </td>
                  <td className="px-2 py-1.5 text-gray-500 whitespace-nowrap">{d.date || '–'}</td>
                  <td className="px-2 py-1.5 whitespace-nowrap">
                    {isHeld(d.status) ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald2-50 text-emerald2-600">
                        Still with us
                      </span>
                    ) : (
                      <span
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-500"
                        title={d.status}
                      >
                        Returned
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ---------- Page ----------

const TABS = [
  { id: 'monthly', label: 'Monthly Cash Flow', icon: ArrowUpFromLine },
  { id: 'fewa', label: 'FEWA Bills', icon: Zap },
  { id: 'deposits', label: 'Deposit History', icon: ShieldCheck },
];

export default function CashFlow() {
  const [tab, setTab] = useState('monthly');

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto animate-fade-up">
      <div className="mb-6">
        <h1 className="page-title">Cash Flow</h1>
        <span className="gold-rule" />
        <p className="text-sm text-gray-500 mt-3">Incoming, outgoing &amp; bills — complete money trail</p>
      </div>

      {/* tabs */}
      <div className="flex gap-1.5 mb-6 overflow-x-auto pb-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
              tab === id
                ? 'bg-charcoal-900 text-primary-400 shadow-card'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-primary-500 hover:text-primary-700'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {tab === 'monthly' && <MonthlyCashFlow cashflow={businessData.cashflow || []} />}
      {tab === 'fewa' && <FewaBills villas={businessData.villas || []} />}
      {tab === 'deposits' && <DepositHistory deposits={businessData.depositHistory || []} />}
    </div>
  );
}
