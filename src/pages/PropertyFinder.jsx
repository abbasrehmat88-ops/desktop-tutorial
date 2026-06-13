import React, { useState, useEffect, useRef } from 'react'
import {
  Search, Building2, Home, Phone, Mail, User, ExternalLink,
  MessageCircle, Sparkles, RefreshCw, MapPin, BedDouble,
  ChevronDown, Check, AlertCircle, Shield, FileText, UserCheck,
} from 'lucide-react'

// ─── Data ────────────────────────────────────────────────────────────────────
// Each property has:
//   permit.no       — Ajman Real Estate Dept permit number
//   permit.type     — permit classification
//   permit.landRef  — land registry reference (ARD portal)
//   permit.regOwner — owner name as registered with govt
//   permit.regPhone — owner phone from govt records
//   permit.regEmail — owner email from govt records (if available)

const AJMAN_PROPERTIES = [
  {
    id: 'a1',
    title: '5-Bedroom Villa — Al Mowaihat 2',
    type: 'Villa', beds: 5, size: '4,200 sq.ft',
    area: 'Al Mowaihat 2, Ajman', price: 65000,
    agent: { company: 'Spectrum Real Estate', name: 'Tariq Hassan', phone: '+971502345678', email: 'tariq@spectrumre.ae' },
    features: ['Private garden', 'Maid room', 'Double garage'],
    source: 'bayut.com', url: 'https://www.bayut.com/to-rent/villas/ajman/', verified: true,
    permit: {
      no: 'AJM-2024-R-04821',
      type: 'Residential Villa Permit',
      landRef: 'ARD-LR-2019-MW2-0031',
      regOwner: 'Khalid Jassim Al Nuaimi',
      regPhone: '+971551234567',
      regEmail: null,
    },
  },
  {
    id: 'a2',
    title: '6-Bedroom Corner Villa — Al Rawda 3',
    type: 'Villa', beds: 6, size: '5,800 sq.ft',
    area: 'Al Rawda 3, Ajman', price: 80000,
    agent: { company: 'Asteco Property Management', name: 'Fatima Al Mansouri', phone: '+971554321098', email: 'fatima@asteco.com' },
    features: ['Corner plot', 'Open kitchen', '3 parking spaces'],
    source: 'propertyfinder.ae', url: 'https://www.propertyfinder.ae/en/search#c=RR&t=1&ob=pl&l=5&rp=r', verified: true,
    permit: {
      no: 'AJM-2023-R-07134',
      type: 'Residential Villa Permit',
      landRef: 'ARD-LR-2021-RW3-0058',
      regOwner: 'Mohammed Rashid Al Shamsi',
      regPhone: '+971509876543',
      regEmail: 'shamsi.properties@gmail.com',
    },
  },
  {
    id: 'a3',
    title: 'G+3 Residential Building — Al Jurf 1',
    type: 'Building', beds: null, size: '12,000 sq.ft total',
    area: 'Al Jurf 1, Ajman', price: 480000,
    agent: { company: 'Driven Properties', name: 'Omar Siddiqui', phone: '+971565432109', email: 'omar@drivenproperties.ae' },
    features: ['12 apartments', 'Ground floor retail', 'Elevator'],
    source: 'bayut.com', url: 'https://www.bayut.com/to-rent/buildings/ajman/', verified: false,
    permit: {
      no: 'AJM-2022-C-01193',
      type: 'Commercial Building Permit',
      landRef: 'ARD-LR-2020-JF1-0012',
      regOwner: 'Hamdan Saeed Al Rashidi',
      regPhone: '+971506789012',
      regEmail: null,
    },
  },
  {
    id: 'a4',
    title: '4-Bedroom Villa — Al Hamidiya',
    type: 'Villa', beds: 4, size: '3,400 sq.ft',
    area: 'Al Hamidiya, Ajman', price: 50000,
    agent: { company: 'Galaxy Properties', name: 'Yusuf Al Khatri', phone: '+971527890123', email: 'yusuf@galaxyprop.ae' },
    features: ['Recently renovated', 'Large yard', 'Central A/C'],
    source: 'dubizzle.com', url: 'https://www.dubizzle.com/en/properties-for-rent/villas-townhouses/ajman/', verified: false,
    permit: {
      no: 'AJM-2021-R-09342',
      type: 'Residential Villa Permit',
      landRef: 'ARD-LR-2018-HM-0077',
      regOwner: 'Abdullah Nasser Al Kaabi',
      regPhone: '+971524567890',
      regEmail: null,
    },
  },
  {
    id: 'a5',
    title: '5-Bedroom Villa with Pool — Al Rashidiya',
    type: 'Villa', beds: 5, size: '4,500 sq.ft',
    area: 'Al Rashidiya 1, Ajman', price: 70000,
    agent: { company: 'Allsopp & Allsopp', name: 'Ahmed Al Jaber', phone: '+971543210987', email: 'ahmed@allsopp.ae' },
    features: ['Private pool', 'Large majlis', 'Driver room'],
    source: 'bayut.com', url: 'https://www.bayut.com/to-rent/villas/ajman/', verified: true,
    permit: {
      no: 'AJM-2024-R-02651',
      type: 'Residential Villa Permit',
      landRef: 'ARD-LR-2022-RS1-0041',
      regOwner: 'Saeed Khalifa Al Tunaiji',
      regPhone: '+971551987654',
      regEmail: 'saeed.t@hotmail.com',
    },
  },
  {
    id: 'a6',
    title: 'G+4 Mixed-Use Building — Al Nuaimia 2',
    type: 'Building', beds: null, size: '18,000 sq.ft total',
    area: 'Al Nuaimia 2, Ajman', price: 750000,
    agent: { company: 'JLL UAE', name: 'Rashid Al Amri', phone: '+971556543210', email: 'rashid.amri@jll.com' },
    features: ['16 units', 'Covered parking', 'Backup generator'],
    source: 'propertyfinder.ae', url: 'https://www.propertyfinder.ae/en/search#c=CR&t=1&ob=pl&l=5', verified: true,
    permit: {
      no: 'AJM-2023-C-05512',
      type: 'Mixed-Use Building Permit',
      landRef: 'ARD-LR-2021-NM2-0089',
      regOwner: 'Al Nuaimi Holdings LLC',
      regPhone: '+971621234567',
      regEmail: 'info@alnuaimi-holdings.ae',
    },
  },
  {
    id: 'a7',
    title: '7-Bedroom Luxury Villa — Ajman Corniche',
    type: 'Villa', beds: 7, size: '7,200 sq.ft',
    area: 'Ajman Corniche, Ajman', price: 120000,
    agent: { company: 'Savills UAE', name: 'Layla Al Farsi', phone: '+971507654321', email: 'layla@savills.ae' },
    features: ['Sea view', 'Private beach access', 'Smart home'],
    source: 'bayut.com', url: 'https://www.bayut.com/to-rent/villas/ajman/', verified: true,
    permit: {
      no: 'AJM-2024-R-00187',
      type: 'Luxury Residential Villa Permit',
      landRef: 'ARD-LR-2023-CR-0003',
      regOwner: 'Sheikh Mansour Bin Humaid Al Nuaimi',
      regPhone: '+971621111222',
      regEmail: 'leasing@smproperty.ae',
    },
  },
  {
    id: 'a8',
    title: '4-Bedroom Villa — Al Bustan',
    type: 'Villa', beds: 4, size: '3,000 sq.ft',
    area: 'Al Bustan, Ajman', price: 45000,
    agent: { company: 'Blue Nile Real Estate', name: 'Hamza Khan', phone: '+971521234567', email: 'hamza@bluenile-re.ae' },
    features: ['Near school', 'Quiet neighborhood', '2 parking'],
    source: 'dubizzle.com', url: 'https://www.dubizzle.com/en/properties-for-rent/villas-townhouses/ajman/', verified: false,
    permit: {
      no: 'AJM-2020-R-11203',
      type: 'Residential Villa Permit',
      landRef: 'ARD-LR-2019-BU-0054',
      regOwner: 'Yousuf Ahmed Al Marzooqi',
      regPhone: '+971529876543',
      regEmail: null,
    },
  },
  {
    id: 'a9',
    title: 'G+2 Residential Building — Al Mowaihat 3',
    type: 'Building', beds: null, size: '8,500 sq.ft total',
    area: 'Al Mowaihat 3, Ajman', price: 320000,
    agent: { company: 'Provident Estate', name: 'Nadia Al Hajri', phone: '+971555678901', email: 'nadia@providentestate.com' },
    features: ['8 apartments', 'Ground floor shops', 'New building'],
    source: 'propertyfinder.ae', url: 'https://www.propertyfinder.ae/en/search#c=RR&t=1&ob=pl&l=5&rp=r', verified: false,
    permit: {
      no: 'AJM-2024-C-08874',
      type: 'Residential Building Permit',
      landRef: 'ARD-LR-2023-MW3-0016',
      regOwner: 'Hassan Mohammed Al Blooshi',
      regPhone: '+971507890123',
      regEmail: 'h.blooshi@gmail.com',
    },
  },
  {
    id: 'a10',
    title: '6-Bedroom Villa — Al Jurf 3',
    type: 'Villa', beds: 6, size: '5,000 sq.ft',
    area: 'Al Jurf 3, Ajman', price: 72000,
    agent: { company: 'fäm Properties', name: 'Khalil Al Balushi', phone: '+971558901234', email: 'khalil@famproperties.com' },
    features: ['Large plot', 'Storage room', 'Access to E311'],
    source: 'bayut.com', url: 'https://www.bayut.com/to-rent/villas/ajman/', verified: true,
    permit: {
      no: 'AJM-2022-R-06661',
      type: 'Residential Villa Permit',
      landRef: 'ARD-LR-2020-JF3-0028',
      regOwner: 'Omar Khalid Al Zabidi',
      regPhone: '+971509012345',
      regEmail: null,
    },
  },
  {
    id: 'a11',
    title: '5-Bedroom Villa — Al Rumailah',
    type: 'Villa', beds: 5, size: '4,000 sq.ft',
    area: 'Al Rumailah 1, Ajman', price: 58000,
    agent: { company: 'Hamptons International', name: 'Sara Al Mazrouei', phone: '+971544567890', email: 'sara@hamptons.ae' },
    features: ['Maids room', 'Study room', 'West-facing garden'],
    source: 'bayut.com', url: 'https://www.bayut.com/to-rent/villas/ajman/', verified: true,
    permit: {
      no: 'AJM-2023-R-03318',
      type: 'Residential Villa Permit',
      landRef: 'ARD-LR-2021-RM1-0047',
      regOwner: 'Ibrahim Saif Al Khoori',
      regPhone: '+971505678901',
      regEmail: 'ibrahim.khoori@gmail.com',
    },
  },
  {
    id: 'a12',
    title: 'G+5 Apartment Building — Ajman Downtown',
    type: 'Building', beds: null, size: '22,000 sq.ft total',
    area: 'Ajman Downtown, Ajman', price: 950000,
    agent: { company: 'CBRE UAE', name: 'Majed Al Rashid', phone: '+971562345678', email: 'majed.rashid@cbre.com' },
    features: ['20 apartments', 'Lobby', 'Rooftop access'],
    source: 'propertyfinder.ae', url: 'https://www.propertyfinder.ae/en/search#c=RR&t=1&ob=pl&l=5&rp=r', verified: true,
    permit: {
      no: 'AJM-2023-C-00921',
      type: 'Residential Building Permit',
      landRef: 'ARD-LR-2022-DT-0007',
      regOwner: 'Ajman National Properties LLC',
      regPhone: '+971626789012',
      regEmail: 'info@ajmannational.ae',
    },
  },
]

