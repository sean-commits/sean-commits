import React, { useState, useEffect } from 'react';
import './App.css';
import { db } from './firebase';
import { doc, getDoc, setDoc, increment } from 'firebase/firestore';
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
  // Instead of a simple number, use a ridiculous value
  const [visitorCount, setVisitorCount] = useState("999,999,997");
  const [currentUser, setCurrentUser] = useState('');

  useEffect(() => {
    // Update visitor counter in Firebase
    async function updateVisitorCount() {
      try {
        const statsRef = doc(db, "stats", "visitors");
        const statsDoc = await getDoc(statsRef);
        
        if (statsDoc.exists()) {
          // Generate a humorous visitor number
          // This creates a number between 999,999,800 and 999,999,999
          const baseNumber = 999999800;
          const randomOffset = Math.floor(Math.random() * 199);
          setVisitorCount(baseNumber + randomOffset);
        } else {
          // Create counter if it doesn't exist
          await setDoc(statsRef, { count: 999999800 });
          setVisitorCount(999999800);
        }
      } catch (error) {
        console.error("Error updating visitor count:", error);
        // Fallback with a funny number
        setVisitorCount("999,999,8" + Math.floor(Math.random() * 99));
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
        <p>
          <span className="blink">⚠️</span> 
          CONGRATULATIONS! You are visitor number <span className="blink">{visitorCount}</span>! 
          <span className="blink">⚠️</span>
        </p>
        <p className="visitor-message">
          You're the 999,999,999th visitor! Click <span className="fake-link">HERE</span> to claim your FREE iPad Pro!*
        </p>
        <p className="visitor-disclaimer">
          *Not actually free. iPad Pro not included. Void where prohibited. Clicking will do nothing because it's just a nostalgic joke.
        </p>
      </div>
      
      <div className="hotchie">
        <img 
          src={`${process.env.PUBLIC_URL}/0D5398D0-FF94-4ED7-BF78-B57ABDFAC0C3.jpg`} 
          alt="Hotchie" 
        />
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
      
    </div>
  );
}

export default App;