import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { addItem } from '../data/db'
import { CheckCircle, Loader2, AlertCircle, Upload } from 'lucide-react'

// All tenants read from the spreadsheet image.
// rentSchedule = payment date range written in the sheet (e.g. "5 To 10").
// paid is set to false by default — mark each one paid once you collect.
const TENANTS = [
  // ── ADIL VILLA 8 ──────────────────────────────────────────────────
  { property:'Adil Villa 8',    unit:'ADV-1',    name:'Amal Deen / Abid',       rentAmount:720,  rentSchedule:'5 To 5'   },
  { property:'Adil Villa 8',    unit:'ADV-2',    name:'Sajid Khan',              rentAmount:720,  rentSchedule:'1 To 5'   },
  { property:'Adil Villa 8',    unit:'ADV-3',    name:'Sohail',                  rentAmount:720,  rentSchedule:'5 To 5'   },
  { property:'Adil Villa 8',    unit:'ADV-4',    name:'Usman Dhani',             rentAmount:1500, rentSchedule:'5 To 10'  },
  { property:'Adil Villa 8',    unit:'ADV-5',    name:'Shereen Benzeer',         rentAmount:1400, rentSchedule:'20 To 5'  },
  { property:'Adil Villa 8',    unit:'ADV-6',    name:'Talaab Punjabi',          rentAmount:1400, rentSchedule:'1 To 5'   },
  { property:'Adil Villa 8',    unit:'ADV-7',    name:'Shereen',                 rentAmount:1500, rentSchedule:''         },
  { property:'Adil Villa 8',    unit:'ADV-8',    name:'Arif Rao',                rentAmount:1650, rentSchedule:'5 To 10'  },
  { property:'Adil Villa 8',    unit:'ADV-9',    name:'Saloon',                  rentAmount:1100, rentSchedule:'1 To 5'   },
  { property:'Adil Villa 8',    unit:'ADV-10',   name:'Saqib Baloch',            rentAmount:800,  rentSchedule:''         },

  // ── DAWOOD VILLA 6 ────────────────────────────────────────────────
  { property:'Dawood Villa 6',  unit:'DWV-11',   name:'Nizam Deen',              rentAmount:800,  rentSchedule:'1 To 5'   },
  { property:'Dawood Villa 6',  unit:'DWV-12',   name:'Shahid Ali',              rentAmount:1400, rentSchedule:'1 To 5'   },
  { property:'Dawood Villa 6',  unit:'DWV-13',   name:'Maqsood',                 rentAmount:1500, rentSchedule:'5 To 5'   },
  { property:'Dawood Villa 6',  unit:'DWV-14',   name:'Cha Cha Cafeteria',       rentAmount:1150, rentSchedule:'3 To 5'   },
  { property:'Dawood Villa 6',  unit:'DWV-15',   name:'Sohail',                  rentAmount:1500, rentSchedule:'1 To 5'   },
  { property:'Dawood Villa 6',  unit:'DWV-16',   name:'Shahzad / Adidi',         rentAmount:1000, rentSchedule:'1 To 5'   },
  { property:'Dawood Villa 6',  unit:'DWV-17',   name:'Shahzad / Rauf',          rentAmount:1000, rentSchedule:'5 To 10'  },
  { property:'Dawood Villa 6',  unit:'DWV-18',   name:'Farhan / Bangali',        rentAmount:1000, rentSchedule:'1 To 10'  },
  { property:'Dawood Villa 6',  unit:'DWV-19',   name:'Saeed CCTV',              rentAmount:800,  rentSchedule:'1 To 10'  },
  { property:'Dawood Villa 6',  unit:'DWV-20',   name:'Hamza Afgan',             rentAmount:800,  rentSchedule:'5 To 5'   },
  { property:'Dawood Villa 6',  unit:'DWV-201',  name:'Sharjafat Taxi',          rentAmount:900,  rentSchedule:'5 To 10'  },

  // ── MUSTAFA VILLA 9 ───────────────────────────────────────────────
  { property:'Mustafa Villa 9', unit:'MSV-21',   name:'Karim / Noor Hasan',      rentAmount:1400, rentSchedule:'1 To 5'   },
  { property:'Mustafa Villa 9', unit:'MSV-22',   name:'Noor Hasan',              rentAmount:1900, rentSchedule:'3 To 5'   },
  { property:'Mustafa Villa 9', unit:'MSV-23',   name:'Noman Tanker Wala',       rentAmount:1000, rentSchedule:'1 To 5'   },
  { property:'Mustafa Villa 9', unit:'MSV-24',   name:'Alam',                    rentAmount:770,  rentSchedule:'1 To 8'   },
  { property:'Mustafa Villa 9', unit:'MSV-25',   name:'Store Room Alam Son',     rentAmount:300,  rentSchedule:'3 To 5'   },

  // ── ARIF VILLA 10 ─────────────────────────────────────────────────
  { property:'Arif Villa 10',   unit:'ARV-31',   name:'Du Haj',                  rentAmount:1100, rentSchedule:'5 To 5'   },
  { property:'Arif Villa 10',   unit:'ARV-32',   name:'Hamza Baloch',            rentAmount:1400, rentSchedule:'1 To 5'   },
  { property:'Arif Villa 10',   unit:'ARV-33',   name:'Rahimullah / Manto',      rentAmount:1400, rentSchedule:'3 To 5'   },
  { property:'Arif Villa 10',   unit:'ARV-34',   name:'Bilal / Rachman',         rentAmount:1000, rentSchedule:'1 To 5'   },
  { property:'Arif Villa 10',   unit:'ARV-35',   name:'Bilal Shah',              rentAmount:1000, rentSchedule:'1 To 5'   },
  { property:'Arif Villa 10',   unit:'ARV-36',   name:'Ali Khan Sweetly',        rentAmount:875,  rentSchedule:'1 To 10'  },
  { property:'Arif Villa 10',   unit:'ARV-37',   name:'Shoaib Haji',             rentAmount:1020, rentSchedule:'1 To 10'  },
  { property:'Arif Villa 10',   unit:'ARV-38',   name:'Ahmad Abdul Aziz',        rentAmount:1400, rentSchedule:'1 To 10'  },
  { property:'Arif Villa 10',   unit:'ARV-39',   name:'Arif Hawas Kesh',         rentAmount:600,  rentSchedule:'1 To 5'   },

  // ── NO ENTRY VILLA 12 ─────────────────────────────────────────────
  { property:'No Entry Villa 12', unit:'NEV-41', name:'Du Wala',                 rentAmount:1300, rentSchedule:'10 To 15' },
  { property:'No Entry Villa 12', unit:'NEV-42', name:'Umar / Saeed',            rentAmount:800,  rentSchedule:'1 To 5'   },
  { property:'No Entry Villa 12', unit:'NEV-43', name:'Totano Bandwal',          rentAmount:800,  rentSchedule:'1 To 5'   },
  { property:'No Entry Villa 12', unit:'NEV-44', name:'Nizar',                   rentAmount:800,  rentSchedule:'1 To 5'   },
  { property:'No Entry Villa 12', unit:'NEV-45', name:'Adnan Lalor',             rentAmount:1500, rentSchedule:'1 To 5'   },
  { property:'No Entry Villa 12', unit:'NEV-46', name:'Adnan Zafar',             rentAmount:1500, rentSchedule:'1 To 5'   },
  { property:'No Entry Villa 12', unit:'NEV-47', name:'Hussain Bangal',          rentAmount:1500, rentSchedule:'1 To 5'   },
  { property:'No Entry Villa 12', unit:'NEV-48', name:'Ajay Makwari',            rentAmount:1000, rentSchedule:'20 To 25' },
  { property:'No Entry Villa 12', unit:'NEV-50', name:'Taxi Seeni Room',         rentAmount:1500, rentSchedule:'5 To 20'  },

  // ── ZAM ZAM VILLA 7 ───────────────────────────────────────────────
  { property:'Zam Zam Villa 7', unit:'ZZV-51',   name:'Imran Typing Wala',       rentAmount:1100, rentSchedule:'1 To 5'   },
  { property:'Zam Zam Villa 7', unit:'ZZV-52',   name:'Said Ali',                rentAmount:3100, rentSchedule:'3 To 5'   },
  { property:'Zam Zam Villa 7', unit:'ZZV-53',   name:'Aleem Forman',            rentAmount:1500, rentSchedule:'1 To 5'   },
  { property:'Zam Zam Villa 7', unit:'ZZV-54',   name:'Punjabi Back Room',       rentAmount:800,  rentSchedule:'5 To 10'  },

  // ── PARK VILLA 34 ─────────────────────────────────────────────────
  { property:'Park Villa 34',   unit:'PKV-61',   name:'Misbah Afghan',           rentAmount:1300, rentSchedule:'1 To 5'   },
  { property:'Park Villa 34',   unit:'PKV-62',   name:'Sajeed',                  rentAmount:1400, rentSchedule:'10 To 15' },
  { property:'Park Villa 34',   unit:'PKV-63',   name:'Imran Makhbaz',           rentAmount:1400, rentSchedule:'1 To 5'   },
  { property:'Park Villa 34',   unit:'PKV-64',   name:'M Shah Nawaz',            rentAmount:1400, rentSchedule:'1 To 5'   },
  { property:'Park Villa 34',   unit:'PKV-65',   name:'Subhan Taxi',             rentAmount:1000, rentSchedule:'5 To 10'  },
  { property:'Park Villa 34',   unit:'PKV-66',   name:'Khuram Afghan',           rentAmount:800,  rentSchedule:'1 To 5'   },
  { property:'Park Villa 34',   unit:'PKV-67',   name:'Ameer Sodani',            rentAmount:1000, rentSchedule:'1 To 5'   },
  { property:'Park Villa 34',   unit:'PKV-68',   name:'DTC Driver',              rentAmount:800,  rentSchedule:'1 To 5'   },

  // ── ABRAR VILLA 42 ────────────────────────────────────────────────
  { property:'Abrar Villa 42',  unit:'ABV-71',   name:'Dil Haji',                rentAmount:1100, rentSchedule:'1 To 10'  },
  { property:'Abrar Villa 42',  unit:'ABV-72',   name:'Kamal Front Room',        rentAmount:1300, rentSchedule:'1 To 5'   },
  { property:'Abrar Villa 42',  unit:'ABV-73',   name:'Kamal Back Room',         rentAmount:1000, rentSchedule:'1 To 5'   },
  { property:'Abrar Villa 42',  unit:'ABV-74',   name:'Himmat Labor 2',          rentAmount:1600, rentSchedule:'1 To 5'   },
  { property:'Abrar Villa 42',  unit:'ABV-75',   name:'Afghan Last Room',        rentAmount:1000, rentSchedule:'1 To 5'   },
  { property:'Abrar Villa 42',  unit:'ABV-76',   name:'Himmat Hujri',            rentAmount:1000, rentSchedule:'1 To 5'   },
  { property:'Abrar Villa 42',  unit:'ABV-77',   name:'Bahadur',                 rentAmount:875,  rentSchedule:'1 To 5'   },
  { property:'Abrar Villa 42',  unit:'ABV-78',   name:'Hijamat Oil Wala',        rentAmount:4800, rentSchedule:'1 To 10'  },
  { property:'Abrar Villa 42',  unit:'ABV-79',   name:'Rehmat Big Room / Haider',rentAmount:1500, rentSchedule:''         },

  // ── FLAT BUILDING 24 ──────────────────────────────────────────────
  { property:'Flat Building 24', unit:'FLB-81',  name:'Noman B1',                rentAmount:1500, rentSchedule:'15 To 20' },
  { property:'Flat Building 24', unit:'FLB-82',  name:'Noman B1 (2)',            rentAmount:1500, rentSchedule:'15 To 20' },
  { property:'Flat Building 24', unit:'FLB-83',  name:'Flat Building Room',      rentAmount:1650, rentSchedule:'15 To 20' },
  { property:'Flat Building 24', unit:'FLB-84',  name:'Qazi Link Room',          rentAmount:1600, rentSchedule:''         },
  { property:'Flat Building 24', unit:'FLB-85',  name:'Said MC Room',            rentAmount:1800, rentSchedule:'10 To 15' },
  { property:'Flat Building 24', unit:'FLB-87',  name:'M Akbar',                 rentAmount:900,  rentSchedule:'1 To 10'  },

  // ── MUNEER VILLA 13 ───────────────────────────────────────────────
  { property:'Muneer Villa 13', unit:'MNV-89',   name:'Ihsan / Zafar',           rentAmount:875,  rentSchedule:'15 onwards'},
  { property:'Muneer Villa 13', unit:'MNV-90',   name:'Ihsan / Zafar (2)',       rentAmount:875,  rentSchedule:'15 onwards'},
  { property:'Muneer Villa 13', unit:'MNV-91',   name:'Ihsan / Zafar (3)',       rentAmount:875,  rentSchedule:'15 onwards'},
  { property:'Muneer Villa 13', unit:'MNV-92',   name:'Ihsan (4)',               rentAmount:875,  rentSchedule:'15 onwards'},
  { property:'Muneer Villa 13', unit:'MNV-93',   name:'Rasool Jan',              rentAmount:1100, rentSchedule:'1 To 5'   },
  { property:'Muneer Villa 13', unit:'MNV-94',   name:'Razaallah',               rentAmount:875,  rentSchedule:'15 onwards'},

  // ── MUNEER VILLA 10 ───────────────────────────────────────────────
  { property:'Muneer Villa 10', unit:'MNV2-101', name:'Hamid Recovery',          rentAmount:0,    rentSchedule:'1 To 5'   },
  { property:'Muneer Villa 10', unit:'MNV2-102', name:'Sadeen Kitchen Room',     rentAmount:1500, rentSchedule:'5 To 10'  },
  { property:'Muneer Villa 10', unit:'MNV2-103', name:'Said Afghan',             rentAmount:1500, rentSchedule:'1 To 5'   },
  { property:'Muneer Villa 10', unit:'MNV2-104', name:'Imran Afghan',            rentAmount:1000, rentSchedule:'1 To 5'   },
  { property:'Muneer Villa 10', unit:'MNV2-105', name:'Imran Afghan (2)',        rentAmount:1000, rentSchedule:'1 To 10'  },
  { property:'Muneer Villa 10', unit:'MNV2-106', name:'Hamid Afghan',            rentAmount:1000, rentSchedule:'5 To 5'   },
  { property:'Muneer Villa 10', unit:'MNV2-107', name:'Hawaya Big Room',         rentAmount:1500, rentSchedule:'5 To 5'   },

  // ── ABU MARIAM VILLA 3 ────────────────────────────────────────────
  { property:'Abu Mariam Villa 3', unit:'AMV-111', name:'Taxi Terminal Clinic',  rentAmount:1100, rentSchedule:'1 To 10'  },
  { property:'Abu Mariam Villa 3', unit:'AMV-112', name:'Jabor Dewa',            rentAmount:1600, rentSchedule:'20 To 25' },
  { property:'Abu Mariam Villa 3', unit:'AMV-114', name:'Khalid Abdur Rahman',   rentAmount:1300, rentSchedule:'1 To 5'   },
  { property:'Abu Mariam Villa 3', unit:'AMV-115', name:'Afghan Fazal Link',     rentAmount:1400, rentSchedule:'20 To 25' },
  { property:'Abu Mariam Villa 3', unit:'AMV-116', name:'Imran Afghan 2',        rentAmount:1200, rentSchedule:'10 To 15' },
  { property:'Abu Mariam Villa 3', unit:'AMV-119', name:'Sajad Afghan',          rentAmount:1000, rentSchedule:'10 To 15' },

  // ── KHALID VILLA 4 ────────────────────────────────────────────────
  { property:'Khalid Villa 4',  unit:'KHV-121',  name:'Taxi Wala',               rentAmount:1800, rentSchedule:'1 To 5'   },
  { property:'Khalid Villa 4',  unit:'KHV-122',  name:'Noor Kallwal Taxi',       rentAmount:2300, rentSchedule:'1 To 5'   },

  // ── GARI LINK TALABAT ─────────────────────────────────────────────
  { property:'Gari Link Talabat', unit:'GLT-126', name:'Gari Link Talabat',      rentAmount:2100, rentSchedule:''         },
]

