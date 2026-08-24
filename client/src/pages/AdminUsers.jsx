import { useEffect, useState } from "react"
import supabase from "../supabaseClient"
import AdminSidebar from "../components/AdminSidebar"
import "../styles/AdminUsers.css"
import { useNavigate } from "react-router-dom"
import toast from "react-hot-toast"
import {
  FiUser,
  FiUsers,
  FiBriefcase,
  FiCheckCircle,
  FiCircle,
  FiShield,
  FiShieldOff,
  FiPhone,
  FiMapPin,
  FiCalendar,
  FiFileText,
  FiTrash2,
  FiEye,
  FiUserCheck,
  FiUserX,
  FiLoader,
  FiAlertTriangle
} from "react-icons/fi"

function AdminUsers() {

  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedUser, setSelectedUser] = useState(null)
  const [showUserModal, setShowUserModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [makingAdmin, setMakingAdmin] = useState(false)
  const [suspendingUser, setSuspendingUser] = useState(false)
  const [deletingUser, setDeletingUser] = useState(false)
  const [stats, setStats] = useState({
  total: 0,
  online: 0,
  workers: 0,
  contractors: 0,
  admins: 0,
  suspended: 0
})
const USERS_PER_PAGE = 10

const [currentPage, setCurrentPage] = useState(1)

  const navigate = useNavigate()


  useEffect(() => {
    fetchUsers()
  }, [])

  async function fetchUsers() {

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error(error)
      return
    }

    setUsers(data || [])

    setStats({

  total: data.length,

  workers: data.filter(
    user => user.role === "worker"
  ).length,

  contractors: data.filter(
    user => user.role === "contractor"
  ).length,

  online: data.filter(
    user => user.is_online
  ).length,

  admins: data.filter(
    user => user.is_admin
  ).length,

  suspended: data.filter(
    user => user.is_suspended
  ).length

})

    console.log(data)

    setLoading(false)
  }

  async function makeAdmin(userId) {

  setMakingAdmin(true)

  try {

    console.log("Updating user:", userId)

    const { data, error } = await supabase
      .from("users")
      .update({
        is_admin: true
      })
      .eq("id", userId)
      .select()

    console.log("DATA:", data)
    console.log("ERROR:", error)

    if (error) {
      toast.error(error.message)
      return
    }

    toast.success("User is now an admin 👑")

    await fetchUsers()

    setSelectedUser(prev => ({
      ...prev,
      is_admin: true
    }))

  } catch (err) {

    console.error(err)
    toast.error("Something went wrong.")

  } finally {

    setMakingAdmin(false)

  }

}
async function toggleSuspend(user) {

  setSuspendingUser(true)

  try {

    const { error } = await supabase
      .from("users")
      .update({
        is_suspended: !user.is_suspended
      })
      .eq("id", user.id)

    if (error) {
      toast.error("Failed to update user")
      console.error(error)
      return
    }

    toast.success(
      user.is_suspended
        ? "User has been unsuspended ✅"
        : "User has been suspended 🚫"
    )

    await fetchUsers()

    setSelectedUser(prev => ({
      ...prev,
      is_suspended: !prev.is_suspended
    }))

  } catch (err) {

    console.error(err)
    toast.error("Something went wrong.")

  } finally {

    setSuspendingUser(false)

  }

}

