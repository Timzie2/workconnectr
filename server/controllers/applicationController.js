const pool = require("../config/db");


exports.applyForJob = async (req, res) => {

  const { job_id, worker_id } = req.body;

  try {

    const result = await pool.query(
      "INSERT INTO applications (job_id, worker_id) VALUES ($1,$2) RETURNING *",
      [job_id, worker_id]
    );

    res.status(201).json(result.rows[0]);

  } catch (error) {

    console.log(error);

    res.status(500).json({ message:"Error applying" });

  }

};



exports.getApplications = async (req,res)=>{

  try{

    const result = await pool.query(`
      SELECT
      applications.id,
      applications.status,
      jobs.title,
      users.full_name,
      users.email
      FROM applications
      JOIN jobs ON applications.job_id = jobs.id
      JOIN users ON applications.worker_id = users.id
      ORDER BY applications.id DESC
    `);

    res.json(result.rows);

  }catch(error){

    console.log(error);

    res.status(500).json({message:"Error fetching"});

  }

};



exports.getWorkerApplications = async (req,res)=>{

  const {worker_id} = req.params;

  try{

    const result = await pool.query(`
      SELECT
      applications.id,
      applications.status,
      jobs.title
      FROM applications
      JOIN jobs ON applications.job_id = jobs.id
      WHERE worker_id=$1
      ORDER BY applications.id DESC
    `,[worker_id]);

    res.json(result.rows);

  }catch(error){

    console.log(error);

    res.status(500).json({message:"Error fetching"});

  }

};



exports.updateApplicationStatus = async (req,res)=>{

  const {id} = req.params;
  const {status} = req.body;

  try{

    const result = await pool.query(
      "UPDATE applications SET status=$1 WHERE id=$2 RETURNING *",
      [status,id]
    );

    res.json(result.rows[0]);

  }catch(error){

    console.log(error);

    res.status(500).json({message:"Error updating"});

  }

};