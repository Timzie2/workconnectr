import { Navigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

function ProtectedRoute({ children, role: requiredRole }) {

  const { user, role, loading } = useAuth()

  console.log("ProtectedRoute:", { user, role, loading }) // ✅ ADD HERE
  console.log("Required:", requiredRole)
console.log("Actual:", role)

  // ⏳ wait until auth fully loads
if (loading || user === undefined) {
  return <div>Loading...</div>
}

// 🔒 not logged in
if (!user) {
  return <Navigate to="/login" replace />
}

// 🔥 WAIT for role to load before checking
if (requiredRole) {
  if (role === null) {
    return <div>Loading...</div> // ⬅️ FIX: DON'T REDIRECT HERE
  }

  if (role !== requiredRole) {
  return <Navigate to={`/${role}-dashboard`} replace />
}
}

return children
}

export default ProtectedRoute