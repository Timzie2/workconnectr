import toast from "react-hot-toast"
import { Link, useNavigate } from "react-router-dom"
import { useState, useEffect, useRef } from "react"
import supabase from "../supabaseClient"

import {
  Home,
  Briefcase,
  Users,
  Bell,
  User,
  Settings,
  LogOut,
  Sun,
  Moon,
  Monitor,
  MessageSquare
} from "lucide-react"

import "./Navbar.css"

function ContractorNavbar({ darkMode, setDarkMode }) {

  const navigate = useNavigate()

  const [menuOpen, setMenuOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [themeMenu, setThemeMenu] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [userId, setUserId] = useState(null)

  const notifRef = useRef(null)
  const profileRef = useRef(null)

  // ✅ GET USER
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        window.location.replace("/login")
        return
      }

      setUserId(user.id)
    }

    getUser()
  }, [])

  // ✅ CLOSE DROPDOWNS
  useEffect(() => {

    const handleClickOutside = (event) => {

      if (profileRef.current?.contains(event.target)) return
      if (notifRef.current?.contains(event.target)) return

      setMenuOpen(false)
      setNotifOpen(false)
    }

    document.addEventListener("click", handleClickOutside)

    return () => {
      document.removeEventListener("click", handleClickOutside)
    }

  }, [])

  // ✅ FETCH NOTIFICATIONS
  useEffect(() => {

    if (!userId) return

    const fetchNotifications = async () => {

      const { data, error } = await supabase
        .from("applications")
        .select(`
          id,
          job_id,
          is_read,
          created_at,
          users:worker_id(full_name),
          jobs:job_id(title, contractor_id)
        `)
        .order("created_at", { ascending: false })

      if (error) return console.log(error)

      const filtered = data.filter(
        item => item.jobs?.contractor_id === userId
      )

      setNotifications(filtered)
    }

    fetchNotifications()

    const channel = supabase
      .channel("applications-channel")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "applications"
        },
        () => {
          fetchNotifications()
          toast.success("🔔 New application received")
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }

  }, [userId])

  // ✅ OPEN NOTIFICATIONS
  const openNotifications = async () => {

    setNotifOpen(prev => !prev)

    if (!notifOpen) {
      await supabase
        .from("applications")
        .update({ is_read: true })
        .eq("is_read", false)

      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true }))
      )
    }
  }

  // ✅ DELETE NOTIFICATION
  const deleteNotification = async (id) => {

    await supabase
      .from("applications")
      .delete()
      .eq("id", id)

    setNotifications(prev =>
      prev.filter(n => n.id !== id)
    )
  }

  // ✅ THEME SWITCH
  const toggleTheme = (mode) => {

    if (mode === "light") setDarkMode(false)
    if (mode === "dark") setDarkMode(true)

    if (mode === "auto") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
      setDarkMode(prefersDark)
    }
  }

  // ✅ LOGOUT
  const handleLogout = async () => {

    try {
      const { error } = await supabase.auth.signOut()

      if (error) {
        toast.error("Logout failed")
        return
      }

      localStorage.clear()
      sessionStorage.clear()

      toast.success("Logged out 👋")
      window.location.href = "/login"

    } catch (err) {
      console.error(err)
    }
  }

  return (

    <nav className="navbar">

      {/* LEFT */}
      <div className="navbar-left">

        <h2 className="logo">WorkConnectr</h2>

        <Link to="/contractor-dashboard" className="nav-link">
          <Home size={18}/> Dashboard
        </Link>

        <Link to="/post-job" className="nav-link">
          <Briefcase size={18}/> Post Job
        </Link>

        <Link to="/contractor-applications" className="nav-link">
          <Users size={18}/> Applicants
        </Link>

      </div>

      {/* RIGHT */}
      <div className="navbar-right">

        {/* 🌗 QUICK THEME TOGGLE (NEW 🔥) */}
        <div
          className="icon-btn"
          onClick={() => setDarkMode(prev => !prev)}
          title="Toggle Theme"
        >
          {darkMode ? <Sun size={18}/> : <Moon size={18}/>}
        </div>

        {/* 💬 MESSAGES */}
        <div
          className="icon-btn"
          onClick={() => navigate("/messages")}
        >
          <MessageSquare size={20}/>
        </div>

        {/* 🔔 NOTIFICATIONS */}
        <div className="notification" ref={notifRef}>

          <Bell size={20} onClick={openNotifications}/>

          {notifications.filter(n => !n.is_read).length > 0 && (
            <span className="notification-count">
              {notifications.filter(n => !n.is_read).length}
            </span>
          )}

          {notifOpen && (
            <div className="notification-panel">

              <h4 className="notif-header">Notifications</h4>

              {notifications.length === 0 ? (
                <div className="notif-empty">No notifications</div>
              ) : (
                notifications.map((notif) => (

                  <div
                    key={notif.id}
                    className="notif-card"
                    onClick={() => navigate("/contractor-applications")}
                  >

                    <div className="notif-icon">🔔</div>

                    <div className="notif-content">
                      <p>
                        <strong>{notif.users?.full_name}</strong> applied for{" "}
                        <strong>{notif.jobs?.title}</strong>
                      </p>

                      <small>
                        {new Date(notif.created_at).toLocaleString()}
                      </small>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteNotification(notif.id)
                      }}
                    >
                      ✖
                    </button>

                  </div>

                ))
              )}

            </div>
          )}

        </div>

        {/* 👤 PROFILE */}
        <div
          className="profile-icon"
          ref={profileRef}
          onClick={() => setMenuOpen(prev => !prev)}
        >
          <User size={18}/>
        </div>

        {menuOpen && (
          <div className="profile-dropdown">

            <p className="dropdown-title">Your Account</p>

            {/* 🎨 THEME MENU */}
            <div onClick={() => setThemeMenu(prev => !prev)}>
              <Monitor size={16}/> Theme
            </div>

            {themeMenu && (
              <>
                <div onClick={() => toggleTheme("auto")}>Auto</div>
                <div onClick={() => toggleTheme("light")}>
                  <Sun size={14}/> Light
                </div>
                <div onClick={() => toggleTheme("dark")}>
                  <Moon size={14}/> Dark
                </div>
              </>
            )}

            <Link to="/contractor-profile">
              <User size={16}/> Profile
            </Link>

            <Link to="/settings">
              <Settings size={16}/> Settings
            </Link>

            <button
              className="logout"
              onClick={(e) => {
                e.stopPropagation()
                handleLogout()
              }}
            >
              <LogOut size={16}/> Logout
            </button>

          </div>
        )}

      </div>

    </nav>
  )
}

export default ContractorNavbar