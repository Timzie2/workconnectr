import {
  FaBriefcase,
  FaComments,
  FaUserCheck,
  FaBolt
} from "react-icons/fa"
import { Link } from "react-router-dom"
import { useState, useEffect } from "react"
import "../styles/landing.css"
import workerDashboard from "../assets/worker-dashboard.png"
import chatPreview from "../assets/chat-preview.png"
import logoIcon from "../assets/logo-icon.png"
import { motion } from "framer-motion"
import { FaBars, FaTimes } from "react-icons/fa"
import CountUp from "react-countup"

function LandingPage() {

    const [menuOpen, setMenuOpen] = useState(false)

  return (

    <div className="landing-page">
        <div className="bg-glow glow-1"></div>
<div className="bg-glow glow-2"></div>
<div className="bg-glow glow-3"></div>

        <div className="landing-container">

      {/* NAVBAR */}
      <nav className="landing-navbar">

        <div className="logo-wrapper">

  <img
    src={logoIcon}
    alt="WorkConnectr Logo"
    className="logo-icon"
  />

  <h2 className="logo">

    <span className="logo-white">
      Work
    </span>

    <span className="logo-green">
      Connectr
    </span>

  </h2>

</div>

        <div className={`nav-links ${menuOpen ? "active" : ""}`}>

          <Link to="/login">
            <button className="nav-login">
              Login
            </button>
          </Link>

          <Link to="/register">
            <button className="nav-register">
              Get Started
            </button>
          </Link>

        </div>

        <button
  className="menu-btn"
  onClick={() => setMenuOpen(prev => !prev)}
>

  {menuOpen ? <FaTimes /> : <FaBars />}

</button>

      </nav>

      {/* HERO */}
      <motion.section
  className="hero-section"
  initial={{ opacity:0, y:40 }}
  animate={{ opacity:1, y:0 }}
  transition={{ duration:0.8 }}
>

        <div className="hero-content">

            <div className="floating-card floating-1">
  💬 Instant Messaging
</div>

<div className="floating-card floating-2">
  ⚡ Fast Hiring
</div>

<div className="floating-card floating-3">
  ✅ Verified Workers
</div>

          <h1>
            Hire skilled workers
            <br />
            or find jobs faster.
          </h1>

          <p>
            WorkConnectr helps contractors and workers
            connect instantly through smart hiring,
            messaging, and job matching.
          </p>

          <div className="hero-buttons">

            <Link to="/register">
              <button className="primary-btn">
                Find Work
              </button>
            </Link>

            <Link to="/register">
              <button className="secondary-btn">
                Hire Workers
              </button>
            </Link>

          </div>

        </div>

      </motion.section>

      {/* STATS */}

<motion.section
  className="stats-section"
  initial={{ opacity:0, y:40 }}
  whileInView={{ opacity:1, y:0 }}
  viewport={{ once:true }}
  transition={{ duration:0.7 }}
>

  <div className="stats-grid">

    <div className="stat-card">
      <h2>
  <CountUp
    end={10000}
    duration={2.5}
    separator=","
    enableScrollSpy
    scrollSpyOnce
  />
  +
</h2>
      <p>Workers Connected</p>
    </div>

    <div className="stat-card">
      <h2>
  <CountUp
    end={2000}
    duration={2.5}
    separator=","
  />
  +
</h2>
      <p>Contractors Hiring</p>
    </div>

    <div className="stat-card">
      <h2>
  <CountUp
    end={50000}
    duration={2.5}
    separator=","
  />
  +
</h2>
      <p>Messages Sent</p>
    </div>

    <div className="stat-card">
      <h2>
  <CountUp
    end={95}
    duration={2.5}
  />
  %
</h2>
      <p>Successful Matches</p>
    </div>

  </div>

</motion.section>

      {/* FEATURES */}

<motion.section
  className="features-section"
  initial={{ opacity:0, y:50 }}
  whileInView={{ opacity:1, y:0 }}
  viewport={{ once:true }}
  transition={{ duration:0.7 }}
>

  <h2>
    Everything you need to hire or get hired
  </h2>

  <div className="features-grid">

    {/* CARD 1 */}

    <motion.div
      className="feature-card"
      initial={{ opacity:0, y:30 }}
      whileInView={{ opacity:1, y:0 }}
      viewport={{ once:true }}
      transition={{ duration:0.5, delay:0.1 }}
    >

      <div className="feature-icon">
        <FaComments />
      </div>

      <h3>Real-Time Messaging</h3>

      <p>
        Chat instantly with workers and contractors.
      </p>

    </motion.div>

    {/* CARD 2 */}

    <motion.div
      className="feature-card"
      initial={{ opacity:0, y:30 }}
      whileInView={{ opacity:1, y:0 }}
      viewport={{ once:true }}
      transition={{ duration:0.5, delay:0.2 }}
    >

      <div className="feature-icon">
        <FaBolt />
      </div>

      <h3>Fast Hiring</h3>

      <p>
        Post jobs and receive applications quickly.
      </p>

    </motion.div>

    {/* CARD 3 */}

    <motion.div
      className="feature-card"
      initial={{ opacity:0, y:30 }}
      whileInView={{ opacity:1, y:0 }}
      viewport={{ once:true }}
      transition={{ duration:0.5, delay:0.3 }}
    >

      <div className="feature-icon">
        <FaUserCheck />
      </div>

      <h3>Worker Profiles</h3>

      <p>
        Showcase skills, experience, and portfolios.
      </p>

    </motion.div>

    {/* CARD 4 */}

    <motion.div
      className="feature-card"
      initial={{ opacity:0, y:30 }}
      whileInView={{ opacity:1, y:0 }}
      viewport={{ once:true }}
      transition={{ duration:0.5, delay:0.4 }}
    >

      <div className="feature-icon">
        <FaBriefcase />
      </div>

      <h3>Smart Job Matching</h3>

      <p>
        Find opportunities that match your skills.
      </p>

    </motion.div>

  </div>

</motion.section>

{/* DASHBOARD PREVIEW */}

<motion.section
  className="landing-preview-section"
  initial={{ opacity:0, y:50 }}
  whileInView={{ opacity:1, y:0 }}
  viewport={{ once:true }}
  transition={{ duration:0.7 }}
>

  <div className="landing-preview-content">

    <h2>
      Built for modern hiring
    </h2>

    <p>
      Manage applications, chat instantly,
      and hire faster through one platform.
    </p>

    <img
      src={workerDashboard}
      alt="Worker Dashboard Preview"
      className="landing-dashboard-preview"
    />

  </div>

</motion.section>

{/* CHAT PREVIEW */}

<motion.section
  className="landing-preview-section"
  initial={{ opacity:0, y:50 }}
  whileInView={{ opacity:1, y:0 }}
  viewport={{ once:true }}
  transition={{ duration:0.7 }}
>

  <div className="landing-preview-content">

    <h2>
      Real-time communication
    </h2>

    <p>
      Workers and contractors can chat instantly,
      discuss projects, and stay connected easily.
    </p>

    <img
      src={chatPreview}
      alt="Chat Preview"
      className="landing-dashboard-preview"
    />

  </div>

</motion.section>

{/* TESTIMONIALS */}

<motion.section
  className="testimonials-section"
  initial={{ opacity:0, y:50 }}
  whileInView={{ opacity:1, y:0 }}
  viewport={{ once:true }}
  transition={{ duration:0.7 }}
>

  <h2>
    Trusted by workers and contractors
  </h2>

  <div className="testimonials-grid">

    <div className="testimonial-card">
      <p>
        “WorkConnectr helped me find jobs much faster than traditional methods.”
      </p>

      <h4>
        — Electrician
      </h4>
    </div>

    <div className="testimonial-card">
      <p>
        “Hiring skilled workers has become easier and more organized.”
      </p>

      <h4>
        — Contractor
      </h4>
    </div>

    <div className="testimonial-card">
      <p>
        “The messaging system makes communication very smooth.”
      </p>

      <h4>
        — Site Manager
      </h4>
    </div>

  </div>

</motion.section>

{/* FINAL CTA */}

<motion.section
  className="cta-section"
  initial={{ opacity:0, y:50 }}
  whileInView={{ opacity:1, y:0 }}
  viewport={{ once:true }}
  transition={{ duration:0.7 }}
>

  <h2>
    Ready to get started?
  </h2>

  <p>
    Join WorkConnectr today and connect with
    workers or contractors instantly.
  </p>

  <div className="cta-buttons">

    <Link to="/register">
      <button className="primary-btn">
        Create Account
      </button>
    </Link>

    <Link to="/login">
      <button className="secondary-btn">
        Login
      </button>
    </Link>

  </div>

</motion.section>

{/* FOOTER */}

<footer className="landing-footer">

  <h3>
    WorkConnectr
  </h3>

  <p>
    Connecting workers and contractors seamlessly.
  </p>

</footer>

    </div>

    </div>

  )
}

export default LandingPage