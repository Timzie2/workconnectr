import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import toast from "react-hot-toast"

import supabase from "../supabaseClient"
import { useAuth } from "../context/AuthContext"

import AppNavbar from "../components/AppNavbar"

import "../styles/AccountSettings.css"

function AccountSettings() {

  const navigate = useNavigate()

  const { user, role, loading: authLoading } = useAuth()

  const [loading, setLoading] = useState(false)

  const [fullName, setFullName] = useState("")
  const [location, setLocation] = useState("")
  const [skills, setSkills] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [aboutCompany, setAboutCompany] = useState("")

  const [email, setEmail] = useState("")

  // ========================================
  // REDIRECT IF NOT LOGGED IN
  // ========================================

  useEffect(() => {

    if (!authLoading && !user) {
      navigate("/login")
    }

  }, [user, authLoading])

  // ========================================
  // FETCH USER DATA
  // ========================================

  useEffect(() => {

    if (!user) return

    fetchProfile()

  }, [user])

  async function fetchProfile() {

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single()

    if (error) {
      toast.error("Failed to load profile")
      return
    }

    setEmail(data.email || "")
    setLocation(data.location || "")

    if (role === "worker") {

      setFullName(data.full_name || "")
      setSkills(data.skills || "")

    }

    if (role === "contractor") {

      setCompanyName(data.company_name || "")
      setAboutCompany(data.about_company || "")

    }

  }

  // ========================================
  // SAVE SETTINGS
  // ========================================

  async function handleSave(e) {

    e.preventDefault()

    if (!user) return

    setLoading(true)

    let updates = {
      location
    }

    if (role === "worker") {

      updates = {
        ...updates,
        full_name: fullName,
        skills
      }

    }

    if (role === "contractor") {

      updates = {
        ...updates,
        company_name: companyName,
        about_company: aboutCompany
      }

    }

    const { error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", user.id)

    if (error) {

      toast.error("Failed to update settings")

      setLoading(false)

      return
    }

    toast.success("Settings updated 🎉")

    setLoading(false)
  }

  // ========================================
  // CHANGE EMAIL
  // ========================================

  async function handleEmailUpdate() {

    if (!email) return

    const { error } = await supabase.auth.updateUser({
      email
    })

    if (error) {
      toast.error(error.message)
      return
    }

    toast.success(
      "Check your email to confirm change 📩"
    )
  }

  // ========================================
  // CHANGE PASSWORD
  // ========================================

  async function handlePasswordReset() {

    const { error } =
      await supabase.auth.resetPasswordForEmail(
        user.email,
        {
          redirectTo:
            "http://localhost:5173/reset-password"
        }
      )

    if (error) {
      toast.error(error.message)
      return
    }

    toast.success(
      "Password reset email sent 📩"
    )
  }

  // ========================================
  // DELETE ACCOUNT
  // ========================================

  async function handleDeleteAccount() {

    const confirmDelete = window.confirm(
      "Are you sure you want to delete your account?"
    )

    if (!confirmDelete) return

    toast.error(
      "Account deletion backend not added yet"
    )
  }

  // ========================================
  // LOADING
  // ========================================

  if (authLoading) {

    return (
      <div className="account-settings-page">
        Loading...
      </div>
    )
  }

  return (
    <>
      <AppNavbar />

      <div className="account-settings-page">

        <div className="account-settings-card">

          <div className="account-settings-header">

            <div className="settings-icon">
              ⚙️
            </div>

            <h1>
              Account Settings
            </h1>

            <p>
              Manage your profile and account
              preferences.
            </p>

          </div>

          {/* ========================================
              PROFILE FORM
          ======================================== */}

          <form onSubmit={handleSave}>

            {/* WORKER */}

            {role === "worker" && (
              <>
                <div className="settings-group">

                  <label>
                    Full Name
                  </label>

                  <input
                    type="text"
                    value={fullName}
                    onChange={(e)=>
                      setFullName(e.target.value)
                    }
                    placeholder="Your full name"
                  />

                </div>

                <div className="settings-group">

                  <label>
                    Skills
                  </label>

                  <input
                    type="text"
                    value={skills}
                    onChange={(e)=>
                      setSkills(e.target.value)
                    }
                    placeholder="Frontend Developer, UI Designer"
                  />

                </div>
              </>
            )}

            {/* CONTRACTOR */}

            {role === "contractor" && (
              <>
                <div className="settings-group">

                  <label>
                    Company Name
                  </label>

                  <input
                    type="text"
                    value={companyName}
                    onChange={(e)=>
                      setCompanyName(e.target.value)
                    }
                    placeholder="Your company"
                  />

                </div>

                <div className="settings-group">

                  <label>
                    About Company
                  </label>

                  <textarea
                    value={aboutCompany}
                    onChange={(e)=>
                      setAboutCompany(e.target.value)
                    }
                    placeholder="Tell users about your company"
                  />

                </div>
              </>
            )}

            {/* LOCATION */}

            <div className="settings-group">

              <label>
                Location
              </label>

              <input
                type="text"
                value={location}
                onChange={(e)=>
                  setLocation(e.target.value)
                }
                placeholder="Your location"
              />

            </div>

            {/* EMAIL */}

            <div className="settings-group">

              <label>
                Email Address
              </label>

              <div className="settings-inline">

                <input
                  type="email"
                  value={email}
                  onChange={(e)=>
                    setEmail(e.target.value)
                  }
                />

                <button
                  type="button"
                  className="secondary-btn"
                  onClick={handleEmailUpdate}
                >
                  Update
                </button>

              </div>

            </div>

            {/* ACTIONS */}

            <div className="settings-actions">

              <button
                type="submit"
                className="save-settings-btn"
                disabled={loading}
              >
                {loading
                  ? "Saving..."
                  : "Save Changes"}
              </button>

              <button
                type="button"
                className="password-btn"
                onClick={handlePasswordReset}
              >
                Change Password
              </button>

              <button
                type="button"
                className="delete-account-btn"
                onClick={handleDeleteAccount}
              >
                Delete Account
              </button>

            </div>

          </form>

        </div>

      </div>
    </>
  )
}

export default AccountSettings