import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy, 
  Timestamp, 
  onSnapshot, 
  where 
} from 'firebase/firestore';

function StickyNoteBoard({ currentUser }) {
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [noteColor, setNoteColor] = useState('#ffff99'); // Default yellow
  const [loading, setLoading] = useState(true);

  const colors = [
    { value: '#ffff99', label: 'Yellow' },
    { value: '#ff9999', label: 'Pink' },
    { value: '#99ff99', label: 'Green' },
    { value: '#9999ff', label: 'Blue' },
    { value: '#ffcc99', label: 'Orange' }
  ];

  // Load notes from Firestore on component mount - use statusUpdates collection
  useEffect(() => {
    // Filter for only sticky note type documents
    const q = query(
      collection(db, "statusUpdates"), 
      where("type", "==", "stickyNote"),
      orderBy("timestamp", "desc")
    );
    
    // Set up real-time listener
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      try {
        const notesList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp.toDate().toLocaleString() // Convert Firestore timestamp
        }));
        setNotes(notesList);
        setLoading(false);
      } catch (error) {
        console.error("Error processing notes:", error);
        setLoading(false);
      }
    }, (error) => {
      console.error("Error listening to notes:", error);
      setLoading(false);
    });
    
    // Clean up listener on component unmount
    return () => unsubscribe();
  }, []);

  const addNote = async () => {
    if (newNote.trim() && currentUser) {
      try {
        // Create new note with Firestore timestamp
        const newNoteData = {
          text: newNote,
          color: noteColor,
          user: currentUser,
          timestamp: Timestamp.now(),
          type: "stickyNote", // Add type field to differentiate from other statusUpdates
          emoji: "📝" // Add emoji for compatibility with StatusUpdate component
        };
        
        // Add to statusUpdates collection instead
        await addDoc(collection(db, "statusUpdates"), newNoteData);
        
        // Clear input field
        setNewNote('');
      } catch (error) {
        console.error("Error adding sticky note:", error);
        alert("Failed to add note. Please try again.");
      }
    } else if (!currentUser) {
      alert('Please sign in to add a note!');
    } else {
      alert('Please enter some text for your note!');
    }
  };

  const removeNote = async (id, noteUser) => {
    // Only allow deletion if current user matches the note creator
    if (currentUser !== noteUser) {
      alert("You can only delete your own notes!");
      return;
    }
    
    try {
      // Delete from statusUpdates collection
      await deleteDoc(doc(db, "statusUpdates", id));
    } catch (error) {
      console.error("Error deleting note:", error);
      alert("Failed to delete note. Please try again.");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && e.ctrlKey && currentUser && newNote.trim()) {
      addNote();
    }
  };

  // Generate a random rotation angle but keep it consistent for each note
  const getRotation = (id) => {
    // Use the first 8 characters of the ID to generate a consistent angle
    if (!id) return 0;
    const seed = id.substring(0, 8);
    let sum = 0;
    for (let i = 0; i < seed.length; i++) {
      sum += seed.charCodeAt(i);
    }
    // Generate a rotation between -6 and 6 degrees
    return (sum % 13) - 6;
  };

  return (
    <div className="container">
      <h2>Sticky Notes</h2>
      <div style={{textAlign: 'center', marginBottom: '20px'}}>
        <textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder={currentUser ? "Write your note here... (Ctrl+Enter to submit)" : "Sign in to leave a note"}
          rows="3"
          style={{width: '80%', padding: '10px', margin: '10px 0'}}
          disabled={!currentUser}
        />
        <div>
          <select 
            value={noteColor} 
            onChange={(e) => setNoteColor(e.target.value)}
            style={{marginRight: '10px'}}
            disabled={!currentUser}
          >
            {colors.map(color => (
              <option key={color.value} value={color.value}>
                {color.label}
              </option>
            ))}
          </select>
          <button 
            onClick={addNote} 
            disabled={!currentUser || !newNote.trim()}
            style={{
              padding: '8px 16px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: currentUser && newNote.trim() ? 'pointer' : 'not-allowed'
            }}
          >
            Add Note
          </button>
        </div>
      </div>
      
      {loading ? (
        <p style={{textAlign: 'center'}}>Loading notes...</p>
      ) : (
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '15px'
        }}>
          {notes.length === 0 ? (
            <p style={{textAlign: 'center'}}>No notes yet. Be the first to add one!</p>
          ) : (
            notes.map((note) => (
              <div key={note.id} style={{
                backgroundColor: note.color,
                padding: '15px',
                width: '150px',
                minHeight: '150px',
                boxShadow: '5px 5px 7px rgba(33,33,33,.7)',
                transform: `rotate(${getRotation(note.id)}deg)`,
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                fontFamily: '"Indie Flower", cursive',
                transition: 'transform 0.15s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = `rotate(${getRotation(note.id)}deg) scale(1.05)`;
                e.currentTarget.style.zIndex = '1';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = `rotate(${getRotation(note.id)}deg)`;
                e.currentTarget.style.zIndex = '0';
              }}
              >
                <div>
                  <p style={{fontWeight: 'bold', borderBottom: '1px solid rgba(0,0,0,0.3)', paddingBottom: '5px'}}>
                    From: {note.user}
                  </p>
                  <div style={{wordWrap: 'break-word', margin: '10px 0', whiteSpace: 'pre-wrap'}}>
                    {note.text}
                  </div>
                </div>
                <div>
                  <p style={{fontSize: '10px', margin: '5px 0'}}>
                    {note.timestamp}
                  </p>
                  {currentUser === note.user && (
                    <button 
                      onClick={() => removeNote(note.id, note.user)}
                      style={{
                        position: 'absolute',
                        bottom: '5px',
                        right: '5px',
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: '#ff0000',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '16px'
                      }}
                      title="Delete this note"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default StickyNoteBoard;
