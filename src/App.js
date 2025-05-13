import React, { useState, useEffect } from 'react';
import './App.css';
import { db } from './firebase';
import { doc, getDoc, setDoc, increment } from 'firebase/firestore';
// Import the image with a clearer variable name
import hotchieImage from './0D5398D0-FF94-4ED7-BF78-B57ABDFAC0C3.jpg';
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
    // Update visitor counter in Firebase
    async function updateVisitorCount() {
      try {
        const statsRef = doc(db, "stats", "visitors");
        const statsDoc = await getDoc(statsRef);
        
        if (statsDoc.exists()) {
          // Increment existing counter
          await setDoc(statsRef, { count: increment(1) }, { merge: true });
          setVisitorCount(statsDoc.data().count + 1);
        } else {
          // Create counter if it doesn't exist
          await setDoc(statsRef, { count: 1 });
          setVisitorCount(1);
        }
      } catch (error) {
        console.error("Error updating visitor count:", error);
        // Fallback to localStorage if Firebase fails
        const storedCount = localStorage.getItem('visitorCount') || 0;
        const newCount = parseInt(storedCount) + 1;
        localStorage.setItem('visitorCount', newCount);
        setVisitorCount(newCount);
      }
    }
    
    updateVisitorCount();
  }, []);

  const handleUserChange = (username) => {
    setCurrentUser(username);
  };

  return (
    <div className="App">
      <h1>Really Awesome Website for Lizzie</h1>
      
      <div className="visitor-counter">
        <p>You are visitor number: <span className="blink">{visitorCount}</span></p>
      </div>
      
      <div className="hotchie">
        <img src={hotchieImage} alt="Hotchie" />
      </div>
      
      <marquee scrollamount="3" bgcolor="#ffff00">Hello, haha, hi, hehe, tobi, hello</marquee>
      
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
      
    </div>
  );
}

export default App;