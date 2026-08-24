import { useEffect, useState } from "react"
import supabase from "../supabaseClient"
import AdminSidebar from "../components/AdminSidebar"
import "../styles/AdminCategoryRequests.css"
import toast from "react-hot-toast"

import {
  FiFolder,
  FiUser,
  FiCheckCircle,
  FiXCircle,
  FiEye,
  FiCalendar,
  FiSearch,
  FiTag
} from "react-icons/fi"

function AdminCategoryRequests() {

  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const [selectedRequest, setSelectedRequest] = useState(null)
  const [showModal, setShowModal] = useState(false)

  const [processing, setProcessing] = useState(false)

  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  })
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [requestToDelete, setRequestToDelete] = useState(null)

  useEffect(() => {
    fetchRequests()
  }, [])

  async function fetchRequests() {

  setLoading(true)

  const { data, error } = await supabase
  .from("category_requests")
  .select(`
    *,
    users:users!category_requests_user_id_fkey(
      full_name,
      role
    )
  `)
  .order("created_at", { ascending: false })

  if (error) {
  console.error("Category Request Error:", error)
  toast.error(error.message)
  setLoading(false)
  return
}

  setRequests(data || [])

  setStats({
    total: data.length,

    pending: data.filter(
      request => request.status === "pending"
    ).length,

    approved: data.filter(
      request => request.status === "approved"
    ).length,

    rejected: data.filter(
      request => request.status === "rejected"
    ).length
  })

  setLoading(false)

}

async function approveRequest(request) {

  setProcessing(true)

  try {

    const { data: existing } = await supabase
      .from("categories")
      .select("id")
      .ilike("name", request.category_name)
      .maybeSingle()

    if (existing) {
      toast.error("Category already exists")
      setProcessing(false)
      return
    }

    const { error: categoryError } = await supabase
  .from("categories")
  .insert({
    name: request.category_name,
    slug: request.category_name
      .toLowerCase()
      .replace(/\s+/g, "-"),
    icon: "📁",
    color: "#22C55E",
    is_active: true
  })

    if (categoryError) throw categoryError

    const { error: requestError } = await supabase
      .from("category_requests")
      .update({
  status: "approved",
  reviewed_at: new Date().toISOString()
})
      .eq("id", request.id)

    if (requestError) throw requestError

    const { error: notificationError } = await supabase
  .from("notifications")
  .insert({
    user_id: request.user_id,
    type: "category",
    title: "Category Request Approved",
    message: `Your category request "${request.category_name}" has been approved and is now available when posting jobs.`,
    is_read: false,
    is_seen: false
  })

if (notificationError) {
  console.error(notificationError)
}

    toast.success("Category approved successfully")

setShowModal(false)

await fetchRequests()

  } catch (err) {

    toast.error(err.message)

  } finally {

    setProcessing(false)

  }

}

async function rejectRequest(request) {

  setProcessing(true)

  try {

    const { error } = await supabase
  .from("category_requests")
  .update({
  status: "rejected",
  reviewed_at: new Date().toISOString()
})
  .eq("id", request.id)

if (error) throw error

const { error: notificationError } = await supabase
  .from("notifications")
  .insert({
    user_id: request.user_id,
    type: "category",
    title: "Category Request Rejected",
    message: `Your request for "${request.category_name}" wasn't approved. You can submit another request if needed.`,
    is_read: false,
    is_seen: false
  })

if (notificationError) {
  console.error(notificationError)
}

toast.success("Request rejected")

setShowModal(false)

await fetchRequests()

  } catch (err) {

    toast.error(err.message)

  } finally {

    setProcessing(false)

  }

}

async function deleteHistory(request) {

  setProcessing(true)

  try {

    const { error } = await supabase
      .from("category_requests")
      .delete()
      .eq("id", request.id)

    if (error) throw error

    toast.success("Request history deleted.")

    setShowDeleteModal(false)
    setShowModal(false)
    setRequestToDelete(null)

    await fetchRequests()

  } catch (err) {

    toast.error(err.message)

  } finally {

    setProcessing(false)

  }

}

