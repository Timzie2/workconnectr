import React from "react"
import supabase from "../supabaseClient"
function MessageBubble(props) {

  const {
    msg,
    userId,
    hoveredMessage,
    setHoveredMessage,
    selectedMessage,
    setSelectedMessage,
    setMenuPosition,
    setShowMessageMenu,
    reactionPickerFor,
    setReactionPickerFor,
    mediaMessages,
    setCurrentImageIndex,
    setViewImage,
    setShowImageViewer,
    setMessages,
    getFileIcon
  } = props

  const isMine =
    msg.sender_id === userId

  return (

    <div
      className={`
        chat-message
        ${isMine ? "mine" : ""}
      `}
    >

              <div
  className="message-bubble"

  onMouseEnter={() =>
    setHoveredMessage(msg.id)
  }

  onMouseLeave={() =>
    setHoveredMessage(null)
  }

  onContextMenu={(e) => {

    e.preventDefault()

    setSelectedMessage(msg)

    setMenuPosition({
      x: e.clientX,
      y: e.clientY
    })

    setShowMessageMenu(true)

  }}

  onClick={(e) => {

    if (window.innerWidth < 768) {

      setSelectedMessage(msg)

      setMenuPosition({
        x: e.clientX,
        y: e.clientY
      })

      setShowMessageMenu(true)

    }

  }}
>

  {hoveredMessage === msg.id && (

    <button
      className="message-hover-btn"

      onClick={(e) => {

        e.stopPropagation()

        setSelectedMessage(msg)

        setMenuPosition({
          x: e.clientX,
          y: e.clientY
        })

        setShowMessageMenu(true)

      }}
    >

      ⋮

    </button>

  )}

  {msg.image_url && (

    <img
      src={msg.image_url}
      className="chat-image"

      onClick={() => {

  const images =
    mediaMessages.filter(
      m => m.image_url
    )

  const index =
    images.findIndex(
      m =>
        m.image_url ===
        msg.image_url
    )

  setCurrentImageIndex(index)

  setViewImage(msg.image_url)

  setShowImageViewer(true)

}}
    />

  )}

  {msg.audio_url && (

  <div className="audio-message">

    <audio
      controls
      src={msg.audio_url}
      className="chat-audio"
    />

  </div>

)}

  {msg.video_url && (

  <video
    src={msg.video_url}
    controls
    className="chat-video"
  />

)}

  {msg.file_url &&
 !msg.file_name?.match(
   /\.(png|jpg|jpeg|gif|mp4|mov|avi)$/i
 ) && (

  <a
    href={msg.file_url}
    target="_blank"
    rel="noreferrer"
    className="chat-file"
  >

    <div className="chat-file-icon">

      {getFileIcon(msg.file_name)}

    </div>

    <div className="chat-file-info">

      <span className="chat-file-name">

        {msg.file_name || "File"}

      </span>

      <span className="chat-file-type">

        File

      </span>

    </div>

  </a>

)}

  {msg.replied_text && (

  <div className="reply-message-box">

    <small>
      {msg.replied_sender}
    </small>

    <p>
      {msg.replied_text}
    </p>

  </div>

)}

  {msg.message && (
  <p>{msg.message}</p>
)}

{reactionPickerFor === msg.id && (

  <div
  className="reaction-picker"

  onClick={(e) =>
    e.stopPropagation()
  }
>

    {["❤️","😂","🔥","👍","😭","😮"].map(
      emoji => (

      <span
        key={emoji}

        onClick={async () => {

          const existingReaction =
  msg.reactions?.find(
    reaction =>
      reaction.user_id === userId
  )

let updatedReactions = [
  ...(msg.reactions || [])
]

// USER ALREADY REACTED

if (existingReaction) {

  // SAME EMOJI = REMOVE REACTION

  if (
    existingReaction.emoji === emoji
  ) {

    updatedReactions =
      updatedReactions.filter(
        reaction =>
          reaction.user_id !== userId
      )

  }

  // DIFFERENT EMOJI = REPLACE

  else {

    updatedReactions =
      updatedReactions.map(
        reaction =>

          reaction.user_id === userId

            ? {
                ...reaction,
                emoji
              }

            : reaction
      )

  }

}

// NO REACTION YET

else {

  updatedReactions.push({
    emoji,
    user_id: userId
  })

}

const { error } = await supabase
  .from("messages")
  .update({
    reactions: updatedReactions
  })
  .eq("id", msg.id)

if (error) {
  console.error(error)
  return
}

// INSTANT UI UPDATE

setMessages(prev =>

  prev.map(message =>

    message.id === msg.id

      ? {
          ...message,
          reactions: updatedReactions
        }

      : message

  )

)

setReactionPickerFor(null)

        }}
      >

        {emoji}

      </span>

    ))}

  </div>

)}

  <div className="message-meta">

    <span>

      {new Date(
        msg.created_at
      ).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      })}

    </span>

    {isMine && (

      <small
        className={`
          read-status
          ${msg.is_read ? "seen" : ""}
        `}
      >

        {msg.is_read ? "✓✓" : "✓"}

      </small>

    )}

  </div>

  {msg.reactions?.length > 0 && (

    <div className="message-reactions">

      {msg.reactions.map(
        (reaction, index) => (

          <span key={index}>
            {reaction.emoji}
          </span>

        )
      )}

    </div>

  )}

</div>

</div>

)

}

export default React.memo(MessageBubble)