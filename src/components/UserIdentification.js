import React, { useState, useEffect } from 'react';

function UserIdentification({ onUserChange }) {
  const [userName, setUserName] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Load username from localStorage on component mount
  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      setUserName(storedUser);
      setIsLoggedIn(true);
      onUserChange(storedUser);
    }
  }, [onUserChange]);

  const handleLogin = () => {
    if (userName.trim()) {
      localStorage.setItem('currentUser', userName);
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