const filteredRequests = requests.filter(request => {

  const matchesSearch =
    (request.category_name || "")
      .toLowerCase()
      .includes(search.toLowerCase())

  const matchesStatus =
    statusFilter === "all" ||
    request.status === statusFilter

  return matchesSearch && matchesStatus

})


  return (

    <div className="admin-layout">

      <AdminSidebar />

      <div className="admin-content">

        <h1 className="admin-category-title">
  <FiFolder />
  Category Requests
</h1>

<div className="admin-category-toolbar">

  <div className="admin-search-box">

    <FiSearch />

    <input
      type="text"
      placeholder="Search category..."
      value={search}
      onChange={(e) => setSearch(e.target.value)}
    />

  </div>

  <select
    value={statusFilter}
    onChange={(e) => setStatusFilter(e.target.value)}
  >
    <option value="all">All Requests</option>
    <option value="pending">Pending</option>
    <option value="approved">Approved</option>
    <option value="rejected">Rejected</option>
  </select>

</div>

<div className="admin-users-stats">

  <div className="admin-users-stat-card">
    <FiFolder className="stat-icon" />
    <h2>{stats.total}</h2>
    <p>Total Requests</p>
  </div>

  <div className="admin-users-stat-card">
    <FiCalendar className="stat-icon warning" />
    <h2>{stats.pending}</h2>
    <p>Pending</p>
  </div>

  <div className="admin-users-stat-card">
    <FiCheckCircle className="stat-icon success" />
    <h2>{stats.approved}</h2>
    <p>Approved</p>
  </div>

  <div className="admin-users-stat-card">
    <FiXCircle className="stat-icon danger" />
    <h2>{stats.rejected}</h2>
    <p>Rejected</p>
  </div>

</div>

{loading ? (

  <p>Loading category requests...</p>

) : (

  <div className="admin-category-table-wrapper">

    <table className="admin-category-table">

      <thead>

        <tr>
          <th>Category</th>
          <th>Requested By</th>
          <th>Role</th>
          <th>Date</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>

      </thead>

      <tbody>

  {filteredRequests.length === 0 ? (

    <tr>

      <td colSpan="6" className="admin-empty-state">
        No category requests found.
      </td>

    </tr>

  ) : (

    filteredRequests.map(request => (

      <tr key={request.id}>

        <td>{request.category_name}</td>

        <td>
          {request.users?.full_name || "Unknown"}
        </td>

        <td>

          <span className={`admin-badge ${request.users?.role}`}>
            {request.users?.role || "-"}
          </span>

        </td>

        <td>
          {new Date(
            request.created_at
          ).toLocaleDateString()}
        </td>

        <td>

          <span
            className={`admin-badge ${request.status}`}
          >
            {request.status}
          </span>

        </td>

        <td>

          <button
            className="admin-btn admin-btn-primary"
            onClick={() => {
              setSelectedRequest(request)
              setShowModal(true)
            }}
          >
            <FiEye />
            View
          </button>

        </td>

      </tr>

    ))

  )}

</tbody>

    </table>

  </div>

)}

{showModal && selectedRequest && (

  <div
    className="admin-user-modal-overlay"
    onClick={() => setShowModal(false)}
  >

    <div
      className="admin-user-modal"
      onClick={(e) => e.stopPropagation()}
    >

      <div className="admin-user-header">

        <FiFolder className="admin-modal-icon" />

        <h2>{selectedRequest.category_name}</h2>

        <p>
          Requested by{" "}
          {selectedRequest.users?.full_name || "Unknown User"}
        </p>

      </div>

      <div className="admin-user-details">

        <div className="admin-user-detail">

          <strong>
            <FiTag />
            Category
          </strong>

          <span>{selectedRequest.category_name}</span>

        </div>

        <div className="admin-user-detail">

          <strong>
            <FiUser />
            Requested By
          </strong>

          <span>
            {selectedRequest.users?.full_name || "Unknown"}
          </span>

        </div>

        <div className="admin-user-detail">

          <strong>
            <FiUser />
            Role
          </strong>

          <span>
            {selectedRequest.users?.role || "-"}
          </span>

        </div>

        <div className="admin-user-detail">

          <strong>
            <FiCalendar />
            Date Requested
          </strong>

          <span>
            {new Date(
              selectedRequest.created_at
            ).toLocaleDateString()}
          </span>

        </div>

        <div className="admin-user-detail admin-description-card">

          <strong>
            <FiFolder />
            Reason
          </strong>

          <span>
  {selectedRequest.description || "No reason provided."}
</span>

        </div>

        <div className="admin-user-detail">

          <strong>
            <FiCheckCircle />
            Status
          </strong>

          <span
            className={`admin-badge ${selectedRequest.status}`}
          >
            {selectedRequest.status}
          </span>

        </div>

      </div>

      {selectedRequest.status === "pending" ? (

  <div className="admin-user-actions">

    <button
      className="admin-btn admin-btn-success"
      disabled={processing}
      onClick={() => approveRequest(selectedRequest)}
    >
      <FiCheckCircle />
      Approve
    </button>

    <button
      className="admin-btn admin-btn-danger"
      disabled={processing}
      onClick={() => rejectRequest(selectedRequest)}
    >
      <FiXCircle />
      Reject
    </button>

  </div>

) : (

  <div className="admin-user-actions">

    <button
      className="admin-btn admin-btn-danger"
      onClick={() => {
        setRequestToDelete(selectedRequest)
        setShowDeleteModal(true)
      }}
    >
      Delete History
    </button>

  </div>

)}

<button
  className="admin-btn admin-btn-secondary"
  onClick={() => setShowModal(false)}
>
  Close
</button>

    </div>

  </div>

)}

{showDeleteModal && requestToDelete && (

  <div
    className="admin-delete-modal-overlay"
    onClick={() => setShowDeleteModal(false)}
  >

    <div
      className="admin-delete-modal"
      onClick={(e) => e.stopPropagation()}
    >

      <div className="admin-delete-icon">
        ⚠
      </div>

      <h2>Delete Request History</h2>

      <p>
        Are you sure you want to permanently delete this request?
      </p>

      <h3>{requestToDelete.category_name}</h3>

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
          disabled={processing}
          onClick={() => deleteHistory(requestToDelete)}
        >
          {processing ? "Deleting..." : "Delete"}
        </button>

      </div>

    </div>

  </div>

)}

      </div>

    </div>

  )

}

export default AdminCategoryRequests