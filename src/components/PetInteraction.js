import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  increment,
  onSnapshot
} from 'firebase/firestore';

function PetInteraction({ currentUser }) {
  const [tobiDancing, setTobiDancing] = useState(false);
  const [hachiDancing, setHachiDancing] = useState(false);
  const [stats, setStats] = useState({
    petsFed: 0,
    tobiDances: 0,
    hachiDances: 0,
    lastFed: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize and load pet stats
  useEffect(() => {
    // Create a single stats document if it doesn't exist
    const initStats = async () => {
      try {
        const statsRef = doc(db, "pets", "stats");
        const statsDoc = await getDoc(statsRef);
        
        if (!statsDoc.exists()) {
          await setDoc(statsRef, {
            petsFed: 0,
            tobiDances: 0,
            hachiDances: 0,
            lastFed: null
          });
        }
      } catch (err) {
        console.error("Error initializing stats:", err);
      }
    };
    
    initStats();
    
    // Set up listener for the stats document
    const statsRef = doc(db, "pets", "stats");
    const unsubscribe = onSnapshot(statsRef, (doc) => {
      if (doc.exists()) {
        setStats(doc.data());
      }
      setLoading(false);
    }, (err) => {
      console.error("Error in snapshot:", err);
      setError("Failed to load pet data");
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  const handleTobiDance = async () => {
    if (!currentUser) return;
    
    setTobiDancing(true);
    setTimeout(() => setTobiDancing(false), 3000);
    
    try {
      const statsRef = doc(db, "pets", "stats");
      await updateDoc(statsRef, {
        tobiDances: increment(1)
      });
    } catch (err) {
      console.error("Error updating Tobi dance count:", err);
    }
  };

  const handleHachiDance = async () => {
    if (!currentUser) return;
    
    setHachiDancing(true);
    setTimeout(() => setHachiDancing(false), 3000);
    
    try {
      const statsRef = doc(db, "pets", "stats");
      await updateDoc(statsRef, {
        hachiDances: increment(1)
      });
    } catch (err) {
      console.error("Error updating Hachi dance count:", err);
    }
  };

  const feedPets = async () => {
    if (!currentUser) return;
    
    try {
      const statsRef = doc(db, "pets", "stats");
      await updateDoc(statsRef, {
        petsFed: increment(1),
        lastFed: new Date().toISOString()
      });
    } catch (err) {
      console.error("Error feeding pets:", err);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "Never";
    return new Date(dateStr).toLocaleString();
  };

  return (
    <div className="container">
      <h2>🐾 Tobi & Hachi 🐾</h2>
      
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
      
      <div style={{textAlign: 'center'}}>
        <p>Click on Tobi and Hachi to make them dance!</p>
        
        <div style={{display: 'flex', justifyContent: 'center', gap: '30px', margin: '20px 0'}}>
          <div>
            <img
              src="/path/to/tobi.jpg" // Replace with actual image path
              alt="Tobi"
              onClick={handleTobiDance}
              className={tobiDancing ? 'dancing' : ''}
              style={{
                width: '150px',
                height: '150px',
                border: '3px solid #ff9900',
                borderRadius: '10px',
                cursor: 'pointer',
                transition: 'transform 0.3s',
                transform: tobiDancing ? 'rotate(20deg) scale(1.2)' : 'none'
              }}
            />
            <p style={{fontWeight: 'bold', marginTop: '5px'}}>Tobi</p>
            <p style={{fontSize: '14px', color: '#666'}}>
              Dance Count: {loading ? '...' : stats.tobiDances}
            </p>
          </div>
          
          <div>
            <img
              src="/path/to/hachi.jpg" // Replace with actual image path
              alt="Hachi"
              onClick={handleHachiDance}
              className={hachiDancing ? 'dancing' : ''}
              style={{
                width: '150px',
                height: '150px',
                border: '3px solid #9933cc',
                borderRadius: '10px',
                cursor: 'pointer',
                transition: 'transform 0.3s',
                transform: hachiDancing ? 'rotate(-20deg) scale(1.2)' : 'none'
              }}
            />
            <p style={{fontWeight: 'bold', marginTop: '5px'}}>Hachi</p>
            <p style={{fontSize: '14px', color: '#666'}}>
              Dance Count: {loading ? '...' : stats.hachiDances}
            </p>
          </div>
        </div>
        
        <div style={{
          marginTop: '30px',
          padding: '15px',
          backgroundColor: '#f9f9f9',
          borderRadius: '8px',
          border: '2px solid #ff9900',
          maxWidth: '400px',
          margin: '0 auto'
        }}>
          <button 
            onClick={feedPets}
            disabled={!currentUser}
            style={{
              padding: '10px 20px',
              backgroundColor: !currentUser ? '#cccccc' : '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: !currentUser ? 'not-allowed' : 'pointer',
              fontSize: '16px'
            }}
          >
            Feed Pets
          </button>
          
          <div style={{marginTop: '15px'}}>
            <p style={{margin: '5px 0'}}>
              Pets have been fed <strong>{loading ? '...' : stats.petsFed}</strong> {stats.petsFed === 1 ? 'time' : 'times'}!
            </p>
            <p style={{margin: '5px 0', fontSize: '14px', color: '#666'}}>
              Last fed: {loading ? '...' : formatDate(stats.lastFed)}
            </p>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes dance {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(20deg) scale(1.2); }
          50% { transform: rotate(-20deg) scale(1.2); }
          75% { transform: rotate(20deg) scale(1.2); }
        }
        
        .dancing {
          animation: dance 0.5s infinite;
        }
      `}</style>
    </div>
  );
}

export default PetInteraction;
