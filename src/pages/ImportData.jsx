import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { addItem, removeItem, watchCollection } from '../data/db'
import {
  CheckCircle,
  Loader2,
  AlertCircle,
  Upload,
  Trash2,
  FileUp,
  Database,
  Building2,
  Wallet,
  Users,
  ArrowRight,
  KeyRound,
} from 'lucide-react'

// ── Villa owners — ejaar (monthly rent paid to villa owners). ─────────────────
// Amounts are the current monthly rates from Villa_rent_1.xlsx (2026 data).
const OWNERS = [
  { name: 'Adil',         property: 'v1 Adil',       rentAmount: 8333, dueDay: '1',  paymentMethod: 'cash', notes: 'Ejaar — monthly' },
  { name: 'Mustafa Arbab',property: 'v2 Rauf',       rentAmount: 2333, dueDay: '10', paymentMethod: 'cash', notes: 'Ejaar — monthly equiv (28000/yr)' },
  { name: 'Dawood',       property: 'v3 Dawood',     rentAmount: 4750, dueDay: '17', paymentMethod: 'cash', notes: 'Ejaar — monthly equiv (57000/yr)' },
  { name: 'Zam Zam',      property: 'v4 Zam Zam',   rentAmount: 2700, dueDay: '1',  paymentMethod: 'cash', notes: 'Ejaar — monthly' },
  { name: 'Arif Masool',  property: 'v5 Arif',       rentAmount: 4583, dueDay: '15', paymentMethod: 'cash', notes: 'Ejaar — monthly equiv' },
  { name: 'Al Sarooj',    property: 'v6 Al_sarooj',  rentAmount: 3750, dueDay: '10', paymentMethod: 'cash', notes: 'Ejaar — monthly equiv (45000/yr)' },
  { name: 'Hassan Saeed', property: 'v7 Park',       rentAmount: 4166, dueDay: '10', paymentMethod: 'cash', notes: 'Ejaar — monthly' },
  { name: 'Abrar',        property: 'v8 AbraR',      rentAmount: 5000, dueDay: '20', paymentMethod: 'cash', notes: 'Ejaar — monthly' },
  { name: 'Flat 01 Owner',property: 'v9 Flat',       rentAmount: 2166, dueDay: '10', paymentMethod: 'cash', notes: 'Ejaar — monthly equiv' },
  { name: 'Muneer',       property: 'v10 munir',     rentAmount: 3750, dueDay: '15', paymentMethod: 'cash', notes: 'Ejaar — monthly' },
  { name: 'Muneer 2',     property: 'v11 munir 2',   rentAmount: 6250, dueDay: '25', paymentMethod: 'cash', notes: 'Ejaar — monthly' },
  { name: 'Flat 06 Owner',property: 'v12 flat 06',   rentAmount: 2500, dueDay: '10', paymentMethod: 'cash', notes: 'Ejaar — monthly' },
  { name: 'Abu Maryam',   property: 'v13 abumaryam', rentAmount: 9167, dueDay: '15', paymentMethod: 'cash', notes: 'Ejaar — monthly equiv' },
  { name: 'Khalid',       property: 'v14 khlid mus', rentAmount: 5420, dueDay: '10', paymentMethod: 'cash', notes: 'Ejaar — monthly equiv' },
]

const OWNERS_TOTAL = OWNERS.length
const OWNERS_TOTAL_RENT = OWNERS.reduce((s, o) => s + o.rentAmount, 0)