async function deleteUser(user) {

  setDeletingUser(true)

  try {

    const { data, error } = await supabase
      .from("users")
      .delete()
      .eq("id", user.id)
      .select()

    console.log("DELETE DATA:", data)
    console.log("DELETE ERROR:", error)

    if (error) {
      toast.error("Failed to delete user")
      console.error(error)
      return
    }

    if (!data || data.length === 0) {
      toast.error("No user was deleted.")
      return
    }

    toast.success("User deleted successfully 🗑")

    setShowDeleteModal(false)
    setShowUserModal(false)
    setSelectedUser(null)

    await fetchUsers()

  } catch (err) {

    console.error(err)
    toast.error("Something went wrong.")

  } finally {

    setDeletingUser(false)

  }

}

  const filteredUsers = users.filter(user => {

  const matchesSearch =
    (user.full_name || "")
      .toLowerCase()
      .includes(search.toLowerCase()) ||

    (user.email || "")
      .toLowerCase()
      .includes(search.toLowerCase())

  const matchesRole =
    roleFilter === "all" ||
    user.role === roleFilter

  const matchesStatus =
    statusFilter === "all" ||
    (statusFilter === "online" && user.is_online) ||
    (statusFilter === "offline" && !user.is_online)

  return (
    matchesSearch &&
    matchesRole &&
    matchesStatus
  )

})

const totalPages = Math.ceil(
  filteredUsers.length / USERS_PER_PAGE
)

const startIndex =
  (currentPage - 1) * USERS_PER_PAGE

