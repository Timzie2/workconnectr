import { Navigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { useEffect, useState } from "react"
import supabase from "../supabaseClient"

function ProtectedRoute({ children, role }) {

  const { user, loading } = useAuth()
  const [userRole, setUserRole] = useState(null)
  const [roleLoading, setRoleLoading] = useState(true)

  useEffect(() => {

    const getRole = async () => {

      if (!user) {
        setRoleLoading(false)
        return
      }

      const { data } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single()

      setUserRole(data?.role || null)
      setRoleLoading(false)
    }

    getRole()

  }, [user])

  if (loading || roleLoading) return <div>Loading...</div>

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (role && userRole !== role) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default ProtectedRoute