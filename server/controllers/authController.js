const pool = require("../config/db")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")

// REGISTER

exports.register = async (req, res) => {

try{

const { name, email, password, role } = req.body

const hashedPassword = await bcrypt.hash(password, 10)

const newUser = await pool.query(

"INSERT INTO users (full_name,email,password,role) VALUES ($1,$2,$3,$4) RETURNING *",

[name, email, hashedPassword, role]

)

res.json(newUser.rows[0])

}catch(err){

console.error(err)
res.status(500).send("Server error")

}

}


// LOGIN

exports.login = async (req, res) => {

try{

const { email, password } = req.body

const user = await pool.query(

"SELECT * FROM users WHERE email = $1",

[email]

)

if(user.rows.length === 0){

return res.status(400).json({message:"User not found"})

}

const validPassword = await bcrypt.compare(

password,

user.rows[0].password

)

if(!validPassword){

return res.status(400).json({message:"Invalid password"})

}

const token = jwt.sign(

{ id: user.rows[0].id },

process.env.JWT_SECRET

)

res.json({

token: token,
role: user.rows[0].role,
name: user.rows[0].full_name

})

}catch(err){

console.error(err)
res.status(500).send("Server error")

}

}