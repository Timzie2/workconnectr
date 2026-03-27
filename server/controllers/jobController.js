const pool = require("../config/db");


// CREATE JOB
const createJob = async (req, res) => {
  try {

    const { title, description, location, daily_pay, contractor_id } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: "Title and description required" });
    }

    const result = await pool.query(
      `INSERT INTO jobs (title, description, location, daily_pay, contractor_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [title, description, location, daily_pay, contractor_id]
    );

    res.status(201).json({
      message: "Job created successfully",
      job: result.rows[0]
    });

  } catch (error) {

    console.error("CREATE JOB ERROR:", error);
    res.status(500).json({ error: "Failed to create job" });

  }
};



// GET ALL JOBS
const getJobs = async (req, res) => {
  try {

    const result = await pool.query(
      "SELECT * FROM jobs ORDER BY created_at DESC"
    );

    res.json(result.rows);

  } catch (error) {

    console.error("GET JOBS ERROR:", error);
    res.status(500).json({ error: "Failed to fetch jobs" });

  }
};



// EXPORT FUNCTIONS
module.exports = {
  createJob,
  getJobs
};