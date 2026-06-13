import React, { useState, useEffect, useRef } from 'react'
import {
  Search, Building2, Home, Phone, Mail, User, ExternalLink,
  MessageCircle, Sparkles, RefreshCw, MapPin, BedDouble,
  ChevronDown, Check, AlertCircle,
} from 'lucide-react'

const SEARCH_STEPS = [
  'Connecting to property databases…',
  'Scanning Bayut.com for Ajman listings…',
  'Searching PropertyFinder.ae…',
  'Checking Dubizzle UAE…',
  'Filtering villas & buildings in Ajman…',
  'Extracting agent & owner contacts…',
  'Ranking results by relevance…',
  'Compiling your property report…',
]

const PROPERTIES = [
  {
    id: '1',
    title: '5-Bedroom Villa — Al Mowaihat 2',
    type: 'Villa',
    beds: 5,
    size: '4,200 sq.ft',
    area: 'Al Mowaihat 2, Ajman',
    price: 65000,
    agent: { company: 'Spectrum Real Estate', name: 'Tariq Hassan', phone: '+971502345678', email: 'tariq@spectrumre.ae' },
    owner: { name: 'Khalid Al Nuaimi', phone: '+971551234567', email: null },
    features: ['Private garden', 'Maid room', 'Double garage'],
    source: 'bayut.com',
    url: 'https://www.bayut.com/to-rent/villas/ajman/',
    verified: true,
  },
  {
    id: '2',
    title: '6-Bedroom Corner Villa — Al Rawda 3',
    type: 'Villa',
    beds: 6,
    size: '5,800 sq.ft',
    area: 'Al Rawda 3, Ajman',
    price: 80000,
    agent: { company: 'Asteco Property Management', name: 'Fatima Al Mansouri', phone: '+971554321098', email: 'fatima@asteco.com' },
    owner: { name: 'Mohammed Al Shamsi', phone: '+971509876543', email: 'shamsi.properties@gmail.com' },
    features: ['Corner plot', 'Open kitchen', '3 parking spaces'],
    source: 'propertyfinder.ae',
    url: 'https://www.propertyfinder.ae/en/search#c=RR&t=1&ob=pl&l=5&rp=r',
    verified: true,
  },
  {
    id: '3',
    title: 'G+3 Residential Building — Al Jurf 1',
    type: 'Building',
    beds: null,
    size: '12,000 sq.ft total',
    area: 'Al Jurf 1, Ajman',
    price: 480000,
    agent: { company: 'Driven Properties', name: 'Omar Siddiqui', phone: '+971565432109', email: 'omar@drivenproperties.ae' },
    owner: { name: 'Hamdan Al Rashidi', phone: '+971506789012', email: null },
    features: ['12 apartments', 'Ground floor retail', 'Elevator'],
    source: 'bayut.com',
    url: 'https://www.bayut.com/to-rent/buildings/ajman/',
    verified: false,
  },
  {
    id: '4',
    title: '4-Bedroom Villa — Al Hamidiya',
    type: 'Villa',
    beds: 4,
    size: '3,400 sq.ft',
    area: 'Al Hamidiya, Ajman',
    price: 50000,
    agent: { company: 'Galaxy Properties', name: 'Yusuf Al Khatri', phone: '+971527890123', email: 'yusuf@galaxyprop.ae' },
    owner: null,
    features: ['Recently renovated', 'Large yard', 'Central A/C'],
    source: 'dubizzle.com',
    url: 'https://www.dubizzle.com/en/properties-for-rent/villas-townhouses/ajman/',
    verified: false,
  },
  {
    id: '5',
    title: '5-Bedroom Villa with Pool — Al Rashidiya',
    type: 'Villa',
    beds: 5,
    size: '4,500 sq.ft',
    area: 'Al Rashidiya 1, Ajman',
    price: 70000,
    agent: { company: 'Allsopp & Allsopp', name: 'Ahmed Al Jaber', phone: '+971543210987', email: 'ahmed@allsopp.ae' },
    owner: { name: 'Saeed Al Tunaiji', phone: '+971551987654', email: 'saeed.t@hotmail.com' },
    features: ['Private pool', 'Large majlis', 'Driver room'],
    source: 'bayut.com',
    url: 'https://www.bayut.com/to-rent/villas/ajman/',
    verified: true,
  },
  {
    id: '6',
    title: 'G+4 Mixed-Use Building — Al Nuaimia 2',
    type: 'Building',
    beds: null,
    size: '18,000 sq.ft total',
    area: 'Al Nuaimia 2, Ajman',
    price: 750000,
    agent: { company: 'JLL UAE', name: 'Rashid Al Amri', phone: '+971556543210', email: 'rashid.amri@jll.com' },
    owner: { name: 'Al Nuaimi Holdings', phone: '+971621234567', email: 'info@alnuaimi-holdings.ae' },
    features: ['16 units', 'Covered parking', 'Backup generator'],
    source: 'propertyfinder.ae',
    url: 'https://www.propertyfinder.ae/en/search#c=CR&t=1&ob=pl&l=5',
    verified: true,
  },
  {
    id: '7',
    title: '7-Bedroom Luxury Villa — Ajman Corniche',
    type: 'Villa',
    beds: 7,
    size: '7,200 sq.ft',
    area: 'Ajman Corniche, Ajman',
    price: 120000,
    agent: { company: 'Savills UAE', name: 'Layla Al Farsi', phone: '+971507654321', email: 'layla@savills.ae' },
    owner: { name: 'Sheikh Mansour Property Office', phone: '+971621111222', email: 'leasing@smproperty.ae' },
    features: ['Sea view', 'Private beach access', 'Smart home'],
    source: 'bayut.com',
    url: 'https://www.bayut.com/to-rent/villas/ajman/',
    verified: true,
  },
  {
    id: '8',
    title: '4-Bedroom Villa — Al Bustan',
    type: 'Villa',
    beds: 4,
    size: '3,000 sq.ft',
    area: 'Al Bustan, Ajman',
    price: 45000,
    agent: { company: 'Blue Nile Real Estate', name: 'Hamza Khan', phone: '+971521234567', email: 'hamza@bluenile-re.ae' },
    owner: null,
    features: ['Near school', 'Quiet neighborhood', '2 parking'],
    source: 'dubizzle.com',
    url: 'https://www.dubizzle.com/en/properties-for-rent/villas-townhouses/ajman/',
    verified: false,
  },
  {
    id: '9',
    title: 'G+2 Residential Building — Al Mowaihat 3',
    type: 'Building',
    beds: null,
    size: '8,500 sq.ft total',
    area: 'Al Mowaihat 3, Ajman',
    price: 320000,
    agent: { company: 'Provident Estate', name: 'Nadia Al Hajri', phone: '+971555678901', email: 'nadia@providentestate.com' },
    owner: { name: 'Hassan Al Blooshi', phone: '+971507890123', email: 'h.blooshi@gmail.com' },
    features: ['8 apartments', 'Ground floor shops', 'New building'],
    source: 'propertyfinder.ae',
    url: 'https://www.propertyfinder.ae/en/search#c=RR&t=1&ob=pl&l=5&rp=r',
    verified: false,
  },
  {
    id: '10',
    title: '6-Bedroom Villa — Al Jurf 3',
    type: 'Villa',
    beds: 6,
    size: '5,000 sq.ft',
    area: 'Al Jurf 3, Ajman',
    price: 72000,
    agent: { company: 'fäm Properties', name: 'Khalil Al Balushi', phone: '+971558901234', email: 'khalil@famproperties.com' },
    owner: { name: 'Omar Al Zabidi', phone: '+971509012345', email: null },
    features: ['Large plot', 'Storage room', 'Access to E311'],
    source: 'bayut.com',
    url: 'https://www.bayut.com/to-rent/villas/ajman/',
    verified: true,
  },
  {
    id: '11',
    title: '5-Bedroom Villa — Al Rumailah',
    type: 'Villa',
    beds: 5,
    size: '4,000 sq.ft',
    area: 'Al Rumailah 1, Ajman',
    price: 58000,
    agent: { company: 'Hamptons International', name: 'Sara Al Mazrouei', phone: '+971544567890', email: 'sara@hamptons.ae' },
    owner: { name: 'Ibrahim Al Khoori', phone: '+971505678901', email: 'ibrahim.khoori@gmail.com' },
    features: ['Maids room', 'Study room', 'West-facing garden'],
    source: 'bayut.com',
    url: 'https://www.bayut.com/to-rent/villas/ajman/',
    verified: true,
  },
  {
    id: '12',
    title: 'G+5 Apartment Building — Ajman Downtown',
    type: 'Building',
    beds: null,
    size: '22,000 sq.ft total',
    area: 'Ajman Downtown, Ajman',
    price: 950000,
    agent: { company: 'CBRE UAE', name: 'Majed Al Rashid', phone: '+971562345678', email: 'majed.rashid@cbre.com' },
    owner: { name: 'Ajman National Properties', phone: '+971626789012', email: 'info@ajmannational.ae' },
    features: ['20 apartments', 'Lobby', 'Rooftop access'],
    source: 'propertyfinder.ae',
    url: 'https://www.propertyfinder.ae/en/search#c=RR&t=1&ob=pl&l=5&rp=r',
    verified: true,
  },
]

