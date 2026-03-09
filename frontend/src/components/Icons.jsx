const props = (p) => ({
  viewBox: '0 0 20 20',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  width: '100%',
  height: '100%',
  ...p,
})

export const IconDashboard = (p) => (
  <svg {...props(p)}>
    <rect x="2" y="2" width="7" height="7" rx="1.5"/>
    <rect x="11" y="2" width="7" height="7" rx="1.5"/>
    <rect x="2" y="11" width="7" height="7" rx="1.5"/>
    <rect x="11" y="11" width="7" height="7" rx="1.5"/>
  </svg>
)

export const IconBrowse = (p) => (
  <svg {...props(p)}>
    <circle cx="9" cy="9" r="6"/>
    <path d="M13.5 13.5L17 17"/>
    <path d="M6 9h6M9 6v6" strokeWidth={1.4}/>
  </svg>
)

export const IconMatch = (p) => (
  <svg {...props(p)}>
    <path d="M10 17.5s-7-4.5-7-9a4 4 0 018 0 4 4 0 018 0c0 4.5-7 9-7 9z"/>
  </svg>
)

export const IconSwap = (p) => (
  <svg {...props(p)}>
    <path d="M3 7h14M13 4l4 3-4 3"/>
    <path d="M17 13H3M7 10l-4 3 4 3"/>
  </svg>
)

export const IconStar = (p) => (
  <svg {...props(p)}>
    <path d="M10 2l2.4 4.8 5.3.8-3.85 3.75.91 5.3L10 14.1l-4.76 2.55.91-5.3L2.3 7.6l5.3-.8L10 2z"/>
  </svg>
)

export const IconUser = (p) => (
  <svg {...props(p)}>
    <circle cx="10" cy="7" r="3.5"/>
    <path d="M3 17c0-3.87 3.13-7 7-7s7 3.13 7 7"/>
  </svg>
)

export const IconLogout = (p) => (
  <svg {...props(p)}>
    <path d="M13 5l5 5-5 5M18 10H7"/>
    <path d="M7 3H4a1 1 0 00-1 1v12a1 1 0 001 1h3"/>
  </svg>
)

export const IconPlus = (p) => (
  <svg {...props(p)}>
    <path d="M10 3v14M3 10h14"/>
  </svg>
)

export const IconCheck = (p) => (
  <svg {...props(p)}>
    <path d="M3 10l5 5 9-9"/>
  </svg>
)

export const IconX = (p) => (
  <svg {...props(p)}>
    <path d="M4 4l12 12M16 4L4 16"/>
  </svg>
)

export const IconChevronRight = (p) => (
  <svg {...props(p)} strokeWidth={2}>
    <path d="M7 4l6 6-6 6"/>
  </svg>
)

export const IconArrowRight = (p) => (
  <svg {...props(p)}>
    <path d="M3 10h14M12 5l5 5-5 5"/>
  </svg>
)

export const IconCoin = (p) => (
  <svg {...props(p)}>
    <circle cx="10" cy="10" r="8"/>
    <path d="M10 6v8M7.5 8c0-1.1.9-2 2.5-2s2.5.9 2.5 2-.9 2-2.5 2-2.5.9-2.5 2 .9 2 2.5 2 2.5-.9 2.5-2"/>
  </svg>
)

export const IconCalendar = (p) => (
  <svg {...props(p)}>
    <rect x="2" y="4" width="16" height="14" rx="2"/>
    <path d="M2 9h16M7 2v4M13 2v4"/>
  </svg>
)

export const IconClock = (p) => (
  <svg {...props(p)}>
    <circle cx="10" cy="10" r="8"/>
    <path d="M10 6v4l3 3"/>
  </svg>
)

export const IconEdit = (p) => (
  <svg {...props(p)}>
    <path d="M14.5 3.5a2.121 2.121 0 013 3L6 18H3v-3L14.5 3.5z"/>
  </svg>
)

export const IconTrash = (p) => (
  <svg {...props(p)}>
    <path d="M3 6h14M8 6V4h4v2M6 6l1 11a1 1 0 001 1h4a1 1 0 001-1l1-11"/>
  </svg>
)

export const IconFilter = (p) => (
  <svg {...props(p)}>
    <path d="M2 5h16M5 10h10M8 15h4"/>
  </svg>
)

export const IconSearch = (p) => (
  <svg {...props(p)}>
    <circle cx="9" cy="9" r="6"/>
    <path d="M14 14l3.5 3.5"/>
  </svg>
)

export const IconZap = (p) => (
  <svg {...props(p)}>
    <path d="M11 2L3 12h7l-1 6 8-10H10l1-6z"/>
  </svg>
)

export const IconBook = (p) => (
  <svg {...props(p)}>
    <path d="M4 2h10a2 2 0 012 2v14l-6-3-6 3V4a2 2 0 012-2z"/>
  </svg>
)

export const IconGlobe = (p) => (
  <svg {...props(p)}>
    <circle cx="10" cy="10" r="8"/>
    <path d="M10 2c-3 4-3 12 0 16M10 2c3 4 3 12 0 16M2 10h16"/>
  </svg>
)

export const IconPeople = (p) => (
  <svg {...props(p)}>
    <circle cx="7" cy="7" r="3"/>
    <path d="M1 17c0-3.3 2.7-6 6-6s6 2.7 6 6"/>
    <path d="M14 7c0-1.7 1.3-3 3-3" strokeWidth={1.4}/>
    <path d="M17 14c1.1.6 2 1.7 2 3" strokeWidth={1.4}/>
  </svg>
)

export const IconInbox = (p) => (
  <svg {...props(p)}>
    <path d="M2 13l2.5-8A1 1 0 015.5 4h9a1 1 0 01.97.74L18 13"/>
    <path d="M2 13h4l1.5 3h5l1.5-3H18v3a2 2 0 01-2 2H4a2 2 0 01-2-2v-3z"/>
  </svg>
)

export const IconSend = (p) => (
  <svg {...props(p)}>
    <path d="M3 10L17 3l-7 14-2-5-5-2z"/>
  </svg>
)
