import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

function UserIdentification({ onUserChange }) {
  const [userName, setUserName] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check for user in localStorage on component mount
  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      setUserName(storedUser);
      setIsLoggedIn(true);
      onUserChange(storedUser);
    }
  }, [onUserChange]);

  const handleLogin = async () => {
    if (userName.trim()) {
      // Store in localStorage for quick access
      localStorage.setItem('currentUser', userName);
      
      // Also record in Firebase that this user exists
      try {
        await setDoc(doc(db, "users", userName), {
          lastLogin: new Date(),
          loginCount: 1 // You could increment this if needed
        }, { merge: true });
      } catch (error) {
        console.error("Error recording user login:", error);
        // Continue anyway as we have localStorage backup
      }
      
      setIsLoggedIn(true);
      onUserChange(userName);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    setIsLoggedIn(false);
    setUserName('');
    onUserChange('');
  };

  return (
    <div className="container" style={{ textAlign: 'center' }}>
      <h2>👤 User ID 👤</h2>
      
      {!isLoggedIn ? (
        <div>
          <p>Please enter your name:</p>
          <input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="Your Name"
          />
          <button onClick={handleLogin} style={{ marginLeft: '10px' }}>
            Sign In
          </button>
        </div>
      ) : (
        <div>
          <p className="blink">Welcome, <span style={{ fontWeight: 'bold', color: '#ff0000' }}>{userName}</span>!</p>
          <button onClick={handleLogout}>Sign Out</button>
        </div>
      )}
    </div>
  );
}

export default UserIdentification;