// ── Tenant list from Villa_rent_1.xlsx (June 2026). ──────────────────────────
// property = canonical villa name so grouping works without alias lookup.
// rentSchedule = day range when rent is collected each month.
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
  // Tenant import state
  const [status, setStatus] = useState('idle')
  const [done, setDone] = useState(0)
  const [cleared, setCleared] = useState(0)
  const [errorMsg, setErrorMsg] = useState('')
  const [existing, setExisting] = useState([])

  // Owner import state
  const [ownerStatus, setOwnerStatus] = useState('idle')
  const [ownerDone, setOwnerDone] = useState(0)
  const [ownerCleared, setOwnerCleared] = useState(0)
  const [ownerErrorMsg, setOwnerErrorMsg] = useState('')
  const [existingOwners, setExistingOwners] = useState([])

  const navigate = useNavigate()

  useEffect(() => {
    const unsubTenants = watchCollection('tenants', 'createdAt', 'desc', setExisting, () => {})
    const unsubOwners = watchCollection('owners', 'createdAt', 'desc', setExistingOwners, () => {})
    return () => {
      unsubTenants()
      unsubOwners()
    }
  }, [])

  // ── Tenant import helpers ──────────────────────────────────────────────────
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

  // ── Owner import helpers ───────────────────────────────────────────────────
  async function importAllOwners() {
    for (let i = 0; i < OWNERS.length; i++) {
      const o = OWNERS[i]
      await addItem('owners', {
        name: o.name,
        property: o.property,
        rentAmount: o.rentAmount,
        dueDay: o.dueDay,
        paymentMethod: o.paymentMethod,
        notes: o.notes,
        bankName: '',
        checkDetails: '',
        phone: '',
        email: '',
        payments: {},
      })
      setOwnerDone(i + 1)
    }
  }

  async function runOwnerImport() {
    setOwnerStatus('running')
    setOwnerDone(0)
    setOwnerErrorMsg('')
    try {
      await importAllOwners()
      setOwnerStatus('done')
    } catch (err) {
      setOwnerErrorMsg(err.message || 'Owner import failed.')
      setOwnerStatus('error')
    }
  }

  async function runClearAndImportOwners() {
    const count = existingOwners.length
    if (
      !window.confirm(
        `This will DELETE all ${count} owners currently in the app and replace them with the ${OWNERS_TOTAL} owners from the spreadsheet. Continue?`
      )
    )
      return
    setOwnerStatus('clearing')
    setOwnerCleared(0)
    setOwnerDone(0)
    setOwnerErrorMsg('')
    try {
      const toDelete = [...existingOwners]
      for (let i = 0; i < toDelete.length; i++) {
        await removeItem('owners', toDelete[i].id)
        setOwnerCleared(i + 1)
      }
      setOwnerStatus('running')
      await importAllOwners()
      setOwnerStatus('done')
    } catch (err) {
      setOwnerErrorMsg(err.message || 'Owner import failed.')
      setOwnerStatus('error')
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto animate-fade-up">
      {/* Header */}
      <div className="mb-6">
        <h1 className="page-title">One-Time Data Import</h1>
        <span className="gold-rule" />
        <p className="text-gray-500 text-sm mt-2">
          Import tenants and villa owners from your spreadsheet straight into Firebase —
          corrected rents, ejaar amounts, and payment due dates.
        </p>
      </div>

      {/* ── OWNERS SECTION ──────────────────────────────────────────────────── */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-primary-100 text-primary-700">
            <KeyRound size={18} />
          </div>
          <div>
            <h2 className="font-display text-lg text-charcoal-900 leading-tight">Villa Owners — Ejaar Payments</h2>
            <p className="text-xs text-gray-500 mt-0.5">14 owners · monthly ejaar amounts &amp; due dates from Villa_rent_1.xlsx</p>
          </div>
        </div>

        {/* Owner summary stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4 stagger">
          <div className="stat-card">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 bg-charcoal-900 text-primary-400">
                <KeyRound size={22} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Total Owners</p>
                <p className="text-2xl font-bold text-charcoal-900 mt-1 tabular">{OWNERS_TOTAL}</p>
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 bg-primary-100 text-primary-700">
                <Wallet size={22} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Monthly Ejaar</p>
                <p className="text-2xl font-bold text-charcoal-900 mt-1 tabular">AED {OWNERS_TOTAL_RENT.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 bg-emerald2-50 text-emerald2-600">
                <Building2 size={22} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Villas</p>
                <p className="text-2xl font-bold text-charcoal-900 mt-1 tabular">14</p>
              </div>
            </div>
          </div>
        </div>

        {/* Owner import action card */}
        <div className="card p-6 sm:p-8 mb-4">
          {ownerStatus === 'idle' && (
            <>
              {existingOwners.length > 0 ? (
                <div className="text-center max-w-xl mx-auto">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 bg-rust-50 text-rust-600 ring-1 ring-rust-100">
                    <AlertCircle size={30} />
                  </div>
                  <p className="text-gray-600 mb-2 text-sm">
                    You already have <strong className="text-charcoal-900 tabular">{existingOwners.length}</strong> owners in the app.
                  </p>
                  <p className="text-gray-600 mb-6 text-sm">
                    Use the button below to <strong>delete the old data and import the corrected owner list</strong> with updated ejaar amounts and due dates.
                  </p>
                  <button
                    onClick={runClearAndImportOwners}
                    className="btn-danger px-8 py-3.5 text-base min-h-[44px] mx-auto"
                  >
                    <Trash2 size={20} />
                    Delete Old Data &amp; Import {OWNERS_TOTAL} Owners
                  </button>
                  <div>
                    <button
                      onClick={runOwnerImport}
                      className="text-gray-400 text-xs underline mt-4 hover:text-gray-600 min-h-[44px] px-2"
                    >
                      or import without deleting (will create duplicates)
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rounded-card border-2 border-dashed border-primary-200 bg-primary-50/30 px-6 py-10 text-center">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 bg-charcoal-900 text-primary-400 shadow-glow-sm">
                    <KeyRound size={30} />
                  </div>
                  <h2 className="font-display text-xl text-charcoal-900">Ready to import owners</h2>
                  <p className="text-gray-600 mt-2 mb-6 text-sm max-w-md mx-auto">
                    All 14 villa owners with ejaar amounts and payment due dates are previewed below.
                    Payment history starts empty — mark months paid in the Owners page.
                  </p>
                  <button
                    onClick={runOwnerImport}
                    className="btn-primary px-8 py-3.5 text-base min-h-[44px] mx-auto"
                  >
                    <Upload size={20} />
                    Import {OWNERS_TOTAL} Owners to Firebase
                  </button>
                </div>
              )}
            </>
          )}

          {ownerStatus === 'clearing' && (
            <div className="text-center py-4">
              <Loader2 size={40} className="animate-spin text-rust-600 mx-auto mb-4" />
              <p className="text-charcoal-900 font-semibold text-lg">Deleting old owners…</p>
              <p className="text-gray-500 text-sm mt-1"><span className="tabular">{ownerCleared}</span> removed</p>
            </div>
          )}

          {ownerStatus === 'running' && (
            <div className="text-center py-4">
              <Loader2 size={40} className="animate-spin text-primary-500 mx-auto mb-4" />
              <p className="text-charcoal-900 font-semibold text-lg">Importing owners…</p>
              <p className="text-gray-500 text-sm mt-1">
                <span className="tabular">{ownerDone}</span> of <span className="tabular">{OWNERS_TOTAL}</span> owners uploaded
              </p>
              <div className="w-full bg-gray-100 rounded-full h-3 mt-4 overflow-hidden">
                <div
                  className="h-3 bg-gradient-to-r from-primary-500 to-primary-400 rounded-full transition-all duration-300"
                  style={{ width: `${(ownerDone / OWNERS_TOTAL) * 100}%` }}
                />
              </div>
            </div>
          )}

          {ownerStatus === 'done' && (
            <div className="rounded-card border border-emerald2-100 bg-emerald2-50 px-6 py-10 text-center animate-scale-in">
              <CheckCircle size={48} className="text-emerald2-600 mx-auto mb-4" />
              <p className="text-charcoal-900 font-bold text-xl font-display">Owners Imported</p>
              <p className="text-gray-600 text-sm mt-2 mb-6 max-w-md mx-auto">
                All <span className="tabular">{OWNERS_TOTAL}</span> villa owners are now in Firebase with ejaar amounts and
                payment due dates, syncing across every device.
              </p>
              <button onClick={() => navigate('/owners')} className="btn-primary px-8 py-3 min-h-[44px] mx-auto">
                Go to Owners
                <ArrowRight size={18} />
              </button>
            </div>
          )}

          {ownerStatus === 'error' && (
            <div className="rounded-card border border-rust-100 bg-rust-50 px-6 py-8 text-center animate-pop">
              <AlertCircle size={40} className="text-rust-600 mx-auto mb-3" />
              <p className="text-charcoal-900 font-semibold">Owner Import Failed</p>
              <p className="text-rust-600 text-sm mt-1 mb-4">{ownerErrorMsg}</p>
              <p className="text-gray-500 text-xs mb-4 max-w-md mx-auto">
                Make sure you are signed in and connected to the internet, then try again.
              </p>
              <button onClick={runClearAndImportOwners} className="btn-primary px-8 py-3 min-h-[44px] mx-auto">
                Retry (Delete All &amp; Reimport)
              </button>
            </div>
          )}
        </div>

        {/* Owner preview table */}
        {ownerStatus !== 'done' && (
          <div className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-primary-50 text-primary-700">
                <Database size={18} />
              </div>
              <div>
                <h2 className="font-display text-xl text-charcoal-900">Preview — All Owners</h2>
                <span className="gold-rule" />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-left">
                    <th className="px-4 py-3 text-2xs font-bold text-gray-500 uppercase tracking-[0.14em]">Owner</th>
                    <th className="px-4 py-3 text-2xs font-bold text-gray-500 uppercase tracking-[0.14em]">Property</th>
                    <th className="px-4 py-3 text-2xs font-bold text-gray-500 uppercase tracking-[0.14em]">Monthly Ejaar (AED)</th>
                    <th className="px-4 py-3 text-2xs font-bold text-gray-500 uppercase tracking-[0.14em]">Due Day</th>
                    <th className="px-4 py-3 text-2xs font-bold text-gray-500 uppercase tracking-[0.14em]">Method</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {OWNERS.map((o, i) => (
                    <tr
                      key={i}
                      className={`transition-colors odd:bg-white even:bg-gray-50/40 hover:bg-primary-50/40 ${i < ownerDone && ownerStatus === 'running' ? 'opacity-40' : ''}`}
                    >
                      <td className="px-4 py-3 font-medium text-charcoal-900">{o.name}</td>
                      <td className="px-4 py-3 text-gray-600 text-xs">
                        <span className="chip">{o.property}</span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-charcoal-900 tabular">{o.rentAmount.toLocaleString()}</td>
                      <td className="px-4 py-3 text-gray-500 tabular">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary-50 text-primary-700 text-xs font-bold">
                          {o.dueDay}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs capitalize">{o.paymentMethod}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-charcoal-900 text-white">
                    <td colSpan={2} className="px-4 py-3 text-sm font-semibold">
                      Total (<span className="tabular">{OWNERS_TOTAL}</span> owners)
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-primary-400 tabular">
                      {OWNERS_TOTAL_RENT.toLocaleString()}
                    </td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-gray-100 mb-8" />

      {/* ── TENANTS SECTION ─────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-emerald2-50 text-emerald2-600">
            <Users size={18} />
          </div>
          <div>
            <h2 className="font-display text-lg text-charcoal-900 leading-tight">Tenants</h2>
            <p className="text-xs text-gray-500 mt-0.5">{TOTAL} tenants · corrected rents and rent schedules from Villa_rent_1.xlsx</p>
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4 stagger">
          <div className="stat-card">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 bg-charcoal-900 text-primary-400">
                <Users size={22} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Total Tenants</p>
                <p className="text-2xl font-bold text-charcoal-900 mt-1 tabular">{TOTAL}</p>
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 bg-emerald2-50 text-emerald2-600">
                <Wallet size={22} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Total Monthly Rent</p>
                <p className="text-2xl font-bold text-charcoal-900 mt-1 tabular">AED {TOTAL_RENT.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 bg-primary-100 text-primary-700">
                <Building2 size={22} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Properties</p>
                <p className="text-2xl font-bold text-charcoal-900 mt-1 tabular">{PROPERTY_COUNT}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Progress / Action */}
        <div className="card p-6 sm:p-8 mb-4">
          {status === 'idle' && (
            <>
              {existing.length > 0 ? (
                <div className="text-center max-w-xl mx-auto">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 bg-rust-50 text-rust-600 ring-1 ring-rust-100">
                    <AlertCircle size={30} />
                  </div>
                  <p className="text-gray-600 mb-2 text-sm">
                    You already have <strong className="text-charcoal-900 tabular">{existing.length}</strong> tenants in
                    the app (the old import with wrong amounts).
                  </p>
                  <p className="text-gray-600 mb-6 text-sm">
                    Use the button below to <strong>delete the old data and import the corrected list</strong> in one step.
                  </p>
                  <button
                    onClick={runClearAndImport}
                    className="btn-danger px-8 py-3.5 text-base min-h-[44px] mx-auto"
                  >
                    <Trash2 size={20} />
                    Delete Old Data &amp; Import {TOTAL} Corrected Tenants
                  </button>
                  <div>
                    <button
                      onClick={runImport}
                      className="text-gray-400 text-xs underline mt-4 hover:text-gray-600 min-h-[44px] px-2"
                    >
                      or import without deleting (will create duplicates)
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rounded-card border-2 border-dashed border-primary-200 bg-primary-50/30 px-6 py-10 text-center">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 bg-charcoal-900 text-primary-400 shadow-glow-sm">
                    <FileUp size={30} />
                  </div>
                  <h2 className="font-display text-xl text-charcoal-900">Ready to import</h2>
                  <p className="text-gray-600 mt-2 mb-6 text-sm max-w-md mx-auto">
                    All tenants are previewed in the table below. Each starts as <strong>Unpaid</strong> —
                    mark them paid in the Tenants page as you collect.
                  </p>
                  <button
                    onClick={runImport}
                    className="btn-primary px-8 py-3.5 text-base min-h-[44px] mx-auto"
                  >
                    <Upload size={20} />
                    Import All {TOTAL} Tenants to Firebase
                  </button>
                </div>
              )}
            </>
          )}

          {status === 'clearing' && (
            <div className="text-center py-4">
              <Loader2 size={40} className="animate-spin text-rust-600 mx-auto mb-4" />
              <p className="text-charcoal-900 font-semibold text-lg">Deleting old data…</p>
              <p className="text-gray-500 text-sm mt-1"><span className="tabular">{cleared}</span> removed</p>
            </div>
          )}

          {status === 'running' && (
            <div className="text-center py-4">
              <Loader2 size={40} className="animate-spin text-primary-500 mx-auto mb-4" />
              <p className="text-charcoal-900 font-semibold text-lg">Importing…</p>
              <p className="text-gray-500 text-sm mt-1">
                <span className="tabular">{done}</span> of <span className="tabular">{TOTAL}</span> tenants uploaded
              </p>
              <div className="w-full bg-gray-100 rounded-full h-3 mt-4 overflow-hidden">
                <div
                  className="h-3 bg-gradient-to-r from-primary-500 to-primary-400 rounded-full transition-all duration-300"
                  style={{ width: `${(done / TOTAL) * 100}%` }}
                />
              </div>
            </div>
          )}

          {status === 'done' && (
            <div className="rounded-card border border-emerald2-100 bg-emerald2-50 px-6 py-10 text-center animate-scale-in">
              <CheckCircle size={48} className="text-emerald2-600 mx-auto mb-4" />
              <p className="text-charcoal-900 font-bold text-xl font-display">Import Complete</p>
              <p className="text-gray-600 text-sm mt-2 mb-6 max-w-md mx-auto">
                All <span className="tabular">{TOTAL}</span> tenants are now in Firebase with the corrected rents
                and rent dates, syncing across every phone.
              </p>
              <button onClick={() => navigate('/tenants')} className="btn-primary px-8 py-3 min-h-[44px] mx-auto">
                Go to Tenants
                <ArrowRight size={18} />
              </button>
            </div>
          )}

          {status === 'error' && (
            <div className="rounded-card border border-rust-100 bg-rust-50 px-6 py-8 text-center animate-pop">
              <AlertCircle size={40} className="text-rust-600 mx-auto mb-3" />
              <p className="text-charcoal-900 font-semibold">Import Failed</p>
              <p className="text-rust-600 text-sm mt-1 mb-4">{errorMsg}</p>
              <p className="text-gray-500 text-xs mb-4 max-w-md mx-auto">
                Make sure you are signed in and connected to the internet, then try again.
              </p>
              <button onClick={runClearAndImport} className="btn-primary px-8 py-3 min-h-[44px] mx-auto">
                Retry (Delete All &amp; Reimport)
              </button>
            </div>
          )}
        </div>

        {/* Preview table */}
        {status !== 'done' && (
          <div className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-primary-50 text-primary-700">
                <Database size={18} />
              </div>
              <div>
                <h2 className="font-display text-xl text-charcoal-900">Preview — All Tenants</h2>
                <span className="gold-rule" />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-left">
                    <th className="px-4 py-3 text-2xs font-bold text-gray-500 uppercase tracking-[0.14em]">Room</th>
                    <th className="px-4 py-3 text-2xs font-bold text-gray-500 uppercase tracking-[0.14em]">Name</th>
                    <th className="px-4 py-3 text-2xs font-bold text-gray-500 uppercase tracking-[0.14em]">Property</th>
                    <th className="px-4 py-3 text-2xs font-bold text-gray-500 uppercase tracking-[0.14em]">Rent (AED)</th>
                    <th className="px-4 py-3 text-2xs font-bold text-gray-500 uppercase tracking-[0.14em]">Rent Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {TENANTS.map((t, i) => (
                    <tr key={i} className={`transition-colors odd:bg-white even:bg-gray-50/40 hover:bg-primary-50/40 ${i < done && status === 'running' ? 'opacity-40' : ''}`}>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500 tabular">{t.unit}</td>
                      <td className="px-4 py-3 font-medium text-charcoal-900">{t.name}</td>
                      <td className="px-4 py-3 text-gray-600 text-xs">
                        <span className="chip">{t.property}</span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-charcoal-900 tabular">{t.rentAmount.toLocaleString()}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs tabular">{t.rentSchedule || '—'}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-charcoal-900 text-white">
                    <td colSpan={3} className="px-4 py-3 text-sm font-semibold">
                      Total (<span className="tabular">{TOTAL}</span> tenants)
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-primary-400 tabular">
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
    </div>
  )
}