const TOTAL = TENANTS.length
const TOTAL_RENT = TENANTS.reduce((s, t) => s + t.rentAmount, 0)

export default function ImportData() {
  const [status, setStatus] = useState('idle') // idle | running | done | error
  const [done, setDone] = useState(0)
  const [errorMsg, setErrorMsg] = useState('')
  const navigate = useNavigate()

  async function runImport() {
    setStatus('running')
    setDone(0)
    setErrorMsg('')
    try {
      for (let i = 0; i < TENANTS.length; i++) {
        const t = TENANTS[i]
        await addItem('tenants', {
          name: t.name,
          unit: t.unit,
          rentAmount: t.rentAmount,
          phone: '',
          dueDate: '',
          paid: false,
          notes: `Property: ${t.property}${t.rentSchedule ? ' | Payment cycle: ' + t.rentSchedule : ''}`,
        })
        setDone(i + 1)
      }
      setStatus('done')
    } catch (err) {
      setErrorMsg(err.message || 'Import failed.')
      setStatus('error')
    }
  }

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto animate-fade-up">
      {/* Header */}
      <div className="mb-8">
        <h1 className="page-title">One-Time Data Import</h1>
        <span className="gold-rule" />
        <p className="text-gray-500 text-sm mt-3">
          Imports all <strong className="text-charcoal-900">{TOTAL} tenants</strong> from
          your spreadsheet directly into Firebase. Run this once — after that, manage
          everything through the Tenants page.
        </p>
      </div>

      {/* Summary card */}
      <div className="card p-6 mb-6 flex flex-col sm:flex-row gap-6">
        <div className="flex-1">
          <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Total Tenants</p>
          <p className="text-4xl font-bold text-charcoal-900 mt-1">{TOTAL}</p>
        </div>
        <div className="flex-1">
          <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Total Monthly Rent</p>
          <p className="text-4xl font-bold text-charcoal-900 mt-1">
            AED {TOTAL_RENT.toLocaleString()}
          </p>
        </div>
        <div className="flex-1">
          <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Properties</p>
          <p className="text-4xl font-bold text-charcoal-900 mt-1">14</p>
        </div>
      </div>

      {/* Progress / Action */}
      <div className="card p-6 mb-6">
        {status === 'idle' && (
          <div className="text-center py-4">
            <p className="text-gray-600 mb-6 text-sm">
              All tenants are shown in the table below. Click the button to upload them to Firebase.
              Each tenant will start as <strong>Unpaid</strong> — you can mark them paid in the Tenants page.
            </p>
            <button onClick={runImport} className="btn-primary px-10 py-4 text-base flex items-center gap-2 mx-auto">
              <Upload size={20} />
              Import All {TOTAL} Tenants to Firebase
            </button>
          </div>
        )}

        {status === 'running' && (
          <div className="text-center py-4">
            <Loader2 size={40} className="animate-spin text-primary-500 mx-auto mb-4" />
            <p className="text-charcoal-900 font-semibold text-lg">Importing…</p>
            <p className="text-gray-500 text-sm mt-1">{done} of {TOTAL} tenants uploaded</p>
            <div className="w-full bg-gray-100 rounded-full h-3 mt-4 overflow-hidden">
              <div
                className="h-3 bg-gradient-to-r from-primary-500 to-primary-400 rounded-full transition-all duration-300"
                style={{ width: `${(done / TOTAL) * 100}%` }}
              />
            </div>
          </div>
        )}

        {status === 'done' && (
          <div className="text-center py-4">
            <CheckCircle size={48} className="text-emerald2-600 mx-auto mb-4" />
            <p className="text-charcoal-900 font-bold text-xl">Import Complete!</p>
            <p className="text-gray-500 text-sm mt-2 mb-6">
              All {TOTAL} tenants are now in Firebase and syncing across every phone.
            </p>
            <button onClick={() => navigate('/tenants')} className="btn-primary px-8 py-3">
              Go to Tenants →
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center py-4">
            <AlertCircle size={40} className="text-rust-600 mx-auto mb-3" />
            <p className="text-charcoal-900 font-semibold">Import Failed</p>
            <p className="text-rust-600 text-sm mt-1 mb-4">{errorMsg}</p>
            <p className="text-gray-500 text-xs mb-4">
              Make sure you are signed in and Firebase is connected, then try again.
              Already-imported tenants won't be duplicated.
            </p>
            <button onClick={runImport} className="btn-primary px-8 py-3">
              Retry
            </button>
          </div>
        )}
      </div>

      {/* Preview table */}
      {status !== 'done' && (
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-display text-xl text-charcoal-900">Preview — All Tenants</h2>
            <span className="gold-rule" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Unit</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Property</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Rent (AED)</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Payment Cycle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {TENANTS.map((t, i) => (
                  <tr key={i} className={`hover:bg-gray-50 transition-colors ${i < done && status === 'running' ? 'opacity-40' : ''}`}>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{t.unit}</td>
                    <td className="px-4 py-3 font-medium text-charcoal-900">{t.name}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{t.property}</td>
                    <td className="px-4 py-3 font-semibold text-charcoal-900">
                      {t.rentAmount > 0 ? t.rentAmount.toLocaleString() : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{t.rentSchedule || '—'}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 border-t border-gray-200">
                  <td colSpan={3} className="px-4 py-3 text-sm font-semibold text-gray-700">
                    Total ({TOTAL} tenants)
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-charcoal-900">
                    {TOTAL_RENT.toLocaleString()}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
