import { Link, useNavigate } from "react-router-dom"
import { useState, useEffect, useRef } from "react"
import supabase from "../supabaseClient"
import { useAuth } from "../context/AuthContext" // ✅ USE GLOBAL AUTH
import { useTheme } from "../context/ThemeContext"

import {
  Home,
  Briefcase,
  FileText,
  User,
  LogOut,
  MessageSquare,
  Star,
  Bell,
  Sun,
  Moon,
  Search,
  Settings
} from "lucide-react"

import "../styles/WorkerNavbar.css"

function WorkerNavbar(){

const navbarRef = useRef(null)
const [searchOpen, setSearchOpen] = useState(false)
const [searchQuery, setSearchQuery] = useState("")
const [searchResults, setSearchResults] = useState([])
const [categories, setCategories] = useState([])
const [selectedCategory, setSelectedCategory] = useState("")
const [closing, setClosing] = useState(false)
const searchRef = useRef(null)
const [activeIndex, setActiveIndex] = useState(-1)
const [filterOpen, setFilterOpen] = useState(false)
const navigate = useNavigate()
const { user } = useAuth()

const [menuOpen, setMenuOpen] = useState(false)
const [notifOpen, setNotifOpen] = useState(false)
const [notifications, setNotifications] = useState([])
const [profileData, setProfileData] = useState(null)

const profileRef = useRef(null)
const notifRef = useRef(null)
const { darkMode, setDarkMode } = useTheme()

  async function handleSearch(query, category = selectedCategory) {
  setSearchQuery(query)
  setActiveIndex(-1)

  if (!query.trim()) {
    setSearchResults([])
    return
  }

  let queryBuilder = supabase
    .from("jobs")
    .select(`
  id,
  title,
  description,
  salary,
  pay_type,
  users:contractor_id (
    company_name,
    full_name,
    avatar_url
  )
`)
    .ilike("title", `%${query}%`)
    .limit(5)

  if (category) {
    queryBuilder = queryBuilder.eq("category", category)
  }

  const { data, error } = await queryBuilder

  if (!error) {
    setSearchResults(data || [])
  }
}

function handleKeyDown(e) {
  if (!searchResults.length) return

  if (e.key === "ArrowDown") {
    e.preventDefault()
    setActiveIndex(prev =>
      prev < searchResults.length - 1 ? prev + 1 : 0
    )
  }

  if (e.key === "ArrowUp") {
    e.preventDefault()
    setActiveIndex(prev =>
      prev > 0 ? prev - 1 : searchResults.length - 1
    )
  }

  if (e.key === "Enter" && activeIndex >= 0) {
    navigate(`/job/${searchResults[activeIndex].id}`)
    setSearchOpen(false)
  }
}

useEffect(() => {
  fetchCategories()
}, [])

async function fetchCategories() {
  const { data } = await supabase
    .from("jobs")
    .select("category")

  if (data) {
    let unique = [...new Set(data.map(j => j.category).filter(Boolean))]

// 🔥 Move "Other" to the end
unique = unique
  .filter(cat => cat !== "Other")
  .concat(unique.includes("Other") ? ["Other"] : [])

setCategories(unique)
  }
}

  /* ✅ CLOSE DROPDOWNS */
  useEffect(() => {

  const handleClickOutside = (event) => {

    // ✅ Ignore clicks inside navbar
    if (navbarRef.current?.contains(event.target)) return

    // ✅ Close other dropdowns
    setMenuOpen(false)
    setNotifOpen(false)

    // ✅ Only close search if it's open
    if (searchOpen) {
      setClosing(true)

      setTimeout(() => {
        setSearchOpen(false)
        setClosing(false)
      }, 200)
    }
  }

  document.addEventListener("click", handleClickOutside)

  return () => {
    document.removeEventListener("click", handleClickOutside)
  }

}, [searchOpen]) // ✅ IMPORTANT // ✅ THIS FIXES EVERYTHING

  /* ✅ FETCH + REALTIME NOTIFICATIONS */
  useEffect(() => {

    if (!user) return

    fetchNotifications()

    const channel = supabase
      .channel("notifications-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications"
        },
        async (payload) => {

  const newNotif = payload.new

  const { data: fullNotif, error } = await supabase
  .from("notifications")
  .select(`
    *,
    sender:sender_id (
      full_name,
      avatar_url
    )
  `)
    .eq("id", newNotif.id)
    .single()

  if (fullNotif?.user_id === user.id) {

    setNotifications(prev => {

      const exists = prev.some(
        n => n.id === fullNotif.id
      )

      if (exists) return prev

      return [fullNotif, ...prev]
    })

    new Audio("/notification.mp3").play()
  }
}
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }

  }, [user])

  useEffect(() => {

  if(user){
    fetchProfile()
  }

}, [user])

