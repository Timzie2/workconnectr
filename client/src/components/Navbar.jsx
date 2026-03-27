import { NavLink, useNavigate } from "react-router-dom"
import "./Navbar.css"

function Navbar() {

  const navigate = useNavigate()

  const user = JSON.parse(localStorage.getItem("user"))

  const dashboardLink =
    user?.role === "contractor"
      ? "/contractor-dashboard"
      : "/worker-dashboard"

  function handleLogout() {
    localStorage.removeItem("user")
    navigate("/login")
  }

  return (

    <div className="navbar">

      <div className="logo">
        WorkConnectr
      </div>

      <div className="nav-links">

        <NavLink
          to={dashboardLink}
          className={({ isActive }) =>
            isActive ? "nav-link active" : "nav-link"
          }
        >
          Dashboard
        </NavLink>

        <NavLink
          to="/jobs"
          className={({ isActive }) =>
            isActive ? "nav-link active" : "nav-link"
          }
        >
          Jobs
        </NavLink>

        <NavLink
          to="/applications"
          className={({ isActive }) =>
            isActive ? "nav-link active" : "nav-link"
          }
        >
          Applications
        </NavLink>

        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>

      </div>

    </div>

  )
  
}

export default Navbar