import { NavLink } from 'react-router-dom'

/* Page-based nav: each item is a route, laid out as four cells on the
   12-column grid (span 3 each). Links are direct grid children so nothing
   collapses. */
const links = [
  { to: '/', label: 'About', num: '01', end: true },
  { to: '/publications', label: 'Publications', num: '02', end: false },
  { to: '/cv', label: 'CV', num: '03', end: false },
  { to: '/photography', label: 'Photography', num: '04', end: false },
]

export default function Nav() {
  return (
    <nav className="navbar" aria-label="Primary">
      {links.map((l) => (
        <NavLink key={l.to} to={l.to} end={l.end} className="pub reveal" data-d="1">
          <span className="num">{l.num}</span>
          {l.label}
        </NavLink>
      ))}
    </nav>
  )
}
