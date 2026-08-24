import {
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from "recharts"

const COLORS = [
  "#22c55e",
  "#3b82f6",
  "#f59e0b",
  "#ef4444"
]

function AdminCharts({ stats, revenueData }) {

  const roleData = [
    {
      name: "Workers",
      value: stats.workers
    },
    {
      name: "Contractors",
      value: stats.contractors
    }
  ]

  const activityData = [
    {
      name: "Jobs",
      total: stats.jobs
    },
    {
      name: "Applications",
      total: stats.applications
    },
    {
      name: "Reviews",
      total: stats.reviews
    }
  ]

  return (

    <div className="admin-charts-grid">

      {/* Revenue */}

      <div className="admin-dashboard-panel">

        <h2>📈 Revenue Trend</h2>

        <ResponsiveContainer
          width="100%"
          height={300}
        >

          <LineChart data={revenueData}>

            <CartesianGrid strokeDasharray="3 3" />

            <XAxis dataKey="month" />

            <YAxis />

            <Tooltip />

            <Legend />

            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#22c55e"
              strokeWidth={3}
            />

          </LineChart>

        </ResponsiveContainer>

      </div>

      {/* User Roles */}

      <div className="admin-dashboard-panel">

        <h2>👥 User Roles</h2>

        <ResponsiveContainer
          width="100%"
          height={300}
        >

          <PieChart>

            <Pie
              data={roleData}
              dataKey="value"
              outerRadius={100}
              label
            >

              {roleData.map((entry, index) => (

                <Cell
                  key={index}
                  fill={
                    COLORS[index % COLORS.length]
                  }
                />

              ))}

            </Pie>

            <Tooltip />

            <Legend />

          </PieChart>

        </ResponsiveContainer>

      </div>

      {/* Activity */}

      <div className="admin-dashboard-panel">

        <h2>📊 Platform Activity</h2>

        <ResponsiveContainer
          width="100%"
          height={300}
        >

          <BarChart data={activityData}>

            <CartesianGrid strokeDasharray="3 3" />

            <XAxis dataKey="name" />

            <YAxis />

            <Tooltip />

            <Legend />

            <Bar
              dataKey="total"
              fill="#22c55e"
            />

          </BarChart>

        </ResponsiveContainer>

      </div>

    </div>

  )
}

export default AdminCharts