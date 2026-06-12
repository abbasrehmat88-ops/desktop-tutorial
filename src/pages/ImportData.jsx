import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { addItem, removeItem, watchCollection } from '../data/db'
import { CheckCircle, Loader2, AlertCircle, Upload, Trash2 } from 'lucide-react'

// All tenants from the spreadsheet (verified against the clear photos).
// rentSchedule = the "Rent date" column in the sheet (e.g. "1 To 5").
// paid starts false — mark each tenant paid in the Tenants page after collecting.
const TENANTS = [
  // ── ADIL VILLA 8 / 1 ──────────────────────────────────────────────
  { property:'Adil Villa 8',      unit:'1',   name:'Amal Deen / Abid',      rentAmount:1700, rentSchedule:'1 To 5'   },
  { property:'Adil Villa 8',      unit:'2',   name:'Sajid Khan',            rentAmount:720,  rentSchedule:'1 To 5'   },
  { property:'Adil Villa 8',      unit:'3',   name:'Shafiullah',            rentAmount:1820, rentSchedule:'5 To 10'  },
  { property:'Adil Villa 8',      unit:'4',   name:'Usman Ghani',           rentAmount:1500, rentSchedule:'5 To 10'  },
  { property:'Adil Villa 8',      unit:'5',   name:'Shereen Boneer',        rentAmount:1100, rentSchedule:'20 To 25' },
  { property:'Adil Villa 8',      unit:'6',   name:'Talabat Punjabi',       rentAmount:1400, rentSchedule:'1 To 5'   },
  { property:'Adil Villa 8',      unit:'7',   name:'Shereen Roommate',      rentAmount:1000, rentSchedule:'1 To 5'   },
  { property:'Adil Villa 8',      unit:'8',   name:'Asif Rao',              rentAmount:1650, rentSchedule:'5 To 10'  },
  { property:'Adil Villa 8',      unit:'9',   name:'Abid Saloon',           rentAmount:1100, rentSchedule:'1 To 5'   },
  { property:'Adil Villa 8',      unit:'10',  name:'Baqala Bangali',        rentAmount:900,  rentSchedule:'15 To 20' },

  // ── DAWOOD VILLA 6 / 2 ────────────────────────────────────────────
  { property:'Dawood Villa 6',    unit:'11',  name:'Nizam Deen',            rentAmount:1500, rentSchedule:'1 To 5'   },
  { property:'Dawood Villa 6',    unit:'12',  name:'Shahid Ali',            rentAmount:1450, rentSchedule:'1 To 5'   },
  { property:'Dawood Villa 6',    unit:'13',  name:'Wazeer Zada',           rentAmount:1100, rentSchedule:'1 To 5'   },
  { property:'Dawood Villa 6',    unit:'14',  name:'Cha Cha Caftria',       rentAmount:1150, rentSchedule:'1 To 5'   },
  { property:'Dawood Villa 6',    unit:'15',  name:'Sohail',                rentAmount:1500, rentSchedule:'1 To 5'   },
  { property:'Dawood Villa 6',    unit:'16',  name:'Sadiq Afridi',          rentAmount:1600, rentSchedule:'1 To 5'   },
  { property:'Dawood Villa 6',    unit:'17',  name:'Shehzad / Rauf',        rentAmount:1000, rentSchedule:'5 To 10'  },
  { property:'Dawood Villa 6',    unit:'18',  name:'Farhan / Ibrahim',      rentAmount:1000, rentSchedule:'5 To 10'  },
  { property:'Dawood Villa 6',    unit:'19',  name:'Sajeel CCTV',           rentAmount:800,  rentSchedule:'1 To 10'  },
  { property:'Dawood Villa 6',    unit:'20',  name:'Hamza Afsar',           rentAmount:600,  rentSchedule:'5 To 10'  },
  { property:'Dawood Villa 6',    unit:'201', name:'Sharafat Taxi',         rentAmount:1000, rentSchedule:'5 To 10'  },

  // ── MUSTAFA VILLA 9 / 3 ───────────────────────────────────────────
  { property:'Mustafa Villa 9',   unit:'21',  name:'Karim / Noor Ghani',    rentAmount:1600, rentSchedule:'1 To 5'   },
  { property:'Mustafa Villa 9',   unit:'22',  name:'Noor Hasan',            rentAmount:1900, rentSchedule:'1 To 5'   },
  { property:'Mustafa Villa 9',   unit:'23',  name:'Noman Tankar Wala',     rentAmount:1100, rentSchedule:'1 To 7'   },
  { property:'Mustafa Villa 9',   unit:'24',  name:'Alam',                  rentAmount:770,  rentSchedule:'1 To 8'   },
  { property:'Mustafa Villa 9',   unit:'25',  name:'Store Room Alam Son',   rentAmount:900,  rentSchedule:'1 To 9'   },

  // ── ARIF VILLA 10 / 4 ─────────────────────────────────────────────
  { property:'Arif Villa 10',     unit:'31',  name:'Taj Haji',              rentAmount:1300, rentSchedule:'1 To 5'   },
  { property:'Arif Villa 10',     unit:'32',  name:'Hammad Saloon',         rentAmount:1400, rentSchedule:'5 To 10'  },
  { property:'Arif Villa 10',     unit:'33',  name:'Rahimullah / Masto',    rentAmount:1400, rentSchedule:'1 To 10'  },
  { property:'Arif Villa 10',     unit:'34',  name:'Bilal / Reshmin',       rentAmount:1600, rentSchedule:'1 To 5'   },
  { property:'Arif Villa 10',     unit:'35',  name:'Bilal Shah',            rentAmount:1000, rentSchedule:'1 To 5'   },
  { property:'Arif Villa 10',     unit:'36',  name:'Ali Khan Swaty',        rentAmount:800,  rentSchedule:'5 To 10'  },
  { property:'Arif Villa 10',     unit:'37',  name:'Shoaib Haji',           rentAmount:1020, rentSchedule:'1 To 10'  },
  { property:'Arif Villa 10',     unit:'38',  name:'Mangal Afghan',         rentAmount:1850, rentSchedule:'1 To 10'  },
  { property:'Arif Villa 10',     unit:'39',  name:'Arif Hawa Kash',        rentAmount:600,  rentSchedule:'1 To 5'   },
  { property:'Arif Villa 10',     unit:'40',  name:'Sheer Alam',            rentAmount:800,  rentSchedule:'1 To 5'   },

  // ── NO ENTRY VILLA 12 / 5 ─────────────────────────────────────────
  { property:'No Entry Villa 12', unit:'41',  name:'Du Wala Butti Room',    rentAmount:1300, rentSchedule:'10 To 15' },
  { property:'No Entry Villa 12', unit:'42',  name:'Umar / Saeed',          rentAmount:1400, rentSchedule:'1 To 5'   },
  { property:'No Entry Villa 12', unit:'43',  name:'Totano Bandwal',        rentAmount:800,  rentSchedule:'1 To 5'   },
  { property:'No Entry Villa 12', unit:'44',  name:'Nizar DTC',             rentAmount:800,  rentSchedule:'1 To 5'   },
  { property:'No Entry Villa 12', unit:'45',  name:'Salman Labor',          rentAmount:1500, rentSchedule:'1 To 5'   },
  { property:'No Entry Villa 12', unit:'46',  name:'Adnan Zulal',           rentAmount:1500, rentSchedule:'5 To 10'  },
  { property:'No Entry Villa 12', unit:'47',  name:'Hussain Bangali',       rentAmount:1700, rentSchedule:'5 To 10'  },
  { property:'No Entry Villa 12', unit:'48',  name:'Ajay Malwari',          rentAmount:800,  rentSchedule:'20 To 25' },
  { property:'No Entry Villa 12', unit:'49',  name:'M. Nawaz',              rentAmount:1000, rentSchedule:'1 To 5'   },
  { property:'No Entry Villa 12', unit:'50',  name:'Taxi Seeri Room',       rentAmount:1000, rentSchedule:'5 To 10'  },

  // ── ZAM ZAM VILLA 7 / 6 ───────────────────────────────────────────
  { property:'Zam Zam Villa 7',   unit:'51',  name:'Imran Typing Wala',     rentAmount:1200, rentSchedule:'1 To 10'  },
  { property:'Zam Zam Villa 7',   unit:'52',  name:'Said Ali',              rentAmount:1100, rentSchedule:'1 To 5'   },
  { property:'Zam Zam Villa 7',   unit:'53',  name:'Aleem Forman',          rentAmount:1000, rentSchedule:'1 To 5'   },
  { property:'Zam Zam Villa 7',   unit:'54',  name:'Punjabi Back Room',     rentAmount:800,  rentSchedule:'5 To 10'  },
  { property:'Zam Zam Villa 7',   unit:'55',  name:'Irfan Door Wala',       rentAmount:1600, rentSchedule:'10 To 15' },

  // ── PARK VILLA 34 / 7 ─────────────────────────────────────────────
  { property:'Park Villa 34',     unit:'61',  name:'Misbah / Ghufran',      rentAmount:1400, rentSchedule:'1 To 5'   },
  { property:'Park Villa 34',     unit:'62',  name:'Sajjad',                rentAmount:1300, rentSchedule:'1 To 5'   },
  { property:'Park Villa 34',     unit:'63',  name:'Imran Makhbaz',         rentAmount:1400, rentSchedule:'10 To 15' },
  { property:'Park Villa 34',     unit:'64',  name:'M Shah Nawaz',          rentAmount:1400, rentSchedule:'1 To 5'   },
  { property:'Park Villa 34',     unit:'65',  name:'Subhan Taxi',           rentAmount:1500, rentSchedule:'5 To 10'  },
  { property:'Park Villa 34',     unit:'66',  name:'Khuram Shehzad',        rentAmount:1000, rentSchedule:'1 To 5'   },
  { property:'Park Villa 34',     unit:'67',  name:'Aiman Sodani',          rentAmount:1000, rentSchedule:'1 To 5'   },
  { property:'Park Villa 34',     unit:'68',  name:'DTC Driver',            rentAmount:500,  rentSchedule:'20 To 25' },
  { property:'Park Villa 34',     unit:'69',  name:'DTC Driver',            rentAmount:2000, rentSchedule:'20 To 25' },

  // ── ABRAR VILLA 42 / 8 ────────────────────────────────────────────
  { property:'Abrar Villa 42',    unit:'71',  name:'Oli Haji',              rentAmount:1500, rentSchedule:'1 To 10'  },
  { property:'Abrar Villa 42',    unit:'72',  name:'Kamal Front Room',      rentAmount:1300, rentSchedule:'1 To 5'   },
  { property:'Abrar Villa 42',    unit:'73',  name:'Hikmat Labor 1',        rentAmount:1600, rentSchedule:'1 To 5'   },
  { property:'Abrar Villa 42',    unit:'74',  name:'Hikmat Labor 2',        rentAmount:1600, rentSchedule:'1 To 5'   },
  { property:'Abrar Villa 42',    unit:'75',  name:'Afghan Last Room',      rentAmount:1300, rentSchedule:'1 To 5'   },
  { property:'Abrar Villa 42',    unit:'76',  name:'Akhter Bonir',          rentAmount:700,  rentSchedule:'1 To 5'   },
  { property:'Abrar Villa 42',    unit:'77',  name:'Baitullah',             rentAmount:600,  rentSchedule:'1 To 5'   },
  { property:'Abrar Villa 42',    unit:'78',  name:'Hikmat Oil Wala',       rentAmount:4800, rentSchedule:'1 To 10'  },
  { property:'Abrar Villa 42',    unit:'79',  name:'Rehmat Cylinder',       rentAmount:800,  rentSchedule:'1 To 5'   },

  // ── FLAT BUILDING 24 / 9/1 ────────────────────────────────────────
  { property:'Flat Building 24 (9/1)', unit:'81', name:'Noman R1',          rentAmount:1500, rentSchedule:'15 To 20' },
  { property:'Flat Building 24 (9/1)', unit:'82', name:'Noman R2',          rentAmount:1500, rentSchedule:'15 To 20' },
  { property:'Flat Building 24 (9/1)', unit:'83', name:'Talabat Punjabi',   rentAmount:1650, rentSchedule:'15 To 20' },
  { property:'Flat Building 24 (9/1)', unit:'84', name:'Qair Link New',     rentAmount:1100, rentSchedule:'1 To 10'  },

  // ── FLAT BUILDING 24 / 9/6 ────────────────────────────────────────
  { property:'Flat Building 24 (9/6)', unit:'85', name:'Sajid - Nabil Advert', rentAmount:1800, rentSchedule:'1 To 5'   },
  { property:'Flat Building 24 (9/6)', unit:'86', name:'Safeer - Ibrahim',  rentAmount:1600, rentSchedule:'25 To 30' },
  { property:'Flat Building 24 (9/6)', unit:'87', name:'M. Akbar',          rentAmount:1500, rentSchedule:'1 To 10'  },
  { property:'Flat Building 24 (9/6)', unit:'88', name:'Wasi Eng',          rentAmount:900,  rentSchedule:'1 To 10'  },

  // ── MUNEER VILLA 13 / 10 ──────────────────────────────────────────
  { property:'Muneer Villa 13',   unit:'91',  name:'Ihsan / Zafar',         rentAmount:875,  rentSchedule:'15 onwards' },
  { property:'Muneer Villa 13',   unit:'92',  name:'Ihsan / Zafar',         rentAmount:875,  rentSchedule:'15 onwards' },
  { property:'Muneer Villa 13',   unit:'93',  name:'Ihsan / Zafar',         rentAmount:875,  rentSchedule:'15 onwards' },
  { property:'Muneer Villa 13',   unit:'94',  name:'Ihsan / Zafar',         rentAmount:875,  rentSchedule:'15 onwards' },
  { property:'Muneer Villa 13',   unit:'95',  name:'Ihsan / Zafar',         rentAmount:875,  rentSchedule:'15 onwards' },
  { property:'Muneer Villa 13',   unit:'96',  name:'Ihsan / Zafar',         rentAmount:875,  rentSchedule:'15 onwards' },
  { property:'Muneer Villa 13',   unit:'97',  name:'Rasool Jan',            rentAmount:1100, rentSchedule:'1 To 10'  },
  { property:'Muneer Villa 13',   unit:'98',  name:'Ihsan / Zafar',         rentAmount:2000, rentSchedule:'15 onwards' },
  { property:'Muneer Villa 13',   unit:'99',  name:'Sing Paji',             rentAmount:1000, rentSchedule:'20 To 25' },
  { property:'Muneer Villa 13',   unit:'100', name:'Shafiq Taxi',           rentAmount:1400, rentSchedule:'10 To 15' },

  // ── MUNEER VILLA 10 / 11 ──────────────────────────────────────────
  { property:'Muneer Villa 10',   unit:'101', name:'Hamid Recovery',        rentAmount:1200, rentSchedule:'1 To 5'   },
  { property:'Muneer Villa 10',   unit:'102', name:'Sodani Kitchen Room',   rentAmount:600,  rentSchedule:'1 To 5'   },
  { property:'Muneer Villa 10',   unit:'103', name:'Sajid Pathan',          rentAmount:1650, rentSchedule:'5 To 10'  },
  { property:'Muneer Villa 10',   unit:'104', name:'Rafi Afghan',           rentAmount:1000, rentSchedule:'1 To 5'   },
  { property:'Muneer Villa 10',   unit:'105', name:'Imran Afghan',          rentAmount:1000, rentSchedule:'1 To 5'   },
  { property:'Muneer Villa 10',   unit:'106', name:'Inayat Afghan',         rentAmount:1000, rentSchedule:'1 To 5'   },
  { property:'Muneer Villa 10',   unit:'107', name:'Rawza Big Room',        rentAmount:1000, rentSchedule:'1 To 5'   },
  { property:'Muneer Villa 10',   unit:'108', name:'M Zaman Back Room',     rentAmount:1600, rentSchedule:'5 To 10'  },

  // ── ABU MARYAM VILLA 3 / 12 ───────────────────────────────────────
  { property:'Abu Maryam Villa 3', unit:'111', name:'Taxi Palawan Link',    rentAmount:1500, rentSchedule:'1 To 10'  },
  { property:'Abu Maryam Villa 3', unit:'112', name:'Jabar Dewa',           rentAmount:1500, rentSchedule:'1 To 5'   },
  { property:'Abu Maryam Villa 3', unit:'113', name:'Jabar Dewa',           rentAmount:1300, rentSchedule:'20 To 25' },
  { property:'Abu Maryam Villa 3', unit:'114', name:'Jabar Dewa',           rentAmount:1300, rentSchedule:'20 To 25' },
  { property:'Abu Maryam Villa 3', unit:'115', name:'Khalid Pathan - Ihsan', rentAmount:2000, rentSchedule:'1 To 5'  },
  { property:'Abu Maryam Villa 3', unit:'116', name:'Afghan Fazal Link',    rentAmount:1400, rentSchedule:'20 To 25' },
  { property:'Abu Maryam Villa 3', unit:'117', name:'Qari Waliullah',       rentAmount:2000, rentSchedule:'1 To 5'   },
  { property:'Abu Maryam Villa 3', unit:'118', name:'UnHappy Chacha',       rentAmount:900,  rentSchedule:'1 To 10'  },
  { property:'Abu Maryam Villa 3', unit:'119', name:'Jabar Dewa',           rentAmount:2000, rentSchedule:'1 To 10'  },
  { property:'Abu Maryam Villa 3', unit:'120', name:'Bangali 4 Man',        rentAmount:1200, rentSchedule:'10 To 15' },

  // ── KHALID VILLA 4 / 13 ───────────────────────────────────────────
  { property:'Khalid Villa 4',    unit:'121', name:'Lal Bacha',             rentAmount:2500, rentSchedule:'1 To 5'   },
  { property:'Khalid Villa 4',    unit:'122', name:'Noor Kaliwal Taxi',     rentAmount:2300, rentSchedule:'1 To 5'   },
  { property:'Khalid Villa 4',    unit:'125', name:'Qari Link Talabat',     rentAmount:2100, rentSchedule:''         },
]