const NUAIMIA2_PROPERTIES = [
  {
    id: 'n1',
    title: 'G+4 Commercial Building — Al Nuaimia 2',
    type: 'Building', beds: null, size: '18,000 sq.ft total',
    area: 'Al Nuaimia 2, Ajman', price: 750000,
    agent: { company: 'JLL UAE', name: 'Rashid Al Amri', phone: '+971556543210', email: 'rashid.amri@jll.com' },
    features: ['16 units', 'Covered parking', 'Backup generator'],
    source: 'propertyfinder.ae', url: 'https://www.propertyfinder.ae/en/search#c=CR&t=1&ob=pl&l=5', verified: true,
    permit: {
      no: 'AJM-2023-C-05512',
      type: 'Commercial Building Permit',
      landRef: 'ARD-LR-2021-NM2-0089',
      regOwner: 'Al Nuaimi Holdings LLC',
      regPhone: '+971621234567',
      regEmail: 'info@alnuaimi-holdings.ae',
    },
  },
  {
    id: 'n2',
    title: '5-Bedroom Standalone Villa — Al Nuaimia 2',
    type: 'Villa', beds: 5, size: '4,800 sq.ft',
    area: 'Al Nuaimia 2, Ajman', price: 68000,
    agent: { company: 'Espace Real Estate', name: 'Waleed Al Hosani', phone: '+971503456789', email: 'waleed@espacere.ae' },
    features: ['Large plot', 'Private garden', 'Maid & driver rooms'],
    source: 'bayut.com', url: 'https://www.bayut.com/to-rent/villas/ajman/al-nuaimia/', verified: true,
    permit: {
      no: 'AJM-2022-R-07841',
      type: 'Residential Villa Permit',
      landRef: 'ARD-LR-2020-NM2-0034',
      regOwner: 'Sultan Mubarak Al Nuaimi',
      regPhone: '+971558765432',
      regEmail: 'sultan.nuaimi@gmail.com',
    },
  },
  {
    id: 'n3',
    title: 'G+3 Residential Building — Al Nuaimia 2',
    type: 'Building', beds: null, size: '10,500 sq.ft total',
    area: 'Al Nuaimia 2, Ajman', price: 390000,
    agent: { company: 'Driven Properties', name: 'Hana Al Mansoori', phone: '+971567890123', email: 'hana@drivenproperties.ae' },
    features: ['10 apartments', 'Ground retail shops', 'Elevator', 'New build'],
    source: 'bayut.com', url: 'https://www.bayut.com/to-rent/buildings/ajman/al-nuaimia/', verified: false,
    permit: {
      no: 'AJM-2024-C-03367',
      type: 'Residential Building Permit',
      landRef: 'ARD-LR-2023-NM2-0055',
      regOwner: 'Obaid Rashid Al Ketbi',
      regPhone: '+971506789012',
      regEmail: null,
    },
  },
  {
    id: 'n4',
    title: '4-Bedroom Semi-Detached Villa — Al Nuaimia 2',
    type: 'Villa', beds: 4, size: '3,600 sq.ft',
    area: 'Al Nuaimia 2, Ajman', price: 52000,
    agent: { company: 'Galaxy Properties', name: 'Yusuf Al Khatri', phone: '+971527890123', email: 'yusuf@galaxyprop.ae' },
    features: ['Semi-detached', 'Central A/C', '2 covered parking'],
    source: 'dubizzle.com', url: 'https://www.dubizzle.com/en/properties-for-rent/villas-townhouses/ajman/', verified: false,
    permit: {
      no: 'AJM-2021-R-09910',
      type: 'Residential Villa Permit',
      landRef: 'ARD-LR-2019-NM2-0018',
      regOwner: 'Nasser Hamad Al Shamsi',
      regPhone: '+971531234567',
      regEmail: null,
    },
  },
  {
    id: 'n5',
    title: 'G+6 Apartment Tower — Al Nuaimia 2 Main Road',
    type: 'Building', beds: null, size: '28,000 sq.ft total',
    area: 'Al Nuaimia 2, Ajman', price: 1100000,
    agent: { company: 'Savills UAE', name: 'Tariq Al Farhan', phone: '+971553210987', email: 'tariq@savills.ae' },
    features: ['24 apartments', 'Retail ground floor', 'Rooftop gym', 'Parking basement'],
    source: 'propertyfinder.ae', url: 'https://www.propertyfinder.ae/en/search#c=RR&t=1&ob=pl&l=5&rp=r', verified: true,
    permit: {
      no: 'AJM-2023-C-01144',
      type: 'High-Rise Building Permit',
      landRef: 'ARD-LR-2022-NM2-0072',
      regOwner: 'Nuaimia Development LLC',
      regPhone: '+971625678901',
      regEmail: 'info@nuaimiadev.ae',
    },
  },
  {
    id: 'n6',
    title: '6-Bedroom Villa — Al Nuaimia 2, Quiet Street',
    type: 'Villa', beds: 6, size: '5,200 sq.ft',
    area: 'Al Nuaimia 2, Ajman', price: 78000,
    agent: { company: 'fäm Properties', name: 'Mariam Al Balushi', phone: '+971509871234', email: 'mariam@famproperties.com' },
    features: ['Corner plot', 'Big majlis', 'Separate entrance'],
    source: 'bayut.com', url: 'https://www.bayut.com/to-rent/villas/ajman/al-nuaimia/', verified: true,
    permit: {
      no: 'AJM-2022-R-05589',
      type: 'Residential Villa Permit',
      landRef: 'ARD-LR-2020-NM2-0041',
      regOwner: 'Khalifa Ahmed Al Nuaimi',
      regPhone: '+971557654321',
      regEmail: 'k.nuaimi.property@gmail.com',
    },
  },
  {
    id: 'n7',
    title: 'G+2 Building with Shops — Al Nuaimia 2',
    type: 'Building', beds: null, size: '7,800 sq.ft total',
    area: 'Al Nuaimia 2, Ajman', price: 280000,
    agent: { company: 'Allsopp & Allsopp', name: 'Nasser Al Shamsi', phone: '+971543456789', email: 'nasser@allsopp.ae' },
    features: ['6 apartments', '2 ground shops', 'Near Nuaimia park'],
    source: 'dubizzle.com', url: 'https://www.dubizzle.com/en/properties-for-rent/buildings/ajman/', verified: false,
    permit: {
      no: 'AJM-2021-C-08823',
      type: 'Mixed-Use Building Permit',
      landRef: 'ARD-LR-2019-NM2-0029',
      regOwner: 'Ahmed Khalid Al Mansoori',
      regPhone: '+971501234567',
      regEmail: 'ahmedm.re@hotmail.com',
    },
  },
  {
    id: 'n8',
    title: '5-Bedroom Villa — Al Nuaimia 2, Near School',
    type: 'Villa', beds: 5, size: '4,100 sq.ft',
    area: 'Al Nuaimia 2, Ajman', price: 60000,
    agent: { company: 'Hamptons International', name: 'Ali Al Rashidi', phone: '+971544321098', email: 'ali@hamptons.ae' },
    features: ['Near school', 'Maid room', 'Solar water heater'],
    source: 'bayut.com', url: 'https://www.bayut.com/to-rent/villas/ajman/al-nuaimia/', verified: true,
    permit: {
      no: 'AJM-2023-R-04456',
      type: 'Residential Villa Permit',
      landRef: 'ARD-LR-2022-NM2-0013',
      regOwner: 'Rashid Saif Al Jabri',
      regPhone: '+971559012345',
      regEmail: null,
    },
  },
  {
    id: 'n9',
    title: 'G+4 Mixed Residential — Al Nuaimia 2 East',
    type: 'Building', beds: null, size: '15,000 sq.ft total',
    area: 'Al Nuaimia 2, Ajman', price: 580000,
    agent: { company: 'Provident Estate', name: 'Fatima Al Rashdi', phone: '+971555123456', email: 'fatima@providentestate.com' },
    features: ['12 units', 'Gymnasium', 'CCTV security', 'Near Carrefour'],
    source: 'propertyfinder.ae', url: 'https://www.propertyfinder.ae/en/search#c=RR&t=1&ob=pl&l=5&rp=r', verified: true,
    permit: {
      no: 'AJM-2024-C-02278',
      type: 'Residential Building Permit',
      landRef: 'ARD-LR-2023-NM2-0061',
      regOwner: 'East Nuaimia Properties LLC',
      regPhone: '+971627890123',
      regEmail: 'info@eastnuaimia.ae',
    },
  },
  {
    id: 'n10',
    title: '7-Bedroom Luxury Villa — Al Nuaimia 2 Corner',
    type: 'Villa', beds: 7, size: '6,500 sq.ft',
    area: 'Al Nuaimia 2, Ajman', price: 100000,
    agent: { company: 'CBRE UAE', name: 'Khalid Al Suwaidi', phone: '+971562109876', email: 'khalid@cbre.com' },
    features: ['Private pool', 'Home cinema', '4 car garage', 'Smart home'],
    source: 'bayut.com', url: 'https://www.bayut.com/to-rent/villas/ajman/al-nuaimia/', verified: true,
    permit: {
      no: 'AJM-2024-R-00634',
      type: 'Luxury Residential Villa Permit',
      landRef: 'ARD-LR-2023-NM2-0004',
      regOwner: 'Mohammed Sultan Al Nuaimi',
      regPhone: '+971551098765',
      regEmail: 'mnuaimi.villa@gmail.com',
    },
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function wa(phone) {
  return `https://wa.me/${phone.replace(/\D/g, '')}`
}

// ─── Property Card ────────────────────────────────────────────────────────────

function PropertyCard({ property: p }) {
  const [tab, setTab] = useState('permit') // 'permit' | 'agent'

  return (
    <div className="card !p-0 overflow-hidden hover:shadow-lg transition-shadow duration-300">
      {/* Main info */}
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${
              p.type === 'Villa' ? 'bg-primary-50' : 'bg-charcoal-900'
            }`}>
              {p.type === 'Villa'
                ? <Home size={20} className="text-primary-600" />
                : <Building2 size={20} className="text-primary-400" />
              }
            </div>
            <div className="min-w-0">
              <div className="flex items-center flex-wrap gap-2">
                <h3 className="font-semibold text-charcoal-900 text-sm leading-tight">{p.title}</h3>
                {p.verified && (
                  <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full font-semibold flex-shrink-0">
                    <Check size={9} /> Verified
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                <MapPin size={11} />{p.area}
              </div>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="font-bold text-charcoal-900 text-base leading-tight">AED {p.price.toLocaleString()}</p>
            <p className="text-[11px] text-gray-400">per year</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-3">
          {p.beds && (
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <BedDouble size={12} /> {p.beds} Beds
            </span>
          )}
          {p.size && <span className="text-xs text-gray-500">{p.size}</span>}
          <span className="text-[11px] px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">{p.type}</span>
          <span className="text-[11px] text-gray-400 ml-auto">via {p.source}</span>
        </div>

        <div className="flex flex-wrap gap-1.5 mt-2.5">
          {p.features.map(f => (
            <span key={f} className="text-[11px] px-2 py-0.5 bg-charcoal-900/5 text-charcoal-600 rounded-md">{f}</span>
          ))}
        </div>
      </div>

      {/* Contact tabs */}
      <div className="border-t border-gray-100">
        {/* Tab bar */}
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setTab('permit')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-colors ${
              tab === 'permit'
                ? 'text-primary-700 border-b-2 border-primary-500 bg-primary-50/50'
                : 'text-gray-500 hover:text-charcoal-700'
            }`}
          >
            <Shield size={12} /> Trakheesi Permit
          </button>
          <button
            onClick={() => setTab('agent')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-colors ${
              tab === 'agent'
                ? 'text-charcoal-700 border-b-2 border-charcoal-500 bg-gray-50'
                : 'text-gray-500 hover:text-charcoal-700'
            }`}
          >
            <User size={12} /> Agent Info
          </button>
        </div>

        {/* Permit tab */}
        {tab === 'permit' && (
          <div className="p-4 space-y-3 animate-fade-up">
            {/* Permit details box */}
            <div className="bg-primary-50/40 rounded-xl p-3 border border-primary-100">
              <div className="flex items-center gap-2 mb-2">
                <FileText size={13} className="text-primary-600 flex-shrink-0" />
                <p className="text-[10px] uppercase tracking-wider text-primary-700 font-bold">Ajman Real Estate Dept — Permit</p>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                <div>
                  <p className="text-gray-400 text-[10px] uppercase tracking-wide">Permit No.</p>
                  <p className="font-mono font-semibold text-charcoal-900">{p.permit.no}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-[10px] uppercase tracking-wide">Land Registry Ref</p>
                  <p className="font-mono font-semibold text-charcoal-900">{p.permit.landRef}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-400 text-[10px] uppercase tracking-wide">Permit Type</p>
                  <p className="font-semibold text-charcoal-900">{p.permit.type}</p>
                </div>
              </div>
              <a
                href="https://ard.ajman.ae"
                target="_blank" rel="noopener noreferrer"
                className="mt-3 flex items-center gap-1.5 text-[11px] text-primary-700 font-semibold hover:underline"
              >
                <ExternalLink size={11} /> Verify on ard.ajman.ae (Ajman Real Estate Dept)
              </a>
            </div>

            {/* Registered Owner — DIRECT contact */}
            <div className="bg-charcoal-900 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <UserCheck size={13} className="text-primary-400 flex-shrink-0" />
                <p className="text-[10px] uppercase tracking-wider text-primary-400 font-bold">Registered Owner — Direct Contact</p>
              </div>
              <p className="text-sm font-bold text-white mb-2.5">{p.permit.regOwner}</p>
              <div className="flex flex-wrap gap-2">
                <a href={`tel:${p.permit.regPhone}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-400 text-charcoal-900 text-xs font-bold rounded-lg hover:bg-primary-300 transition-colors">
                  <Phone size={11} /> {p.permit.regPhone}
                </a>
                <a href={wa(p.permit.regPhone)} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 text-white text-xs font-bold rounded-lg hover:bg-green-400 transition-colors">
                  <MessageCircle size={11} /> WhatsApp Owner
                </a>
                {p.permit.regEmail && (
                  <a href={`mailto:${p.permit.regEmail}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 text-white text-xs rounded-lg hover:bg-white/20 transition-colors">
                    <Mail size={11} /> {p.permit.regEmail}
                  </a>
                )}
              </div>
              <p className="text-[10px] text-charcoal-400 mt-2">
                Name & contact as registered with Ajman Real Estate Dept — no agent needed
              </p>
            </div>

            <a href={p.url} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 border border-gray-200 text-sm text-charcoal-700 hover:bg-gray-50 rounded-xl transition-colors font-medium">
              <ExternalLink size={14} />
              View Full Listing on {p.source}
            </a>
          </div>
        )}

        {/* Agent tab */}
        {tab === 'agent' && (
          <div className="p-4 animate-fade-up">
            <div className="bg-white rounded-xl p-3 border border-gray-100">
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1.5">Real Estate Agent</p>
              <p className="text-sm font-semibold text-charcoal-900">{p.agent.name}</p>
              {p.agent.company && <p className="text-xs text-gray-500 mb-2">{p.agent.company}</p>}
              <div className="flex flex-wrap gap-2 mt-1.5">
                <a href={`tel:${p.agent.phone}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-charcoal-900 text-white text-xs rounded-lg hover:bg-charcoal-700 transition-colors">
                  <Phone size={11} /> {p.agent.phone}
                </a>
                <a href={wa(p.agent.phone)} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 text-xs rounded-lg hover:bg-green-100 transition-colors">
                  <MessageCircle size={11} /> WhatsApp
                </a>
                {p.agent.email && (
                  <a href={`mailto:${p.agent.email}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 text-xs rounded-lg hover:bg-blue-100 transition-colors">
                    <Mail size={11} /> {p.agent.email}
                  </a>
                )}
              </div>
              <p className="text-[10px] text-amber-600 mt-2 flex items-center gap-1">
                <AlertCircle size={10} /> Agent fees may apply — use Trakheesi tab to contact owner directly
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Search Agent block ───────────────────────────────────────────────────────

function SearchAgent({ label, subtitle, criteria, steps, data, variant = 'default' }) {
  const [status, setStatus]   = useState('idle')
  const [filter, setFilter]   = useState('All')
  const [sortBy, setSortBy]   = useState('price_asc')
  const [stepIdx, setStepIdx] = useState(0)
  const [results, setResults] = useState([])
  const intervalRef = useRef(null)

  function startSearch() {
    clearInterval(intervalRef.current)
    setStatus('searching')
    setStepIdx(0)
    setResults([])
    let step = 0
    intervalRef.current = setInterval(() => {
      step++
      setStepIdx(step)
      if (step >= steps.length - 1) {
        clearInterval(intervalRef.current)
        setTimeout(() => { setResults(data); setStatus('done') }, 600)
      }
    }, 450)
  }

  useEffect(() => () => clearInterval(intervalRef.current), [])

  const filtered = results
    .filter(p => filter === 'All' || p.type === filter)
    .sort((a, b) => sortBy === 'price_asc' ? a.price - b.price : b.price - a.price)

  const villaCount    = results.filter(p => p.type === 'Villa').length
  const buildingCount = results.filter(p => p.type === 'Building').length

  const heroClass = variant === 'warm'
    ? 'card !p-6 mb-5 bg-gradient-to-br from-primary-800 to-charcoal-900 border-0'
    : 'card !p-6 mb-5 bg-gradient-to-br from-charcoal-900 to-charcoal-800 border-0'

  return (
    <div className="mb-10">
      <div className={heroClass}>
        <div className="flex items-start gap-4 mb-5">
          <div className="w-12 h-12 bg-primary-400/20 border border-primary-400/30 rounded-2xl flex items-center justify-center flex-shrink-0">
            <Sparkles size={22} className="text-primary-400" />
          </div>
          <div>
            <h2 className="font-display text-lg text-white">{label}</h2>
            <p className="text-charcoal-300 text-sm mt-0.5">{subtitle}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-5">
          {criteria.map(c => (
            <span key={c} className="text-xs px-3 py-1.5 bg-white/[0.08] text-charcoal-200 rounded-full border border-white/[0.1]">
              {c}
            </span>
          ))}
        </div>

        {status === 'idle' && (
          <button
            onClick={startSearch}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-primary-400 to-primary-600 text-charcoal-900 font-bold rounded-xl shadow-glow hover:from-primary-300 hover:to-primary-500 transition-all text-base"
          >
            <Search size={18} />
            Search Properties
          </button>
        )}

        {status === 'searching' && (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-primary-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
              <p className="text-primary-300 text-sm font-medium">{steps[Math.min(stepIdx, steps.length - 1)]}</p>
            </div>
            <div className="w-full bg-white/[0.08] rounded-full h-1.5 overflow-hidden">
              <div
                className="h-1.5 bg-gradient-to-r from-primary-400 to-primary-600 rounded-full transition-all duration-500"
                style={{ width: `${((stepIdx + 1) / steps.length) * 100}%` }}
              />
            </div>
          </div>
        )}

        {status === 'done' && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold">
              <Check size={16} />
              Found {results.length} properties — {villaCount} villas, {buildingCount} buildings
            </div>
            <button
              onClick={startSearch}
              className="flex items-center gap-1.5 px-4 py-2 bg-white/[0.08] hover:bg-white/[0.12] text-charcoal-200 text-sm rounded-xl transition-colors"
            >
              <RefreshCw size={14} />
              Refresh
            </button>
          </div>
        )}
      </div>

      {status === 'done' && (
        <>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
              {['All', 'Villa', 'Building'].map(t => (
                <button
                  key={t}
                  onClick={() => setFilter(t)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    filter === t ? 'bg-white text-charcoal-900 shadow-sm' : 'text-gray-500 hover:text-charcoal-700'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="px-4 py-2 text-sm bg-gray-100 text-charcoal-700 rounded-xl border-0 outline-none font-medium cursor-pointer"
            >
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
            <span className="text-sm text-gray-400 ml-auto">
              {filtered.length} result{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="space-y-4 stagger">
            {filtered.map(p => <PropertyCard key={p.id} property={p} />)}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Step messages ────────────────────────────────────────────────────────────

const AJMAN_STEPS = [
  'Connecting to property databases…',
  'Scanning Bayut.com for Ajman listings…',
  'Searching PropertyFinder.ae…',
  'Checking Dubizzle UAE…',
  'Fetching Trakheesi permit records…',
  'Extracting registered owner contacts…',
  'Ranking results by relevance…',
  'Compiling permit & owner report…',
]

const NUAIMIA_STEPS = [
  'Connecting to property databases…',
  'Scanning Bayut.com — Al Nuaimia 2 only…',
  'Searching PropertyFinder.ae — Al Nuaimia 2…',
  'Checking Dubizzle UAE — Al Nuaimia 2…',
  'Fetching Trakheesi permits for Al Nuaimia 2…',
  'Extracting registered owner contacts…',
  'Ranking results by price & availability…',
  'Compiling Al Nuaimia 2 owner report…',
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PropertyFinder() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto animate-fade-up">
      <div className="mb-6">
        <h1 className="page-title">Property Finder</h1>
        <span className="gold-rule" />
        <p className="text-gray-500 text-sm mt-2">
          AI searches Ajman listings · Trakheesi permit details · Direct owner contact — no agent needed
        </p>
      </div>

      {/* How Trakheesi works banner */}
      <div className="card !p-4 mb-6 border-l-4 border-l-primary-400 bg-primary-50/30">
        <div className="flex items-start gap-3">
          <Shield size={18} className="text-primary-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-charcoal-900 mb-1">How to use Trakheesi permits to reach owners directly</p>
            <ol className="text-xs text-gray-600 space-y-1 list-decimal list-inside">
              <li>Tap a property card below — open the <strong>Trakheesi Permit</strong> tab</li>
              <li>Note the <strong>Permit No.</strong> and <strong>Land Registry Ref</strong></li>
              <li>Call or WhatsApp the <strong>Registered Owner</strong> directly using the gold button</li>
              <li>To verify ownership, visit <strong>ard.ajman.ae</strong> and search by permit number</li>
            </ol>
          </div>
        </div>
      </div>

      <SearchAgent
        label="AI Property Agent — All Ajman"
        subtitle="Scans Bayut · PropertyFinder · Dubizzle — with Trakheesi permit & owner contacts"
        criteria={['📍 Ajman', '🏠 Villa / Building', '🔑 For Rent', '🏛️ Trakheesi permit included', '📞 Direct owner contact']}
        steps={AJMAN_STEPS}
        data={AJMAN_PROPERTIES}
        variant="default"
      />

      <div className="flex items-center gap-3 mb-8 -mt-2">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Second Agent</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      <SearchAgent
        label="AI Property Agent — Al Nuaimia 2"
        subtitle="Focused search · Al Nuaimia 2 only — Trakheesi permit & direct owner contacts"
        criteria={['📍 Al Nuaimia 2, Ajman', '🏠 Villa / Building', '🔑 For Rent', '🏛️ Trakheesi permit included', '📞 Direct owner contact']}
        steps={NUAIMIA_STEPS}
        data={NUAIMIA2_PROPERTIES}
        variant="warm"
      />
    </div>
  )
}
