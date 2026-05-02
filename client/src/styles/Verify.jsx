import { useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import supabase from "../supabaseClient"

function Verify() {

  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {

    const verifyPayment = async () => {

      const params = new URLSearchParams(location.search)

      const reference = params.get("reference")
      const jobId = params.get("jobId")
      const plan = params.get("plan")

      console.log("VERIFYING:", { reference, jobId, plan })

      if (!reference || !jobId || !plan) {
        alert("Missing payment details")
        navigate("/contractor-dashboard")
        return
      }

      try {

        // 🔐 GET CURRENT USER (better than email)
        const { data: userData } = await supabase.auth.getUser()
        const user = userData?.user

        // 🔥 PREVENT DUPLICATE PAYMENT
        const { data: existing } = await supabase
          .from("payments")
          .select("*")
          .eq("reference", reference)
          .maybeSingle()

        if (existing) {
          alert("⚠️ Payment already processed")
          navigate("/contractor-dashboard")
          return
        }

        // 🔥 VERIFY WITH PAYSTACK
        const res = await fetch(
          `https://api.paystack.co/transaction/verify/${reference}`,
          {
            headers: {
              Authorization: `Bearer sk_test_e0046a13a62e426fc11f57ae1ff465f1078fbfc0`
            }
          }
        )

        const data = await res.json()

        console.log("PAYSTACK RESPONSE:", data)

        if (data.status && data.data.status === "success") {

          // ✅ SAVE PAYMENT
          await supabase.from("payments").insert({
            user_id: user?.id,   // ✅ FIXED
            job_id: jobId,
            reference: reference,
            amount: data.data.amount,
            plan: plan,
            status: "success"
          })

          // 🔥 BOOST LOGIC
          const planDays = {
            basic: 1,
            standard: 7,
            premium: 30
          }

          const days = planDays[plan]

          const newExpiry = new Date(
            Date.now() + days * 24 * 60 * 60 * 1000
          )

          const { error } = await supabase
            .from("jobs")
            .update({
              is_featured: true,
              featured_until: newExpiry.toISOString()
            })
            .eq("id", jobId)

          if (error) {
            alert("DB update failed: " + error.message)
            return
          }

          alert("🚀 Job boosted successfully!")
          navigate("/contractor-dashboard")

        } else {
          alert("Payment not successful")
          navigate("/contractor-dashboard")
        }

      } catch (err) {
        console.error(err)
        alert("Verification failed")
        navigate("/contractor-dashboard")
      }
    }

    verifyPayment()

  }, [location, navigate])

  return (
    <div style={{ padding: "40px", textAlign: "center" }}>
      <h2>Verifying Payment...</h2>
      <p>Please wait, do not close this page.</p>
    </div>
  )
}

export default Verify