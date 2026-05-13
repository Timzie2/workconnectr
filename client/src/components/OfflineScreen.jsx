import "../styles/Offline.css"

function OfflineScreen() {

  return (
    <div className="offline-screen">

      <div className="offline-card">

        <div className="offline-icon">
          📡
        </div>

        <h2>No Internet Connection</h2>

        <p>
          WorkConnectr couldn't connect to the server.
          Check your internet and try again.
        </p>

        <button
  className="retry-btn"
  onClick={() => window.location.reload()}
>
  Retry
</button>

      </div>

    </div>
  )
}

export default OfflineScreen