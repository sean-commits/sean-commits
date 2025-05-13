import React, { useState, useEffect, useRef } from 'react';
import { db, storage } from '../firebase';
import { 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy, 
  Timestamp, 
  onSnapshot 
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from 'firebase/storage';

function DigitalCollage({ currentUser }) {
  const [collageItems, setCollageItems] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [draggedItem, setDraggedItem] = useState(null);
  const collageRef = useRef(null);

  // Load collage items from Firestore on component mount
  useEffect(() => {
    const q = query(
      collection(db, "collageItems"), 
      orderBy("timestamp", "desc")
    );
    
    // Set up real-time listener
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      try {
        const items = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp.toDate().toLocaleString()
        }));
        setCollageItems(items);
        setLoading(false);
      } catch (error) {
        console.error("Error processing collage items:", error);
        setError("Failed to load collage. Please refresh the page.");
        setLoading(false);
      }
    }, (error) => {
      console.error("Error listening to collage updates:", error);
      setError("Failed to connect to the database. Please refresh the page.");
      setLoading(false);
    });
    
    // Clean up listener on component unmount
    return () => unsubscribe();
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("File size too large! Please select an image under 5MB.");
        setSelectedFile(null);
        return;
      }
      
      // Check file type
      if (!file.type.match('image.*')) {
        setError("Please select an image file (JPEG, PNG, etc.).");
        setSelectedFile(null);
        return;
      }
      
      setError(null);
      setSelectedFile(file);
      
      // Create a preview URL for the selected image
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadCollageItem = async () => {
    if (!currentUser) {
      setError('Please sign in to add to the collage!');
      return;
    }

    if (!selectedFile) {
      setError('Please select an image to upload!');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      
      // Generate random position if collage exists
      const collageEl = collageRef.current;
      let positionX = 10;
      let positionY = 10;
      let rotation = Math.floor(Math.random() * 30) - 15; // Random rotation between -15 and 15 degrees
      
      if (collageEl) {
        // Get collage dimensions
        const width = collageEl.offsetWidth - 150; // Account for image width
        const height = collageEl.offsetHeight - 150; // Account for image height
        
        // Generate random position within the collage area
        positionX = Math.max(10, Math.floor(Math.random() * width));
        positionY = Math.max(10, Math.floor(Math.random() * height));
      }
      
      // Create a unique file name
      const fileName = `collage/${currentUser}_${Date.now()}_${selectedFile.name}`;
      const storageRef = ref(storage, fileName);
      
      // Upload file to Firebase Storage
      await uploadBytes(storageRef, selectedFile);
      
      // Get download URL
      const downloadURL = await getDownloadURL(storageRef);
      
      // Save metadata to Firestore
      const collageData = {
        caption: caption.trim() || '',
        imageUrl: downloadURL,
        storagePath: fileName,
        positionX: positionX,
        positionY: positionY,
        rotation: rotation,
        zIndex: collageItems.length + 1, // Place on top
        user: currentUser,
        timestamp: Timestamp.now()
      };
      
      await addDoc(collection(db, "collageItems"), collageData);
      
      // Reset form
      setCaption('');
      setSelectedFile(null);
      setPreviewUrl('');
      
    } catch (error) {
      console.error("Error uploading collage item:", error);
      setError("Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const deleteCollageItem = async (id, storagePath, itemUser) => {
    // Only allow deletion if current user matches the item creator
    if (currentUser !== itemUser) {
      setError("You can only delete your own collage items!");
      return;
    }
    
    try {
      // Delete from Firestore
      await deleteDoc(doc(db, "collageItems", id));
      
      // Delete from Storage
      const fileRef = ref(storage, storagePath);
      await deleteObject(fileRef);
    } catch (error) {
      console.error("Error deleting collage item:", error);
      setError("Failed to delete item. Please try again.");
    }
  };

  // Drag and drop functionality
  const handleDragStart = (e, id) => {
    if (!currentUser) return;
    setDraggedItem(id);
  };

  const handleDragEnd = (e) => {
    setDraggedItem(null);
  };

  const updateItemPosition = async (id, newX, newY) => {
    try {
      // Update in Firestore
      await updateDoc(doc(db, "collageItems", id), {
        positionX: newX,
        positionY: newY
      });
    } catch (error) {
      console.error("Error updating position:", error);
    }
  };

  const handleMouseMove = (e) => {
    if (draggedItem && currentUser) {
      const item = collageItems.find(item => item.id === draggedItem);
      if (item && item.user === currentUser) {
        const collageEl = collageRef.current;
        const rect = collageEl.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        updateItemPosition(draggedItem, x, y);
      }
    }
  };

  return (
    <div className="container">
      <h2 style={{ textAlign: 'center', color: '#9933cc' }}>Digital Collage</h2>
      
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
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        marginBottom: '20px',
        padding: '15px',
        backgroundColor: '#f0f0ff',
        borderRadius: '8px',
        border: '2px solid #9933cc'
      }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#9933cc' }}>Add to the Collage</h3>
        
        <div style={{
          width: '80%',
          padding: '15px',
          border: '2px dashed #9933cc',
          borderRadius: '8px',
          backgroundColor: '#f8f8ff',
          textAlign: 'center',
          marginBottom: '15px'
        }}>
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleFileChange}
            disabled={!currentUser || uploading}
            id="collage-file-input"
            style={{ display: 'none' }}
          />
          <label 
            htmlFor="collage-file-input"
            style={{
              display: 'block',
              padding: '10px',
              cursor: !currentUser || uploading ? 'not-allowed' : 'pointer',
              backgroundColor: !currentUser || uploading ? '#cccccc' : '#e6e6fa',
              borderRadius: '4px',
              marginBottom: '10px'
            }}
          >
            {uploading ? 'Uploading...' : 'Choose an Image'}
          </label>
          
          {selectedFile && (
            <div style={{ fontSize: '14px', color: '#666' }}>
              Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
            </div>
          )}
        </div>
        
        {previewUrl && (
          <div style={{ margin: '10px 0', textAlign: 'center' }}>
            <p style={{ fontWeight: 'bold', color: '#9933cc' }}>Preview:</p>
            <div style={{
              width: '150px',
              height: '150px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto'
            }}>
              <img 
                src={previewUrl} 
                alt="Preview" 
                style={{
                  maxWidth: '100%', 
                  maxHeight: '100%',
                  objectFit: 'contain'
                }} 
              />
            </div>
          </div>
        )}
        
        <input 
          type="text"
          placeholder="Add a caption (optional)"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          disabled={!currentUser || uploading}
          style={{
            margin: '15px 0', 
            width: '80%',
            padding: '10px',
            borderRadius: '4px',
            border: '1px solid #ccc'
          }}
        />
        
        <button 
          onClick={uploadCollageItem}
          disabled={!currentUser || !selectedFile || uploading}
          style={{
            padding: '10px 20px',
            backgroundColor: !currentUser || !selectedFile || uploading ? '#cccccc' : '#9933cc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: !currentUser || !selectedFile || uploading ? 'not-allowed' : 'pointer',
            fontSize: '16px'
          }}
        >
          {uploading ? 'Uploading...' : 'Add to Collage'}
        </button>
        <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
          Maximum file size: 5MB
        </p>
      </div>
      
      <div 
        ref={collageRef}
        style={{
          position: 'relative',
          width: '100%',
          height: '600px',
          backgroundColor: '#ffccff',
          borderRadius: '8px',
          overflow: 'hidden',
          border: '3px solid #9933cc',
          boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
          marginTop: '20px'
        }}
        onMouseMove={handleMouseMove}
      >
        {loading ? (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            height: '100%',
            color: '#9933cc',
            fontSize: '18px'
          }}>
            Loading collage...
          </div>
        ) : collageItems.length === 0 ? (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            height: '100%',
            color: '#9933cc',
            fontSize: '18px',
            fontStyle: 'italic'
          }}>
            No items in the collage yet. Be the first to add one!
          </div>
        ) : (
          collageItems.map(item => (
            <div 
              key={item.id} 
              style={{
                position: 'absolute',
                left: `${item.positionX}px`,
                top: `${item.positionY}px`,
                transform: `rotate(${item.rotation}deg)`,
                zIndex: item.zIndex,
                cursor: item.user === currentUser ? 'move' : 'default',
                transition: draggedItem === item.id ? 'none' : 'transform 0.2s ease',
                padding: '5px',
                backgroundColor: 'white',
                boxShadow: '0 3px 6px rgba(0,0,0,0.16)',
                border: '1px solid #ddd',
                maxWidth: '150px'
              }}
              draggable={item.user === currentUser}
              onDragStart={(e) => handleDragStart(e, item.id)}
              onDragEnd={handleDragEnd}
            >
              <img 
                src={item.imageUrl} 
                alt={item.caption || "Collage item"}
                style={{
                  width: '100%',
                  maxHeight: '150px',
                  objectFit: 'contain'
                }}
                loading="lazy"
              />
              {item.caption && (
                <div style={{
                  marginTop: '5px',
                  fontSize: '12px',
                  textAlign: 'center',
                  wordBreak: 'break-word'
                }}>
                  {item.caption}
                </div>
              )}
              <div style={{
                position: 'absolute',
                bottom: '-18px',
                right: '5px',
                fontSize: '10px',
                backgroundColor: 'rgba(255,255,255,0.8)',
                padding: '2px 4px',
                borderRadius: '3px'
              }}>
                {item.user}
              </div>
              
              {currentUser === item.user && (
                <button 
                  onClick={() => deleteCollageItem(item.id, item.storagePath, item.user)}
                  style={{
                    position: 'absolute',
                    top: '-8px',
                    right: '-8px',
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
                    justifyContent: 'center',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }}
                  title="Remove from collage"
                >
                  ✕
                </button>
              )}
            </div>
          ))
        )}
      </div>
      
      <div style={{ 
        marginTop: '15px', 
        textAlign: 'center',
        fontSize: '14px',
        color: '#666'
      }}>
        {currentUser ? 
          "Drag your images to arrange them in the collage!" : 
          "Sign in to add and arrange images in the collage!"}
      </div>
    </div>
  );
}

export default DigitalCollage;