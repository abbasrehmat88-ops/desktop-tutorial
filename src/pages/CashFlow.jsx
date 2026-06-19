import { useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  Plus,
  X,
  Trash2,
  Loader2,
} from 'lucide-react';
import businessData from '../data/businessData.json';
import { watchCollection, addItem, removeItem } from '../data/db';

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
      className={`min-h-[36px] px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
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
        <p className={`text-lg font-bold leading-tight truncate tabular ${valueTones[tone]}`}>{value}</p>
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
          <div className="p-10 text-center">
            <div className="w-11 h-11 mx-auto mb-3 rounded-2xl bg-gray-100 flex items-center justify-center">
              <Banknote size={20} className="text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-500">No data for this month</p>
          </div>
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
                  <tr key={i} className="odd:bg-white even:bg-gray-50/40 hover:bg-primary-50/40 transition-colors">
                    <td className="px-2 py-2 font-medium text-charcoal-900 whitespace-nowrap">{e.villa}</td>
                    <td className="px-2 py-2 text-right font-semibold text-primary-700 bg-primary-50/40 tabular whitespace-nowrap">
                      {fmt(e.incoming)}
                    </td>
                    <td className="px-2 py-2 text-right text-gray-700 tabular whitespace-nowrap">{fmt(e.fewa)}</td>
                    <td className="px-2 py-2 text-right text-gray-700 tabular whitespace-nowrap">{fmt(e.ejaar)}</td>
                    <td className="px-2 py-2 text-gray-500 tabular whitespace-nowrap">{e.ejaarDate || '–'}</td>
                    <td className="px-2 py-2 text-right text-gray-700 tabular whitespace-nowrap">{fmt(e.others)}</td>
                    <td className="px-2 py-2 text-gray-500">{e.details || '–'}</td>
                  </tr>
                ))}
                <tr className="bg-charcoal-900 font-bold text-white">
                  <td className="px-2 py-2 text-primary-400">Total</td>
                  <td className="px-2 py-2 text-right text-primary-400 tabular">{fmtAlways(totals.incoming)}</td>
                  <td className="px-2 py-2 text-right tabular">{fmtAlways(totals.fewa)}</td>
                  <td className="px-2 py-2 text-right tabular">{fmtAlways(totals.ejaar)}</td>
                  <td className="px-2 py-2" />
                  <td className="px-2 py-2 text-right tabular">{fmtAlways(totals.others)}</td>
                  <td className={`px-2 py-2 tabular whitespace-nowrap ${net >= 0 ? 'text-emerald2-400' : 'text-rust-400'}`}>
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
                    className={`text-[11px] font-bold tabular ${m.net >= 0 ? 'text-emerald2-600' : 'text-rust-600'}`}
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

function AddFewaBillModal({ open, onClose, villas, defaultYear }) {
  const now = new Date();
  const [villaId, setVillaId] = useState(villas[0]?.id || '');
  const [year, setYear] = useState(defaultYear || String(now.getFullYear()));
  const [month, setMonth] = useState(now.getMonth());
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setAmount('');
      setError('');
      setYear(defaultYear || String(now.getFullYear()));
      setMonth(now.getMonth());
    }
  }, [open]); // eslint-disable-line

  async function handleSave(e) {
    e.preventDefault();
    const val = Number(amount);
    if (!villaId) return setError('Pick a villa.');
    if (!amount || isNaN(val) || val < 0) return setError('Enter a valid bill amount.');
    setSaving(true);
    try {
      const villa = villas.find((v) => v.id === villaId);
      await addItem('fewaBills', {
        villaId,
        villaName: villa?.name || villaId,
        year: String(year),
        month,            // 0-11
        amount: val,
      });
      onClose();
    } catch (err) {
      setError('Could not save: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  const yearOptions = [];
  for (let y = now.getFullYear() - 2; y <= now.getFullYear() + 1; y++) yearOptions.push(String(y));

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(19,21,28,0.6)' }}
      role="dialog"
      aria-modal="true"
      aria-label="Add FEWA Bill"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-premium w-full max-w-sm max-h-[92vh] flex flex-col animate-scale-in overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-display text-xl text-charcoal-900 flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Zap size={16} />
              </span>
              Add FEWA Bill
            </h2>
            <span className="gold-rule" />
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            <X size={18} className="text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleSave} className="px-6 py-5 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3 bg-rust-50 border border-rust-100 rounded-xl text-rust-700 text-sm">{error}</div>
          )}
          <div>
            <label htmlFor="fewa-villa" className="field-label">Villa *</label>
            <select id="fewa-villa" value={villaId} onChange={(e) => setVillaId(e.target.value)} className="input-field">
              {villas.map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="fewa-year" className="field-label">Year</label>
              <select id="fewa-year" value={year} onChange={(e) => setYear(e.target.value)} className="input-field">
                {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="fewa-month" className="field-label">Month</label>
              <select id="fewa-month" value={month} onChange={(e) => setMonth(Number(e.target.value))} className="input-field">
                {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="fewa-amount" className="field-label">Bill Amount (AED) *</label>
            <input
              id="fewa-amount"
              type="number" min="0" step="0.01" value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="input-field tabular" placeholder="e.g. 2450" autoFocus
            />
          </div>
          <div className="flex gap-3 pt-2 border-t border-gray-100 -mx-6 px-6 -mb-5 py-4 mt-5 bg-gray-50/50">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
              Save Bill
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

function FewaBills({ villas }) {
  const [liveBills, setLiveBills] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    return watchCollection('fewaBills', 'createdAt', 'desc',
      (data) => setLiveBills(data),
      (err) => console.error(err)
    );
  }, []);

  const years = useMemo(() => {
    const set = new Set();
    villas.forEach((v) => Object.keys(v.fewaConsumption || {}).forEach((y) => set.add(y)));
    liveBills.forEach((b) => set.add(String(b.year)));
    return [...set].sort();
  }, [villas, liveBills]);
  const [year, setYear] = useState(years.includes('2026') ? '2026' : years[years.length - 1]);

  const rows = useMemo(
    () =>
      villas
        .map((v) => {
          // Start from the Excel data, then overlay live uploaded bills
          const base = v.fewaConsumption?.[year];
          const arr = Array.isArray(base) ? [...base] : Array(12).fill(null);
          liveBills
            .filter((b) => b.villaId === v.id && String(b.year) === String(year))
            .forEach((b) => { arr[b.month] = (arr[b.month] || 0) + Number(b.amount || 0); });
          const total = arr.reduce((s, x) => s + (x || 0), 0);
          const max = Math.max(...arr.map((x) => x || 0));
          return { villa: v, arr, total, max };
        })
        .filter((r) => r.arr.some((x) => x != null && x !== 0)),
    [villas, year, liveBills]
  );

  async function deleteBill(bill) {
    if (!window.confirm(`Delete FEWA bill of AED ${Number(bill.amount).toLocaleString()} for ${bill.villaName} (${MONTHS[bill.month]} ${bill.year})?`)) return;
    try { await removeItem('fewaBills', bill.id); } catch (e) { console.error(e); }
  }

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 -mt-2">
        <p className="text-sm text-gray-500">Electricity &amp; water (FEWA) cost per villa per month</p>
        <button
          onClick={() => setModalOpen(true)}
          className="btn-primary flex items-center gap-2 self-start sm:self-auto text-sm"
        >
          <Plus size={16} /> Add FEWA Bill
        </button>
      </div>

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
          <div className="p-10 text-center">
            <div className="w-11 h-11 mx-auto mb-3 rounded-2xl bg-gray-100 flex items-center justify-center">
              <Zap size={20} className="text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-500">No FEWA data for {year}</p>
            <p className="text-xs text-gray-400 mt-1">Add a bill to start tracking.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] font-bold tracking-[0.08em] border-b border-gray-200">
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
                  <tr key={r.villa.id} className="odd:bg-white even:bg-gray-50/40 hover:bg-primary-50/40 transition-colors">
                    <td className="px-2 py-2 font-medium text-charcoal-900 whitespace-nowrap">{r.villa.name}</td>
                    {r.arr.map((val, i) => (
                      <td
                        key={i}
                        className={`px-2 py-2 text-right tabular whitespace-nowrap ${
                          val != null && val !== 0 && val === r.max
                            ? 'bg-amber-50 text-amber-700 font-semibold'
                            : 'text-gray-700'
                        }`}
                      >
                        {val != null && val !== 0 ? val.toLocaleString() : '–'}
                      </td>
                    ))}
                    <td className="px-2 py-2 text-right font-bold text-charcoal-900 tabular whitespace-nowrap">
                      {fmtAlways(r.total)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-charcoal-900 font-bold text-white">
                  <td className="px-2 py-2 text-primary-400">Total</td>
                  {colTotals.map((t, i) => (
                    <td key={i} className="px-2 py-2 text-right tabular whitespace-nowrap">
                      {t ? t.toLocaleString() : '–'}
                    </td>
                  ))}
                  <td className="px-2 py-2 text-right text-primary-400 tabular whitespace-nowrap">
                    {fmtAlways(grandTotal)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* recently uploaded bills (live, deletable) */}
      {liveBills.length > 0 && (
        <div className="card !p-0 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
            <Zap size={15} className="text-amber-500" />
            <h3 className="font-semibold text-charcoal-900 text-sm">Recently Uploaded Bills</h3>
            <span className="text-[11px] text-gray-400 ml-auto">{liveBills.length} added from app</span>
          </div>
          <ul className="divide-y divide-gray-100">
            {liveBills.slice(0, 15).map((b) => (
              <li key={b.id} className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50/60 transition-colors">
                <span className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <Zap size={13} />
                </span>
                <span className="font-medium text-charcoal-900 flex-1 min-w-0 truncate">{b.villaName}</span>
                <span className="text-xs text-gray-500 whitespace-nowrap">{MONTHS[b.month]} {b.year}</span>
                <span className="font-semibold text-charcoal-900 tabular whitespace-nowrap">AED {Number(b.amount).toLocaleString()}</span>
                <button
                  onClick={() => deleteBill(b)}
                  aria-label={`Delete FEWA bill for ${b.villaName} (${MONTHS[b.month]} ${b.year})`}
                  className="w-9 h-9 flex items-center justify-center shrink-0 text-gray-400 hover:text-rust-600 hover:bg-rust-50 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rust-600"
                >
                  <Trash2 size={15} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <AddFewaBillModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        villas={villas}
        defaultYear={year}
      />
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

      {/* tabs — segmented control */}
      <div
        role="tablist"
        aria-label="Cash flow view"
        className="inline-flex items-center gap-1 mb-6 p-1 bg-white border border-gray-200/80 rounded-2xl shadow-card max-w-full overflow-x-auto"
      >
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 min-h-[44px] px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
              tab === id
                ? 'bg-charcoal-900 text-primary-400 shadow-card'
                : 'text-gray-600 hover:text-primary-700 hover:bg-primary-50/60'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {tab === 'monthly' && <MonthlyCashFlow cashflow={businessData.cashflow || []} />}
      {tab === 'fewa' && <FewaBills villas={businessData.villas || []} />}
    </div>
  );
}
