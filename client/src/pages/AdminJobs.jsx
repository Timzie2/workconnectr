import { useEffect, useState } from "react"
import supabase from "../supabaseClient"
import AdminSidebar from "../components/AdminSidebar"
import "../styles/AdminJobs.css"
import { useNavigate } from "react-router-dom"
import toast from "react-hot-toast"
import {
  FiEye,
  FiUsers,
  FiTrash2,
  FiClock,
  FiStar,
  FiAlertCircle,
  FiMapPin,
  FiCalendar,
  FiBriefcase,
  FiDollarSign,
  FiFileText,
  FiCheckCircle,
  FiXCircle,
  FiPhone,
  FiArchive,
  FiZap,
  FiUser,
  FiRefreshCw,
  FiLock,
  FiUnlock,
  FiAward,
  FiTool
} from "react-icons/fi"

function AdminJobs() {

  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [jobStats, setJobStats] = useState({
  total: 0,
  open: 0,
  closed: 0,
  expired: 0,
  archived: 0,
  featured: 0,
  urgent: 0
})
const [selectedJob, setSelectedJob] = useState(null)
const [showJobModal, setShowJobModal] = useState(false)
const [updatingJob, setUpdatingJob] = useState(false)
const [deletingJob, setDeletingJob] = useState(false)
const [showDeleteModal, setShowDeleteModal] = useState(false)
const [extendingJob, setExtendingJob] = useState(false)
const [showFeatureModal, setShowFeatureModal] = useState(false)
const [showUrgentModal, setShowUrgentModal] = useState(false)
const [showExpiryModal, setShowExpiryModal] = useState(false)
const [applications, setApplications] = useState([])
const [showApplications, setShowApplications] =useState(false)
const [loadingApplications, setLoadingApplications] = useState(false)
const [showProfileModal, setShowProfileModal] = useState(false)
const [selectedApplicant, setSelectedApplicant] = useState(null)

const [selectedDays, setSelectedDays] = useState(30)

  const navigate = useNavigate()

  useEffect(() => {
    fetchJobs()
  }, [])

  async function fetchJobs() {

    const { data, error } = await supabase
      .from("jobs")
      .select(`
        *,
        users(full_name)
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error(error)
      toast.error("Failed to fetch jobs")
      return
    }

    setJobs(data || [])

    setJobStats({
  total: data.length,

  open: data.filter(
    job => job.status === "open"
  ).length,

  closed: data.filter(
    job => job.status === "closed"
  ).length,

  archived: data.filter(
    job => job.status === "archived"
  ).length,

  featured: data.filter(
    job => job.is_featured
  ).length,

  expired: data.filter(
  job =>
    new Date(job.expires_at) < new Date() &&
    job.status === "open"
).length,

  urgent: data.filter(
    job => job.is_urgent
  ).length
})

    setLoading(false)

  }

  async function toggleJobStatus(job) {

  setUpdatingJob(true)

  try {

    const { error } = await supabase
      .from("jobs")
      .update({
        status:
          job.status === "open"
            ? "closed"
            : "open"
      })
      .eq("id", job.id)

    if (error) throw error

    toast.success("Job updated successfully")

    await fetchJobs()

    setSelectedJob(prev => ({
      ...prev,
      status:
        prev.status === "open"
          ? "closed"
          : "open"
    }))

  } catch (err) {

    toast.error(err.message)

  } finally {

    setUpdatingJob(false)

  }

}

async function toggleFeatured(job) {

  setUpdatingJob(true)

  try {

    const { error } = await supabase
      .from("jobs")
      .update({
        is_featured: !job.is_featured
      })
      .eq("id", job.id)

    if (error) throw error

    toast.success("Job updated")

    await fetchJobs()

    setSelectedJob(prev => ({
      ...prev,
      is_featured: !prev.is_featured
    }))

  } catch (err) {

    toast.error(err.message)

  } finally {

    setUpdatingJob(false)

  }

}

async function toggleUrgent(job) {

  setUpdatingJob(true)

  try {

    const { error } = await supabase
      .from("jobs")
      .update({
        is_urgent: !job.is_urgent
      })
      .eq("id", job.id)

    if (error) throw error

    toast.success("Job updated")

    await fetchJobs()

    setSelectedJob(prev => ({
      ...prev,
      is_urgent: !prev.is_urgent
    }))

  } catch (err) {

    toast.error(err.message)

  } finally {

    setUpdatingJob(false)

  }

}

async function extendExpiry(job) {

  setExtendingJob(true)

  try {

    const newExpiry = new Date()

newExpiry.setDate(
  newExpiry.getDate() + selectedDays
)

    const { error } = await supabase
      .from("jobs")
      .update({
        expires_at: newExpiry.toISOString(),
        status: "open"
      })
      .eq("id", job.id)

    if (error) throw error

    toast.success(
  `Job extended by ${selectedDays} day(s) ✅`
)

setShowExpiryModal(false)

    await fetchJobs()

    setSelectedJob(prev => ({
      ...prev,
      expires_at: newExpiry.toISOString(),
      status: "open"
    }))

  } catch (err) {

    toast.error(err.message)

  } finally {

    setExtendingJob(false)

  }

}

async function featureJob(job) {

  setUpdatingJob(true)

  try {

    const featuredUntil = new Date()

    featuredUntil.setDate(
      featuredUntil.getDate() + selectedDays
    )

    const { error } = await supabase
      .from("jobs")
      .update({
        is_featured: true,
        featured_until: featuredUntil.toISOString()
      })
      .eq("id", job.id)

    if (error) throw error

    toast.success(
      `Featured for ${selectedDays} day(s) ⭐`
    )

    setShowFeatureModal(false)

    await fetchJobs()

    setSelectedJob(prev => ({
      ...prev,
      is_featured: true,
      featured_until: featuredUntil.toISOString()
    }))

  } catch (err) {

    toast.error(err.message)

  } finally {

    setUpdatingJob(false)

  }

}

async function removeFeature(job) {

  setUpdatingJob(true)

  try {

    const { error } = await supabase
      .from("jobs")
      .update({
        is_featured: false,
        featured_until: null
      })
      .eq("id", job.id)

    if (error) throw error

    toast.success("Feature removed")

    await fetchJobs()

    setSelectedJob(prev => ({
      ...prev,
      is_featured: false,
      featured_until: null
    }))

  } catch (err) {

    toast.error(err.message)

  } finally {

    setUpdatingJob(false)

  }

}

async function makeUrgent(job) {

  setUpdatingJob(true)

  try {

    const urgentUntil = new Date()

    urgentUntil.setDate(
      urgentUntil.getDate() + selectedDays
    )

    const { error } = await supabase
      .from("jobs")
      .update({
        is_urgent: true,
        urgent_expires_at: urgentUntil.toISOString()
      })
      .eq("id", job.id)

    if (error) throw error

    toast.success(
      `Marked urgent for ${selectedDays} day(s) 🔥`
    )

    setShowUrgentModal(false)

    await fetchJobs()

    setSelectedJob(prev => ({
      ...prev,
      is_urgent: true,
      urgent_expires_at: urgentUntil.toISOString()
    }))

  } catch (err) {

    toast.error(err.message)

  } finally {

    setUpdatingJob(false)

  }

}

async function removeUrgent(job) {

  setUpdatingJob(true)

  try {

    const { error } = await supabase
      .from("jobs")
      .update({
        is_urgent: false,
        urgent_expires_at: null
      })
      .eq("id", job.id)

    if (error) throw error

    toast.success("Urgent removed")

    await fetchJobs()

    setSelectedJob(prev => ({
      ...prev,
      is_urgent: false,
      urgent_expires_at: null
    }))

  } catch (err) {

    toast.error(err.message)

  } finally {

    setUpdatingJob(false)

  }

}

async function deleteJob(job) {

  setDeletingJob(true)

  try {

    const { error } = await supabase
      .from("jobs")
      .delete()
      .eq("id", job.id)

    if (error) throw error

    toast.success("Job deleted successfully")

    setShowDeleteModal(false)
    setShowJobModal(false)

    await fetchJobs()

  } catch (err) {

    toast.error(err.message)

  } finally {

    setDeletingJob(false)

  }

}

async function fetchApplications(jobId) {

  setLoadingApplications(true)

  const { data, error } = await supabase
    .from("applications")
    .select(`
      *,
      users:worker_id(
        full_name,
        email,
        phone,
        location,
        avatar_url,
        headline,
        availability,
        skills,
        experience,
        bio,
        resume_url
      )
    `)
    .eq("job_id", jobId)
    .order("created_at", {
      ascending: false
    })

  if (error) {
    console.error(error)
    toast.error(error.message)
    setLoadingApplications(false)
    return
  }

  setApplications(data || [])
  setShowApplications(true)
  setLoadingApplications(false)

}

async function updateApplicationStatus(id, status) {

  const { error } = await supabase
    .from("applications")
    .update({
      status
    })
    .eq("id", id)

  if (error) {
    toast.error(error.message)
    return
  }

  toast.success(`Application ${status}`)

  fetchApplications(selectedJob.id)

}

  const filteredJobs = jobs.filter(job => {

    const matchesSearch =
      (job.title || "")
        .toLowerCase()
        .includes(search.toLowerCase())

    const matchesStatus =
  statusFilter === "all" ||
  (
    statusFilter === "expired"
      ? job.expires_at &&
        new Date(job.expires_at) < new Date() &&
        job.status === "open"
      : job.status === statusFilter
  )

    return matchesSearch && matchesStatus

  })

  const isExpired =
  selectedJob?.expires_at &&
  new Date(selectedJob.expires_at) < new Date() &&
  selectedJob.status === "open";

  return (
    <div className="admin-layout">

      <AdminSidebar />

      <div className="admin-content">

        <h1 className="admin-jobs-title">
          Job Management
        </h1>

        <div className="admin-jobs-toolbar">

          <input
            type="text"
            placeholder="Search jobs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Jobs</option>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
            <option value="archived">Archived</option>
            <option value="expired">Expired</option>
          </select>

        </div>

        {showJobModal && selectedJob && (

  <div
    className="admin-user-modal-overlay"
    onClick={() => setShowJobModal(false)}
  >

    <div
      className="admin-user-modal"
      onClick={(e) => e.stopPropagation()}
    >

      <div className="admin-user-header">

        <h2>{selectedJob.title}</h2>

        <p>
          {selectedJob.users?.full_name || "Unknown Contractor"}
        </p>

      </div>

      <div className="admin-user-details">

        <div className="admin-user-detail">
          <strong>💰 Salary</strong>
          <span>
            ₦{selectedJob.salary?.toLocaleString()}
          </span>
        </div>

        <div className="admin-user-detail">
          <strong><FiMapPin />
Location</strong>
          <span>{selectedJob.location}</span>
        </div>

        <div className="admin-user-detail">
          <strong><FiBriefcase />
Category</strong>
          <span>{selectedJob.category}</span>
        </div>

        <div className="admin-user-detail">
          <strong><FiCalendar />
Posted</strong>
          <span>
            {new Date(
              selectedJob.created_at
            ).toLocaleDateString()}
          </span>
        </div>

        <div className="admin-user-detail admin-description-card">
  <strong>
    <FiFileText />
    Description
  </strong>

  <span>{selectedJob.description}</span>
</div>

        <div className="admin-user-detail">
          <strong>Status</strong>

         <span
  className={`job-status-badge ${
    isExpired ? "expired" : selectedJob.status
  }`}
>
  {isExpired ? "expired" : selectedJob.status}
</span>

        </div>

      </div>

      <div className="admin-job-timeline">

  <h3>
    <FiCalendar />
    Job Timeline
  </h3>

  <div className="admin-timeline-item">
    <strong>
      <FiCalendar />
      Posted
    </strong>

    <span>
      {new Date(selectedJob.created_at).toLocaleDateString()}
    </span>
  </div>

  <div className="admin-timeline-item">
    <strong>
      <FiStar />
      Featured Until
    </strong>

    <span>
      {selectedJob.featured_until
        ? new Date(
            selectedJob.featured_until
          ).toLocaleDateString()
        : "Not Featured"}
    </span>
  </div>

  <div className="admin-timeline-item">
    <strong>
      <FiZap />
      Urgent Until
    </strong>

    <span>
      {selectedJob.urgent_expires_at
        ? new Date(
            selectedJob.urgent_expires_at
          ).toLocaleDateString()
        : "Not Urgent"}
    </span>
  </div>

  <div className="admin-timeline-item">
    <strong>
      <FiClock />
      Job Expires
    </strong>

    <span>
      {selectedJob.expires_at
        ? new Date(
            selectedJob.expires_at
          ).toLocaleDateString()
        : "No Expiry"}
    </span>
  </div>

</div>

      <div className="admin-user-actions">

  {isExpired ? (

  <button
  className="admin-btn admin-btn-primary"
  disabled={extendingJob}
  onClick={() => {
    setSelectedDays(30)
    setShowExpiryModal(true)
  }}
>
  <FiRefreshCw />
  {extendingJob
    ? "Extending..."
    : "Extend 30 Days"}
</button>

) : (

  <button
  className="admin-btn admin-btn-primary"
  disabled={updatingJob}
  onClick={() => toggleJobStatus(selectedJob)}
>
  {selectedJob.status === "open" ? (
    <>
      <FiLock />
      Close Job
    </>
  ) : (
    <>
      <FiUnlock />
      Reopen Job
    </>
  )}
</button>

)}

<button
  className="admin-btn admin-btn-primary"
  onClick={() => fetchApplications(selectedJob.id)}
>

<FiUsers />
View Applications

</button>

  <button
  className="admin-btn admin-btn-secondary"
  disabled={updatingJob}
  onClick={() => {

    if (selectedJob.is_featured) {
      removeFeature(selectedJob)
    } else {
      setSelectedDays(30)
      setShowFeatureModal(true)
    }

  }}
>
  <FiStar />
  {selectedJob.is_featured
    ? "Remove Feature"
    : "Feature Job"}
</button>

  <button
  className="admin-btn admin-btn-warning"
  disabled={updatingJob}
  onClick={() => {

    if (selectedJob.is_urgent) {
      removeUrgent(selectedJob)
    } else {
      setSelectedDays(7)
      setShowUrgentModal(true)
    }

  }}
>
  <FiZap />
  {selectedJob.is_urgent
    ? "Remove Urgent"
    : "Mark Urgent"}
</button>

  <button
    className="admin-btn admin-btn-danger"
    onClick={() => setShowDeleteModal(true)}
  >
   <FiTrash2 />
Delete
  </button>

</div>

      <button
        className="admin-btn admin-btn-danger"
        onClick={() => setShowJobModal(false)}
      >
        Close
      </button>

    </div>

  </div>

)}

        <div className="admin-users-stats">

  <div className="admin-users-stat-card">

  <FiFileText className="stat-icon" />

  <h2>{jobStats.total}</h2>

  <p>Total Jobs</p>

</div>

  <div className="admin-users-stat-card">

  <FiCheckCircle className="stat-icon success" />

  <h2>{jobStats.open}</h2>

  <p>Open Jobs</p>

</div>

  <div className="admin-users-stat-card">

  <FiXCircle className="stat-icon danger" />

  <h2>{jobStats.closed}</h2>

  <p>Closed Jobs</p>

</div>

  <div className="admin-users-stat-card">

  <FiClock className="stat-icon warning" />

  <h2>{jobStats.expired}</h2>

  <p>Expired Jobs</p>

</div>

  <div className="admin-users-stat-card">

  <FiArchive className="stat-icon archive" />

  <h2>{jobStats.archived}</h2>

  <p>Archived Jobs</p>

</div>

<div className="admin-users-stat-card">

  <FiStar className="stat-icon featured" />

  <h2>{jobStats.featured}</h2>

  <p>Featured Jobs</p>

</div>

<div className="admin-users-stat-card">

  <FiZap className="stat-icon urgent" />

  <h2>{jobStats.urgent}</h2>

  <p>Urgent Jobs</p>

</div>

</div>

        {loading ? (

          <p>Loading jobs...</p>

        ) : (

          <div className="admin-jobs-table-wrapper">

            <table className="admin-jobs-table">

              <thead>

                <tr>
                  <th>Title</th>
                  <th>Contractor</th>
                  <th>Salary</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>

              </thead>

              <tbody>

                {filteredJobs.map(job => (

                  <tr key={job.id}>

                    <td>{job.title}</td>

                    <td>
                      {job.users?.full_name || "Unknown"}
                    </td>

                    <td>
                     ₦{job.salary?.toLocaleString()}
                    </td>

                    <td>

                      <span
  className={`job-status-badge ${
    job.expires_at &&
    new Date(job.expires_at) < new Date() &&
    job.status === "open"
      ? "expired"
      : job.status
  }`}
>
  {job.expires_at &&
  new Date(job.expires_at) < new Date() &&
  job.status === "open"
    ? "expired"
    : job.status}
</span>

                    </td>

                    <td>
                      {new Date(job.created_at).toLocaleDateString()}
                    </td>

                    <td>

                      <button
  className="admin-btn admin-btn-primary"
  onClick={() => {
    setSelectedJob(job)
    setShowJobModal(true)
  }}
>
  <FiEye />
View
</button>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

        {showFeatureModal && (

  <div
    className="admin-delete-modal-overlay"
    onClick={() => setShowFeatureModal(false)}
  >

    <div
      className="admin-delete-modal"
      onClick={(e) => e.stopPropagation()}
    >

      <h2>
    <FiStar />
    Feature Job
</h2>

      <p>
        Select how long this job should remain featured.
      </p>

      <div className="admin-duration-box">

  <label>Duration</label>

  <select
    value={selectedDays}
    onChange={(e) =>
      setSelectedDays(Number(e.target.value))
    }
    className="admin-duration-select"
  >
        <option value={1}>1 Day</option>
        <option value={3}>3 Days</option>
        <option value={7}>7 Days</option>
        <option value={14}>14 Days</option>
        <option value={30}>30 Days</option>
        <option value={60}>60 Days</option>
        <option value={90}>90 Days</option>
      </select>

      </div>

      <div className="admin-preview-card">

  <p>Ends On</p>

  <h3>
    {new Date(
      Date.now() +
      selectedDays * 24 * 60 * 60 * 1000
    ).toLocaleDateString()}
  </h3>

</div>

      <div className="admin-delete-buttons">

        <button
          className="admin-btn"
          onClick={() =>
            setShowFeatureModal(false)
          }
        >
          Cancel
        </button>

        <button
          className="admin-btn admin-btn-secondary"
          onClick={() =>
            featureJob(selectedJob)
          }
        >
          <FiStar />
Feature Job
        </button>

      </div>

    </div>

  </div>

)}

{showUrgentModal && (

  <div
    className="admin-delete-modal-overlay"
    onClick={() => setShowUrgentModal(false)}
  >

    <div
      className="admin-delete-modal"
      onClick={(e) => e.stopPropagation()}
    >

      <h2>
    <FiAlertCircle />
    Mark Job Urgent
</h2>

      <p>
        Select how long this job should remain urgent.
      </p>

      <select
        value={selectedDays}
        onChange={(e) =>
          setSelectedDays(Number(e.target.value))
        }
        className="admin-duration-select"
      >
        <option value={1}>1 Day</option>
        <option value={3}>3 Days</option>
        <option value={7}>7 Days</option>
        <option value={14}>14 Days</option>
        <option value={30}>30 Days</option>
      </select>

      <div className="admin-delete-buttons">

        <button
          className="admin-btn"
          onClick={() => setShowUrgentModal(false)}
        >
          Cancel
        </button>

        <button
          className="admin-btn admin-btn-warning"
          onClick={() => makeUrgent(selectedJob)}
        >
          <FiAlertCircle />
Mark Urgent
        </button>

      </div>

    </div>

  </div>

)}

{showExpiryModal && (

  <div
    className="admin-delete-modal-overlay"
    onClick={() => setShowExpiryModal(false)}
  >

    <div
      className="admin-delete-modal"
      onClick={(e) => e.stopPropagation()}
    >

      <h2>
    <FiClock />
    Extend Job Expiry
</h2>

      <p>

        Current Expiry

      </p>

      <strong>

        {selectedJob?.expires_at
          ? new Date(
              selectedJob.expires_at
            ).toLocaleDateString()
          : "No expiry"}

      </strong>

      <br />
      <br />

      <select
        value={selectedDays}
        onChange={(e) =>
          setSelectedDays(Number(e.target.value))
        }
        className="admin-duration-select"
      >

        <option value={3}>3 Days</option>
        <option value={7}>7 Days</option>
        <option value={14}>14 Days</option>
        <option value={30}>30 Days</option>
        <option value={60}>60 Days</option>
        <option value={90}>90 Days</option>

      </select>

      <br />
      <br />

      <p>

        New Expiry

      </p>

      <strong>

        {new Date(
          Date.now() +
          selectedDays *
          24 *
          60 *
          60 *
          1000
        ).toLocaleDateString()}

      </strong>

      <div className="admin-delete-buttons">

        <button
          className="admin-btn"
          onClick={() =>
            setShowExpiryModal(false)
          }
        >
          Cancel
        </button>

        <button
          className="admin-btn admin-btn-primary"
          onClick={() =>
            extendExpiry(selectedJob)
          }
        >
          ⏰ Extend Job
        </button>

      </div>

    </div>

  </div>

)}

{showDeleteModal && (

  <div
    className="admin-delete-modal-overlay"
    onClick={() => setShowDeleteModal(false)}
  >

    <div
      className="admin-delete-modal"
      onClick={(e) => e.stopPropagation()}
    >

      <h2>
    <FiTrash2 />
    Delete Job
</h2>

      <p>

        Are you sure you want to permanently delete

      </p>

      <h3>{selectedJob?.title}</h3>

      <p style={{ color: "#ef4444" }}>
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
          disabled={deletingJob}
          onClick={() => deleteJob(selectedJob)}
        >
          {deletingJob ? "Deleting..." : "Delete Job"}
        </button>

      </div>

    </div>

  </div>

)}

{showApplications && (

  <div
    className="admin-delete-modal-overlay"
    onClick={() => setShowApplications(false)}
  >

    <div
      className="admin-applications-modal"
      onClick={(e) => e.stopPropagation()}
    >

      <h2>
    <FiUsers />
    Applications
</h2>

      {loadingApplications ? (

        <p>Loading...</p>

      ) : applications.length === 0 ? (

        <p>No applications yet.</p>

      ) : (

        applications.map(app => (

  <div
    key={app.id}
    className="application-card"
  >

    <div className="application-header">

      <img
        src={
          app.users?.avatar_url ||
          "/default-avatar.png"
        }
        alt=""
        className="application-avatar"
      />

      <div className="application-user">

        <h3>{app.users?.full_name}</h3>

        <p>{app.users?.email}</p>

        <div className="application-meta">

  <span>
    <FiMapPin />
    {app.users?.location || "No location"}
  </span>

  <span>
    <FiPhone />
    {app.users?.phone || "No phone"}
  </span>

</div>

        <p className="application-headline">
          {app.users?.headline || "No headline"}
        </p>

      </div>

      <span
        className={`application-status ${app.status}`}
      >
        {app.status}
      </span>

    </div>

    <div className="application-bio">

      <strong>About Applicant</strong>

      <p>
        {app.users?.bio ||
          "This applicant hasn't added a bio yet."}
      </p>

    </div>

    <div className="application-footer">

  <small>
    <FiCalendar />
    Applied on{" "}
    {new Date(app.created_at).toLocaleDateString()}
  </small>

      <div className="application-actions">

        <button
          className="admin-btn admin-btn-primary"
          onClick={() => {
            setSelectedApplicant(app.users)
            setShowProfileModal(true)
          }}
        >
          <FiUser />
  Profile
        </button>

        {app.users?.resume_url && (

  <a
    href={app.users.resume_url}
    target="_blank"
    rel="noopener noreferrer"
    className="application-cv-btn"
  >
    <FiFileText />
    View Resume
  </a>

)}

        <button
          className="admin-btn admin-btn-success"
          onClick={() =>
            updateApplicationStatus(
              app.id,
              "approved"
            )
          }
        >
          <FiCheckCircle />
Accept
        </button>

        <button
          className="admin-btn admin-btn-danger"
          onClick={() =>
            updateApplicationStatus(
              app.id,
              "rejected"
            )
          }
        >
          <FiXCircle />
Reject
        </button>

      </div>

    </div>

  </div>

))

      )}

      <button
        className="admin-btn"
        onClick={() => setShowApplications(false)}
      >
        Close
      </button>

    </div>

  </div>

)}

{showProfileModal && selectedApplicant && (

<div
  className="admin-delete-modal-overlay"
  onClick={() => setShowProfileModal(false)}
>

<div
  className="admin-profile-modal"
  onClick={(e)=>e.stopPropagation()}
>

<img
  src={
    selectedApplicant.avatar_url ||
    "/default-avatar.png"
  }
  className="admin-profile-avatar"
  alt=""
/>

<h2>{selectedApplicant.full_name}</h2>

<p className="admin-profile-email">
  {selectedApplicant.email}
</p>

<div className="admin-profile-grid">

<div>
  <strong>
    <FiPhone />
    Phone
  </strong>
  <p>{selectedApplicant.phone || "Not provided"}</p>
</div>

<div>
  <strong>
    <FiMapPin />
    Location
  </strong>
  <p>{selectedApplicant.location || "Not provided"}</p>
</div>

<div>
  <strong>
    <FiUser />
    Bio
  </strong>
  <p>{selectedApplicant.bio || "No bio yet."}</p>
</div>

<div>
  <strong>
    <FiTool />
    Skills
  </strong>
  <p>{selectedApplicant.skills || "No skills added."}</p>
</div>

<div>
  <strong>
    <FiAward />
    Experience
  </strong>
  <p>{selectedApplicant.experience || "No experience added."}</p>
</div>

</div>

<div className="admin-profile-actions">

  {selectedApplicant.resume_url && (

    <a
      href={selectedApplicant.resume_url}
      target="_blank"
      rel="noreferrer"
      className="application-cv-btn"
    >
      <FiFileText />
View Resume
    </a>

  )}

  <button
    className="admin-btn"
    onClick={() => setShowProfileModal(false)}
  >
    Close
  </button>

</div>

</div>

</div>

)}

      </div>

    </div>
  )
}

export default AdminJobs