import { useEffect, useState } from "react"
import supabase from "../supabaseClient"
import AdminSidebar from "../components/AdminSidebar"
import "../styles/AdminCategories.css"
import toast from "react-hot-toast"

import {
  FiGrid,
  FiSearch,
  FiPlus,
  FiEye,
  FiCheckCircle,
  FiXCircle
} from "react-icons/fi"

function AdminCategories() {

  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const [selectedCategory, setSelectedCategory] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editName, setEditName] = useState("")
  const [editIcon, setEditIcon] = useState("")
  const [editColor, setEditColor] = useState("")
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newName, setNewName] = useState("")
  const [newIcon, setNewIcon] = useState("💼")
  const [newColor, setNewColor] = useState("#22c55e")
  const [newStatus, setNewStatus] = useState(true)

const [adding, setAdding] = useState(false)
  const categoryIcons = {
  Popular: [
    "💻","🛠️","⚡","🧹","🎨","📷",
    "💼","📚","🏠","🚗","📱","📦"
  ],

  "Construction & Trades": [
    "🧱","🔨","🪚","🪜","⚒️","🏗️",
    "🪛","🔧","⚙️","🧰"
  ],

  Technology: [
    "💻","🖥️","⌨️","🖱️","🌐",
    "📡","🔒","🤖","💾","📱"
  ],

  Business: [
    "💼","📈","📊","🧾","💰",
    "🏦","🛒","📢"
  ],

  Creative: [
    "🎨","📷","🎬","🎵","🎤",
    "🖌️","✏️","🎭"
  ],

  Services: [
    "🧹","🍔","🚚","🩺","💄",
    "✂️","🌿","🧵"
  ]
}

  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0
  })

  useEffect(() => {
    fetchCategories()
  }, [])

  async function fetchCategories() {

  setLoading(true)

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name", { ascending: true })

  if (error) {
    console.error(error)
    toast.error("Failed to fetch categories")
    setLoading(false)
    return
  }

  setCategories(data || [])

  setStats({
    total: data.length,

    active: data.filter(
      category => category.is_active
    ).length,

    inactive: data.filter(
      category => !category.is_active
    ).length
  })

  setLoading(false)

}

function closeAddModal() {

  setShowAddModal(false)

  setNewName("")
  setNewIcon("💼")
  setNewColor("#22c55e")
  setNewStatus(true)

}

function closeEditModal() {

  setShowEditModal(false)

  setEditName("")
  setEditIcon("")
  setEditColor("")

}

async function toggleCategoryStatus(category) {

  try {

    const { error } = await supabase
      .from("categories")
      .update({
        is_active: !category.is_active
      })
      .eq("id", category.id)

    if (error) throw error

    toast.success(
      category.is_active
        ? "Category disabled."
        : "Category enabled."
    )

    setShowModal(false)

    fetchCategories()

  } catch (err) {

    toast.error(err.message)

  }

}

async function updateCategory() {

  try {

    const { error } = await supabase
      .from("categories")
      .update({

        name: editName,

        slug: editName
          .toLowerCase()
          .replace(/\s+/g, "-"),

        icon: editIcon.trim() || "💼",
        color: editColor

      })
      .eq("id", selectedCategory.id)

    if (error) throw error

    toast.success("Category updated successfully.")

closeEditModal()

fetchCategories()

  } catch (err) {

    toast.error(err.message)

  }

}

async function deleteCategory() {

  setDeleting(true)

  try {

    const { count, error: countError } = await supabase
      .from("jobs")
      .select("*", {
        count: "exact",
        head: true
      })
      .eq("category", selectedCategory.name)

    if (countError) throw countError

    if (count > 0) {

      toast.error(
        `This category is being used by ${count} job(s). Disable it instead.`
      )

      return

    }

    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("id", selectedCategory.id)

    if (error) throw error

    toast.success("Category deleted successfully.")

    setShowDeleteModal(false)

    fetchCategories()

  } catch (err) {

    toast.error(err.message)

  } finally {

    setDeleting(false)

  }

}

async function addCategory() {

  if (!newName.trim()) {
    toast.error("Category name is required.")
    return
  }

  setAdding(true)

  try {

    const slug = newName
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")

    const { data: existing } = await supabase
      .from("categories")
      .select("id")
      .or(`name.ilike.${newName},slug.eq.${slug}`)
      .maybeSingle()

    if (existing) {
      toast.error("A category with this name already exists.")
      return
    }

    const { error } = await supabase
      .from("categories")
      .insert({
        name: newName.trim(),
        slug,
        icon: newIcon.trim() || "💼",
        color: newColor,
        is_active: newStatus
      })

    if (error) throw error

    toast.success("Category added successfully.")

closeAddModal()

fetchCategories()

  } catch (err) {

    toast.error(err.message)

  } finally {

    setAdding(false)

  }

}

