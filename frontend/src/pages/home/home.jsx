import React, { useContext, useState } from 'react';
import withAuth from '../../utils/withAuth';
import { useNavigate } from 'react-router-dom';
import "./home.css";
import { Button, IconButton, TextField } from '@mui/material';
import RestoreIcon from '@mui/icons-material/Restore';
import { AuthContext } from "../../context/AuthContext";

function HomeComponent() {
  const navigate = useNavigate();
  const [meetingCode, setMeetingCode] = useState("");
  const { addToUserHistory } = useContext(AuthContext);

  const handleJoinVideoCall = async () => {
    await addToUserHistory(meetingCode);
    navigate(`/${meetingCode}`);
  };

  return (
    <div className="homeContainer">
      <header className="homeNavBar">
        <h2 className="homeBrand">Callora</h2>
        <div className="homeNavButtons">
          {/* <IconButton onClick={() => navigate("/history")}>
            <RestoreIcon />
          </IconButton> */}
          <button onClick={() => navigate("/history")} className="historyText">History</button>
          <button onClick={() => {
            localStorage.removeItem("token");
            navigate("/auth");
          }} variant="outlined" color="error">
            Logout
          </button>
        </div>
      </header>

      <main className="homeMain">
        <section className="homeLeft">
          <h1>Seamless Video Calls for Better Communication</h1>
          <p>Enter a meeting code to connect instantly with your friends, family, or team.</p>
          <div className="meetingInputGroup">
            <TextField
              onChange={e => setMeetingCode(e.target.value)}
              label="Meeting Code"
              variant="outlined"
              fullWidth
            />
            <Button onClick={handleJoinVideoCall} variant="contained" className="joinBtn">
              Join
            </Button>
          </div>
        </section>
        <section className="homeRight">
          <img src="/logo3.png" alt="Video Call" />
        </section>
      </main>
    </div>
  );
}

export default withAuth(HomeComponent);