const TOTAL = TENANTS.length
const TOTAL_RENT = TENANTS.reduce((s, t) => s + t.rentAmount, 0)
const PROPERTY_COUNT = new Set(TENANTS.map((t) => t.property)).size

export default function ImportData() {
  const [status, setStatus] = useState('idle') // idle | clearing | running | done | error
  const [done, setDone] = useState(0)
  const [cleared, setCleared] = useState(0)
  const [errorMsg, setErrorMsg] = useState('')
  const [existing, setExisting] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    return watchCollection('tenants', 'createdAt', 'desc', setExisting, () => {})
  }, [])

  async function importAll() {
    for (let i = 0; i < TENANTS.length; i++) {
      const t = TENANTS[i]
      await addItem('tenants', {
        name: t.name,
        unit: t.unit,
        property: t.property,
        rentAmount: t.rentAmount,
        rentSchedule: t.rentSchedule,
        deposit: 0,
        startDate: '',
        phone: '',
        dueDate: '',
        paid: false,
      })
      setDone(i + 1)
    }
  }

  async function runImport() {
    setStatus('running')
    setDone(0)
    setErrorMsg('')
    try {
      await importAll()
      setStatus('done')
    } catch (err) {
      setErrorMsg(err.message || 'Import failed.')
      setStatus('error')
    }
  }

  async function runClearAndImport() {
    const count = existing.length
    if (
      !window.confirm(
        `This will DELETE all ${count} tenants currently in the app and replace them with the ${TOTAL} corrected tenants. Continue?`
      )
    )
      return
    setStatus('clearing')
    setCleared(0)
    setDone(0)
    setErrorMsg('')
    try {
      const toDelete = [...existing]
      for (let i = 0; i < toDelete.length; i++) {
        await removeItem('tenants', toDelete[i].id)
        setCleared(i + 1)
      }
      setStatus('running')
      await importAll()
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
          your spreadsheet — with the corrected rents, names, and the Rent Date column —
          directly into Firebase.
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
          <p className="text-4xl font-bold text-charcoal-900 mt-1">{PROPERTY_COUNT}</p>
        </div>
      </div>

      {/* Progress / Action */}
      <div className="card p-6 mb-6">
        {status === 'idle' && (
          <div className="text-center py-4">
            {existing.length > 0 ? (
              <>
                <p className="text-gray-600 mb-2 text-sm">
                  You already have <strong className="text-charcoal-900">{existing.length} tenants</strong> in
                  the app (the old import with wrong amounts).
                </p>
                <p className="text-gray-600 mb-6 text-sm">
                  Use the red button to <strong>delete the old data and import the corrected list</strong> in one step.
                </p>
                <button
                  onClick={runClearAndImport}
                  className="btn-danger px-10 py-4 text-base flex items-center gap-2 mx-auto"
                >
                  <Trash2 size={20} />
                  Delete Old Data & Import {TOTAL} Corrected Tenants
                </button>
                <button
                  onClick={runImport}
                  className="text-gray-400 text-xs underline mt-4 hover:text-gray-600"
                >
                  or import without deleting (will create duplicates)
                </button>
              </>
            ) : (
              <>
                <p className="text-gray-600 mb-6 text-sm">
                  All tenants are shown in the table below. Click the button to upload them to Firebase.
                  Each tenant starts as <strong>Unpaid</strong> — mark them paid in the Tenants page as you collect.
                </p>
                <button onClick={runImport} className="btn-primary px-10 py-4 text-base flex items-center gap-2 mx-auto">
                  <Upload size={20} />
                  Import All {TOTAL} Tenants to Firebase
                </button>
              </>
            )}
          </div>
        )}

        {status === 'clearing' && (
          <div className="text-center py-4">
            <Loader2 size={40} className="animate-spin text-rust-600 mx-auto mb-4" />
            <p className="text-charcoal-900 font-semibold text-lg">Deleting old data…</p>
            <p className="text-gray-500 text-sm mt-1">{cleared} removed</p>
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
              All {TOTAL} tenants are now in Firebase with the corrected rents and rent dates,
              syncing across every phone.
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
              Make sure you are signed in and connected to the internet, then try again.
            </p>
            <button onClick={runClearAndImport} className="btn-primary px-8 py-3">
              Retry (Delete All & Reimport)
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
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Room</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Property</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Rent (AED)</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Rent Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {TENANTS.map((t, i) => (
                  <tr key={i} className={`hover:bg-gray-50 transition-colors ${i < done && status === 'running' ? 'opacity-40' : ''}`}>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{t.unit}</td>
                    <td className="px-4 py-3 font-medium text-charcoal-900">{t.name}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{t.property}</td>
                    <td className="px-4 py-3 font-semibold text-charcoal-900">{t.rentAmount.toLocaleString()}</td>
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
