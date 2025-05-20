import React, { useRef, useEffect, useState } from 'react';
import { db, storage } from '../firebase';
import { 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy, 
  Timestamp, 
  onSnapshot, 
  where
} from 'firebase/firestore';
import {
  ref,
  uploadString,
  getDownloadURL,
  deleteObject
} from 'firebase/storage';

function Whiteboard({ currentUser }) {
  const canvasRef = useRef(null);
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(5);
  const [savedDrawings, setSavedDrawings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pointerEvents, setPointerEvents] = useState(true);
  const [error, setError] = useState(null);
  
  // Track drawing state with useRef to avoid dependency issues in useEffect
  const drawingState = useRef({
    drawing: false,
    lastX: 0,
    lastY: 0
  });

  // Load saved drawings from Firestore on component mount
  useEffect(() => {
    // Filter for only whiteboard drawing entries in the statusUpdates collection
    const q = query(
      collection(db, "statusUpdates"),
      where("type", "==", "whiteboardDrawing"),
      orderBy("timestamp", "desc")
    );
    
    // Set up real-time listener
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      try {
        const drawingsList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp.toDate().toLocaleString() // Convert Firestore timestamp
        }));
        setSavedDrawings(drawingsList);
        setLoading(false);
      } catch (error) {
        console.error("Error processing drawings:", error);
        setError("Failed to load drawings. Please refresh the page.");
        setLoading(false);
      }
    }, (error) => {
      console.error("Error listening to drawings:", error);
      setError("Failed to connect to the database. Please refresh the page.");
      setLoading(false);
    });
    
    // Clean up listener on component unmount
    return () => unsubscribe();
  }, []);

  // Initialize canvas and set up event listeners
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Fill canvas with white
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Setup drawing state
    const state = drawingState.current;
    
    const startDrawing = (e) => {
      if (!currentUser || !pointerEvents) {
        if (!currentUser) {
          setError('Please sign in to draw!');
        }
        return;
      }
      
      state.drawing = true;
      
      // Get initial position
      const rect = canvas.getBoundingClientRect();
      state.lastX = e.clientX - rect.left;
      state.lastY = e.clientY - rect.top;
    };
    
    const stopDrawing = () => {
      state.drawing = false;
    };
    
    const draw = (e) => {
      if (!state.drawing || !pointerEvents) return;
      
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = color;

      const rect = canvas.getBoundingClientRect();
      const currentX = e.clientX - rect.left;
      const currentY = e.clientY - rect.top;
      
      // Draw line from last position to current position
      ctx.beginPath();
      ctx.moveTo(state.lastX, state.lastY);
      ctx.lineTo(currentX, currentY);
      ctx.stroke();
      
      // Update last position
      state.lastX = currentX;
      state.lastY = currentY;
    };

    // Add touch support
    const touchStart = (e) => {
      e.preventDefault();
      if (!currentUser || !pointerEvents) {
        if (!currentUser) {
          setError('Please sign in to draw!');
        }
        return;
      }
      
      const touch = e.touches[0];
      const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY
      });
      canvas.dispatchEvent(mouseEvent);
    };
    
    const touchMove = (e) => {
      e.preventDefault();
      if (!state.drawing || !pointerEvents) return;
      
      const touch = e.touches[0];
      const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
      });
      canvas.dispatchEvent(mouseEvent);
    };
    
    const touchEnd = (e) => {
      e.preventDefault();
      const mouseEvent = new MouseEvent('mouseup', {});
      canvas.dispatchEvent(mouseEvent);
    };

    // Add event listeners
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseout', stopDrawing);
    
    // Touch events
    canvas.addEventListener('touchstart', touchStart);
    canvas.addEventListener('touchmove', touchMove);
    canvas.addEventListener('touchend', touchEnd);

    return () => {
      // Remove event listeners
      canvas.removeEventListener('mousedown', startDrawing);
      canvas.removeEventListener('mouseup', stopDrawing);
      canvas.removeEventListener('mousemove', draw);
      canvas.removeEventListener('mouseout', stopDrawing);
      
      // Touch events
      canvas.removeEventListener('touchstart', touchStart);
      canvas.removeEventListener('touchmove', touchMove);
      canvas.removeEventListener('touchend', touchEnd);
    };
  }, [color, brushSize, currentUser, pointerEvents]);

  const clearCanvas = () => {
    if (!currentUser) {
      setError('Please sign in to use the whiteboard!');
      return;
    }
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const saveDrawing = async () => {
    if (!currentUser) {
      setError('Please sign in to save your drawing!');
      return;
    }
    
    setSaving(true);
    setPointerEvents(false);
    
    try {
      const canvas = canvasRef.current;
      // Convert canvas to base64 string (data URL) with reduced quality/size
      const drawingURL = canvas.toDataURL('image/jpeg', 0.6);
      
      // Create a unique file name
      const timestamp = Date.now();
      const fileName = `drawings/${currentUser}_${timestamp}.jpg`;
      const storageRef = ref(storage, fileName);
      
      // Upload image to Firebase Storage
      await uploadString(storageRef, drawingURL, 'data_url');
      
      // Get download URL
      const downloadURL = await getDownloadURL(storageRef);
      
      // Save drawing metadata to statusUpdates collection
      const newDrawing = {
        type: "whiteboardDrawing", // Add type field to distinguish from other statusUpdates
        imageUrl: downloadURL,
        storagePath: fileName,
        user: currentUser,
        timestamp: Timestamp.now(),
        // Add fields for compatibility with StatusUpdate
        text: `${currentUser} shared a drawing`,
        emoji: "🎨"
      };
      
      await addDoc(collection(db, "statusUpdates"), newDrawing);
      
      // Clear the canvas
      clearCanvas();
      setError(null);
    } catch (error) {
      console.error("Error saving drawing:", error);
      setError("Failed to save drawing. Please try again.");
    } finally {
      setSaving(false);
      setPointerEvents(true);
    }
  };

  const deleteDrawing = async (id, storagePath, drawingUser) => {
    // Only allow deletion if current user matches the drawing creator
    if (currentUser !== drawingUser) {
      setError("You can only delete your own drawings!");
      return;
    }
    
    try {
      // First delete from Firestore (from statusUpdates)
      await deleteDoc(doc(db, "statusUpdates", id));
      
      // Then delete the image from Storage
      const storageRef = ref(storage, storagePath);
      await deleteObject(storageRef);
      
      setError(null);
    } catch (error) {
      console.error("Error deleting drawing:", error);
      setError("Failed to delete drawing. Please try again.");
    }
  };

  return (
    <div className="container">
      <h2>Whiteboard</h2>
      
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
      
      <div style={{
        textAlign: 'center', 
        marginBottom: '15px',
        padding: '10px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        border: '1px solid #dee2e6'
      }}>
        <label style={{marginRight: '15px'}}>
          Color:
          <input 
            type="color" 
            value={color} 
            onChange={(e) => setColor(e.target.value)}
            style={{marginLeft: '5px', cursor: currentUser ? 'pointer' : 'not-allowed'}}
            disabled={!currentUser || saving}
          />
        </label>
        
        <label style={{marginRight: '15px'}}>
          Brush Size:
          <select 
            value={brushSize} 
            onChange={(e) => setBrushSize(parseInt(e.target.value))}
            style={{
              marginLeft: '5px',
              padding: '4px 8px',
              borderRadius: '4px',
              border: '1px solid #ced4da',
              cursor: currentUser ? 'pointer' : 'not-allowed'
            }}
            disabled={!currentUser || saving}
          >
            <option value="1">Small</option>
            <option value="5">Medium</option>
            <option value="10">Large</option>
            <option value="20">Extra Large</option>
          </select>
        </label>
        
        <button 
          onClick={clearCanvas} 
          style={{
            marginLeft: '10px',
            padding: '5px 10px',
            backgroundColor: !currentUser || saving ? '#cccccc' : '#ff6b6b',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: !currentUser || saving ? 'not-allowed' : 'pointer'
          }} 
          disabled={!currentUser || saving}
        >
          Clear
        </button>
        
        <button 
          onClick={saveDrawing} 
          style={{
            marginLeft: '10px',
            padding: '5px 10px',
            backgroundColor: !currentUser || saving ? '#cccccc' : '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: !currentUser || saving ? 'not-allowed' : 'pointer'
          }} 
          disabled={!currentUser || saving}
        >
          {saving ? 'Saving...' : 'Save & Share'}
        </button>
      </div>
      
      <div style={{display: 'flex', justifyContent: 'center'}}>
        <canvas 
          ref={canvasRef} 
          width="500" 
          height="400" 
          style={{
            border: '3px solid #000000',
            borderRadius: '5px',
            cursor: currentUser && pointerEvents ? 'crosshair' : 'not-allowed',
            backgroundColor: '#ffffff',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            pointerEvents: pointerEvents ? 'auto' : 'none'
          }} 
        />
      </div>
      
      {/* Saved Drawings Gallery */}
      <div style={{marginTop: '30px'}}>
        <h3 style={{
          backgroundColor: '#ccffcc', 
          padding: '8px', 
          textAlign: 'center',
          borderRadius: '5px'
        }}>
          Shared Masterpieces
        </h3>
        
        {loading ? (
          <p style={{textAlign: 'center'}}>Loading drawings...</p>
        ) : savedDrawings.length === 0 ? (
          <p style={{textAlign: 'center'}}>No drawings yet. Be the first artist!</p>
        ) : (
          <div style={{
            display: 'flex', 
            flexWrap: 'wrap', 
            justifyContent: 'center', 
            gap: '20px',
            marginTop: '15px'
          }}>
            {savedDrawings.map((drawing) => (
              <div key={drawing.id} style={{
                border: '2px solid #9933cc',
                padding: '15px',
                backgroundColor: '#f0f0ff',
                width: '250px',
                position: 'relative',
                borderRadius: '8px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.15)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
              }}
              >
                <p style={{
                  fontWeight: 'bold', 
                  color: '#0000FF',
                  borderBottom: '1px solid #ddd',
                  paddingBottom: '5px',
                  marginTop: '0'
                }}>
                  Artist: {drawing.user}
                </p>
                <p style={{
                  fontSize: '12px',
                  color: '#666',
                  marginTop: '5px'
                }}>
                  {drawing.timestamp}
                </p>
                <div style={{
                  width: '100%', 
                  height: '200px', 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  marginTop: '10px'
                }}>
                  <img 
                    src={drawing.imageUrl} 
                    alt={`Drawing by ${drawing.user}`}
                    style={{
                      maxWidth: '100%', 
                      maxHeight: '100%', 
                      objectFit: 'contain',
                      border: '1px solid #ddd',
                      borderRadius: '4px'
                    }}
                    loading="lazy"
                  />
                </div>
                
                {currentUser === drawing.user && (
                  <button 
                    onClick={() => deleteDrawing(drawing.id, drawing.storagePath, drawing.user)}
                    style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      backgroundColor: '#ff6666',
                      color: 'white',
                      border: 'none',
                      borderRadius: '50%',
                      width: '24px',
                      height: '24px',
                      fontSize: '14px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Delete this drawing"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Whiteboard;
