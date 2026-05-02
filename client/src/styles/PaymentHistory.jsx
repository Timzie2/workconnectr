import { useEffect, useState } from "react"
import supabase from "../supabaseClient"
import ContractorNavbar from "../components/ContractorNavbar"


function PaymentHistory() {

  const [payments, setPayments] = useState([])
  const [filteredPayments, setFilteredPayments] = useState([])
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("all")

  const [currentPage, setCurrentPage] = useState(1)
  const paymentsPerPage = 5

  useEffect(() => {
    getPayments()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [search, filter, payments])

  const getPayments = async () => {
    const { data } = await supabase.auth.getSession()
    if (!data.session) return

    const user = data.session.user

    const { data: paymentsData, error } = await supabase
      .from("payments")
      .select(`
        id,
        amount,
        plan,
        status,
        created_at,
        jobs ( title )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (!error) {
      setPayments(paymentsData || [])
      setFilteredPayments(paymentsData || [])
    }
  }

  const applyFilters = () => {
    let data = [...payments]

    if (search.trim()) {
      const query = search.toLowerCase()

      data = data.filter(p =>
        p.jobs?.title?.toLowerCase().includes(query) ||
        p.plan.toLowerCase().includes(query)
      )
    }

    const now = new Date()

    if (filter === "today") {
      data = data.filter(p =>
        new Date(p.created_at).toDateString() === now.toDateString()
      )
    }

    if (filter === "week") {
      const weekAgo = new Date()
      weekAgo.setDate(now.getDate() - 7)
      data = data.filter(p => new Date(p.created_at) >= weekAgo)
    }

    if (filter === "month") {
      const monthAgo = new Date()
      monthAgo.setMonth(now.getMonth() - 1)
      data = data.filter(p => new Date(p.created_at) >= monthAgo)
    }

    setFilteredPayments(data)
    setCurrentPage(1)
  }

  const totalAmount = filteredPayments.reduce((sum, p) => sum + p.amount, 0)

  // 🔥 PAGINATION
  const indexOfLast = currentPage * paymentsPerPage
  const indexOfFirst = indexOfLast - paymentsPerPage
  const currentPayments = filteredPayments.slice(indexOfFirst, indexOfLast)
  const totalPages = Math.ceil(filteredPayments.length / paymentsPerPage)

  // 🔥 PAGE NUMBERS
  const pageNumbers = []
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i)
  }

  // 📥 RECEIPT (₦ FIXED PROPERLY)
  const downloadReceipt = async (payment) => {
  const { jsPDF } = await import("jspdf") // ✅ dynamic import

  const doc = new jsPDF()

  doc.setFillColor(37, 99, 235)
  doc.rect(0, 0, 210, 30, "F")

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.text("WorkConnectr", 20, 18)

  doc.setFontSize(12)
  doc.text("Payment Receipt", 140, 18)

  doc.setTextColor(0, 0, 0)

  doc.rect(15, 40, 180, 90)

  let y = 55

  const addRow = (label, value) => {
    doc.setFont(undefined, "bold")
    doc.text(label, 20, y)

    doc.setFont(undefined, "normal")
    doc.text(String(value), 90, y)

    y += 10
  }

  addRow("Job:", payment.jobs?.title || "Job")
  addRow("Plan:", payment.plan.toUpperCase())
  addRow("Amount:", `₦${payment.amount.toLocaleString()}`)
  addRow("Status:", payment.status.toUpperCase())
  addRow("Date:", new Date(payment.created_at).toLocaleDateString("en-NG"))
  addRow("Reference:", `#${payment.id}`)

  doc.setFontSize(14)
  doc.text(`Total Paid: ₦${payment.amount.toLocaleString()}`, 20, y + 15)

  doc.setFontSize(10)
  doc.text("Thank you for using WorkConnectr!", 20, 160)

  doc.save(`receipt_${payment.id}.pdf`)
}

  return (
    <>
      <ContractorNavbar />

      <div className="dashboard-container">

        <h1 className="dashboard-title">💰 Payment History</h1>

        <div className="payment-controls">
          <input
            type="text"
            placeholder="Search job or plan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />

          <div className="filters">
            <button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>All</button>
            <button className={filter === "today" ? "active" : ""} onClick={() => setFilter("today")}>Today</button>
            <button className={filter === "week" ? "active" : ""} onClick={() => setFilter("week")}>This Week</button>
            <button className={filter === "month" ? "active" : ""} onClick={() => setFilter("month")}>This Month</button>
          </div>
        </div>

        <p style={{ marginTop: "10px", opacity: 0.8 }}>
          Total: <strong>{"₦" + totalAmount.toLocaleString()}</strong>
        </p>

        <p className="showing-text">
          Showing {currentPayments.length} of {filteredPayments.length} payments
        </p>

        {filteredPayments.length === 0 ? (
          <p style={{ opacity: 0.6, marginTop: "20px" }}>
            No payments found
          </p>
        ) : (
          <>
            <div className="payments-table">
              <table>
                <thead>
                  <tr>
                    <th>Job</th>
                    <th>Plan</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {currentPayments.map((p) => (
                    <tr key={p.id}>
                      <td>{p.jobs?.title || "Job"}</td>
                      <td className={`plan ${p.plan}`}>{p.plan}</td>
                      <td>{"₦" + p.amount.toLocaleString()}</td>
                      <td className={`status ${p.status}`}>{p.status}</td>
                      <td>
                        {new Date(p.created_at).toLocaleDateString("en-NG", {
                          day: "numeric",
                          month: "short",
                          year: "numeric"
                        })}
                      </td>
                      <td>
                        <button
                          className="receipt-btn"
                          onClick={() => downloadReceipt(p)}
                        >
                          📥 Download
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 🔥 PAGINATION WITH NUMBERS */}
            <div className="pagination">

              <button
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
              >
                ⬅
              </button>

              <div className="page-numbers">
                {pageNumbers.map(num => (
                  <button
                    key={num}
                    className={currentPage === num ? "active-page" : ""}
                    onClick={() => setCurrentPage(num)}
                  >
                    {num}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                ➡
              </button>

            </div>
          </>
        )}

      </div>
    </>
  )
}

export default PaymentHistory