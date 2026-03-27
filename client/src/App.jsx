import { Routes, Route, Navigate } from "react-router-dom"
import { useState, useEffect } from "react"
import supabase from "./supabaseClient"

import PostJob from "./pages/PostJob"
import ContractorProfile from "./pages/ContractorProfile"
import Login from "./pages/Login"
import Register from "./pages/Register"
import Jobs from "./pages/JobsPage"
import WorkerApplications from "./pages/WorkerApplications"
import ContractorApplications from "./pages/ContractorApplications"
import WorkerProfile from "./pages/WorkerProfile"
import WorkerDashboard from "./pages/WorkerDashboard"
import ContractorDashboard from "./pages/ContractorDashboard"
import Chat from "./pages/Chat"
import Messages from "./pages/Messages"
import WorkerMessages from "./pages/WorkerMessages"
import ContractorMessages from "./pages/ContractorMessages"
import SavedJobs from "./pages/SavedJobs"
import ProfileSetup from "./pages/ProfileSetup"
import JobDetails from "./pages/JobDetails"

import "./theme.css"

function App(){

  const [darkMode, setDarkMode] = useState(true)

  // ✅ NEW AUTH STATE (SUPABASE ONLY)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  /* THEME MODE */
  useEffect(() => {
    if(darkMode){
      document.body.classList.remove("light-mode")
    }else{
      document.body.classList.add("light-mode")
    }
  }, [darkMode])

  /* ✅ GET SESSION + LISTEN TO AUTH CHANGES */
  useEffect(() => {

    const getSession = async () => {
      const { data } = await supabase.auth.getSession()
      setUser(data.session?.user || null)
      setLoading(false)
    }

    getSession()

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null)
      }
    )

    return () => {
      listener.subscription.unsubscribe()
    }

  }, [])

  /* ✅ UPDATE USER OFFLINE (USING SUPABASE USER) */
  useEffect(() => {

    if (!user) return

    const updateOffline = async () => {
      await supabase
      .from("users")
      .update({
        is_online:false,
        last_seen:new Date()
      })
      .eq("id", user.id)
    }

    window.addEventListener("beforeunload", updateOffline)

    return () => {
      window.removeEventListener("beforeunload", updateOffline)
    }

  }, [user])

  // ✅ PREVENT EARLY RENDER (IMPORTANT)
  if (loading) {
    return <div>Loading...</div>
  }

  return(

  <Routes>

    {/* AUTH */}
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />

    {/* GENERAL */}
    <Route path="/jobs" element={<Jobs />} />
    <Route path="/post-job" element={<PostJob />} />

    {/* OLD ROUTES */}
    <Route path="/applications" element={<WorkerApplications />} />
    <Route path="/contractor-applications" element={<ContractorApplications />} />
    <Route
  path="/worker-profile"
  element={
    user ? (
      <WorkerProfile />
    ) : (
      <Navigate to="/login" replace />
    )
  }
/>
    <Route path="/messages" element={<Messages darkMode={darkMode} setDarkMode={setDarkMode}/>} />
    <Route path="/worker-messages" element={<WorkerMessages darkMode={darkMode} setDarkMode={setDarkMode}/>} />

    {/* ✅ PROTECTED DASHBOARDS (REAL FIX) */}
    <Route
      path="/worker-dashboard"
      element={
        user ? (
          <WorkerDashboard darkMode={darkMode} setDarkMode={setDarkMode} />
        ) : (
          <Navigate to="/login" replace />
        )
      }
    />

    <Route
      path="/contractor-dashboard"
      element={
        user ? (
          <ContractorDashboard darkMode={darkMode} setDarkMode={setDarkMode} />
        ) : (
          <Navigate to="/login" replace />
        )
      }
    />

    {/* PROFILES */}
    <Route path="/contractor-profile" element={<ContractorProfile />} />

    {/* CHAT */}
    <Route
      path="/chat/:workerId"
      element={<Chat darkMode={darkMode} setDarkMode={setDarkMode} />}
    />

    <Route
      path="/worker/chat/:id"
      element={<Chat darkMode={darkMode} setDarkMode={setDarkMode} />}
    />

    <Route
      path="/contractor/chat/:id"
      element={<Chat darkMode={darkMode} setDarkMode={setDarkMode} />}
    />

    {/* MESSAGES */}
    <Route
      path="/contractor/messages"
      element={<ContractorMessages darkMode={darkMode} setDarkMode={setDarkMode} />}
    />

    <Route
      path="/contractor-messages"
      element={<ContractorMessages darkMode={darkMode} setDarkMode={setDarkMode} />}
    />

    {/* SAVED JOBS */}
    <Route path="/saved-jobs" element={<SavedJobs />} />

    {/* DEFAULT */}
    <Route path="*" element={<Jobs />} />

    <Route path="/profile-setup" element={<ProfileSetup />} />

    <Route path="/job/:id" element={<JobDetails />} />

  </Routes>

  )

}

export default App