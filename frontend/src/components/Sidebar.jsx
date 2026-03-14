import { NavLink, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Avatar from './Avatar'
import {
  IconDashboard, IconBrowse, IconMatch, IconSwap,
  IconStar, IconUser, IconLogout, IconBook, IconPeople,
} from './Icons'

const NAV = [
  { to: '/dashboard', label: 'Dashboard',  Icon: IconDashboard },
  { to: '/browse',    label: 'Browse',     Icon: IconBrowse    },
  { to: '/matches',   label: 'Matches',    Icon: IconMatch     },
  { to: '/swaps',     label: 'Swaps',      Icon: IconSwap      },
  { to: '/favorites', label: 'Favorites',  Icon: IconStar      },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside className="app-sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-mark">S</div>
        <span className="sidebar-logo-text">StudySwap</span>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Navigation</div>
        {NAV.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="nav-item-icon">
              <Icon />
            </span>
            {label}
          </NavLink>
        ))}

        <div className="sidebar-section-label">Account</div>
        <NavLink
          to="/profile/me"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <span className="nav-item-icon"><IconUser /></span>
          Profile
        </NavLink>

        {user?.role === 'admin' && (
          <>
            <div className="sidebar-section-label">Admin</div>
            <NavLink
              to="/admin/users"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="nav-item-icon"><IconPeople /></span>
              Users
            </NavLink>
            <NavLink
              to="/admin/categories"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="nav-item-icon"><IconBook /></span>
              Categories
            </NavLink>
            <NavLink
              to="/admin/swaps"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="nav-item-icon"><IconSwap /></span>
              Swaps
            </NavLink>
            <NavLink
              to="/admin/ratings"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="nav-item-icon"><IconStar /></span>
              Ratings
            </NavLink>
          </>
        )}
      </nav>

      {/* Footer: user + logout */}
      <div className="sidebar-footer">
        {user && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Link to="/profile/me" className="sidebar-user">
              <Avatar src={user.avatar_url} name={user.display_name} size="sm" />
              <div className="sidebar-user-info">
                <div className="sidebar-user-name">{user.display_name}</div>
                <div className="sidebar-user-role">
                  {user.credits} credit{user.credits !== 1 ? 's' : ''} · ★ {user.avg_rating > 0 ? user.avg_rating.toFixed(1) : '—'}
                </div>
              </div>
            </Link>
            <button
              onClick={handleLogout}
              className="nav-item"
              style={{ color: 'rgba(224,90,78,0.75)', marginTop: 2 }}
            >
              <span className="nav-item-icon"><IconLogout /></span>
              Sign out
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
