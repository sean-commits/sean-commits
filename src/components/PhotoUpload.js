import React, { useState, useEffect } from 'react';
import { db, storage } from '../firebase';
import { collection, addDoc, getDocs, query, orderBy, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

function PhotoUpload({ currentUser }) {
  const [photos, setPhotos] = useState([]);
  const [title, setTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Load photos from Firestore on component mount
  useEffect(() => {
    async function fetchPhotos() {
      try {
        setLoading(true);
        const q = query(collection(db, "photos"), orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);
        const photoList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp.toDate().toLocaleString()
        }));
        setPhotos(photoList);
      } catch (error) {
        console.error("Error fetching photos:", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchPhotos();
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      
      // Create a preview URL for the selected image
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTitleChange = (e) => {
    setTitle(e.target.value);
  };

  const uploadPhoto = async () => {
    if (!currentUser) {
      alert('Please sign in to upload photos!');
      return;
    }

    if (!selectedFile) {
      alert('Please select a file to upload!');
      return;
    }

    try {
      setUploading(true);
      
      // 1. Upload file to Firebase Storage
      const storageRef = ref(storage, `photos/${Date.now()}_${selectedFile.name}`);
      await uploadBytes(storageRef, selectedFile);
      const downloadURL = await getDownloadURL(storageRef);
      
      // 2. Save metadata to Firestore
      const photoData = {
        title: title || 'Untitled Photo',
        url: downloadURL,
        storagePath: storageRef.fullPath,
        user: currentUser,
        timestamp: Timestamp.now()
      };
      
      const docRef = await addDoc(collection(db, "photos"), photoData);
      
      // 3. Update local state
      setPhotos([{
        id: docRef.id,
        ...photoData,
        timestamp: new Date().toLocaleString()
      }, ...photos]);
      
      // 4. Reset form
      setTitle('');
      setSelectedFile(null);
      setPreviewUrl('');
      
    } catch (error) {
      console.error("Error uploading photo:", error);
      alert("Failed to upload photo. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const deletePhoto = async (id, storagePath) => {
    try {
      // 1. Delete from Firestore
      await deleteDoc(doc(db, "photos", id));
      
      // 2. Delete from Storage
      const fileRef = ref(storage, storagePath);
      await deleteObject(fileRef);
      
      // 3. Update local state
      setPhotos(photos.filter(photo => photo.id !== id));
    } catch (error) {
      console.error("Error deleting photo:", error);
      alert("Failed to delete photo. Please try again.");
    }
  };

  return (
    <div className="container">
      <h2>Photos</h2>
      
      <div style={{
        border: '2px solid #9933cc',
        padding: '15px',
        backgroundColor: '#f0f0ff',
        marginBottom: '20px'
      }}>
        <h3 style={{color: '#ff00ff', textAlign: 'center'}}>Upload New Photo</h3>
        
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleFileChange}
            disabled={!currentUser || uploading}
            style={{marginBottom: '10px'}}
          />
          
          {previewUrl && (
            <div style={{margin: '10px 0'}}>
              <p>Preview:</p>
              <img 
                src={previewUrl} 
                alt="Preview" 
                style={{
                  maxWidth: '200px', 
                  maxHeight: '200px',
                  border: '1px solid #000'
                }} 
              />
            </div>
          )}
          
          <input 
            type="text"
            placeholder="Enter a title for your photo"
            value={title}
            onChange={handleTitleChange}
            disabled={!currentUser || uploading}
            style={{margin: '10px 0', width: '80%'}}
          />
          
          <button 
            onClick={uploadPhoto}
            disabled={!currentUser || !selectedFile || uploading}
            style={{marginTop: '10px'}}
          >
            {uploading ? 'Uploading...' : 'Upload Photo'}
          </button>
        </div>
      </div>
      
      <div>
        <h3 style={{backgroundColor: '#ffcc99', padding: '5px', textAlign: 'center'}}>
          Photo Gallery
        </h3>
        
        {loading ? (
          <p style={{textAlign: 'center'}}>Loading photos...</p>
        ) : photos.length === 0 ? (
          <p style={{textAlign: 'center'}}>No photos uploaded yet. Be the first!</p>
        ) : (
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '15px'
          }}>
            {photos.map(photo => (
              <div key={photo.id} style={{
                border: '2px solid #ff9900',
                padding: '10px',
                backgroundColor: '#fffaf0',
                width: '220px',
                position: 'relative'
              }}>
                <div style={{textAlign: 'center'}}>
                  <img 
                    src={photo.url} 
                    alt={photo.title}
                    style={{
                      width: '200px',
                      height: '200px',
                      objectFit: 'contain',
                      border: '1px solid #000'
                    }}
                  />
                </div>
                <h4 style={{margin: '10px 0 5px 0', color: '#0000FF'}}>{photo.title}</h4>
                <p style={{margin: '0', fontSize: '12px'}}>Uploaded by: {photo.user}</p>
                <p style={{margin: '0', fontSize: '10px', color: '#666'}}>{photo.timestamp}</p>
                
                {currentUser === photo.user && (
                  <button 
                    onClick={() => deletePhoto(photo.id, photo.storagePath)}
                    style={{
                      position: 'absolute',
                      top: '5px',
                      right: '5px',
                      backgroundColor: '#ff6666',
                      color: 'white',
                      border: 'none',
                      borderRadius: '50%',
                      width: '20px',
                      height: '20px',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    X
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

export default PhotoUpload;