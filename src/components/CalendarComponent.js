import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

function CalendarComponent() {
  const [date, setDate] = useState(new Date());
  const [events, setEvents] = useState({});
  const [newEvent, setNewEvent] = useState('');

  const onChange = (newDate) => {
    setDate(newDate);
  };

  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  const addEvent = () => {
    if (newEvent.trim()) {
      const dateStr = formatDate(date);
      const updatedEvents = {...events};
      
      if (!updatedEvents[dateStr]) {
        updatedEvents[dateStr] = [];
      }
      
      updatedEvents[dateStr].push(newEvent);
      setEvents(updatedEvents);
      setNewEvent('');
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
      }
      .react-calendar__tile--active {
        background: #ff9900 !important;
        color: white !important;
      }
      .react-calendar__tile:enabled:hover {
        background-color: #ffcc00;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div className="container">
      <h2>📅 Our Special Dates 📅</h2>
      <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
        <Calendar onChange={onChange} value={date} />
        
        <div style={{marginTop: '20px', width: '100%', textAlign: 'center'}}>
          <h3 style={{backgroundColor: '#ffcc99', padding: '5px'}}>
            Selected Date: {date.toDateString()}
          </h3>
          
          <div>
            <input
              type="text"
              value={newEvent}
              onChange={(e) => setNewEvent(e.target.value)}
              placeholder="Add event for this date"
              style={{width: '60%'}}
            />
            <button onClick={addEvent} style={{marginLeft: '10px'}}>Add</button>
          </div>
          
          <div style={{marginTop: '15px'}}>
            <h4>Events on this date:</h4>
            {events[formatDate(date)] ? (
              <ul style={{listStyleType: 'none', padding: 0}}>
                {events[formatDate(date)].map((event, index) => (
                  <li key={index} style={{
                    margin: '5px 0',
                    padding: '5px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #cccccc'
                  }}>
                    {event}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No events yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CalendarComponent;