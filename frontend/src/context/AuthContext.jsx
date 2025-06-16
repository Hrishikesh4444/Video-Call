import { createContext, useContext, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import httpStatus from "http-status";

export const AuthContext = createContext({});

const AuthContextProvider = (props) => {
  const [userData, setUserData] = useState({});

  const baseURL = `https://video-call-f9ng.onrender.com${/api/v1/users}`;

  const router = useNavigate();

  const handleRegister = async (name, username, password) => {
    try {
      let request = await axios.post(baseURL + "/register", {
        name: name,
        username: username,
        password: password,
      });

      if (request.status === httpStatus.CREATED) {
        return request.data.message;
        
      }
    } catch (error) {
      throw error;
    }
  };

  const handleLogin = async (username, password) => {
    try {
      let request = await axios.post(baseURL + "/login", {
        username: username,
        password: password,
      });

      if (request.status === httpStatus.OK) {
        localStorage.setItem("token", request.data.token);
        router("/home");
        
      }
    } catch (error) {
      throw error;
    }
  };

  const getHistoryOfUser = async () => {
    try {
      let request = await axios.get(baseURL+"/get_all_activity", {
        params: {
          token: localStorage.getItem("token"),
        },
      });
      return request.data;
    } catch (err) {
      throw err;
    }
  };

  const addToUserHistory = async (meetingCode) => {
    try {
      let request = await axios.post(baseURL+"/add_to_activity", {
        token: localStorage.getItem("token"),
        meeting_code: meetingCode,
      });
      return request;
    } catch (e) {
      throw e;
    }
  };

  const userContextValue = {
    userData,
    setUserData,
    handleRegister,
    handleLogin,
    router,
    addToUserHistory,
    getHistoryOfUser
  };

  return (
    <AuthContext.Provider value={userContextValue}>
      {props.children}
    </AuthContext.Provider>
  );
};

export default AuthContextProvider;
