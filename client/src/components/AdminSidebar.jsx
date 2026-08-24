import { NavLink } from "react-router-dom"
import { useTheme } from "../context/ThemeContext"
import {
  FiHome,
  FiUsers,
  FiBriefcase,
  FiGrid,
  FiFolder,
  FiBarChart2,
  FiAlertTriangle,
  FiSettings,
  FiLogOut,
  FiMoon,
  FiSun
} from "react-icons/fi"

function AdminSidebar() {

  const { darkMode, toggleTheme } = useTheme()

  return (
    <aside className="admin-sidebar">

      <div className="admin-logo">
        <h2>WorkConnectr</h2>
        <span>Admin</span>
      </div>

      <nav>

        <NavLink to="/admin">
          <FiHome />
          Dashboard
        </NavLink>

        <NavLink to="/admin/users">
          <FiUsers />
          Users
        </NavLink>

        <NavLink to="/admin/jobs">
          <FiBriefcase />
          Jobs
        </NavLink>

        <NavLink to="/admin/categories">
          <FiGrid />
          Categories
        </NavLink>

        <NavLink to="/admin/category-requests">
          <FiFolder />
          Category Requests
        </NavLink>

        <NavLink to="/admin/analytics">
          <FiBarChart2 />
          Analytics
        </NavLink>

        <NavLink to="/admin/reports">
          <FiAlertTriangle />
          Reports
        </NavLink>

        <NavLink to="/admin/settings">
          <FiSettings />
          Settings
        </NavLink>

      </nav>

      <div className="admin-sidebar-bottom">

  <button
  className="admin-theme-toggle"
  onClick={toggleTheme}
>
  {darkMode ? <FiSun /> : <FiMoon />}
  {darkMode ? "Light Mode" : "Dark Mode"}
</button>

  <button className="admin-logout">
    <FiLogOut />
    Logout
  </button>

</div>

    </aside>
  )
}

export default AdminSidebar