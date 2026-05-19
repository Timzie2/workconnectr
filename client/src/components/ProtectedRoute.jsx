import { Navigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

function ProtectedRoute({ children, role: requiredRole }) {

  const {
    user,
    role,
    loading,
    profileCompleted
  } = useAuth()

  console.log("ProtectedRoute:", {
    user,
    role,
    loading,
    profileCompleted
  })

  // ✅ WAIT FOR EVERYTHING
  if (
    loading ||
    profileCompleted === null
  ) {
    return <div>Loading...</div>
  }

  // ✅ NOT LOGGED IN
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // ✅ PROFILE SETUP
  if (profileCompleted === false) {

    // 🛑 prevent infinite redirect loop
    if (
      window.location.pathname !== "/profile-setup"
    ) {
      return (
        <Navigate
          to="/profile-setup"
          replace
        />
      )
    }
  }

  // ✅ ROLE PROTECTION
  if (
    requiredRole &&
    role !== requiredRole
  ) {
    return (
      <Navigate
        to={`/${role}-dashboard`}
        replace
      />
    )
  }

  return children
}

export default ProtectedRoute