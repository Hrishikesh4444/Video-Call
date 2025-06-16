import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "./history.css";
import {
  Card,
  CardContent,
  Typography,
  IconButton,
  Button,
  Container,
  Box,
} from "@mui/material";

import HomeIcon from "@mui/icons-material/Home";
import HistoryIcon from "@mui/icons-material/History";

export default function History() {
  const { getHistoryOfUser } = useContext(AuthContext);
  const [meetings, setMeetings] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const history = await getHistoryOfUser();
        setMeetings(history);
      } catch {
        // Implement snackbar later
      }
    };
    fetchHistory();
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="fullPageBackground">
      <Container maxWidth="md" className="historyContainer">
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mt={2}
          mb={3}
        >
          <Box display="flex" alignItems="center" gap={1}>
            <HistoryIcon color="primary" />
            <Typography variant="h5" fontWeight={600}>
              Meeting History
            </Typography>
          </Box>
          <IconButton onClick={() => navigate("/home")} color="primary">
            <HomeIcon fontSize="large"/>
          </IconButton>
        </Box>

        {meetings.length > 0 ? (
          meetings.map((e, i) => (
            <Card
              key={i}
              variant="outlined"
              sx={{ mb: 2, borderRadius: 3, padding: 1 }}
            >
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600}>
                  Meeting Code:{" "}
                  <span style={{ color: "#FF9839" }}>{e.meetingCode}</span>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Date: {formatDate(e.date)}
                </Typography>
              </CardContent>
            </Card>
          ))
        ) : (
          <Box textAlign="center" mt={8}>
            <Typography variant="h6" color="text.secondary">
              You don't have any meeting history yet.
            </Typography>
          </Box>
        )}
      </Container>
    </div>
  );
}
