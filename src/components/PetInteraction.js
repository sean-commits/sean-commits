import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp, 
  increment,
  collection,
  onSnapshot
} from 'firebase/firestore';

function PetInteraction({ currentUser }) {
  const [tobiDancing, setTobiDancing] = useState(false);
  const [hachiDancing, setHachiDancing] = useState(false);
  const [petsFed, setPetsFed] = useState(0);
  const [tobiDanceCount, setTobiDanceCount] = useState(0);
  const [hachiDanceCount, setHachiDanceCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFed, setLastFed] = useState(null);

  // Load pet interaction data from Firestore
  useEffect(() => {
    if (!db) {
      setError("Database connection failed. Please refresh the page.");
      setLoading(false);
      return;
    }

    setLoading(true);
    
    // Set up real-time listener for pet stats
    const petsStatsRef = collection(db, "petStats");
    const unsubscribe = onSnapshot(petsStatsRef, (snapshot) => {
      try {
        let fedCount = 0;
        let tobiCount = 0;
        let hachiCount = 0;
        let lastFedTimestamp = null;
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (doc.id === 'feedCount') {
            fedCount = data.count || 0;
            lastFedTimestamp = data.lastFed ? data.lastFed.toDate() : null;
          } else if (doc.id === 'tobiDanceCount') {
            tobiCount = data.count || 0;
          } else if (doc.id === 'hachiDanceCount') {
            hachiCount = data.count || 0;
          }
        });
        
        setPetsFed(fedCount);
        setTobiDanceCount(tobiCount);
        setHachiDanceCount(hachiCount);
        setLastFed(lastFedTimestamp);
        setLoading(false);
      } catch (error) {
        console.error("Error processing pet stats:", error);
        setError("Failed to load pet interaction data. Please refresh the page.");
        setLoading(false);
      }
    }, (error) => {
      console.error("Error listening to pet stats:", error);
      setError("Failed to connect to the database. Please refresh the page.");
      setLoading(false);
    });
    
    // Clean up listener on component unmount
    return () => unsubscribe();
  }, []);

  // Initialize Firestore documents if they don't exist
  useEffect(() => {
    const initializePetStats = async () => {
      try {
        // Check if documents exist and create if they don't
        const feedDocRef = doc(db, "petStats", "feedCount");
        const feedDocSnap = await getDoc(feedDocRef);
        
        if (!feedDocSnap.exists()) {
          await setDoc(feedDocRef, { 
            count: 0,
            lastFed: null
          });
        }
        
        const tobiDocRef = doc(db, "petStats", "tobiDanceCount");
        const tobiDocSnap = await getDoc(tobiDocRef);
        
        if (!tobiDocSnap.exists()) {
          await setDoc(tobiDocRef, { count: 0 });
        }
        
        const hachiDocRef = doc(db, "petStats", "hachiDanceCount");
        const hachiDocSnap = await getDoc(hachiDocRef);
        
        if (!hachiDocSnap.exists()) {
          await setDoc(hachiDocRef, { count: 0 });
        }
      } catch (error) {
        console.error("Error initializing pet stats:", error);
        setError("Failed to initialize pet data.");
      }
    };
    
    initializePetStats();
  }, []);

  const handleTobiClick = async () => {
    setTobiDancing(true);
    setTimeout(() => setTobiDancing(false), 3000);
    
    try {
      if (currentUser) {
        // Update Tobi's dance count in Firestore
        const tobiDocRef = doc(db, "petStats", "tobiDanceCount");
        await updateDoc(tobiDocRef, {
          count: increment(1),
          lastInteraction: serverTimestamp(),
          lastUser: currentUser
        });
        
        // Add to user's interaction log
        const interactionRef = doc(collection(db, "petInteractions"));
        await setDoc(interactionRef, {
          type: "dance",
          pet: "Tobi",
          user: currentUser,
          timestamp: serverTimestamp()
        });
        
        // Update local state
        setTobiDanceCount(tobiDanceCount + 1);
      }
    } catch (error) {
      console.error("Error updating Tobi dance count:", error);
      setError("Failed to record interaction. Please try again.");
    }
  };

  const handleHachiClick = async () => {
    setHachiDancing(true);
    setTimeout(() => setHachiDancing(false), 3000);
    
    try {
      if (currentUser) {
        // Update Hachi's dance count in Firestore
        const hachiDocRef = doc(db, "petStats", "hachiDanceCount");
        await updateDoc(hachiDocRef, {
          count: increment(1),
          lastInteraction: serverTimestamp(),
          lastUser: currentUser
        });
        
        // Add to user's interaction log
        const interactionRef = doc(collection(db, "petInteractions"));
        await setDoc(interactionRef, {
          type: "dance",
          pet: "Hachi",
          user: currentUser,
          timestamp: serverTimestamp()
        });
        
        // Update local state
        setHachiDanceCount(hachiDanceCount + 1);
      }
    } catch (error) {
      console.error("Error updating Hachi dance count:", error);
      setError("Failed to record interaction. Please try again.");
    }
  };

  const feedPets = async () => {
    try {
      if (currentUser) {
        // Update feed count in Firestore
        const feedDocRef = doc(db, "petStats", "feedCount");
        await updateDoc(feedDocRef, {
          count: increment(1),
          lastFed: serverTimestamp(),
          lastUser: currentUser
        });
        
        // Add to user's interaction log
        const interactionRef = doc(collection(db, "petInteractions"));
        await setDoc(interactionRef, {
          type: "feed",
          user: currentUser,
          timestamp: serverTimestamp()
        });
        
        // Update local state
        setPetsFed(petsFed + 1);
        setLastFed(new Date());
      } else {
        setError("Please sign in to interact with pets!");
      }
    } catch (error) {
      console.error("Error updating feed count:", error);
      setError("Failed to record feeding. Please try again.");
    }
  };

  const formatDate = (date) => {
    if (!date) return "Never";
    return date.toLocaleString();
  };

  return (
    <div className="container">
      <h2>🐾 Tobi & Hachi 🐾</h2>
      
      {loading ? (
        <div style={{textAlign: 'center', padding: '20px'}}>
          <p>Loading pet data...</p>
        </div>
      ) : (
        <div style={{textAlign: 'center'}}>
          {error && (
            <div style={{
              padding: '10px',
              margin: '10px 0',
              backgroundColor: '#fff0f0',
              border: '1px solid #ffcccc',
              borderRadius: '4px',
              color: '#cc0000'
            }}>
              {error}
            </div>
          )}
          
          <p>Click on Tobi and Hachi to make them dance!</p>
          
          <div style={{display: 'flex', justifyContent: 'center', gap: '30px', margin: '20px 0'}}>
            <div>
              <img
                src="/path/to/tobi.jpg" // Replace with actual image path
                alt="Tobi"
                onClick={handleTobiClick}
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
                Dance Count: {tobiDanceCount}
              </p>
            </div>
            
            <div>
              <img
                src="/path/to/hachi.jpg" // Replace with actual image path
                alt="Hachi"
                onClick={handleHachiClick}
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
                Dance Count: {hachiDanceCount}
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
                Pets have been fed <strong>{petsFed}</strong> times!
              </p>
              <p style={{margin: '5px 0', fontSize: '14px', color: '#666'}}>
                Last fed: {formatDate(lastFed)}
              </p>
            </div>
          </div>
        </div>
      )}
      
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
