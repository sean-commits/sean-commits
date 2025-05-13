import React, { useState, useEffect } from 'react';

function WeeklySchedule({ currentUser }) {
  const [schedules, setSchedules] = useState({
    Monday: [],
    Tuesday: [],
    Wednesday: [],
    Thursday: [],
    Friday: [],
    Saturday: [],
    Sunday: []
  });
  
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [activity, setActivity] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  
  // Load schedules from localStorage on component mount
  useEffect(() => {
    const storedSchedules = localStorage.getItem('weeklySchedules');
    if (storedSchedules) {
      setSchedules(JSON.parse(storedSchedules));
    }
  }, []);

  // Save schedules to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('weeklySchedules', JSON.stringify(schedules));
  }, [schedules]);

  const addActivity = () => {
    if (!currentUser) {
      alert('Please sign in to update the schedule!');
      return;
    }

    if (!activity.trim()) {
      alert('Please enter an activity!');
      return;
    }

    const newActivity = {
      id: Date.now(),
      activity,
      startTime: startTime || 'All day',
      endTime: endTime || '',
      user: currentUser,
      timestamp: new Date().toLocaleString()
    };

    setSchedules({
      ...schedules,
      [selectedDay]: [...schedules[selectedDay], newActivity]
    });

    setActivity('');
    setStartTime('');
    setEndTime('');
  };

  const deleteActivity = (day, id) => {
    setSchedules({
      ...schedules,
      [day]: schedules[day].filter(item => item.id !== id)
    });
  };

  return (
    <div className="container">
      <h2>Weekly Schedule</h2>
      
      <div style={{
        border: '2px solid #3399ff',
        padding: '15px',
        backgroundColor: '#f0f8ff',
        marginBottom: '20px'
      }}>
        <h3 style={{color: '#0066cc', textAlign: 'center'}}>Add to Schedule</h3>
        
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
          <select
            value={selectedDay}
            onChange={(e) => setSelectedDay(e.target.value)}
            disabled={!currentUser}
            style={{margin: '10px 0', width: '80%'}}
          >
            <option value="Monday">Monday</option>
            <option value="Tuesday">Tuesday</option>
            <option value="Wednesday">Wednesday</option>
            <option value="Thursday">Thursday</option>
            <option value="Friday">Friday</option>
            <option value="Saturday">Saturday</option>
            <option value="Sunday">Sunday</option>
          </select>
          
          <input 
            type="text"
            placeholder="Activity or Event"
            value={activity}
            onChange={(e) => setActivity(e.target.value)}
            disabled={!currentUser}
            style={{margin: '10px 0', width: '80%'}}
          />
          
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            width: '80%',
            margin: '10px 0'
          }}>
            <div>
              <label>Start Time: </label>
              <input 
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                disabled={!currentUser}
              />
            </div>
            
            <div>
              <label>End Time: </label>
              <input 
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                disabled={!currentUser}
              />
            </div>
          </div>
          
          <button 
            onClick={addActivity}
            disabled={!currentUser || !activity.trim()}
            style={{marginTop: '10px'}}
          >
            Add to Schedule
          </button>
        </div>
      </div>
      
      <div>
        <h3 style={{backgroundColor: '#ccffff', padding: '5px', textAlign: 'center'}}>
          This Week's Schedule
        </h3>
        
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          marginTop: '15px',
          border: '2px solid #3399ff'
        }}>
          <thead>
            <tr>
              <th style={{
                backgroundColor: '#3399ff',
                color: 'white',
                padding: '8px',
                textAlign: 'left',
                border: '1px solid #0066cc'
              }}>
                Day
              </th>
              <th style={{
                backgroundColor: '#3399ff',
                color: 'white',
                padding: '8px',
                textAlign: 'left',
                border: '1px solid #0066cc'
              }}>
                Activities
              </th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(schedules).map(day => (
              <tr key={day}>
                <td style={{
                  padding: '8px',
                  border: '1px solid #3399ff',
                  fontWeight: 'bold',
                  backgroundColor: '#e6f2ff',
                  width: '100px'
                }}>
                  {day}
                </td>
                <td style={{
                  padding: '8px',
                  border: '1px solid #3399ff'
                }}>
                  {schedules[day].length === 0 ? (
                    <p style={{color: '#999', fontStyle: 'italic'}}>Nothing scheduled</p>
                  ) : (
                    <ul style={{
                      listStyleType: 'none',
                      padding: '0',
                      margin: '0'
                    }}>
                      {schedules[day].map(item => (
                        <li key={item.id} style={{
                          margin: '5px 0',
                          padding: '5px',
                          backgroundColor: '#f0f8ff',
                          border: '1px solid #ccc',
                          position: 'relative'
                        }}>
                          <strong>{item.activity}</strong>
                          <p style={{margin: '3px 0', fontSize: '14px'}}>
                            Time: {item.startTime} {item.endTime ? `- ${item.endTime}` : ''}
                          </p>
                          <p style={{margin: '3px 0', fontSize: '12px'}}>
                            Added by: {item.user}
                          </p>
                          
                          <button 
                            onClick={() => deleteActivity(day, item.id)}
                            style={{
                              position: 'absolute',
                              top: '5px',
                              right: '5px',
                              backgroundColor: '#ff6666',
                              color: 'white',
                              border: 'none',
                              borderRadius: '50%',
                              width: '16px',
                              height: '16px',
                              fontSize: '10px',
                              cursor: 'pointer',
                              padding: '0'
                            }}
                          >
                            X
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default WeeklySchedule;