function UploadPreviewModal({

  imagePreview,
  imageCaption,
  setImageCaption,
  setSelectedImage,
  setImagePreview,
  sendImage,

  videoPreview,
  setSelectedVideo,
  setVideoPreview,
  sendVideo,

  documentPreview,
  setSelectedDocument,
  setDocumentPreview,
  sendDocument,

  audioPreview,
  setAudioBlob,
  setAudioPreview,
  sendVoiceNote,

  getFileIcon

}) {

  return (

    <>
    
      {imagePreview && (

        <div className="image-preview-overlay">

          <div className="image-preview-box">

            <img
              src={imagePreview}
              className="preview-image"
              alt=""
            />

            <div className="preview-caption-area">

              <input
                type="text"
                value={imageCaption}
                onChange={(e) =>
                  setImageCaption(
                    e.target.value
                  )
                }
                placeholder="Add a caption..."
              />

            </div>

            <div className="preview-actions">

              <div className="preview-image-info">

                <p>
                  Ready to send
                </p>

              </div>

              <button
                className="cancel-preview-btn"
                onClick={() => {

                  setSelectedImage(null)
                  setImagePreview("")

                }}
              >

                Cancel

              </button>

              <button
                className="send-preview-btn"
                onClick={sendImage}
              >

                Send

              </button>

            </div>

          </div>

        </div>

      )}

      {videoPreview && (

        <div className="image-preview-overlay">

          <div className="image-preview-box">

            <video
              src={videoPreview}
              controls
              className="preview-video"
            />

            <div className="image-preview-actions">

              <button
                onClick={() => {

                  setSelectedVideo(null)
                  setVideoPreview("")

                }}
              >

                Cancel

              </button>

              <button
                onClick={sendVideo}
              >

                Send

              </button>

            </div>

          </div>

        </div>

      )}

      {documentPreview && (

        <div className="image-preview-overlay">

          <div className="document-preview-box">

            <div className="document-preview-icon">

              {getFileIcon(
                documentPreview.name
              )}

            </div>

            <h3>
              {documentPreview.name}
            </h3>

            <p>
              {documentPreview.size} MB
            </p>

            <div className="image-preview-actions">

              <button
                onClick={() => {

                  setSelectedDocument(null)
                  setDocumentPreview(null)

                }}
              >

                Cancel

              </button>

              <button
                onClick={sendDocument}
              >

                Send

              </button>

            </div>

          </div>

        </div>

      )}

      {audioPreview && (

        <div className="image-preview-overlay">

          <div className="document-preview-box">

            <h3>
              Voice Note
            </h3>

            <div className="audio-message">

              <audio
                controls
                src={audioPreview}
                className="chat-audio"
              />

            </div>

            <div className="voice-preview-actions">

              <button
                className="voice-cancel-btn"
                onClick={() => {

                  setAudioBlob(null)
                  setAudioPreview("")

                }}
              >

                Cancel

              </button>

              <button
                className="voice-send-btn"
                onClick={sendVoiceNote}
              >

                Send

              </button>

            </div>

          </div>

        </div>

      )}

    </>

  )

}

export default UploadPreviewModal