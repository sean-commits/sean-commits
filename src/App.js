import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import StatusUpdate from './components/StatusUpdate';
import StickyNoteBoard from './components/StickyNoteBoard';
import TrickSection from './components/TrickSection';
import WeeklySchedule from './components/WeeklySchedule';
import Whiteboard from './components/Whiteboard';
import Auth from './components/Auth';

function App() {
  const [currentUser, setCurrentUser] = useState(null);

  return (
    <Router>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
        <header style={{
          backgroundColor: '#6b5b95',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px',
          color: 'white',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <h1 style={{ margin: '0 0 10px 0', textAlign: 'center' }}>Sean and Lizzie's Page</h1>
          
          <nav style={{
            display: 'flex', 
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: '10px'
          }}>
            <Link to="/" style={navLinkStyle}>Home</Link>
            <Link to="/status" style={navLinkStyle}>Status Updates</Link>
            <Link to="/notes" style={navLinkStyle}>Sticky Notes</Link>
            <Link to="/tricks" style={navLinkStyle}>Skateboard Tricks</Link>
            <Link to="/schedule" style={navLinkStyle}>Weekly Schedule</Link>
            <Link to="/whiteboard" style={navLinkStyle}>Whiteboard</Link>
          </nav>
          
          {currentUser && (
            <div style={{ 
              textAlign: 'right', 
              padding: '10px 5px', 
              fontSize: '14px' 
            }}>
              Logged in as: <strong>{currentUser}</strong>
            </div>
          )}
        </header>
        
        <main>
          <Routes>
            <Route path="/" element={
              <div>
                <Auth setCurrentUser={setCurrentUser} />
                <div style={{ 
                  marginTop: '30px', 
                  padding: '20px', 
                  backgroundColor: '#f8f9fa',
                  borderRadius: '8px',
                  textAlign: 'center' 
                }}>
                  <h2>Welcome to our page!</h2>
                  <p>Use the navigation menu to explore all our features.</p>
                  {!currentUser && (
                    <p style={{ color: '#d32f2f' }}>
                      Please sign in above to interact with our features!
                    </p>
                  )}
                </div>
              </div>
            } />
            <Route path="/status" element={<StatusUpdate currentUser={currentUser} />} />
            <Route path="/notes" element={<StickyNoteBoard currentUser={currentUser} />} />
            <Route path="/tricks" element={<TrickSection currentUser={currentUser} />} />
            <Route path="/schedule" element={<WeeklySchedule currentUser={currentUser} />} />
            <Route path="/whiteboard" element={<Whiteboard currentUser={currentUser} />} />
          </Routes>
        </main>
        
        <footer style={{
          marginTop: '40px',
          padding: '15px',
          textAlign: 'center',
          borderTop: '1px solid #dee2e6',
          color: '#6c757d'
        }}>
          <p>&copy; 2025 Sean and Lizzie's Page | Made with ❤️</p>
        </footer>
      </div>
    </Router>
  );
}

// Styles
const navLinkStyle = {
  color: 'white',
  textDecoration: 'none',
  padding: '8px 12px',
  borderRadius: '4px',
  transition: 'background-color 0.3s',
  backgroundColor: 'rgba(255, 255, 255, 0.2)'
};

export default App;