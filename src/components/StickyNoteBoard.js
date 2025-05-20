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
  const [error, setError] = useState(null);

  const colors = [
    { value: '#ffff99', label: 'Yellow' },
    { value: '#ff9999', label: 'Pink' },
    { value: '#99ff99', label: 'Green' },
    { value: '#9999ff', label: 'Blue' },
    { value: '#ffcc99', label: 'Orange' }
  ];

  // Load notes from statusUpdates collection with a filter for sticky notes
  useEffect(() => {
    console.log("Setting up sticky notes listener...");
    
    // Filter for only sticky note type entries
    const q = query(
      collection(db, "statusUpdates"),
      where("type", "==", "stickyNote"),
      orderBy("timestamp", "desc")
    );
    
    console.log("Query configured. Listening for updates...");
    
    // Set up real-time listener
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      try {
        console.log("Received sticky notes update, docs count:", querySnapshot.size);
        
        const notesList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate 
            ? doc.data().timestamp.toDate().toLocaleString() 
            : new Date().toLocaleString()
        }));
        
        console.log("Processed notes:", notesList);
        setNotes(notesList);
        setLoading(false);
      } catch (error) {
        console.error("Error processing notes:", error);
        setError("Failed to load notes. Please refresh the page.");
        setLoading(false);
      }
    }, (error) => {
      console.error("Error listening to notes:", error);
      setError("Failed to connect to the database. Please refresh the page.");
      setLoading(false);
    });
    
    // Clean up listener on component unmount
    return () => {
      console.log("Cleaning up sticky notes listener");
      unsubscribe();
    };
  }, []);

  const addNote = async () => {
    if (!currentUser) {
      setError('Please sign in to add a note!');
      return;
    }
    
    if (!newNote.trim()) {
      setError('Please enter some text for your note!');
      return;
    }

    try {
      console.log("Attempting to add sticky note");
      
      // Create new note with Firestore timestamp
      const newNoteData = {
        type: "stickyNote", // Add type field to differentiate from other statusUpdates
        text: newNote.trim(),
        color: noteColor,
        user: currentUser,
        timestamp: Timestamp.now(),
        emoji: "📝" // Add emoji for compatibility with StatusUpdate component
      };
      
      console.log("Prepared note data:", newNoteData);
      
      // Add to statusUpdates collection
      const docRef = await addDoc(collection(db, "statusUpdates"), newNoteData);
      console.log("Note added successfully with ID:", docRef.id);
      
      // Clear input field and error
      setNewNote('');
      setError(null);
    } catch (error) {
      console.error("Error adding sticky note:", error);
      setError("Failed to add note. Please try again.");
    }
  };

  const removeNote = async (id, noteUser) => {
    // Only allow deletion if current user matches the note creator
    if (currentUser !== noteUser) {
      setError("You can only delete your own notes!");
      return;
    }
    
    try {
      console.log("Attempting to delete note with ID:", id);
      
      // Delete from statusUpdates collection
      await deleteDoc(doc(db, "statusUpdates", id));
      console.log("Note deleted successfully");
      
      setError(null);
    } catch (error) {
      console.error("Error deleting note:", error);
      setError("Failed to delete note. Please try again.");
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
      
      {error && (
        <div style={{
          padding: '10px',
          margin: '10px 0',
          backgroundColor: '#fff0f0',
          border: '1px solid #ffcccc',
          borderRadius: '4px',
          color: '#cc0000',
          textAlign: 'center'
        }}>
          {error}
        </div>
      )}
      
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
              backgroundColor: !currentUser || !newNote.trim() ? '#cccccc' : '#4CAF50',
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
