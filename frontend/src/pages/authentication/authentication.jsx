import * as React from "react";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import CssBaseline from "@mui/material/CssBaseline";
import TextField from "@mui/material/TextField";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import Typography from "@mui/material/Typography";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { Snackbar } from "@mui/material";
import { AuthContext } from "../../context/AuthContext";


const defaultTheme = createTheme();

export default function Authentication() {
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [name, setName] = React.useState("");
  const [error, setError] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [formState, setFormState] = React.useState(false); // false = SignIn, true = SignUp
  const [open, setOpen] = React.useState(false);

  const { handleRegister, handleLogin } = React.useContext(AuthContext);

  let handleAuth = async () => {
    try {
      if (!formState) {
        let response=await handleLogin(username,password);
        setMessage(result);
        setOpen(true);
      } else {
        let result = await handleRegister(name, username, password);
        setMessage(result);
        setOpen(true);
        setError("");
        setFormState(false);
        setPassword("");
        setUsername("");
      }
    } catch (e) {
      let msg = e.response?.data?.message || "Something went wrong";
      setError(msg);
    }
  };

  return (
    <ThemeProvider theme={defaultTheme}>
      <CssBaseline />

      {/* OUTER FLEX-CONTAINER */}
      <Box
        sx={{
          display: "flex",
          height: "100vh",
          width: "100vw",
          overflow: "hidden",
        }}
      >
        {/* LEFT PANEL: background image */}
        <Box
          sx={{
            flexBasis: { xs: "50%", sm: "40%", md: "70%" },
            minHeight: "100vh",
            backgroundImage: `url("/urban-vintage.jpg")`,
            backgroundRepeat: "no-repeat",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
{/* 
        <Box
          sx={{
            flexBasis: { xs: "50%", sm: "67%", md: "42%" },
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            bgcolor: "background.default",
          }}
        > */}
          <Paper  sx={{ width: "100%", maxWidth: 500, p: 4 }}>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <Avatar sx={{ m: 1, bgcolor: "secondary.main" }}>
                <LockOutlinedIcon />
              </Avatar>

              <Typography component="h1" variant="h5">
                {formState ? "Sign Up" : "Sign In"}
              </Typography>

              <Box sx={{ display: "flex", gap: 1, mt: 2, mb: 2 }}>
                <Button
                  variant={!formState ? "contained" : "outlined"}
                  onClick={() => setFormState(false)}
                  size="small"
                >
                  Sign In
                </Button>
                <Button
                  variant={formState ? "contained" : "outlined"}
                  onClick={() => setFormState(true)}
                  size="small"
                >
                  Sign Up
                </Button>
              </Box>

              <Box component="form" noValidate sx={{ width: "100%" }}>
                {formState && (
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="fullname"
                    label="Full Name"
                    name="fullname"
                    value={name}
                    autoFocus
                    onChange={(e) => setName(e.target.value)}
                  />
                )}

                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="username"
                  label="Username"
                  name="username"
                  value={username}
                  autoFocus={!formState}
                  onChange={(e) => setUsername(e.target.value)}
                />
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="password"
                  label="Password"
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />

                {error && (
                  <Typography color="error" variant="body2" sx={{ mt: 1 }}>
                    {error}
                  </Typography>
                )}

                <Button
                  type="button"
                  fullWidth
                  variant="contained"
                  sx={{ mt: 3, mb: 2 }}
                  onClick={handleAuth}
                >
                  {formState ? "Register" : "Login"}
                </Button>
              </Box>
            </Box>
          </Paper>
        {/* </Box> */}
      </Box>

      <Snackbar
        open={open}
        autoHideDuration={3000}
        message={message}
        onClose={() => setOpen(false)}
      />
    </ThemeProvider>
  );
}
