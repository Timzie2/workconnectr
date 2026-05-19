function UserConversation({
  user,
  displayName,
  lastMessage,
  unreadCount,
  active,
  online,
  onClick
}) {

  return (

    <div
      onClick={onClick}
      className={`conversation-card ${active ? "active" : ""}`}
    >

      <div className="conversation-avatar-wrapper">

        <img
          src={
            user?.avatar_url ||
            "/default-avatar.png"
          }
          className="conversation-avatar"
        />

        {online && (
          <span className="online-dot"></span>
        )}

      </div>

      <div className="conversation-info">

        <div className="conversation-top">

          <h4>
  {displayName ||
    user?.full_name ||
    "User"}
</h4>

          {unreadCount > 0 && (
            <span className="unread-badge">
              {unreadCount}
            </span>
          )}

        </div>

        <p className="conversation-last-message">
          {lastMessage || "Start chatting"}
        </p>

      </div>

    </div>
  )
}

export default UserConversation