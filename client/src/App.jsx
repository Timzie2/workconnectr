import { Routes, Route, Navigate } from "react-router-dom"
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
import PaymentHistory from "./pages/PaymentHistory"
import EditJob from "./pages/EditJob"
import ContractorApplicationsAll from "./pages/ContractorApplicationsAll"
import "./theme.css"
import "./styles/layout.css"
import "./styles/components.css"
import "./styles/dashboard.css"
import ForgotPassword from "./pages/ForgotPassword"
import ResetPassword from "./pages/ResetPassword"



function App(){


  return(

    <Routes>

      {/* AUTH (PUBLIC) */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* PUBLIC */}
      <Route path="/job/:id" element={<JobDetails />} />

      {/* WORKER ROUTES */}
      <Route
        path="/worker-dashboard"
        element={
          <ProtectedRoute role="worker">
            <WorkerDashboard />
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
            <WorkerMessages />
          </ProtectedRoute>
        }
      />

      {/* CONTRACTOR ROUTES */}
      <Route
        path="/contractor-dashboard"
        element={
          <ProtectedRoute role="contractor">
            <ContractorDashboard />
          </ProtectedRoute>
        }
      />

      <Route
  path="/contractor-applications"
  element={
    <ProtectedRoute role="contractor">
      <ContractorApplicationsAll />
    </ProtectedRoute>
  }
/>

<Route
  path="/contractor-applications/:jobId"
  element={
    <ProtectedRoute role="contractor">
      <ContractorApplications />
    </ProtectedRoute>
  }
/>

      <Route
  path="/jobs"
  element={
    <ProtectedRoute role="worker">
      <Jobs />
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
            <ContractorMessages />
          </ProtectedRoute>
        }
      />

      {/* CHAT (BOTH USERS) */}
      <Route
        path="/chat/:workerId"
        element={
          <ProtectedRoute>
            <Chat />
          </ProtectedRoute>
        }
      />

      <Route
        path="/worker/chat/:id"
        element={
          <ProtectedRoute>
            <Chat />
          </ProtectedRoute>
        }
      />

      <Route
        path="/contractor/chat/:id"
        element={
          <ProtectedRoute>
            <Chat />
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
<Route path="/" element={<Navigate to="/login" />} />

<Route path="/payments" element={<PaymentHistory />} />
<Route path="/contractor/edit-job/:id" element={<EditJob />} />

<Route path="/forgot-password" element={<ForgotPassword />} />
<Route path="/reset-password" element={<ResetPassword />} />


<Route path="/contractor/:id" element={<ContractorPublicProfile />} />

{/* ✅ ALWAYS LAST */}
<Route path="*" element={<Navigate to="/login" />} />

    </Routes>

  )
}

export default App