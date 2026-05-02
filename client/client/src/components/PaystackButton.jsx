import { useState } from "react"
import { usePaystackPayment } from "react-paystack"
import "../styles/payments.css"

function PayButton({ email, amount, jobId, selectedPlan, user }) {

  const [loading, setLoading] = useState(false)

  const publicKey = "pk_test_381c898e5ce344e689d30c21daf0397d3b9cf9dd"

  const reference = `job_${jobId}_${Date.now()}`

  const config = {
    reference,
    email,
    amount,
    publicKey,
    currency: "NGN",
    metadata: {
      jobId,
      userId: user?.id,
      plan: selectedPlan
    }
  }

  const initializePayment = usePaystackPayment(config)

  const handlePayment = (e) => {
    e.preventDefault()

    if (!email || !jobId || !selectedPlan || !user?.id) {
      alert("Missing payment details ❌")
      return
    }

    console.log("🚀 Starting payment...")
    console.log("REFERENCE:", reference)

    setLoading(true)

    initializePayment({
      onSuccess: () => {
        setLoading(false)

        alert("Payment received! Processing... 🚀")

        // reload to reflect webhook update
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      },

      onClose: () => {
        setLoading(false)
        alert("Payment cancelled ❌")
      }
    })
  }

  return (
    <button
      type="button"
      className="boost-btn"
      onClick={handlePayment}
      disabled={loading}
    >
      {loading ? "Processing..." : "💳 Pay Now"}
    </button>
  )
}

export default PayButton