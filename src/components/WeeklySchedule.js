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
  where,
  getDocs
} from 'firebase/firestore';

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
  const [loading, setLoading] = useState(true);
  
  // Load schedules from Firestore on component mount
  useEffect(() => {
    setLoading(true);
    
    // Create a query to get all schedule activities
    const q = query(
      collection(db, "weeklySchedule"),
      orderBy("startTimeSort", "asc") // This will sort activities by start time
    );
    
    // Set up real-time listener
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      try {
        const scheduleData = {
          Monday: [],
          Tuesday: [],
          Wednesday: [],
          Thursday: [],
          Friday: [],
          Saturday: [],
          Sunday: []
        };
        
        querySnapshot.docs.forEach(doc => {
          const data = doc.data();
          const activity = {
            id: doc.id,
            activity: data.activity,
            startTime: data.startTime || 'All day',
            endTime: data.endTime || '',
            user: data.user,
            timestamp: data.timestamp.toDate().toLocaleString() // Convert Firestore timestamp
          };
          
          // Add to the appropriate day
          if (scheduleData[data.day]) {
            scheduleData[data.day].push(activity);
          }
        });
        
        setSchedules(scheduleData);
        setLoading(false);
      } catch (error) {
        console.error("Error processing schedule data:", error);
        setLoading(false);
      }
    }, (error) => {
      console.error("Error listening to schedules:", error);
      setLoading(false);
    });
    
    // Clean up listener on component unmount
    return () => unsubscribe();
  }, []);

  const addActivity = async () => {
    if (!currentUser) {
      alert('Please sign in to update the schedule!');
      return;
    }

    if (!activity.trim()) {
      alert('Please enter an activity!');
      return;
    }

    try {
      // Create a numeric value for sorting by time
      let startTimeSort = 0;
      if (startTime) {
        const [hours, minutes] = startTime.split(':').map(Number);
        startTimeSort = hours * 60 + minutes;
      }
      
      // Create new activity with Firestore timestamp
      const newActivity = {
        day: selectedDay,
        activity: activity.trim(),
        startTime: startTime || 'All day',
        endTime: endTime || '',
        startTimeSort: startTimeSort,
        user: currentUser,
        timestamp: Timestamp.now()
      };
      
      // Add to Firestore
      await addDoc(collection(db, "weeklySchedule"), newActivity);
      
      // Reset form
      setActivity('');
      setStartTime('');
      setEndTime('');
    } catch (error) {
      console.error("Error adding schedule activity:", error);
      alert("Failed to add to schedule. Please try again.");
    }
  };

  const deleteActivity = async (id) => {
    try {
      // Get the activity to check ownership
      const activityRef = doc(db, "weeklySchedule", id);
      const activitySnap = await getDocs(query(
        collection(db, "weeklySchedule"),
        where("__name__", "==", id)
      ));
      
      if (!activitySnap.empty) {
        const activityData = activitySnap.docs[0].data();
        
        // Only allow deletion if current user matches the activity creator
        if (currentUser !== activityData.user) {
          alert("You can only delete activities you've added!");
          return;
        }
        
        // Delete from Firestore
        await deleteDoc(activityRef);
      }
    } catch (error) {
      console.error("Error deleting activity:", error);
      alert("Failed to delete activity. Please try again.");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && currentUser && activity.trim()) {
      addActivity();
    }
  };

  return (
    <div className="container">
      <h2>Weekly Schedule</h2>
      
      <div style={{
        border: '2px solid #3399ff',
        padding: '15px',
        backgroundColor: '#f0f8ff',
        marginBottom: '20px',
        borderRadius: '8px'
      }}>
        <h3 style={{color: '#0066cc', textAlign: 'center'}}>Add to Schedule</h3>
        
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
          <select
            value={selectedDay}
            onChange={(e) => setSelectedDay(e.target.value)}
            disabled={!currentUser}
            style={{
              margin: '10px 0', 
              width: '80%',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #ccc'
            }}
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
            onKeyPress={handleKeyPress}
            disabled={!currentUser}
            style={{
              margin: '10px 0', 
              width: '80%',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #ccc'
            }}
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
                style={{
                  padding: '6px',
                  borderRadius: '4px',
                  border: '1px solid #ccc'
                }}
              />
            </div>
            
            <div>
              <label>End Time: </label>
              <input 
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                disabled={!currentUser}
                style={{
                  padding: '6px',
                  borderRadius: '4px',
                  border: '1px solid #ccc'
                }}
              />
            </div>
          </div>
          
          <button 
            onClick={addActivity}
            disabled={!currentUser || !activity.trim()}
            style={{
              marginTop: '10px',
              padding: '8px 16px',
              backgroundColor: !currentUser || !activity.trim() ? '#cccccc' : '#3399ff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: !currentUser || !activity.trim() ? 'not-allowed' : 'pointer'
            }}
          >
            Add to Schedule
          </button>
        </div>
      </div>
      
      <div>
        <h3 style={{
          backgroundColor: '#ccffff', 
          padding: '8px', 
          textAlign: 'center',
          borderRadius: '5px'
        }}>
          This Week's Schedule
        </h3>
        
        {loading ? (
          <div style={{textAlign: 'center', padding: '20px'}}>
            <p>Loading schedule...</p>
          </div>
        ) : (
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            marginTop: '15px',
            border: '2px solid #3399ff',
            borderRadius: '8px',
            overflow: 'hidden'
          }}>
            <thead>
              <tr>
                <th style={{
                  backgroundColor: '#3399ff',
                  color: 'white',
                  padding: '10px',
                  textAlign: 'left',
                  border: '1px solid #0066cc'
                }}>
                  Day
                </th>
                <th style={{
                  backgroundColor: '#3399ff',
                  color: 'white',
                  padding: '10px',
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
                    padding: '10px',
                    border: '1px solid #3399ff',
                    fontWeight: 'bold',
                    backgroundColor: day === selectedDay ? '#cce6ff' : '#e6f2ff',
                    width: '100px',
                    transition: 'background-color 0.3s ease'
                  }}>
                    {day}
                  </td>
                  <td style={{
                    padding: '10px',
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
                            margin: '8px 0',
                            padding: '10px',
                            backgroundColor: '#f0f8ff',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            position: 'relative',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                            transition: 'transform 0.2s ease, box-shadow 0.2s ease'
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
                            <strong>{item.activity}</strong>
                            <p style={{margin: '5px 0', fontSize: '14px'}}>
                              Time: {item.startTime} {item.endTime ? `- ${item.endTime}` : ''}
                            </p>
                            <p style={{margin: '5px 0', fontSize: '12px', color: '#666'}}>
                              Added by: {item.user}
                            </p>
                            
                            {currentUser === item.user && (
                              <button 
                                onClick={() => deleteActivity(item.id)}
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
                                  padding: '0',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                                title="Delete this activity"
                              >
                                ✕
                              </button>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default WeeklySchedule;