import React, { useState, useEffect } from 'react';

function StickyNoteBoard({ currentUser }) {
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [noteColor, setNoteColor] = useState('#ffff99'); // Default yellow

  const colors = [
    { value: '#ffff99', label: 'Yellow' },
    { value: '#ff9999', label: 'Pink' },
    { value: '#99ff99', label: 'Green' },
    { value: '#9999ff', label: 'Blue' },
    { value: '#ffcc99', label: 'Orange' }
  ];

  // Load notes from localStorage on component mount
  useEffect(() => {
    const storedNotes = localStorage.getItem('stickyNotes');
    if (storedNotes) {
      setNotes(JSON.parse(storedNotes));
    }
  }, []);

  // Save notes to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('stickyNotes', JSON.stringify(notes));
  }, [notes]);

  const addNote = () => {
    if (newNote.trim() && currentUser) {
      setNotes([...notes, { 
        text: newNote, 
        color: noteColor,
        user: currentUser,
        timestamp: new Date().toLocaleString()
      }]);
      setNewNote('');
    } else if (!currentUser) {
      alert('Please sign in to add a note!');
    }
  };

  const removeNote = (index) => {
    const updatedNotes = [...notes];
    updatedNotes.splice(index, 1);
    setNotes(updatedNotes);
  };

  return (
    <div className="container">
      <h2>Sticky Notes</h2>
      <div style={{textAlign: 'center', marginBottom: '20px'}}>
        <textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder={currentUser ? "Write your note here..." : "Sign in to leave a note"}
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
          <button onClick={addNote} disabled={!currentUser}>Add Note</button>
        </div>
      </div>
      
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '15px'
      }}>
        {notes.map((note, index) => (
          <div key={index} style={{
            backgroundColor: note.color,
            padding: '15px',
            width: '150px',
            minHeight: '150px',
            boxShadow: '5px 5px 7px rgba(33,33,33,.7)',
            transform: `rotate(${Math.random() * 10 - 5}deg)`,
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <p style={{fontWeight: 'bold', borderBottom: '1px solid #000', paddingBottom: '5px'}}>
                From: {note.user}
              </p>
              <div style={{wordWrap: 'break-word', margin: '10px 0'}}>
                {note.text}
              </div>
              <p style={{fontSize: '10px', position: 'absolute', bottom: '30px', left: '5px'}}>
                {note.timestamp}
              </p>
            </div>
            <button 
              onClick={() => removeNote(index)}
              style={{
                position: 'absolute',
                bottom: '5px',
                right: '5px',
                backgroundColor: 'transparent',
                border: 'none',
                color: '#ff0000',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              X
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default StickyNoteBoard;