function MediaViewer({

  showMediaViewer,
  setShowMediaViewer,

  mediaTab,
  setMediaTab,

  mediaMessages,
  fileMessages,
  audioMessages,

  getFileIcon,

  setCurrentImageIndex,
  setViewImage,
  setShowImageViewer

}) {

  if (!showMediaViewer) return null

  return (

    <div className="media-viewer-overlay">

  <div className="media-viewer-box">

      {/* HEADER */}

      <div className="media-viewer-header">

        <h3>

  Chat Media

  {" "}
  (

  {mediaMessages.length +
   fileMessages.length +
   audioMessages.length}

  )

</h3>

        <button
          onClick={() =>
            setShowMediaViewer(false)
          }
        >

          ✕

        </button>

      </div>

      {/* TABS */}

      <div className="media-tabs">

        <button
          className={
            mediaTab === "media"
              ? "active"
              : ""
          }

          onClick={() =>
            setMediaTab("media")
          }
        >

          Media

        </button>

        <button
          className={
            mediaTab === "files"
              ? "active"
              : ""
          }

          onClick={() =>
            setMediaTab("files")
          }
        >

          Files

        </button>

        <button
          className={
            mediaTab === "audio"
              ? "active"
              : ""
          }

          onClick={() =>
            setMediaTab("audio")
          }
        >

          Voice Notes

        </button>

      </div>

      {/* MEDIA */}

      {mediaTab === "media" && (

        <div className="media-grid">

          {mediaMessages.map((msg, index) => {

  const currentDate =
    new Date(
      msg.created_at
    ).toLocaleDateString()

  const previousDate =
    index > 0

      ? new Date(
          mediaMessages[index - 1]
            .created_at
        ).toLocaleDateString()

      : null

  return (

    <div key={msg.id}>

      {currentDate !== previousDate && (

        <div className="media-group-date">

          {currentDate}

        </div>

      )}

      <div className="media-item">

  

              {msg.image_url && (

    <img
      src={msg.image_url}
      alt=""

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

  {msg.video_url && (

    <video
      src={msg.video_url}
      controls
    />

  )}

  <a
    href={
      msg.image_url ||
      msg.video_url
    }

    download

    target="_blank"

    rel="noreferrer"

    className="media-download-btn"
  >

    Download

  </a>

</div>

</div>

  )

})}

        </div>

      )}

      {/* FILES */}

      {mediaTab === "files" && (

        <div className="media-files-list">

          {fileMessages.map(msg => (

            <a
              key={msg.id}

              href={msg.file_url}

              target="_blank"

              rel="noreferrer"

              className="media-file-item"
            >

              <span>

                {getFileIcon(
                  msg.file_name
                )}

              </span>

              <div>

  <p>
    {msg.file_name}
  </p>

  <small>

    {new Date(
      msg.created_at
    ).toLocaleDateString()}

  </small>

</div>

            </a>

          ))}

        </div>

      )}

      {/* AUDIO */}

{mediaTab === "audio" && (

  <div className="audio-list">

    {audioMessages.map(msg => (

      <div
        key={msg.id}
        className="audio-item"
      >

        <audio
          controls
          src={msg.audio_url}
          className="chat-audio"
        />

        <small>

          {new Date(
            msg.created_at
          ).toLocaleDateString()}

        </small>

        <a
          href={msg.audio_url}
          download
          target="_blank"
          rel="noreferrer"
          className="media-download-btn"
        >

          Download

        </a>

      </div>

    ))}

  </div>

)}

    </div>

    </div>

  )

}

export default MediaViewer