import { Routes, Route } from "react-router-dom"
import { useState, useEffect } from "react"

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
import WorkerMessages from "./pages/WorkerMessages"
import ContractorMessages from "./pages/ContractorMessages"
import SavedJobs from "./pages/SavedJobs"
import ProfileSetup from "./pages/ProfileSetup"
import JobDetails from "./pages/JobDetails"
import ProtectedRoute from "./components/ProtectedRoute"
import ContractorPublicProfile from "./pages/ContractorPublicProfile"

import "./theme.css"

function App(){

  const [darkMode, setDarkMode] = useState(true)

  /* ✅ LOAD THEME (LOCAL STORAGE OR SYSTEM) */
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme")

    if (savedTheme === "light") {
      setDarkMode(false)
    } else if (savedTheme === "dark") {
      setDarkMode(true)
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
      setDarkMode(prefersDark)
    }
  }, [])

  /* ✅ APPLY + SAVE THEME */
  useEffect(() => {
    if (darkMode) {
      document.body.classList.remove("light-mode")
      localStorage.setItem("theme", "dark")
    } else {
      document.body.classList.add("light-mode")
      localStorage.setItem("theme", "light")
    }
  }, [darkMode])

  return(

    <Routes>

      {/* AUTH (PUBLIC) */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* PUBLIC */}
      <Route path="/jobs" element={<Jobs />} />
      <Route path="/job/:id" element={<JobDetails />} />

      {/* WORKER ROUTES */}
      <Route
        path="/worker-dashboard"
        element={
          <ProtectedRoute role="worker">
            <WorkerDashboard darkMode={darkMode} setDarkMode={setDarkMode}/>
          </ProtectedRoute>
        }
      />

      <Route
        path="/applications"
        element={
          <ProtectedRoute role="worker">
            <WorkerApplications />
          </ProtectedRoute>
        }
      />

      <Route
        path="/saved-jobs"
        element={
          <ProtectedRoute role="worker">
            <SavedJobs />
          </ProtectedRoute>
        }
      />

      <Route
        path="/worker-profile"
        element={
          <ProtectedRoute role="worker">
            <WorkerProfile />
          </ProtectedRoute>
        }
      />

      <Route
        path="/worker-messages"
        element={
          <ProtectedRoute role="worker">
            <WorkerMessages darkMode={darkMode} setDarkMode={setDarkMode}/>
          </ProtectedRoute>
        }
      />

      {/* CONTRACTOR ROUTES */}
      <Route
        path="/contractor-dashboard"
        element={
          <ProtectedRoute role="contractor">
            <ContractorDashboard darkMode={darkMode} setDarkMode={setDarkMode}/>
          </ProtectedRoute>
        }
      />

      <Route
        path="/contractor-applications"
        element={
          <ProtectedRoute role="contractor">
            <ContractorApplications />
          </ProtectedRoute>
        }
      />

      <Route
        path="/post-job"
        element={
          <ProtectedRoute role="contractor">
            <PostJob />
          </ProtectedRoute>
        }
      />

      <Route
        path="/contractor-profile"
        element={
          <ProtectedRoute role="contractor">
            <ContractorProfile />
          </ProtectedRoute>
        }
      />

      <Route
        path="/contractor-messages"
        element={
          <ProtectedRoute role="contractor">
            <ContractorMessages darkMode={darkMode} setDarkMode={setDarkMode}/>
          </ProtectedRoute>
        }
      />

      {/* CHAT (BOTH USERS) */}
      <Route
        path="/chat/:workerId"
        element={
          <ProtectedRoute>
            <Chat darkMode={darkMode} setDarkMode={setDarkMode}/>
          </ProtectedRoute>
        }
      />

      <Route
        path="/worker/chat/:id"
        element={
          <ProtectedRoute>
            <Chat darkMode={darkMode} setDarkMode={setDarkMode}/>
          </ProtectedRoute>
        }
      />

      <Route
        path="/contractor/chat/:id"
        element={
          <ProtectedRoute>
            <Chat darkMode={darkMode} setDarkMode={setDarkMode}/>
          </ProtectedRoute>
        }
      />

      {/* PROFILE SETUP */}
      <Route
        path="/profile-setup"
        element={
          <ProtectedRoute>
            <ProfileSetup />
          </ProtectedRoute>
        }
      />

      {/* DEFAULT */}
      <Route path="*" element={<Jobs />} />

      <Route
  path="/contractor/:id"
  element={<ContractorPublicProfile />}
/>

    </Routes>

  )
}

export default App