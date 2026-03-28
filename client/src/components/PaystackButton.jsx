import { PaystackButton } from "react-paystack"

function PayButton({
  jobId,
  email,
  userId,
  loading,
  startLoading,
  stopLoading,
  onSuccess
}) {

  const publicKey = "pk_test_381c898e5ce344e689d30c21daf0397d3b9cf9dd"

  const VERIFY_URL =
    "https://vpmddvbycrexfxonovds.supabase.co/functions/v1/verify-payment"

  // ❌ BLOCK IF DATA NOT READY
  if (!jobId || !email || !userId) {
    return (
      <button className="boost-btn disabled" disabled>
        Loading...
      </button>
    )
  }

  const componentProps = {
    email,
    amount: 50000,
    currency: "NGN",

    metadata: {
      job_id: jobId,
      user_id: userId
    },

    publicKey,

    text: loading ? "Processing..." : "💎 Boost Job",

    onSuccess: async (reference) => {

      if (loading) return

      startLoading() // 🔥 START LOADING (FROM PARENT)

      try {
        console.log("Payment success:", reference)

        const payload = {
          reference: reference.reference,
          jobId,
          userId
        }

        const res = await fetch(VERIFY_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        })

        if (!res.ok) {
          const text = await res.text()
          console.error("Server error:", text)
          alert("Verification failed")
          stopLoading()
          return
        }

        const data = await res.json()

        if (!data.success) {
          alert(data.message || "❌ Payment failed")
          stopLoading()
          return
        }

        if (onSuccess) onSuccess()

        alert("🚀 Job boosted successfully!")

      } catch (err) {
        console.error(err)
        alert("Something went wrong")
        stopLoading()
      } finally {
        stopLoading() // 🔥 ALWAYS RESET
      }
    },

    onClose: () => {
      console.log("Payment closed")
      stopLoading() // 🔥 IMPORTANT
    }
  }

  return (
    <PaystackButton
      {...componentProps}
      className={`boost-btn ${loading ? "disabled" : ""}`}
      disabled={loading}
    />
  )
}

export default PayButton