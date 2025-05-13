import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, getDocs, query, orderBy, deleteDoc, doc, Timestamp } from 'firebase/firestore';

function StatusUpdate({ currentUser }) {
  const [status, setStatus] = useState('');
  const [emoji, setEmoji] = useState('😊');
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load updates from Firestore on component mount
  useEffect(() => {
    async function fetchUpdates() {
      try {
        setLoading(true);
        const q = query(collection(db, "statusUpdates"), orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);
        const updatesList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp.toDate().toLocaleString() // Convert Firestore timestamp
        }));
        setUpdates(updatesList);
      } catch (error) {
        console.error("Error fetching updates:", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchUpdates();
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
        const docRef = await addDoc(collection(db, "statusUpdates"), newUpdate);
        
        // Update local state
        setUpdates([{
          id: docRef.id,
          ...newUpdate,
          timestamp: new Date().toLocaleString()
        }, ...updates]);
        
        setStatus('');
      } catch (error) {
        console.error("Error adding status update:", error);
        alert("Failed to add status update. Please try again.");
      }
    } else if (!currentUser) {
      alert('Please sign in to post a status update!');
    }
  };

  const deleteStatus = async (id) => {
    try {
      // Delete from Firestore
      await deleteDoc(doc(db, "statusUpdates", id));
      
      // Update local state
      setUpdates(updates.filter(update => update.id !== id));
    } catch (error) {
      console.error("Error deleting status update:", error);
      alert("Failed to delete status update. Please try again.");
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
                    width: '20px',
                    height: '20px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
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