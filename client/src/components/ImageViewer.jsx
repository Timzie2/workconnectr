function ImageViewer({

  viewImage,

  zoomLevel,
  setZoomLevel,

  setShowImageViewer

}) {

  return (

    <div
      className="image-viewer-overlay"

      onClick={() => {

        setShowImageViewer(false)

        setZoomLevel(1)

      }}
    >

      <div
        className="image-viewer-content"

        onClick={(e) =>
          e.stopPropagation()
        }
      >

        <img
          src={viewImage}
          className="fullscreen-image"

          style={{
            transform:
              `scale(${zoomLevel})`
          }}
        />

        <div className="image-viewer-controls">

          <button
            onClick={() =>
              setZoomLevel(
                prev => prev + 0.2
              )
            }
          >
            ＋
          </button>

          <button
            onClick={() =>
              setZoomLevel(
                prev =>
                  Math.max(
                    1,
                    prev - 0.2
                  )
              )
            }
          >
            －
          </button>

          <button
            onClick={() => {

              setShowImageViewer(false)

              setZoomLevel(1)

            }}
          >
            ✕
          </button>

        </div>

      </div>

    </div>

  )

}

export default ImageViewer