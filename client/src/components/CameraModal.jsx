function CameraModal({

  videoRef,
  canvasRef,

  capturePhoto,

  cameraStream,

  setShowCamera

}) {

  return (

    <div className="camera-modal">

      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="camera-preview"
      />

      <canvas
        ref={canvasRef}
        style={{
          display:"none"
        }}
      />

      <div className="camera-actions">

        <button
          onClick={capturePhoto}
        >
          Capture
        </button>

        <button
          onClick={() => {

            cameraStream?.getTracks()
              .forEach(track =>
                track.stop()
              )

            setShowCamera(false)

          }}
        >
          Cancel
        </button>

      </div>

    </div>

  )

}

export default CameraModal