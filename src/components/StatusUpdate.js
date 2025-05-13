import React, { useState, useEffect } from 'react';

function StatusUpdate({ currentUser }) {
  const [status, setStatus] = useState('');
  const [emoji, setEmoji] = useState('😊');
  const [updates, setUpdates] = useState([]);

  // Load updates from localStorage on component mount
  useEffect(() => {
    const storedUpdates = localStorage.getItem('statusUpdates');
    if (storedUpdates) {
      setUpdates(JSON.parse(storedUpdates));
    }
  }, []);

  // Save updates to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('statusUpdates', JSON.stringify(updates));
  }, [updates]);

  const handleStatusChange = (e) => {
    setStatus(e.target.value);
  };

  const handleEmojiChange = (e) => {
    setEmoji(e.target.value);
  };

  const addStatus = () => {
    if (status.trim() && currentUser) {
      const newUpdate = {
        user: currentUser,
        emoji,
        text: status,
        timestamp: new Date().toLocaleString()
      };
      setUpdates([newUpdate, ...updates]);
      setStatus('');
    } else if (!currentUser) {
      alert('Please sign in to post a status update!');
    }
  };

  return (
    <div className="container">
      <h2>✨ Mood Ring ✨</h2>
      <div style={{textAlign: 'center'}}>
        <input
          type="text"
          value={status}
          onChange={handleStatusChange}
          placeholder={currentUser ? "How are you feeling today?" : "Sign in to update your status"}
          style={{width: '60%'}}
          disabled={!currentUser}
        />
        <select 
          value={emoji} 
          onChange={handleEmojiChange} 
          style={{marginLeft: '10px'}}
          disabled={!currentUser}
        >
          <option value="😊">😊</option>
          <option value="😢">😢</option>
          <option value="😡">😡</option>
          <option value="❤️">❤️</option>
          <option value="😴">😴</option>
          <option value="🎮">🎮</option>
          <option value="🍕">🍕</option>
        </select>
        <button 
          onClick={addStatus} 
          style={{marginLeft: '10px'}}
          disabled={!currentUser}
        >
          Update
        </button>
      </div>
      
      <div style={{marginTop: '20px', textAlign: 'left'}}>
        <h3 style={{backgroundColor: '#ffccff', padding: '5px'}}>Recent Updates:</h3>
        {updates.length === 0 ? (
          <p style={{textAlign: 'center'}}>No updates yet. Be the first!</p>
        ) : (
          updates.map((update, index) => (
            <div key={index} style={{
              margin: '10px 0',
              padding: '10px',
              backgroundColor: '#ffffff',
              border: '1px solid #cccccc'
            }}>
              <p style={{color: '#0000FF', fontWeight: 'bold'}}>
                {update.user} says:
              </p>
              <p><strong>{update.emoji} {update.text}</strong></p>
              <p style={{fontSize: '12px', color: '#666666'}}>{update.timestamp}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default StatusUpdate;