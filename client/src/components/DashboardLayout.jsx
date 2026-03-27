function DashboardLayout({ children }) {

  return (
    <div
      style={{
        padding: "40px",
        maxWidth: "1200px",
        margin: "0 auto",
        minHeight: "100vh"
      }}
    >
      {children}
    </div>
  )

}

export default DashboardLayout