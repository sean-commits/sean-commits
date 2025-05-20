import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { db } from '../firebase';
import { 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  query, 
  Timestamp, 
  onSnapshot 
} from 'firebase/firestore';

function CalendarComponent({ currentUser }) {
  const [date, setDate] = useState(new Date());
  const [events, setEvents] = useState({});
  const [newEvent, setNewEvent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Format date consistently
  const formatDate = (date) => {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  // Load events from Firestore
  useEffect(() => {
    // Set up real-time listener to the collection
    const unsubscribe = onSnapshot(
      collection(db, "calendarEvents"),
      (snapshot) => {
        try {
          const eventsByDate = {};
          
          snapshot.forEach((doc) => {
            const data = doc.data();
            const dateKey = data.date;
            
            if (!eventsByDate[dateKey]) {
              eventsByDate[dateKey] = [];
            }
            
            eventsByDate[dateKey].push({
              id: doc.id,
              text: data.text,
              user: data.user,
              timestamp: data.timestamp ? data.timestamp.toDate() : new Date()
            });
          });
          
          // Sort events for each date
          Object.keys(eventsByDate).forEach(dateKey => {
            eventsByDate[dateKey].sort((a, b) => b.timestamp - a.timestamp);
          });
          
          setEvents(eventsByDate);
          setLoading(false);
        } catch (error) {
          console.error("Error processing calendar events:", error);
          setError("Failed to load events. Please refresh the page.");
          setLoading(false);
        }
      },
      (error) => {
        console.error("Error listening to calendar events:", error);
        setError("Failed to connect to the database. Please refresh the page.");
        setLoading(false);
      }
    );
    
    // Clean up listener on component unmount
    return () => unsubscribe();
  }, []);

  const onChange = (newDate) => {
    setDate(newDate);
  };

  const addEvent = async () => {
    if (!currentUser) {
      setError('Please sign in to add events!');
      return;
    }
    
    if (!newEvent.trim()) {
      setError('Please enter an event description!');
      return;
    }

    try {
      const dateStr = formatDate(date);
      
      // Add to Firestore
      await addDoc(collection(db, "calendarEvents"), {
        date: dateStr,
        text: newEvent.trim(),
        user: currentUser,
        timestamp: Timestamp.now()
      });
      
      // Clear input field
      setNewEvent('');
      setError(null);
    } catch (error) {
      console.error("Error adding event:", error);
      setError("Failed to add event. Please try again.");
    }
  };

  const deleteEvent = async (eventId) => {
    if (!currentUser) {
      setError('Please sign in to delete events!');
      return;
    }
    
    try {
      // Direct deletion without ownership check (handle this based on your security rules)
      await deleteDoc(doc(db, "calendarEvents", eventId));
      setError(null);
    } catch (error) {
      console.error("Error deleting event:", error);
      setError("Failed to delete event. Please try again.");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && currentUser && newEvent.trim()) {
      addEvent();
    }
  };

  // Determine dates with events for highlighting on calendar
  const tileClassName = ({ date, view }) => {
    if (view === 'month') {
      const dateStr = formatDate(date);
      return events[dateStr] && events[dateStr].length > 0 ? 'has-events' : null;
    }
  };

  // Custom styles to override react-calendar default styles
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      .react-calendar {
        width: 100%;
        background-color: #ffccff;
        border: 3px solid #9933cc;
        font-family: 'Comic Sans MS', sans-serif;
        border-radius: 8px;
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
      }
      .react-calendar__tile--active {
        background: #ff9900 !important;
        color: white !important;
      }
      .react-calendar__tile:enabled:hover {
        background-color: #ffcc00;
      }
      .has-events {
        background-color: #ffcc99;
        font-weight: bold;
        position: relative;
      }
      .has-events::after {
        content: '•';
        position: absolute;
        bottom: 3px;
        right: 3px;
        font-size: 18px;
        color: #ff3366;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div className="container">
      <h2>Times we have done the deed</h2>
      
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
      
      <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
        {loading ? (
          <div style={{textAlign: 'center', padding: '20px'}}>
            <p>Loading calendar events...</p>
          </div>
        ) : (
          <Calendar 
            onChange={onChange} 
            value={date} 
            tileClassName={tileClassName}
          />
        )}
        
        <div style={{
          marginTop: '20px', 
          width: '100%', 
          textAlign: 'center',
          padding: '15px',
          backgroundColor: '#f9f9f9',
          borderRadius: '8px',
          border: '2px solid #ff9900'
        }}>
          <h3 style={{
            backgroundColor: '#ffcc99', 
            padding: '8px',
            borderRadius: '5px'
          }}>
            Selected Date: {date.toDateString()}
          </h3>
          
          <div style={{margin: '15px 0'}}>
            <input
              type="text"
              value={newEvent}
              onChange={(e) => setNewEvent(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={currentUser ? "Add event for this date" : "Sign in to add events"}
              style={{
                width: '60%',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #ccc'
              }}
              disabled={!currentUser}
            />
            <button 
              onClick={addEvent} 
              style={{
                marginLeft: '10px',
                padding: '8px 16px',
                backgroundColor: !currentUser || !newEvent.trim() ? '#cccccc' : '#ff9900',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: !currentUser || !newEvent.trim() ? 'not-allowed' : 'pointer'
              }}
              disabled={!currentUser || !newEvent.trim()}
            >
              Add
            </button>
          </div>
          
          <div style={{marginTop: '15px'}}>
            <h4 style={{
              backgroundColor: '#ffccff', 
              padding: '8px',
              borderRadius: '4px',
              color: '#9933cc'
            }}>
              Events on this date:
            </h4>
            {loading ? (
              <p>Loading events...</p>
            ) : events[formatDate(date)] && events[formatDate(date)].length > 0 ? (
              <ul style={{
                listStyleType: 'none', 
                padding: 0,
                maxHeight: '250px',
                overflowY: 'auto'
              }}>
                {events[formatDate(date)].map((event) => (
                  <li key={event.id} style={{
                    margin: '8px 0',
                    padding: '10px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #cccccc',
                    borderRadius: '4px',
                    position: 'relative',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    textAlign: 'left'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
                  }}
                  >
                    <div>{event.text}</div>
                    <div style={{
                      fontSize: '12px',
                      color: '#666',
                      marginTop: '5px'
                    }}>
                      Added by: {event.user}
                    </div>
                    
                    {currentUser === event.user && (
                      <button 
                        onClick={() => deleteEvent(event.id)}
                        style={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          backgroundColor: '#ff6666',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: '20px',
                          height: '20px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        title="Delete this event"
                      >
                        ✕
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{color: '#666', fontStyle: 'italic'}}>No events yet for this date</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CalendarComponent;