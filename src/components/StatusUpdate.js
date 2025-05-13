import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, getDocs, query, orderBy, deleteDoc, doc, Timestamp, onSnapshot } from 'firebase/firestore';

function StatusUpdate({ currentUser }) {
  const [status, setStatus] = useState('');
  const [emoji, setEmoji] = useState('😊');
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load updates from Firestore on component mount and listen for real-time updates
  useEffect(() => {
    const q = query(collection(db, "statusUpdates"), orderBy("timestamp", "desc"));
    
    // Set up real-time listener
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      try {
        const updatesList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp.toDate().toLocaleString() // Convert Firestore timestamp
        }));
        setUpdates(updatesList);
        setLoading(false);
      } catch (error) {
        console.error("Error processing updates:", error);
        setLoading(false);
      }
    }, (error) => {
      console.error("Error listening to updates:", error);
      setLoading(false);
    });
    
    // Clean up listener on component unmount
    return () => unsubscribe();
  }, []);

  const handleStatusChange = (e) => {
    setStatus(e.target.value);
  };

  const handleEmojiChange = (e) => {
    setEmoji(e.target.value);
  };

  const addStatus = async () => {
    if (status.trim() && currentUser) {
      try {
        // Create new status update with Firestore timestamp
        const newUpdate = {
          user: currentUser,
          emoji,
          text: status,
          timestamp: Timestamp.now()
        };
        
        // Add to Firestore
        await addDoc(collection(db, "statusUpdates"), newUpdate);
        
        // Clear input field (no need to manually update state as the listener will handle it)
        setStatus('');
      } catch (error) {
        console.error("Error adding status update:", error);
        alert("Failed to add status update. Please try again.");
      }
    } else if (!currentUser) {
      alert('Please sign in to post a status update!');
    } else {
      alert('Please enter a status message!');
    }
  };

  const deleteStatus = async (id) => {
    try {
      // Delete from Firestore
      await deleteDoc(doc(db, "statusUpdates", id));
      // No need to manually update state as the listener will handle it
    } catch (error) {
      console.error("Error deleting status update:", error);
      alert("Failed to delete status update. Please try again.");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && currentUser) {
      addStatus();
    }
  };

  return (
    <div className="container">
      <h2>Status</h2>
      <div style={{textAlign: 'center'}}>
        <input
          type="text"
          value={status}
          onChange={handleStatusChange}
          onKeyPress={handleKeyPress}
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
          <option value="🎉">🎉</option>
          <option value="🤔">🤔</option>
          <option value="👍">👍</option>
        </select>
        <button 
          onClick={addStatus} 
          style={{marginLeft: '10px'}}
          disabled={!currentUser || !status.trim()}
        >
          Update
        </button>
      </div>
      
      <div style={{marginTop: '20px', textAlign: 'left'}}>
        <h3 style={{backgroundColor: '#ffccff', padding: '5px'}}>Recent Updates:</h3>
        
        {loading ? (
          <p style={{textAlign: 'center'}}>Loading updates...</p>
        ) : updates.length === 0 ? (
          <p style={{textAlign: 'center'}}>No updates yet. Be the first!</p>
        ) : (
          updates.map((update) => (
            <div key={update.id} style={{
              margin: '10px 0',
              padding: '10px',
              backgroundColor: '#ffffff',
              border: '1px solid #cccccc',
              borderRadius: '5px',
              position: 'relative'
            }}>
              <p style={{color: '#0000FF', fontWeight: 'bold'}}>
                {update.user} says:
              </p>
              <p><strong>{update.emoji} {update.text}</strong></p>
              <p style={{fontSize: '12px', color: '#666666'}}>{update.timestamp}</p>
              
              {currentUser === update.user && (
                <button 
                  onClick={() => deleteStatus(update.id)}
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    backgroundColor: '#ff6666',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="Delete this update"
                >
                  X
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default StatusUpdate;