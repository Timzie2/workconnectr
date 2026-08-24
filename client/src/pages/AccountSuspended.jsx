import { useNavigate } from "react-router-dom"
import "../styles/AccountSuspended.css"

function AccountSuspended() {

  const navigate = useNavigate()

  return (

    <div className="account-suspended">

      <div className="account-suspended-card">

        <div className="account-suspended-icon">
          🚫
        </div>

        <h1>
          Account Suspended
        </h1>

        <p>
          Your account has been suspended by an administrator.
        </p>

        <p className="account-suspended-small">
          If you believe this is a mistake, please contact our support team.
        </p>

        <div className="account-suspended-buttons">

          <button
  className="primary-btn"
  onClick={() =>
    window.location.href =
      "mailto:workconnectr.app@gmail.com"
  }
>
  Contact Support
</button>

          <button
            className="secondary-btn"
            onClick={() => navigate("/")}
          >
            Back to Home
          </button>

        </div>

      </div>

    </div>

  )

}

export default AccountSuspended