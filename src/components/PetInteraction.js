import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { 
  doc, 
  setDoc, 
  updateDoc, 
  collection, 
  onSnapshot, 
  increment,
  serverTimestamp,
  getDoc
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

  // Initialize Firestore documents if they don't exist
  useEffect(() => {
    if (!db) {
      setError("Database connection failed. Please refresh the page.");
      setLoading(false);
      return;
    }

    const initializePetStats = async () => {
      try {
        // Check if feed count document exists and create if it doesn't
        const feedDocRef = doc(db, "petStats", "feedCount");
        const feedDocSnap = await getDoc(feedDocRef);
        
        if (!feedDocSnap.exists()) {
          console.log("Creating feedCount document");
          await setDoc(feedDocRef, { 
            count: 0,
            lastFed: null
          });
        }
        
        // Check if Tobi's dance count document exists and create if it doesn't
        const tobiDocRef = doc(db, "petStats", "tobiDanceCount");
        const tobiDocSnap = await getDoc(tobiDocRef);
        
        if (!tobiDocSnap.exists()) {
          console.log("Creating tobiDanceCount document");
          await setDoc(tobiDocRef, { count: 0 });
        }
        
        // Check if Hachi's dance count document exists and create if it doesn't
        const hachiDocRef = doc(db, "petStats", "hachiDanceCount");
        const hachiDocSnap = await getDoc(hachiDocRef);
        
        if (!hachiDocSnap.exists()) {
          console.log("Creating hachiDanceCount document");
          await setDoc(hachiDocRef, { count: 0 });
        }
      } catch (error) {
        console.error("Error initializing pet stats:", error);
        setError("Failed to initialize pet data.");
      }
    };
    
    initializePetStats();
  }, [db]);

  // Load pet interaction data from Firestore
  useEffect(() => {
    if (!db) {
      return;
    }

    setLoading(true);
    
    // Set up real-time listener for pet stats
    const petsStatsRef = collection(db, "petStats");
    const unsubscribe = onSnapshot(petsStatsRef, (snapshot) => {
      try {
        console.log("Received pet stats update");
        let fedCount = 0;
        let tobiCount = 0;
        let hachiCount = 0;
        let lastFedTimestamp = null;
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          console.log(`Document ${doc.id}:`, data);
          
          if (doc.id === 'feedCount') {
            fedCount = data.count || 0;
            lastFedTimestamp = data.lastFed ? data.lastFed.toDate() : null;
          } else if (doc.id === 'tobiDanceCount') {
            tobiCount = data.count || 0;
          } else if (doc.id === 'hachiDanceCount') {
            hachiCount = data.count || 0;
          }
        });
        
        console.log("Setting pet stats:", {
          fedCount,
          tobiCount,
          hachiCount,
          lastFedTimestamp
        });
        
        setPetsFed(fedCount);
        setTobiDanceCount(tobiCount);
        setHachiDanceCount(hachiCount);
        setLastFed(lastFedTimestamp);
        setLoading(false);
        setError(null);
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
  }, [db]);

  const handleTobiClick = async () => {
    setTobiDancing(true);
    setTimeout(() => setTobiDancing(false), 3000);
    
    try {
      if (currentUser) {
        setError(null);
        
        // Update Tobi's dance count in Firestore
        console.log("Updating Tobi dance count");
        const tobiDocRef = doc(db, "petStats", "tobiDanceCount");
        await updateDoc(tobiDocRef, {
          count: increment(1),
          lastInteraction: serverTimestamp(),
          lastUser: currentUser
        });
        console.log("Tobi dance count updated");
        
        // Add to interaction log
        console.log("Adding to interaction log");
        const interactionRef = doc(collection(db, "petInteractions"));
        await setDoc(interactionRef, {
          type: "dance",
          pet: "Tobi",
          user: currentUser,
          timestamp: serverTimestamp()
        });
        console.log("Interaction log updated");
      } else {
        setError("Please sign in to save interactions!");
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
        setError(null);
        
        // Update Hachi's dance count in Firestore
        console.log("Updating Hachi dance count");
        const hachiDocRef = doc(db, "petStats", "hachiDanceCount");
        await updateDoc(hachiDocRef, {
          count: increment(1),
          lastInteraction: serverTimestamp(),
          lastUser: currentUser
        });
        console.log("Hachi dance count updated");
        
        // Add to interaction log
        console.log("Adding to interaction log");
        const interactionRef = doc(collection(db, "petInteractions"));
        await setDoc(interactionRef, {
          type: "dance",
          pet: "Hachi",
          user: currentUser,
          timestamp: serverTimestamp()
        });
        console.log("Interaction log updated");
      } else {
        setError("Please sign in to save interactions!");
      }
    } catch (error) {
      console.error("Error updating Hachi dance count:", error);
      setError("Failed to record interaction. Please try again.");
    }
  };

  const feedPets = async () => {
    try {
      if (currentUser) {
        setError(null);
        
        // Update feed count in Firestore
        console.log("Updating feed count");
        const feedDocRef = doc(db, "petStats", "feedCount");
        await updateDoc(feedDocRef, {
          count: increment(1),
          lastFed: serverTimestamp(),
          lastUser: currentUser
        });
        console.log("Feed count updated");
        
        // Add to interaction log
        console.log("Adding to interaction log");
        const interactionRef = doc(collection(db, "petInteractions"));
        await setDoc(interactionRef, {
          type: "feed",
          user: currentUser,
          timestamp: serverTimestamp()
        });
        console.log("Interaction log updated");
      } else {
        setError("Please sign in to feed pets!");
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
              src="/Users/seanmorris/Desktop/sean-commits/src/IMG_0076.JPG" // Replace with actual image path
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
            {!loading && (
              <p style={{fontSize: '14px', color: '#666'}}>
                Dance Count: {tobiDanceCount}
              </p>
            )}
          </div>
          
          <div>
            <img
              src="/Users/seanmorris/Desktop/sean-commits/src/A5FA0E8A-3ABD-44E4-8F28-4A51B484DB8A.JPG" // Replace with actual image path
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
            {!loading && (
              <p style={{fontSize: '14px', color: '#666'}}>
                Dance Count: {hachiDanceCount}
              </p>
            )}
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
          
          {loading ? (
            <p>Loading pet data...</p>
          ) : (
            <div style={{marginTop: '15px'}}>
              <p style={{margin: '5px 0'}}>
                Pets have been fed <strong>{petsFed}</strong> {petsFed === 1 ? 'time' : 'times'}!
              </p>
              <p style={{margin: '5px 0', fontSize: '14px', color: '#666'}}>
                Last fed: {formatDate(lastFed)}
              </p>
            </div>
          )}
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
