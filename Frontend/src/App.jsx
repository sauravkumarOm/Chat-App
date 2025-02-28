import React, { useState } from 'react'
import {BrowserRouter as Router, Routes, Route} from "react-router-dom"
import LoginSignup from './pages/LoginSignUppage'
import HomePage from './pages/HomePage'
import Profile from './pages/Profile'


function App() {

  return (
    <>
      <Router>
        <Routes>
          <Route path='/' element = {<LoginSignup/>} />
          <Route path='/homepage' element = {<HomePage/>} />
          <Route path='/profile' element = {<Profile/>} />
        </Routes>
      </Router>
    </>
  )
}

export default App
