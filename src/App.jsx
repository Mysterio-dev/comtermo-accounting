import {useState} from "react";
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import AuthComponent from './AuthComponent';
import ParticlesContainer from "./ParticlesContainer"; 
import Calendar from './pages/Calendar';
import './App.scss';

import 'firebase/auth';
import { initializeApp } from 'firebase/app';




const firebaseConfig = {
  apiKey: "AIzaSyAMENFkqkVFAMWpxLSFWsGB2AWsGiPbG5s",
  authDomain: "comtermo-calendar.firebaseapp.com",
  projectId: "comtermo-calendar",
  storageBucket: "comtermo-calendar.appspot.com",
  messagingSenderId: "645495264257",
  appId: "1:645495264257:web:cc88185130b4b4777a1c00",
  measurementId: "G-PQ6DC10E55",
};

const app = initializeApp(firebaseConfig); 

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  return (
    <BrowserRouter basename="/comtermo-accounting/">
      <main>
        {isLoggedIn ? (
          <Routes>
            <Route path="/" element={<Calendar />} />
          </Routes>
        ) : (
          <AuthComponent firebase={app} setIsLoggedIn={setIsLoggedIn} />
          
        )}
            <ParticlesContainer />
      </main>
    </BrowserRouter>
  );
}

export default App;
