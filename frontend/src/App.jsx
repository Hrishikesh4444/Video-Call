import viteLogo from '/vite.svg'
import './App.css'
import {Route,BrowserRouter,Routes} from "react-router-dom";
import LandingPages from './pages/landing/landing.jsx';
import Authentication from './pages/authentication/authentication.jsx';
import VideoMeet from './pages/videoMeet';
import AuthContextProvider from './context/AuthContext.jsx'
import Home from './pages/home/home.jsx';
import History from './pages/history/history.jsx';
function App() {
  return (
    <>
      <BrowserRouter>
      <AuthContextProvider>
        <Routes>

          {/* <Route path="/home" element={}/> */}
          <Route path='/' element={<LandingPages/>}/>
          <Route path='/auth' element={<Authentication/>}/>
          <Route path='/home' element={<Home/>}/>
          <Route path='/history' element={<History />} />
          <Route path='/:url' element={<VideoMeet/>}/>
        </Routes>
      </AuthContextProvider>
        
      </BrowserRouter>
    </>
  )
}

export default App
