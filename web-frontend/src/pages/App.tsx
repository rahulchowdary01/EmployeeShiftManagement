/**
 * Main App component with navigation and layout.
 * 
 * This component provides the main layout structure for the Employee Shift Management System,
 * including the navigation header and main content area. It uses React Router for navigation
 * between different pages (Employees, Shifts, Assignments, AI Assistant).
 */

import { Link, Outlet, useLocation } from 'react-router-dom'
import '../styles/theme.css'

export default function App() {
  // Get current pathname to highlight active navigation link
  const { pathname } = useLocation()
  
  return (
    <div>
      {/* Navigation Header */}
      <header className="navbar">
        <div className="navbar-inner container">
          {/* Brand/Logo Section */}
          <div className="brand">
            <span className="brand-badge" />
            <span>Royal Workforce</span>
          </div>
          
          {/* Navigation Links */}
          <nav className="nav-links">
            <Link className={`nav-link ${pathname === '/' ? 'active' : ''}`} to="/">Employees</Link>
            <Link className={`nav-link ${pathname.startsWith('/shifts') ? 'active' : ''}`} to="/shifts">Shifts</Link>
            <Link className={`nav-link ${pathname.startsWith('/assignments') ? 'active' : ''}`} to="/assignments">Assignments</Link>
            <Link className={`nav-link ${pathname.startsWith('/ai') ? 'active' : ''}`} to="/ai">AI Assistant</Link>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="container" style={{ marginTop: 20 }}>
        <div className="kicker">Shift operations</div>
        <h1 className="panel-title"><span className="title-accent">Dashboard</span> · Employee Shift Management</h1>
        {/* Router outlet renders the current page component */}
        <Outlet />
      </main>
    </div>
  )
}

