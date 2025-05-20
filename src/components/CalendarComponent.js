import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';

function SimpleCalendar({ currentUser }) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [eventText, setEventText] = useState('');
  const [events, setEvents] = useState([]);
  const [status, setStatus] = useState('');

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  const addEvent = () => {
    if (!currentUser) {
      setStatus('Please login first!');
      return;
    }
    
    if (!eventText.trim()) {
      setStatus('Please enter event text!');
      return;
    }
    
    // Add to local state
    const newEvent = {
      id: Date.now(),
      date: selectedDate,
      text: eventText,
      user: currentUser
    };
    
    setEvents([...events, newEvent]);
    setEventText('');
    setStatus('Event added!');
    
    // Try to write to Firebase
    try {
      addDoc(collection(db, "events"), {
        date: selectedDate,
        text: eventText,
        user: currentUser,
        timestamp: new Date().toString()
      });
    } catch (error) {
      console.error("Firebase write error:", error);
    }
  };

  const removeEvent = (id) => {
    setEvents(events.filter(event => event.id !== id));
    setStatus('Event removed!');
  };

  // Filter events for the selected date
  const filteredEvents = events.filter(event => event.date === selectedDate);

  return (
    <div className="container" style={{padding: '20px'}}>
      <h2>Simple Calendar</h2>
      
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
      
      <div style={{
        border: '2px solid #3399ff',
        padding: '15px',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <div style={{marginBottom: '15px'}}>
          <label style={{display: 'block', marginBottom: '5px'}}>
            Select Date:
          </label>
          <input 
            type="date" 
            value={selectedDate}
            onChange={handleDateChange}
            style={{
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #ccc',
              width: '100%'
            }}
          />
        </div>
        
        <div style={{marginBottom: '15px'}}>
          <label style={{display: 'block', marginBottom: '5px'}}>
            Event:
          </label>
          <input 
            type="text"
            value={eventText}
            onChange={(e) => setEventText(e.target.value)}
            placeholder={currentUser ? "Enter event details" : "Login to add events"}
            style={{
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #ccc',
              width: '100%'
            }}
            disabled={!currentUser}
          />
        </div>
        
        <button 
          onClick={addEvent}
          disabled={!currentUser || !eventText.trim()}
          style={{
            padding: '8px 16px',
            backgroundColor: !currentUser || !eventText.trim() ? '#cccccc' : '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: !currentUser || !eventText.trim() ? 'not-allowed' : 'pointer'
          }}
        >
          Add Event
        </button>
      </div>
      
      <div>
        <h3>Events for {selectedDate}</h3>
        
        {filteredEvents.length === 0 ? (
          <p>No events for this date.</p>
        ) : (
          <ul style={{
            listStyleType: 'none',
            padding: 0
          }}>
            {filteredEvents.map(event => (
              <li key={event.id} style={{
                padding: '10px',
                backgroundColor: '#f9f9f9',
                borderRadius: '4px',
                marginBottom: '10px',
                position: 'relative'
              }}>
                <div>{event.text}</div>
                <div style={{fontSize: '12px', color: '#666'}}>Added by: {event.user}</div>
                
                <button 
                  onClick={() => removeEvent(event.id)}
                  style={{
                    position: 'absolute',
                    top: '5px',
                    right: '5px',
                    backgroundColor: '#ff6666',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '20px',
                    height: '20px',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
        
        <p style={{fontSize: '12px', color: '#666'}}>
          (Firebase writes are being attempted but data is not loaded from Firebase)
        </p>
      </div>
    </div>
  );
}

export default SimpleCalendar;