const filteredCategories = categories.filter(category => {

  const matchesSearch =
    (category.name || "")
      .toLowerCase()
      .includes(search.toLowerCase())

  const matchesStatus =
    statusFilter === "all" ||
    (statusFilter === "active" && category.is_active) ||
    (statusFilter === "inactive" && !category.is_active)

  return matchesSearch && matchesStatus

})

  return (

    <div className="admin-layout">

      <AdminSidebar />

      <div className="admin-content">

        <h1 className="admin-category-title">
  <FiGrid />
  Categories
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
    <option value="all">All Categories</option>
    <option value="active">Active</option>
    <option value="inactive">Inactive</option>
  </select>

  <button
  className="admin-btn admin-btn-success"
  onClick={() => setShowAddModal(true)}
>
    <FiPlus />
    Add Category
  </button>

</div>

<div className="admin-users-stats">

  <div className="admin-users-stat-card">
    <FiGrid className="stat-icon" />
    <h2>{stats.total}</h2>
    <p>Total Categories</p>
  </div>

  <div className="admin-users-stat-card">
    <FiCheckCircle className="stat-icon success" />
    <h2>{stats.active}</h2>
    <p>Active</p>
  </div>

  <div className="admin-users-stat-card">
    <FiXCircle className="stat-icon danger" />
    <h2>{stats.inactive}</h2>
    <p>Inactive</p>
  </div>

</div>

{loading ? (

  <p>Loading categories...</p>

) : (

  <div className="admin-category-table-wrapper">

    <table className="admin-category-table">

      <thead>

        <tr>
          <th>Icon</th>
          <th>Category</th>
          <th>Slug</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>

      </thead>

      <tbody>

        {filteredCategories.length === 0 ? (

          <tr>

            <td
              colSpan="5"
              className="admin-empty-state"
            >
              No categories found.
            </td>

          </tr>

        ) : (

          filteredCategories.map(category => (

            <tr key={category.id}>

              <td>
  <div
    className="category-icon-circle"
    style={{ backgroundColor: category.color }}
  >
    {category.icon}
  </div>
</td>

              <td>{category.name}</td>

              <td>{category.slug}</td>

              <td>

                <span
                  className={`admin-badge ${
                    category.is_active
                      ? "active"
                      : "inactive"
                  }`}
                >
                  {category.is_active
                    ? "Active"
                    : "Inactive"}
                </span>

              </td>

              <td>

                <button
                  className="admin-btn admin-btn-primary"
                  onClick={() => {
                    setSelectedCategory(category)
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

{showModal && selectedCategory && (

  <div
    className="admin-user-modal-overlay"
    onClick={() => setShowModal(false)}
  >

    <div
      className="admin-user-modal"
      onClick={(e) => e.stopPropagation()}
    >

      <div className="admin-user-header">

        <div
  className="category-icon-circle large"
  style={{ backgroundColor: selectedCategory.color }}
>
  {selectedCategory.icon}
</div>

        <h2>{selectedCategory.name}</h2>

        <p>
          Category Information
        </p>

      </div>

      <div className="admin-user-details">

        <div className="admin-user-detail">

          <strong>Name</strong>

          <span>{selectedCategory.name}</span>

        </div>

        <div className="admin-user-detail">

          <strong>Slug</strong>

          <span>{selectedCategory.slug}</span>

        </div>

        <div className="admin-user-detail">

          <strong>Icon</strong>

          <span>{selectedCategory.icon}</span>

        </div>

        <div className="admin-user-detail">

          <strong>Color</strong>

          <span>{selectedCategory.color}</span>

        </div>

        <div className="admin-user-detail">

          <strong>Status</strong>

          <span
            className={`admin-badge ${
              selectedCategory.is_active
                ? "active"
                : "inactive"
            }`}
          >
            {selectedCategory.is_active
              ? "Active"
              : "Inactive"}
          </span>

        </div>

        <div className="admin-user-detail">

          <strong>Created</strong>

          <span>
            {new Date(
              selectedCategory.created_at
            ).toLocaleDateString()}
          </span>

        </div>

      </div>

      <div className="admin-user-actions">

        <button
  className="admin-btn admin-btn-primary"
  onClick={() => {

  setEditName(selectedCategory.name)
  setEditIcon(selectedCategory.icon)
  setEditColor(selectedCategory.color)

  setShowModal(false)
  setShowEditModal(true)

}}
>
  Edit
</button>

        <button
  className="admin-btn admin-btn-warning"
  onClick={() =>
    toggleCategoryStatus(selectedCategory)
  }
>
  {selectedCategory.is_active
    ? "Disable"
    : "Enable"}
</button>

        <button
  className="admin-btn admin-btn-danger"
  onClick={() => {
    setShowModal(false)
    setShowDeleteModal(true)
  }}
>
  Delete
</button>

      </div>

      <button
        className="admin-btn admin-btn-secondary"
        onClick={() => setShowModal(false)}
      >
        Close
      </button>

    </div>

  </div>

)}

{showEditModal && (

  <div
    className="admin-user-modal-overlay"
    onClick={closeEditModal}
  >

    <div
      className="admin-user-modal"
      onClick={(e) => e.stopPropagation()}
    >

      <h2>Edit Category</h2>

<input
  className="edit-category-input"
  value={editName}
  onChange={(e) => setEditName(e.target.value)}
  placeholder="Category Name"
/>

<div className="icon-picker-section">

  <label className="icon-label">
    Category Icon
  </label>

  <p className="icon-helper">
    Choose an icon or enter your own below.
  </p>

  {/* 👇 Replace the old icon-grid with this */}
  {Object.entries(categoryIcons).map(([group, icons]) => (

    <div key={group} className="icon-group">

      <h4 className="icon-group-title">
        {group}
      </h4>

      <div className="icon-grid">

        {icons.map((icon) => (

          <button
            key={icon}
            type="button"
            className={`icon-option ${
              editIcon === icon ? "selected" : ""
            }`}
            onClick={() => setEditIcon(icon)}
          >
            {icon}
          </button>

        ))}

      </div>

    </div>

  ))}

  <div className="icon-divider">
    <span>Or use any emoji</span>
  </div>

  <input
    type="text"
    className="custom-icon-input"
    placeholder="😀"
    maxLength={2}
    value={editIcon}
    onChange={(e) => setEditIcon(e.target.value)}
  />

</div>

<div className="color-picker-row">

  <label>Category Color</label>

  <input
    type="color"
    value={editColor}
    onChange={(e)=>setEditColor(e.target.value)}
  />

</div>

<div className="admin-user-actions">

  <button
    className="admin-btn admin-btn-success"
    onClick={updateCategory}
  >
    Save Changes
  </button>

  <button
    className="admin-btn admin-btn-secondary"
   onClick={closeEditModal}
  >
    Cancel
  </button>

</div>

    </div>

  </div>

)}

{showDeleteModal && selectedCategory && (

  <div
    className="admin-user-modal-overlay"
    onClick={() => setShowDeleteModal(false)}
  >

    <div
      className="admin-user-modal delete-modal"
      onClick={(e) => e.stopPropagation()}
    >

      <div className="admin-user-header">

        <h2>Delete Category</h2>

        <p>
          Are you sure you want to delete
          <strong> "{selectedCategory.name}"</strong>?
        </p>

      </div>

      <div className="delete-warning">

  <strong>Warning</strong>

  This action permanently removes this category from the system.

  If this category is currently assigned to existing jobs, it cannot be deleted.
  Disable it instead to prevent new jobs from using it.

</div>

      <div className="admin-user-actions">

        <button
          className="admin-btn admin-btn-secondary"
          onClick={() => setShowDeleteModal(false)}
          disabled={deleting}
        >
          Cancel
        </button>

        <button
          className="admin-btn admin-btn-danger"
          onClick={deleteCategory}
          disabled={deleting}
        >
          {deleting ? "Deleting..." : "Delete Category"}
        </button>

      </div>

    </div>

  </div>

)}

{showAddModal && (

  <div
    className="admin-user-modal-overlay"
    onClick={closeAddModal}
  >

    <div
      className="admin-user-modal"
      onClick={(e) => e.stopPropagation()}
    >

      <h2>Add Category</h2>

      <input
        className="edit-category-input"
        value={newName}
        onChange={(e) => setNewName(e.target.value)}
        placeholder="Category Name"
      />

      <div className="icon-picker-section">

        <label className="icon-label">
          Category Icon
        </label>

        <p className="icon-helper">
          Choose an icon or enter your own below.
        </p>

        {Object.entries(categoryIcons).map(([group, icons]) => (

          <div key={group} className="icon-group">

            <h4 className="icon-group-title">
              {group}
            </h4>

            <div className="icon-grid">

              {icons.map((icon) => (

                <button
                  key={icon}
                  type="button"
                  className={`icon-option ${
                    newIcon === icon ? "selected" : ""
                  }`}
                  onClick={() => setNewIcon(icon)}
                >
                  {icon}
                </button>

              ))}

            </div>

          </div>

        ))}

        <div className="icon-divider">
          <span>Or use any emoji</span>
        </div>

        <input
          type="text"
          className="custom-icon-input"
          placeholder="😀"
          maxLength={2}
          value={newIcon}
          onChange={(e) => setNewIcon(e.target.value)}
        />

      </div>

      <div className="color-picker-row">

        <label>Category Color</label>

        <input
          type="color"
          value={newColor}
          onChange={(e) => setNewColor(e.target.value)}
        />

      </div>

      <div className="status-row">

        <label>Status</label>

        <select
          value={newStatus ? "active" : "inactive"}
          onChange={(e) =>
            setNewStatus(e.target.value === "active")
          }
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

      </div>

      <div className="admin-user-actions">

        <button
          className="admin-btn admin-btn-secondary"
          onClick={closeAddModal}
        >
          Cancel
        </button>

        <button
          className="admin-btn admin-btn-success"
          onClick={addCategory}
          disabled={adding}
        >
          {adding ? "Adding..." : "Add Category"}
        </button>

      </div>

    </div>

  </div>

)}

      </div>

    </div>

  )

}

export default AdminCategories