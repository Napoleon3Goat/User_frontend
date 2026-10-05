import { Link, NavLink, Outlet } from 'react-router-dom'

// Header and footer shared by every guest page. <Outlet /> is the current page.
export default function Layout() {
  return (
    <div className="site">
      <header className="site-header">
        <Link to="/" className="logo">
          Goatcliff
        </Link>
        <nav>
          <NavLink to="/" end>Book</NavLink>
          <NavLink to="/status">My booking</NavLink>
        </nav>
      </header>

      <main className="site-main">
        <Outlet />
      </main>

      <footer className="site-footer">
        <p>Goatcliff Adventure and Camping · La Trinidad, Benguet</p>
        <p className="muted">Questions? Message us on our Facebook Page.</p>
      </footer>
    </div>
  )
}
