import React, { useState, useEffect } from 'react';
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
  uploadBytesResumable,
  getDownloadURL,
  deleteObject
} from 'firebase/storage';

function TrickSection({ currentUser }) {
  const [tricks, setTricks] = useState([]);
  const [trickName, setTrickName] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Load tricks from Firestore on component mount
  useEffect(() => {
    const q = query(
      collection(db, "skateboardingTricks"), 
      orderBy("timestamp", "desc")
    );
    
    // Set up real-time listener
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      try {
        const tricksList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp.toDate().toLocaleString() // Convert Firestore timestamp
        }));
        setTricks(tricksList);
        setLoading(false);
      } catch (error) {
        console.error("Error processing tricks:", error);
        setLoading(false);
      }
    }, (error) => {
      console.error("Error listening to tricks:", error);
      setLoading(false);
    });
    
    // Clean up listener on component unmount
    return () => unsubscribe();
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Check file size (limit to 50MB)
      if (file.size > 50 * 1024 * 1024) {
        alert('File size too large! Please select a video under 50MB.');
        return;
      }
      
      setSelectedFile(file);
      
      // Create a preview URL for the selected video
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadTrick = async () => {
    if (!currentUser) {
      alert('Please sign in to upload trick videos!');
      return;
    }

    if (!selectedFile) {
      alert('Please select a video to upload!');
      return;
    }

    if (!trickName.trim()) {
      alert('Please name your trick!');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Create a unique file name
      const fileName = `tricks/${currentUser}_${Date.now()}_${selectedFile.name}`;
      const storageRef = ref(storage, fileName);
      
      // Upload file to Firebase Storage with progress tracking
      const uploadTask = uploadBytesResumable(storageRef, selectedFile);
      
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          // Track upload progress
          const progress = Math.round(
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          );
          setUploadProgress(progress);
        },
        (error) => {
          console.error("Error uploading video:", error);
          alert("Failed to upload video. Please try again.");
          setUploading(false);
        },
        async () => {
          // Upload complete - get download URL
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          
          // Create new trick document in Firestore
          const newTrick = {
            name: trickName,
            videoUrl: downloadURL,
            storagePath: fileName, // Store the path for deletion later
            user: currentUser,
            timestamp: Timestamp.now()
          };
          
          await addDoc(collection(db, "skateboardingTricks"), newTrick);
          
          // Reset form
          setTrickName('');
          setSelectedFile(null);
          setPreviewUrl('');
          setUploading(false);
          setUploadProgress(0);
        }
      );
    } catch (error) {
      console.error("Error in upload process:", error);
      alert("Failed to upload trick. Please try again.");
      setUploading(false);
    }
  };

  const deleteTrick = async (id, storagePath, trickUser) => {
    // Only allow deletion if current user matches the trick uploader
    if (currentUser !== trickUser) {
      alert("You can only delete your own trick videos!");
      return;
    }
    
    try {
      // First delete from Firestore
      await deleteDoc(doc(db, "skateboardingTricks", id));
      
      // Then delete the video from Storage
      const storageRef = ref(storage, storagePath);
      await deleteObject(storageRef);
    } catch (error) {
      console.error("Error deleting trick:", error);
      alert("Failed to delete trick. Please try again.");
    }
  };

  return (
    <div className="container">
      <h2>Sean's Tricks</h2>
      
      <div style={{
        border: '2px solid #33cc33',
        padding: '15px',
        backgroundColor: '#f0fff0',
        marginBottom: '20px',
        textAlign: 'center',
        borderRadius: '8px'
      }}>
        <h3 style={{color: '#006600'}}>Upload Trick Video</h3>
        
        <input 
          type="text"
          placeholder="Name your trick"
          value={trickName}
          onChange={(e) => setTrickName(e.target.value)}
          disabled={!currentUser || uploading}
          style={{
            margin: '10px 0', 
            width: '80%', 
            padding: '8px',
            borderRadius: '4px',
            border: '1px solid #ccc'
          }}
        />
        
        <input 
          type="file" 
          accept="video/*" 
          onChange={handleFileChange}
          disabled={!currentUser || uploading}
          style={{margin: '10px 0'}}
        />
        
        {previewUrl && (
          <div style={{margin: '15px 0'}}>
            <p>Preview:</p>
            <video 
              src={previewUrl} 
              controls
              style={{
                maxWidth: '300px', 
                maxHeight: '300px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
          </div>
        )}
        
        {uploading && (
          <div style={{margin: '10px 0'}}>
            <p>Uploading: {uploadProgress}%</p>
            <div style={{
              width: '100%',
              backgroundColor: '#e0e0e0',
              borderRadius: '4px',
              height: '20px'
            }}>
              <div style={{
                width: `${uploadProgress}%`,
                backgroundColor: '#4CAF50',
                height: '20px',
                borderRadius: '4px',
                transition: 'width 0.3s ease'
              }}></div>
            </div>
          </div>
        )}
        
        <button 
          onClick={uploadTrick}
          disabled={!currentUser || !selectedFile || !trickName.trim() || uploading}
          style={{
            marginTop: '10px',
            padding: '8px 16px',
            backgroundColor: !currentUser || !selectedFile || !trickName.trim() || uploading ? '#cccccc' : '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: !currentUser || !selectedFile || !trickName.trim() || uploading ? 'not-allowed' : 'pointer'
          }}
        >
          {uploading ? 'Uploading...' : 'Upload Trick'}
        </button>
        <p style={{fontSize: '12px', color: '#666', marginTop: '5px'}}>
          Note: Maximum file size is 50MB
        </p>
      </div>
      
      <div>
        <h3 style={{
          backgroundColor: '#ccffcc', 
          padding: '8px', 
          textAlign: 'center',
          borderRadius: '5px'
        }}>
          Trick Videos
        </h3>
        
        {loading ? (
          <p style={{textAlign: 'center'}}>Loading trick videos...</p>
        ) : tricks.length === 0 ? (
          <p style={{textAlign: 'center'}}>Nothing here...</p>
        ) : (
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '20px'
          }}>
            {tricks.map(trick => (
              <div key={trick.id} style={{
                border: '2px solid #33cc33',
                padding: '15px',
                backgroundColor: '#f8fff8',
                width: '300px',
                position: 'relative',
                borderRadius: '8px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                transition: 'transform 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
              }}
              >
                <h4 style={{
                  margin: '0 0 10px 0', 
                  color: '#006600', 
                  textAlign: 'center',
                  paddingRight: '20px'
                }}>
                  {trick.name}
                </h4>
                
                <div style={{textAlign: 'center'}}>
                  <video 
                    src={trick.videoUrl} 
                    controls
                    style={{
                      width: '100%',
                      borderRadius: '4px',
                      border: '1px solid #ccc'
                    }}
                  />
                </div>
                
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  margin: '10px 0'
                }}>
                  <span style={{fontSize: '12px', fontWeight: 'bold'}}>
                    By: {trick.user}
                  </span>
                  
                  <span style={{fontSize: '10px', color: '#666'}}>
                    {trick.timestamp}
                  </span>
                </div>
                
                {currentUser === trick.user && (
                  <button 
                    onClick={() => deleteTrick(trick.id, trick.storagePath, trick.user)}
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
                    title="Delete this trick"
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

export default TrickSection;