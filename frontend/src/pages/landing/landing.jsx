import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import "../../App.css";

const LandingPages = () => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="newLandingContainer">
      <header className="navBar">
        <h1 className="brandName">Callora</h1>

        <div className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
          <span></span>
          <span></span>
          <span></span>
        </div>

        <nav className={`navButtons ${menuOpen ? "open" : ""}`}>
          <button onClick={() => navigate("/abc123")}>Join as Guest</button>
          <button onClick={() => navigate("/auth")}>Register</button>
          <button onClick={() => navigate("/auth")}>Login</button>
        </nav>
      </header>

      <main className="heroSection">
        <div className="heroText">
          <h2>Stay Close, Even When You're Apart</h2>
          <p>Callora brings your loved ones closer with seamless communication. Start your journey today!</p>
          <Link to="/auth" className="startButton">Get Started</Link>
        </div>
        <div className="heroImage">
          <img src="./mobile.png" alt="Connect Illustration" />
        </div>
      </main>
    </div>
  );
};

export default LandingPages;
