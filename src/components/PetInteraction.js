import React, { useState } from 'react';
import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';

function PetInteraction({ currentUser }) {
  const [tobiDancing, setTobiDancing] = useState(false);
  const [hachiDancing, setHachiDancing] = useState(false);
  const [feedCount, setFeedCount] = useState(0);
  const [status, setStatus] = useState('');

  // Simple animation without Firebase
  const handleTobiClick = () => {
    setTobiDancing(true);
    setTimeout(() => setTobiDancing(false), 3000);
    
    if (currentUser) {
      setStatus('Tobi is dancing!');
      
      // Try to write to Firebase
      try {
        setDoc(doc(db, "petActions", Date.now().toString()), {
          action: "tobiDance",
          user: currentUser,
          timestamp: new Date().toString()
        });
      } catch (error) {
        console.error("Firebase write error:", error);
      }
    } else {
      setStatus('Please login first!');
    }
  };

  const handleHachiClick = () => {
    setHachiDancing(true);
    setTimeout(() => setHachiDancing(false), 3000);
    
    if (currentUser) {
      setStatus('Hachi is dancing!');
      
      // Try to write to Firebase
      try {
        setDoc(doc(db, "petActions", Date.now().toString()), {
          action: "hachiDance",
          user: currentUser,
          timestamp: new Date().toString()
        });
      } catch (error) {
        console.error("Firebase write error:", error);
      }
    } else {
      setStatus('Please login first!');
    }
  };

  const feedPets = () => {
    if (currentUser) {
      setFeedCount(feedCount + 1);
      setStatus('Pets have been fed!');
      
      // Try to write to Firebase
      try {
        setDoc(doc(db, "petActions", Date.now().toString()), {
          action: "feed",
          user: currentUser,
          timestamp: new Date().toString()
        });
      } catch (error) {
        console.error("Firebase write error:", error);
      }
    } else {
      setStatus('Please login first!');
    }
  };

  return (
    <div className="container" style={{padding: '20px', textAlign: 'center'}}>
      <h2>🐾 Tobi & Hachi 🐾</h2>
      
      {status && (
        <div style={{
          padding: '10px',
          margin: '10px 0',
          backgroundColor: '#f0f8ff',
          borderRadius: '5px'
        }}>
          {status}
        </div>
      )}
      
      <div style={{display: 'flex', justifyContent: 'center', gap: '30px', margin: '20px 0'}}>
        <div>
          <div 
            onClick={handleTobiClick}
            style={{
              width: '150px',
              height: '150px',
              backgroundColor: '#ff9900',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              cursor: 'pointer',
              transition: 'transform 0.3s',
              transform: tobiDancing ? 'rotate(20deg)' : 'none'
            }}
          >
            Tobi 🐕
          </div>
          <p>Click to make Tobi dance</p>
        </div>
        
        <div>
          <div 
            onClick={handleHachiClick}
            style={{
              width: '150px',
              height: '150px',
              backgroundColor: '#9933cc',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              color: 'white',
              cursor: 'pointer',
              transition: 'transform 0.3s',
              transform: hachiDancing ? 'rotate(-20deg)' : 'none'
            }}
          >
            Hachi 🐕
          </div>
          <p>Click to make Hachi dance</p>
        </div>
      </div>
      
      <div style={{marginTop: '20px'}}>
        <button 
          onClick={feedPets}
          style={{
            padding: '10px 20px',
            backgroundColor: !currentUser ? '#cccccc' : '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            cursor: currentUser ? 'pointer' : 'not-allowed'
          }}
          disabled={!currentUser}
        >
          Feed Pets
        </button>
        
        <p>Pets have been fed {feedCount} times in this session!</p>
        <p style={{fontSize: '12px', color: '#666'}}>
          (Firebase writes are being attempted but not displayed)
        </p>
      </div>
    </div>
  );
}

export default PetInteraction;
