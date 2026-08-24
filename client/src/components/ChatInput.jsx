import EmojiPicker from "emoji-picker-react"
import { FiImage } from "react-icons/fi"

function ChatInput(props) {

  const {
    text,
    setText,
    sendMessage,
    inputRef,

    showEmojiPicker,
    setShowEmojiPicker,

    showAttachMenu,
    setShowAttachMenu,

    recording,
    startRecording,
    stopRecording,

    handleEmojiClick,
    handleImageUpload,
    handleDocumentUpload,
    handleVideoUpload,
    openCamera,

    typingChannelRef,
    typingTimeoutRef,

    userId,
    conversationId
  } = props

  return (

    <>
      <div className="chat-input-area">

        <div className="emoji-wrapper">

  <button
  type="button"
  className="emoji-btn"

    onClick={() =>
      setShowEmojiPicker(
        !showEmojiPicker
      )
    }
  >

    <span className="emoji-icon">😀</span>

  </button>

  {showEmojiPicker && (

    <div className="emoji-picker-container">

      <EmojiPicker
  onEmojiClick={handleEmojiClick}
  theme="dark"
  width={340}
  height={400}
  searchPlaceholder="Search emoji..."
  previewConfig={{
    showPreview: false
  }}
  lazyLoadEmojis={true}
  skinTonesDisabled
/>

    </div>

  )}

</div>

        <div className="attach-menu-wrapper">

 {/* PLUS BUTTON */}

<button
  type="button"
  className={`attach-toggle-btn ${
  showAttachMenu ? "open" : ""
}`}

  onClick={() =>
    setShowAttachMenu(prev => !prev)
  }
>

  <span className="attach-plus-icon">
  +
</span>

</button>

  {/* ATTACH MENU */}

  {showAttachMenu && (

    <div className="attach-menu">

      {/* PHOTOS */}

      <label className="attach-option">

  <span className="attach-icon">

    <FiImage />

  </span>

  <span>Photos</span>

  <input
    type="file"
    accept="image/*"
    hidden
    onChange={handleImageUpload}
  />

</label>

      {/* CAMERA */}

<div
  className="attach-option"

  onClick={openCamera}
>

  <span className="attach-icon">
    📷
  </span>

  <span>Camera</span>

</div>

      {/* FILES */}

<label className="attach-option">

  <span className="attach-icon">
    📎
  </span>

  <span>Files</span>

  <input
    type="file"
    hidden
    accept="
audio/*,
.pdf,
.doc,
.docx,
.xls,
.xlsx,
.ppt,
.pptx,
.zip,
.rar
"
    onChange={handleDocumentUpload}
  />

</label>

      {/* VIDEOS */}

      <label className="attach-option">

  <span className="attach-icon">
    🎥
  </span>

  <span>Videos</span>

  <input
    type="file"
    accept="video/*"
    hidden
    onChange={handleVideoUpload}
  />

</label>

    </div>

  )}

</div>

        <input
  ref={inputRef}
  value={text}
          onChange={(e) => {

  setText(e.target.value)

  console.log("Typing payload", {
  userId,
  conversationId,
  isTyping: e.target.value.length > 0
})

  typingChannelRef.current?.send({

    type: "broadcast",

    event: "typing",

    payload: {
      userId,
      conversationId,
      isTyping:
        e.target.value.length > 0
    }

  })

  clearTimeout(
  typingTimeoutRef.current
)

typingTimeoutRef.current =
  setTimeout(() => {

    typingChannelRef.current?.send({

      type:"broadcast",

      event:"typing",

      payload:{
        userId,
        conversationId,
        isTyping:false
      }

    })

  }, 1200)

}}
          onKeyDown={(e) =>
            e.key === "Enter" &&
            sendMessage()
          }
          placeholder="Type a message..."
        />

        {text.trim() ? (

  <button
    className="send-btn"
    onClick={sendMessage}
  >

    Send

  </button>

) : (

  recording ? (

    <div className="recording-ui">

      <div className="recording-dot"></div>

      <div className="voice-wave">

        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>

      </div>

      <button
        type="button"
        className="voice-btn recording"

        onClick={stopRecording}
      >

        ⏹️

      </button>

    </div>

  ) : (

    <button
      type="button"
      className="voice-btn"

      onClick={startRecording}
    >

      🎤

    </button>

  )

)}

      </div>

    </>

  )

}

export default ChatInput