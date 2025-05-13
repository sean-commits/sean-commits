import React, { useState, useEffect } from 'react';

function PhotoUpload({ currentUser }) {
  const [photos, setPhotos] = useState([]);
  const [title, setTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  // Load photos from localStorage on component mount
  useEffect(() => {
    const storedPhotos = localStorage.getItem('uploadedPhotos');
    if (storedPhotos) {
      setPhotos(JSON.parse(storedPhotos));
    }
  }, []);

  // Save photos to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('uploadedPhotos', JSON.stringify(photos));
  }, [photos]);

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

  const uploadPhoto = () => {
    if (!currentUser) {
      alert('Please sign in to upload photos!');
      return;
    }

    if (!selectedFile) {
      alert('Please select a file to upload!');
      return;
    }

    const newPhoto = {
      id: Date.now(),
      url: previewUrl,
      title: title || 'Untitled Photo',
      user: currentUser,
      timestamp: new Date().toLocaleString()
    };

    setPhotos([newPhoto, ...photos]);
    setTitle('');
    setSelectedFile(null);
    setPreviewUrl('');
  };

  const deletePhoto = (id) => {
    setPhotos(photos.filter(photo => photo.id !== id));
  };

  return (
    <div className="container">
      <h2>📸 Photo Album 📸</h2>
      
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
            disabled={!currentUser}
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
            disabled={!currentUser}
            style={{margin: '10px 0', width: '80%'}}
          />
          
          <button 
            onClick={uploadPhoto}
            disabled={!currentUser || !selectedFile}
            style={{marginTop: '10px'}}
          >
            Upload Photo
          </button>
        </div>
      </div>
      
      <div>
        <h3 style={{backgroundColor: '#ffcc99', padding: '5px', textAlign: 'center'}}>
          Photo Gallery
        </h3>
        
        {photos.length === 0 ? (
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
                
                <button 
                  onClick={() => deletePhoto(photo.id)}
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default PhotoUpload;