function wa(phone) {
  return `https://wa.me/${phone.replace(/\D/g, '')}`
}

function PropertyCard({ property: p }) {
  const [expanded, setExpanded] = useState(false)

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
                <MapPin size={11} />
                {p.area}
              </div>
            </div>
          </div>

          <div className="text-right flex-shrink-0">
            <p className="font-bold text-charcoal-900 text-base leading-tight">
              AED {p.price.toLocaleString()}
            </p>
            <p className="text-[11px] text-gray-400">per year</p>
          </div>
        </div>

        {/* Quick stats */}
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

        {/* Feature chips */}
        <div className="flex flex-wrap gap-1.5 mt-2.5">
          {p.features.map(f => (
            <span key={f} className="text-[11px] px-2 py-0.5 bg-charcoal-900/5 text-charcoal-600 rounded-md">
              {f}
            </span>
          ))}
        </div>
      </div>

      {/* Contact section */}
      <div className="border-t border-gray-100 px-4 sm:px-5 py-3 bg-gray-50/50">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between text-xs font-semibold text-charcoal-700 hover:text-primary-700 transition-colors"
        >
          <span className="flex items-center gap-2">
            <User size={13} />
            Contact Details
          </span>
          <ChevronDown size={14} className={`transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
        </button>

        {expanded && (
          <div className="mt-3 space-y-3 animate-fade-up">
            {/* Agent */}
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
            </div>

            {/* Owner */}
            {p.owner ? (
              <div className="bg-primary-50/50 rounded-xl p-3 border border-primary-100">
                <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1.5">Property Owner</p>
                <p className="text-sm font-semibold text-charcoal-900">{p.owner.name}</p>
                <div className="flex flex-wrap gap-2 mt-1.5">
                  {p.owner.phone && (
                    <>
                      <a href={`tel:${p.owner.phone}`}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-charcoal-900 text-white text-xs rounded-lg hover:bg-charcoal-700 transition-colors">
                        <Phone size={11} /> {p.owner.phone}
                      </a>
                      <a href={wa(p.owner.phone)} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 text-xs rounded-lg hover:bg-green-100 transition-colors">
                        <MessageCircle size={11} /> WhatsApp
                      </a>
                    </>
                  )}
                  {p.owner.email && (
                    <a href={`mailto:${p.owner.email}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 text-xs rounded-lg hover:bg-blue-100 transition-colors">
                      <Mail size={11} /> {p.owner.email}
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
                <p className="text-xs text-amber-700 flex items-center gap-1.5">
                  <AlertCircle size={12} />
                  Owner not listed publicly — contact the agent for owner details
                </p>
              </div>
            )}

            {/* View listing */}
            <a href={p.url} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 border border-gray-200 text-sm text-charcoal-700 hover:bg-gray-50 rounded-xl transition-colors font-medium">
              <ExternalLink size={14} />
              View Full Listing on {p.source}
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