async function fetchProfile(){

  const { data } = await supabase
    .from("users")
   .select("*")
    .eq("id", user.id)
    .single()

  if(data){
    setProfileData(data)
  }
}

  /* ✅ FETCH */
  const fetchNotifications = async () => {

    if (!user) return

    const { data, error } = await supabase
  .from("notifications")
  .select(`
    *,
    sender:sender_id (
      full_name,
      avatar_url
    )
  `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (!error) {
      setNotifications(data || [])
    }
  }

  /* 🔔 UNREAD COUNT */
  const unreadCount = notifications.reduce(
    (count, n) => count + (!n.is_read ? 1 : 0),
    0
  )

  /* ✅ OPEN NOTIFICATIONS */
  const openNotifications = async () => {

    const willOpen = !notifOpen
    setNotifOpen(willOpen)

    const openNotifications = () => {
  setNotifOpen(prev => !prev)
}
  }

  /* ✅ LOGOUT */
  const logout = async () => {

    try {
      await supabase.auth.signOut()

      navigate("/login", { replace: true })

    } catch (err) {
      console.error(err)
    }
  }

  const getTimeAgo = (date) => {

  const seconds = Math.floor(
    (new Date() - new Date(date)) / 1000
  )

  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60) return "Just now"
  if (minutes < 60) return `${minutes} min ago`
  if (hours < 24) return `${hours}h ago`

  return `${days}d ago`
}

  return(

  <nav ref={navbarRef} className="worker-navbar">

      <div className="worker-navbar-left">

        <h2 className="worker-logo">WorkConnectr</h2>

        <Link to="/worker-dashboard" className="worker-nav-link">
          <Home size={18}/> Dashboard
        </Link>

        <Link to="/jobs" className="worker-nav-link">
          <Briefcase size={18}/> Jobs
        </Link>

        <Link to="/applications" className="worker-nav-link">
          <FileText size={18}/> Applications
        </Link>

        <Link to="/saved-jobs" className="worker-nav-link">
          <Star size={18}/> Saved
        </Link>

      </div>

      <div className="worker-navbar-right">

        <div
  className="worker-icon-btn"
  onClick={(e) => {
  e.stopPropagation() // ✅ VERY IMPORTANT

  if (searchOpen) {
    setClosing(true)
    setTimeout(() => {
      setSearchOpen(false)
      setClosing(false)
    }, 200)
  } else {
    setSearchOpen(true)
  }
}}
>
  <Search size={22} />
</div>

{(searchOpen || closing) && (
  <div
  ref={searchRef}
  className={`nav-search-dropdown ${closing ? "closing" : ""}`}
>

    {/* 🔍 SEARCH BAR */}
    <div className="search-bar">

  <Search size={18} />

  <input
    type="text"
    placeholder="Search jobs..."
    value={searchQuery}
    onChange={(e) => handleSearch(e.target.value)}
    onKeyDown={handleKeyDown}
    autoFocus
  />

  <div className="custom-filter">

    <div
      className="filter-selected"
      onClick={(e) => {
        e.stopPropagation()
        setFilterOpen(prev => !prev)
      }}
    >
      {selectedCategory || "All"}
      <span className={`arrow ${filterOpen ? "open" : ""}`}>▾</span>
    </div>

    {filterOpen && (
      <div className="filter-dropdown">

        <div
          className="filter-option"
          onClick={() => {
            setSelectedCategory("")
            handleSearch(searchQuery, "")
            setFilterOpen(false)
          }}
        >
          All
        </div>

        {categories.map((cat, i) => (
          <div
            key={i}
            className="filter-option"
            onClick={() => {
              setSelectedCategory(cat)
              handleSearch(searchQuery, cat)
              setFilterOpen(false)
            }}
          >
            {cat}
          </div>
        ))}

      </div>
    )}

  </div>

</div>

    {/* 📋 RESULTS */}
<div className="search-results">

  {searchQuery.trim() === "" ? null : searchResults.length === 0 ? (
    <p className="no-results">No jobs found</p>
  ) : (

    searchResults.map((job, index) => (
      <div
        key={job.id}
        className={`search-item ${index === activeIndex ? "active" : ""}`}
        onClick={() => {
          setSearchOpen(false)
          navigate(`/job/${job.id}`)
        }}
      >

        <div className="search-item-row">

          <img
            src={
              job.users?.avatar_url ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                job.users?.company_name || job.users?.full_name || "User"
              )}`
            }
            className="search-avatar"
          />

          <div className="search-info">
            <h4>{job.title}</h4>

            <p className="search-company">
              {job.users?.company_name || job.users?.full_name}
            </p>

            <p className="search-salary">
              ₦{job.salary?.toLocaleString() || "N/A"}{" "}
              {job.pay_type ? `/ ${job.pay_type}` : ""}
            </p>
          </div>

        </div>

      </div>
    ))

  )}

</div>

  </div>
)}

        <div
          className="worker-icon-btn"
          onClick={() => navigate("/messages")}
        >
          <MessageSquare size={20}/>
        </div>

        <div className="worker-notification" ref={notifRef}>
          <Bell size={20} onClick={openNotifications}/>

          {unreadCount > 0 && (
            <span className="worker-notification-count">
              {unreadCount}
            </span>
          )}

          {notifOpen && (
            <div className="worker-notification-panel">

  <div className="worker-notif-header">

    <h4>Notifications</h4>

    {notifications.some(n => !n.is_read) && (
      <button
        className="mark-read-btn"
        onClick={async (e) => {

          e.stopPropagation()

          await supabase
            .from("notifications")
            .update({ is_read: true })
            .eq("user_id", user.id)

          setNotifications(prev =>
            prev.map(n => ({
              ...n,
              is_read: true
            }))
          )
        }}
      >
        Mark all read
      </button>
    )}

  </div>

  {notifications.length === 0 ? (

    <div className="worker-empty-notif">

      <Bell size={38} />

      <p>No notifications yet</p>

    </div>

  ) : (

    notifications.map((notif) => (

      <div
        key={notif.id}
        className={`
          worker-notif-card
          ${!notif.is_read ? "unread" : ""}
        `}
      >

        <div className="worker-notif-avatar">

          {notif.sender?.avatar_url ? (
            <img
              src={notif.sender.avatar_url}
              className="notif-avatar-img"
              alt="user"
            />
          ) : (
            "🔔"
          )}

        </div>

        <div className="worker-notif-content">

          <p>{notif.message}</p>

          <span>
            {getTimeAgo(notif.created_at)}
          </span>

        </div>

      </div>

    ))

  )}

</div>
          )}

        </div>

        <div
  className="worker-profile-icon"
  ref={profileRef}
  onClick={() => setMenuOpen(prev => !prev)}
>

  <img
    src={
  profileData?.avatar_url ||
  `https://ui-avatars.com/api/?name=${encodeURIComponent(
    profileData?.full_name || "User"
  )}`
}
    alt="profile"
    className="worker-avatar"
  />

</div>

{menuOpen && (
  <div className="worker-profile-dropdown">

    {/* 🔥 TOP USER INFO */}
    <div className="dropdown-user-info">

      <img
        src={
  profileData?.avatar_url ||
  `https://ui-avatars.com/api/?name=${encodeURIComponent(
    profileData?.full_name || "User"
  )}`
}
        alt="profile"
        className="dropdown-avatar"
      />

      <div>
        <h4>
          {profileData?.full_name || "Worker"}
        </h4>

        <p>Worker</p>
      </div>

    </div>

    <div className="dropdown-divider"></div>

    {/* MENU */}
    <Link to="/worker-profile" className="worker-dropdown-item">
  <User size={18}/> Profile
</Link>

<button className="worker-dropdown-item">
  <Settings size={18}/> Account Settings
</button>

<button
  className="worker-dropdown-item"
  onClick={(e) => {
    e.stopPropagation()
    setDarkMode(prev => !prev)
  }}
>
  {darkMode ? <Sun size={18}/> : <Moon size={18}/>}
  {darkMode ? " Light Mode" : " Dark Mode"}
</button>

    <div className="dropdown-divider"></div>

    {/* LOGOUT */}
    <button
      className="worker-dropdown-item logout"
      onClick={(e) => {
        e.stopPropagation()
        logout()
      }}
    >
      <LogOut size={18}/> Logout
    </button>

  </div>
)}

      </div>

    </nav>
  )
}

export default WorkerNavbar