const currentUsers =
  filteredUsers.slice(
    startIndex,
    startIndex + USERS_PER_PAGE
  )

  return (
    <div className="admin-layout">

      <AdminSidebar />

      <div className="admin-content">

        <h1 className="admin-users-title">
  User Management
</h1>

        <div className="admin-users-toolbar">

  <input
    type="text"
    placeholder="Search users..."
    value={search}
    onChange={(e) => setSearch(e.target.value)}
  />

  <select
    value={roleFilter}
    onChange={(e) => setRoleFilter(e.target.value)}
  >
    <option value="all">All Roles</option>
    <option value="worker">Workers</option>
    <option value="contractor">Contractors</option>
  </select>

  <select
    value={statusFilter}
    onChange={(e) => setStatusFilter(e.target.value)}
  >
    <option value="all">All Status</option>
    <option value="online">Online</option>
    <option value="offline">Offline</option>
  </select>

</div>

<div className="admin-users-stats">

  <div className="admin-users-stat-card">
    <FiUsers className="stat-icon" />
    <h2>{stats.total}</h2>
    <p>Total Users</p>
  </div>

  <div className="admin-users-stat-card">
    <FiUser className="stat-icon success" />
    <h2>{stats.workers}</h2>
    <p>Workers</p>
  </div>

  <div className="admin-users-stat-card">
    <FiBriefcase className="stat-icon info" />
    <h2>{stats.contractors}</h2>
    <p>Contractors</p>
  </div>

  <div className="admin-users-stat-card">
    <FiCheckCircle className="stat-icon success" />
    <h2>{stats.online}</h2>
    <p>Online</p>
  </div>

  <div className="admin-users-stat-card">
    <FiShield className="stat-icon featured" />
    <h2>{stats.admins}</h2>
    <p>Admins</p>
  </div>

  <div className="admin-users-stat-card">
    <FiUserX className="stat-icon danger" />
    <h2>{stats.suspended}</h2>
    <p>Suspended</p>
  </div>

</div>

        {loading ? (
          <p>Loading users...</p>
        ) : (

            <>

          <div className="admin-users-table-wrapper">

  <table className="admin-users-table">

            <thead>

              <tr>
                <th>Avatar</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Admin</th>
                <th>Suspended</th>
                <th>Actions</th>
              </tr>

            </thead>

            <tbody>

              {currentUsers.map(user => (

                <tr key={user.id}>

                  <td>

  <img
    src={
      user.avatar_url ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(
        user.full_name || "User"
      )}`
    }
    className="admin-user-avatar"
    alt=""
  />

</td>

                  <td>{user.full_name}</td>

                  <td>{user.email}</td>

                  <td>

  <span
    className={`admin-badge ${
      user.role === "worker"
        ? "worker"
        : "contractor"
    }`}
  >
   <>
  {user.role === "worker"
    ? <FiUser />
    : <FiBriefcase />}
  {user.role === "worker"
    ? "Worker"
    : "Contractor"}
</>
  </span>

</td>

                  <td>

  <span
    className={`admin-badge ${
      user.is_online
        ? "online"
        : "offline"
    }`}
  >
    {user.is_online
      ? <>
  <FiCheckCircle />
  Online
</>
      : <>
  <FiCircle />
  Offline
</>}
  </span>

</td>

<td>
  <span
    className={`admin-badge ${
      user.is_admin ? "admin" : "user"
    }`}
  >
    {user.is_admin ? <>
  <FiShield />
  Admin
</> : <>
  <FiUser />
  User
</>}
  </span>
</td>

<td>
  <span
    className={`admin-badge ${
      user.is_suspended
        ? "suspended"
        : "online"
    }`}
  >
    {user.is_suspended
      ? <>
  <FiUserX />
  Suspended
</>
      : <>
  <FiCheckCircle />
  Active
</>}
  </span>
</td>

                  <td>

  <button
  className="admin-btn admin-btn-primary"
  onClick={() => {

    console.log("Selected User:", user)

    setSelectedUser(user)
    setShowUserModal(true)

  }}
>
  View
</button>

</td>

                </tr>

              ))}

            </tbody>

          </table>

</div>

          <div className="admin-pagination">

            <button
              disabled={currentPage === 1}
              onClick={() =>
                setCurrentPage(prev => prev - 1)
              }
            >
              ← Previous
            </button>

            <span>
              Page {currentPage} of {totalPages || 1}
            </span>

            <button
              disabled={
                currentPage === totalPages ||
                totalPages === 0
              }
              onClick={() =>
                setCurrentPage(prev => prev + 1)
              }
            >
              Next →
            </button>

          </div>
          
          </>

        )}
        
        {showUserModal && selectedUser && (

  <div
    className="admin-user-modal-overlay"
    onClick={() => setShowUserModal(false)}
  >

    <div
      className="admin-user-modal"
      onClick={(e) => e.stopPropagation()}
    >

      <div className="admin-user-header">

  <img
  src={
    selectedUser.avatar_url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      selectedUser.full_name || "User"
    )}`
  }
  className="admin-user-modal-avatar clickable-avatar"
  alt={selectedUser.full_name}
  onClick={() =>
    window.open(
      selectedUser.avatar_url ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(
        selectedUser.full_name || "User"
      )}`,
      "_blank"
    )
  }
/>

  <h2>{selectedUser.full_name}</h2>

  <p>{selectedUser.email}</p>

</div>

      <div className="admin-user-details">

  <div className="admin-user-detail">
  <strong>
    <FiUser />
    Role
  </strong>

  <span
    className={`admin-badge ${
      selectedUser.role === "worker"
        ? "worker"
        : "contractor"
    }`}
  >
    {selectedUser.role === "worker" ? (
      <>
        <FiUser />
        Worker
      </>
    ) : (
      <>
        <FiBriefcase />
        Contractor
      </>
    )}
  </span>
</div>

  <div className="admin-user-detail">
  <strong>
    <FiCheckCircle />
    Status
  </strong>

  <span
    className={`admin-badge ${
      selectedUser.is_online
        ? "online"
        : "offline"
    }`}
  >
    {selectedUser.is_online ? (
      <>
        <FiCheckCircle />
        Online
      </>
    ) : (
      <>
        <FiCircle />
        Offline
      </>
    )}
  </span>
</div>

  <div className="admin-user-detail">
    <strong><strong>
    <FiPhone />
    Phone
</strong></strong>
    <span>{selectedUser.phone || "Not provided"}</span>
  </div>

  <div className="admin-user-detail">
    <strong><strong>
    <FiMapPin />
    Location
</strong></strong>
    <span>{selectedUser.location || "Not provided"}</span>
  </div>

  <div className="admin-user-detail">
    <strong>
    <FiCalendar />
    Joined
</strong>
    <span>
      {new Date(selectedUser.created_at).toLocaleDateString()}
    </span>
  </div>

  <div className="admin-user-detail">
    <strong>
    <FiFileText />
    Profile
</strong>
    <span>
      {selectedUser.profile_completed
        ? "Completed"
        : "Incomplete"}
    </span>
  </div>

  <div className="admin-user-detail">
  <strong>
    <FiShield />
    Admin
  </strong>

  <span
    className={`admin-badge ${
      selectedUser.is_admin
        ? "admin"
        : "user"
    }`}
  >
    {selectedUser.is_admin ? (
      <>
        <FiShield />
        Admin
      </>
    ) : (
      <>
        <FiUser />
        User
      </>
    )}
  </span>
</div>

  <div className="admin-user-detail">
  <strong>
    <FiShieldOff />
    Suspended
  </strong>

  <span
    className={`admin-badge ${
      selectedUser.is_suspended
        ? "suspended"
        : "online"
    }`}
  >
    {selectedUser.is_suspended ? (
      <>
        <FiUserX />
        Suspended
      </>
    ) : (
      <>
        <FiCheckCircle />
        Active
      </>
    )}
  </span>
</div>

</div>

<button
  className="admin-btn admin-btn-secondary"
  onClick={() => {
    if (selectedUser.role === "worker") {
      navigate(`/worker/${selectedUser.id}`)
    } else {
      navigate(`/contractor/${selectedUser.id}`)
    }
  }}
>
  <FiEye />
View Full Profile
</button>

<div className="admin-user-actions">

  <button
  className="admin-btn admin-btn-primary"
  disabled={
    selectedUser.is_admin ||
    makingAdmin
  }
  onClick={() => makeAdmin(selectedUser.id)}
>
  {makingAdmin
? <>
    <FiLoader />
    Making Admin...
  </>
: selectedUser.is_admin
? <>
    <FiShield />
    Already Admin
  </>
: <>
    <FiShield />
    Make Admin
  </>
}
</button>

  <button
  className="admin-btn admin-btn-warning"
  disabled={suspendingUser}
  onClick={() => toggleSuspend(selectedUser)}
>
  {suspendingUser
? <>
    <FiLoader />
    Updating...
  </>
: selectedUser.is_suspended
? <>
    <FiCheckCircle />
    Unsuspend
  </>
: <>
    <FiUserX />
    Suspend
  </>
}
</button>

  <button
  className="admin-btn admin-btn-danger"
  disabled={deletingUser}
  onClick={() => setShowDeleteModal(true)}
>
  <FiTrash2 />
Delete
</button>

</div>

      <button
        className="admin-btn admin-btn-danger"
        onClick={() => setShowUserModal(false)}
      >
        Close
      </button>

    </div>

  </div>

)}

{showDeleteModal && selectedUser && (

  <div
    className="admin-delete-modal-overlay"
    onClick={() => setShowDeleteModal(false)}
  >

    <div
      className="admin-delete-modal"
      onClick={(e) => e.stopPropagation()}
    >

      <div className="admin-delete-icon">
        <FiAlertTriangle />
      </div>

      <h2>Delete User</h2>

      <p>
        Are you sure you want to permanently delete
      </p>

      <h3>
        {selectedUser.full_name}?
      </h3>

      <p className="admin-delete-warning">
        This action cannot be undone.
      </p>

      <div className="admin-delete-buttons">

        <button
          className="admin-btn"
          onClick={() => setShowDeleteModal(false)}
        >
          Cancel
        </button>

        <button
  className="admin-btn admin-btn-danger"
  disabled={deletingUser}
  onClick={() => deleteUser(selectedUser)}
>
  {deletingUser
    ? <>
    <FiLoader />
    Deleting...
</>
    : "Delete User"}
</button>

      </div>

    </div>

  </div>

)}

      </div>

    </div>
  )
}

export default AdminUsers