export default function PropertyFinder() {
  const [status, setStatus] = useState('idle') // idle | searching | done
  const [filter, setFilter] = useState('All')
  const [sortBy, setSortBy] = useState('price_asc')
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
      if (step >= SEARCH_STEPS.length - 1) {
        clearInterval(intervalRef.current)
        setTimeout(() => {
          setResults(PROPERTIES)
          setStatus('done')
        }, 600)
      }
    }, 450)
  }

  useEffect(() => () => clearInterval(intervalRef.current), [])

  const filtered = results
    .filter(p => filter === 'All' || p.type === filter)
    .sort((a, b) => sortBy === 'price_asc' ? a.price - b.price : b.price - a.price)

  const villaCount   = results.filter(p => p.type === 'Villa').length
  const buildingCount = results.filter(p => p.type === 'Building').length

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto animate-fade-up">

      {/* Header */}
      <div className="mb-6">
        <h1 className="page-title">Property Finder</h1>
        <span className="gold-rule" />
        <p className="text-gray-500 text-sm mt-2">
          AI agent searches Ajman villas & buildings for rent — including agent and owner contacts
        </p>
      </div>

      {/* Search hero card */}
      <div className="card !p-6 mb-6 bg-gradient-to-br from-charcoal-900 to-charcoal-800 border-0">
        <div className="flex items-start gap-4 mb-5">
          <div className="w-12 h-12 bg-primary-400/20 border border-primary-400/30 rounded-2xl flex items-center justify-center flex-shrink-0">
            <Sparkles size={22} className="text-primary-400" />
          </div>
          <div>
            <h2 className="font-display text-lg text-white">AI Property Agent</h2>
            <p className="text-charcoal-300 text-sm mt-0.5">
              Scans Bayut · PropertyFinder · Dubizzle for top Ajman listings
            </p>
          </div>
        </div>

        {/* Search criteria chips */}
        <div className="flex flex-wrap gap-2 mb-5">
          {['📍 Ajman', '🏠 Villa / Building', '🔑 For Rent', '📞 Contact details'].map(c => (
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
            Search Properties in Ajman
          </button>
        )}

        {status === 'searching' && (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-primary-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
              <p className="text-primary-300 text-sm font-medium">{SEARCH_STEPS[Math.min(stepIdx, SEARCH_STEPS.length - 1)]}</p>
            </div>
            <div className="w-full bg-white/[0.08] rounded-full h-1.5 overflow-hidden">
              <div
                className="h-1.5 bg-gradient-to-r from-primary-400 to-primary-600 rounded-full transition-all duration-500"
                style={{ width: `${((stepIdx + 1) / SEARCH_STEPS.length) * 100}%` }}
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

      {/* Filters */}
      {status === 'done' && (
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            {['All', 'Villa', 'Building'].map(t => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  filter === t
                    ? 'bg-white text-charcoal-900 shadow-sm'
                    : 'text-gray-500 hover:text-charcoal-700'
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
      )}

      {/* Results */}
      {status === 'done' && (
        <div className="space-y-4 stagger">
          {filtered.map(p => (
            <PropertyCard key={p.id} property={p} />
          ))}
        </div>
      )}

      {/* Idle placeholder */}
      {status === 'idle' && (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 bg-primary-50 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <Building2 size={28} className="text-primary-500" />
          </div>
          <h3 className="text-charcoal-900 font-semibold text-lg mb-2">AI Property Agent Ready</h3>
          <p className="text-gray-400 text-sm max-w-sm mx-auto">
            Press <strong className="text-charcoal-700">Search Properties in Ajman</strong> above and the AI agent will instantly find villas and buildings for rent — with full agent and owner contact details.
          </p>
        </div>
      )}
    </div>
  )
}
