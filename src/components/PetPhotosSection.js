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
  onSnapshot,
  updateDoc,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from 'firebase/storage';

function PetPhotosSection({ currentUser }) {
  const [petPhotos, setPetPhotos] = useState([]);
  const [petName, setPetName] = useState('');
  const [caption, setCaption] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Load pet photos from Firestore on component mount
  useEffect(() => {
    const q = query(
      collection(db, "petPhotos"), 
      orderBy("timestamp", "desc")
    );
    
    // Set up real-time listener
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      try {
        const photosList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp.toDate().toLocaleString()
        }));
        setPetPhotos(photosList);
        setLoading(false);
      } catch (error) {
        console.error("Error processing pet photos:", error);
        setError("Failed to load pet photos. Please refresh the page.");
        setLoading(false);
      }
    }, (error) => {
      console.error("Error listening to pet photos:", error);
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

  const uploadPetPhoto = async () => {
    if (!currentUser) {
      setError('Please sign in to upload pet photos!');
      return;
    }

    if (!selectedFile) {
      setError('Please select a photo to upload!');
      return;
    }

    if (!petName.trim()) {
      setError('Please enter your pet\'s name!');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);
      setError(null);
      
      // Create a unique file name
      const fileName = `pets/${currentUser}_${Date.now()}_${selectedFile.name}`;
      const storageRef = ref(storage, fileName);
      
      // Upload file to Firebase Storage with progress simulation
      // We don't have direct progress tracking with uploadBytes, so simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev < 90) return prev + 10;
          return prev;
        });
      }, 300);
      
      await uploadBytes(storageRef, selectedFile);
      clearInterval(progressInterval);
      setUploadProgress(95);
      
      // Get download URL
      const downloadURL = await getDownloadURL(storageRef);
      setUploadProgress(100);
      
      // Save metadata to Firestore
      const petPhotoData = {
        url: downloadURL,
        storagePath: fileName,
        petName: petName.trim(),
        caption: caption.trim() || 'My cute pet!',
        user: currentUser,
        timestamp: Timestamp.now(),
        likes: 0,
        likedBy: []
      };
      
      await addDoc(collection(db, "petPhotos"), petPhotoData);
      
      // Reset form
      setPetName('');
      setCaption('');
      setSelectedFile(null);
      setPreviewUrl('');
      
    } catch (error) {
      console.error("Error uploading pet photo:", error);
      setError("Failed to upload photo. Please try again.");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const deletePetPhoto = async (id, storagePath, photoUser) => {
    // Only allow deletion if current user matches the photo uploader
    if (currentUser !== photoUser) {
      setError("You can only delete your own pet photos!");
      return;
    }
    
    try {
      // Delete from Firestore
      await deleteDoc(doc(db, "petPhotos", id));
      
      // Delete from Storage
      const fileRef = ref(storage, storagePath);
      await deleteObject(fileRef);
    } catch (error) {
      console.error("Error deleting pet photo:", error);
      setError("Failed to delete photo. Please try again.");
    }
  };

  const likePetPhoto = async (id, likedBy) => {
    if (!currentUser) {
      setError('Please sign in to like photos!');
      return;
    }

    // Check if user already liked this photo
    if (likedBy.includes(currentUser)) {
      return; // User already liked it
    }

    try {
      const photoRef = doc(db, "petPhotos", id);
      
      // Update the likes count and likedBy array
      await updateDoc(photoRef, {
        likes: likedBy.length + 1,
        likedBy: arrayUnion(currentUser)
      });
    } catch (error) {
      console.error("Error liking photo:", error);
      setError("Failed to like photo. Please try again.");
    }
  };

  const unlikePetPhoto = async (id, likedBy) => {
    if (!currentUser) {
      return;
    }

    // Check if user has liked this photo
    if (!likedBy.includes(currentUser)) {
      return; // User hasn't liked it
    }

    try {
      const photoRef = doc(db, "petPhotos", id);
      
      // Update the likes count and likedBy array
      await updateDoc(photoRef, {
        likes: likedBy.length - 1,
        likedBy: arrayRemove(currentUser)
      });
    } catch (error) {
      console.error("Error unliking photo:", error);
      setError("Failed to unlike photo. Please try again.");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && e.ctrlKey && currentUser && selectedFile && petName.trim()) {
      uploadPetPhoto();
    }
  };

  return (
    <div className="container">
      <h2 style={{ textAlign: 'center', color: '#cc0066' }}>Photos of our very awesome cool pets</h2>
      
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
        border: '2px solid #ff6699',
        padding: '20px',
        backgroundColor: '#fff0f5',
        marginBottom: '20px',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        <h3 style={{color: '#cc0066', textAlign: 'center', margin: '0 0 15px 0'}}>Upload Pet Photo</h3>
        
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
          <div style={{
            width: '80%',
            padding: '15px',
            border: '2px dashed #ff6699',
            borderRadius: '8px',
            backgroundColor: '#fff6f9',
            textAlign: 'center',
            marginBottom: '15px'
          }}>
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleFileChange}
              disabled={!currentUser || uploading}
              id="pet-photo-input"
              style={{display: 'none'}}
            />
            <label 
              htmlFor="pet-photo-input"
              style={{
                display: 'block',
                padding: '10px',
                cursor: !currentUser || uploading ? 'not-allowed' : 'pointer',
                backgroundColor: !currentUser || uploading ? '#cccccc' : '#ffccdd',
                borderRadius: '4px',
                marginBottom: '10px'
              }}
            >
              {uploading ? 'Uploading...' : 'Choose a Pet Photo'}
            </label>
            
            {selectedFile && (
              <div style={{fontSize: '14px', color: '#666'}}>
                Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
              </div>
            )}
          </div>
          
          {previewUrl && (
            <div style={{margin: '10px 0', textAlign: 'center'}}>
              <p style={{fontWeight: 'bold', color: '#cc0066'}}>Preview:</p>
              <div style={{
                width: '200px',
                height: '200px',
                border: '1px solid #ff6699',
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
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }} 
                />
              </div>
            </div>
          )}
          
          <input 
            type="text"
            placeholder="Pet's Name"
            value={petName}
            onChange={(e) => setPetName(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={!currentUser || uploading}
            style={{
              margin: '10px 0', 
              width: '80%',
              padding: '10px',
              borderRadius: '4px',
              border: '1px solid #ffaabb'
            }}
          />
          
          <textarea
            placeholder="Add a caption..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            disabled={!currentUser || uploading}
            style={{
              margin: '10px 0', 
              width: '80%', 
              height: '80px',
              padding: '10px',
              borderRadius: '4px',
              border: '1px solid #ffaabb',
              resize: 'vertical'
            }}
          />
          
          {uploading && (
            <div style={{width: '80%', marginBottom: '15px'}}>
              <div style={{
                width: '100%',
                backgroundColor: '#ffddee',
                borderRadius: '4px',
                height: '20px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${uploadProgress}%`,
                  backgroundColor: '#ff6699',
                  height: '100%',
                  borderRadius: '4px',
                  transition: 'width 0.3s ease'
                }}></div>
              </div>
              <p style={{textAlign: 'center', fontSize: '14px', margin: '5px 0', color: '#cc0066'}}>
                {uploadProgress}% Complete
              </p>
            </div>
          )}
          
          <button 
            onClick={uploadPetPhoto}
            disabled={!currentUser || !selectedFile || !petName.trim() || uploading}
            style={{
              padding: '10px 20px',
              backgroundColor: !currentUser || !selectedFile || !petName.trim() || uploading ? '#cccccc' : '#ff6699',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: !currentUser || !selectedFile || !petName.trim() || uploading ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            {uploading ? 'Uploading...' : 'Upload Photo'}
          </button>
          <p style={{fontSize: '12px', color: '#666', marginTop: '5px'}}>
            Maximum file size: 5MB
          </p>
        </div>
      </div>
      
      <div>
        <h3 style={{
          backgroundColor: '#ffccff', 
          padding: '8px', 
          textAlign: 'center',
          borderRadius: '5px',
          color: '#cc0066'
        }}>
          Pet Gallery
        </h3>
        
        {loading ? (
          <div style={{textAlign: 'center', padding: '20px'}}>
            <p>Loading pet photos...</p>
          </div>
        ) : petPhotos.length === 0 ? (
          <p style={{textAlign: 'center', padding: '20px', color: '#666'}}>
            No pet photos uploaded yet. Show off your furry friends!
          </p>
        ) : (
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '20px',
            padding: '10px'
          }}>
            {petPhotos.map(photo => (
              <div key={photo.id} style={{
                border: '2px solid #ff6699',
                padding: '15px',
                backgroundColor: '#fff6f9',
                width: '280px',
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
                <div style={{textAlign: 'center'}}>
                  <img 
                    src={photo.url} 
                    alt={photo.petName}
                    style={{
                      width: '250px',
                      height: '250px',
                      objectFit: 'cover',
                      border: '1px solid #ff6699',
                      borderRadius: '4px'
                    }}
                    loading="lazy"
                  />
                </div>
                
                <h4 style={{
                  margin: '15px 0 5px 0', 
                  color: '#cc0066', 
                  textAlign: 'center',
                  fontSize: '20px'
                }}>
                  {photo.petName}
                </h4>
                
                <p style={{
                  margin: '10px 0', 
                  fontSize: '16px', 
                  fontStyle: 'italic',
                  textAlign: 'center',
                  color: '#666'
                }}>
                  "{photo.caption}"
                </p>
                
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  margin: '15px 0 5px 0',
                  padding: '5px 0',
                  borderTop: '1px solid #ffccdd',
                  borderBottom: '1px solid #ffccdd'
                }}>
                  <span style={{fontSize: '14px', fontWeight: 'bold'}}>
                    By: {photo.user}
                  </span>
                  
                  {photo.likedBy.includes(currentUser) ? (
                    <button 
                      onClick={() => unlikePetPhoto(photo.id, photo.likedBy)}
                      style={{
                        backgroundColor: '#ff99cc',
                        border: 'none',
                        padding: '5px 10px',
                        borderRadius: '20px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <span style={{marginRight: '5px', fontSize: '16px'}}>❤️</span> 
                      <span>{photo.likes}</span>
                    </button>
                  ) : (
                    <button 
                      onClick={() => likePetPhoto(photo.id, photo.likedBy)}
                      disabled={!currentUser}
                      style={{
                        backgroundColor: !currentUser ? '#cccccc' : '#ffccdd',
                        border: 'none',
                        padding: '5px 10px',
                        borderRadius: '20px',
                        cursor: !currentUser ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <span style={{marginRight: '5px', fontSize: '16px'}}>🤍</span>
                      <span>{photo.likes}</span>
                    </button>
                  )}
                </div>
                
                <p style={{
                  margin: '8px 0 0 0', 
                  fontSize: '12px', 
                  color: '#888',
                  textAlign: 'right'
                }}>
                  {photo.timestamp}
                </p>
                
                {currentUser === photo.user && (
                  <button 
                    onClick={() => deletePetPhoto(photo.id, photo.storagePath, photo.user)}
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
                      justifyContent: 'center',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}
                    title="Delete this photo"
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

export default PetPhotosSection;