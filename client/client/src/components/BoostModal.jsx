import PayButton from "./PaystackButton"
import "../styles/BoostModal.css"

function BoostModal({ job, onClose, selectedPlan, setSelectedPlan, user }) {

  // 🔒 Prevent rendering if critical data missing
  if (!job || !user) return null

  const getAmount = () => {
    if (selectedPlan === "basic") return 50000
    if (selectedPlan === "standard") return 150000
    if (selectedPlan === "premium") return 300000
    return 0
  }

  return (
    <div className="modal-overlay">
      <div className="modal">

        <h2>Boost Job</h2>
        <p>Select a plan to promote your job</p>

        {!selectedPlan ? (

          <div className="plans">

            <button
              className="plan basic"
              onClick={() => setSelectedPlan("basic")}
            >
              💎 Basic <br />
              ₦500 • 1 day
            </button>

            <button
              className="plan standard"
              onClick={() => setSelectedPlan("standard")}
            >
              🚀 Standard <br />
              ₦1500 • 7 days
            </button>

            <button
              className="plan premium"
              onClick={() => setSelectedPlan("premium")}
            >
              🔥 Premium <br />
              ₦3000 • 30 days
            </button>

          </div>

        ) : (

          <div style={{ marginTop: "20px" }}>
            <h3>Confirm Payment</h3>

            {/* 🔍 DEBUG (remove later) */}
            {console.log("BoostModal props:", {
              jobId: job?.id,
              selectedPlan,
              user
            })}

            <PayButton
              email={user?.email}
              amount={getAmount()}
              jobId={job?.id}          // 🔥 SAFE ACCESS
              selectedPlan={selectedPlan}
              user={user}             // 🔥 CRITICAL FIX
            />
          </div>

        )}

        <button className="close-btn" onClick={onClose}>
          Cancel
        </button>

      </div>
    </div>
  )
}

export default BoostModal