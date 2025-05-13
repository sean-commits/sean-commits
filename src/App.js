import React, { useState, useEffect } from 'react';
import './App.css';
import UserIdentification from './components/UserIdentification';
import CalendarComponent from './components/CalendarComponent';
import DigitalCollage from './components/DigitalCollage';
import PetInteraction from './components/PetInteraction';
import StickyNoteBoard from './components/StickyNoteBoard';
import Whiteboard from './components/Whiteboard';
import PhotoUpload from './components/PhotoUpload';
import TrickSection from './components/TrickSection';
import PetPhotosSection from './components/PetPhotosSection';
import WeeklySchedule from './components/WeeklySchedule';
import StatusUpdate from './components/StatusUpdate';

function App() {
  const [visitorCount, setVisitorCount] = useState(0);
  const [currentUser, setCurrentUser] = useState('');

  useEffect(() => {
    // Simulate visitor counter
    const storedCount = localStorage.getItem('visitorCount') || 0;
    const newCount = parseInt(storedCount) + 1;
    localStorage.setItem('visitorCount', newCount);
    setVisitorCount(newCount);
  }, []);

  const handleUserChange = (username) => {
    setCurrentUser(username);
  };

  return (
    <div className="App">
      <h1>Sean & Lizzie's Relationship Site</h1>
      
      <div className="visitor-counter">
        <p>You are visitor number: <span className="blink">{visitorCount}</span></p>
      </div>
      
      <div className="under-construction">
        <img src="https://i.imgur.com/JYOcQgJ.gif" alt="Under Construction" />
      </div>
      
      <marquee scrollamount="3" bgcolor="#ffff00">Welcome to our site! We're so happy you're here! ♥♥♥</marquee>
      
      <div className="divider"></div>
      
      <UserIdentification onUserChange={handleUserChange} />
      <div className="divider"></div>
      
      <StatusUpdate currentUser={currentUser} />
      <div className="divider"></div>
      
      <CalendarComponent currentUser={currentUser} />
      <div className="divider"></div>
      
      <WeeklySchedule currentUser={currentUser} />
      <div className="divider"></div>
      
      <PetInteraction currentUser={currentUser} />
      <div className="divider"></div>
      
      <StickyNoteBoard currentUser={currentUser} />
      <div className="divider"></div>
      
      <Whiteboard currentUser={currentUser} />
      <div className="divider"></div>
      
      <PhotoUpload currentUser={currentUser} />
      <div className="divider"></div>
      
      <TrickSection currentUser={currentUser} />
      <div className="divider"></div>
      
      <PetPhotosSection currentUser={currentUser} />
      
      <div className="footer">
        <p>© 2023 Sean & Lizzie | Best viewed in Internet Explorer 6.0 | 800x600 resolution</p>
        <div style={{textAlign: 'center'}}>
          <img src="https://i.imgur.com/wZBbMnE.gif" alt="Email" />
          <img src="https://i.imgur.com/UxHBpfl.gif" alt="Valid HTML" />
        </div>
      </div>
    </div>
  );
}

export default App;