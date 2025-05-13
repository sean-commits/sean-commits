import React, { useState, useEffect } from 'react';

function PetPhotosSection({ currentUser }) {
  const [petPhotos, setPetPhotos] = useState([]);
  const [petName, setPetName] = useState('');
  const [caption, setCaption] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  // Load pet photos from localStorage on component mount
  useEffect(() => {
    const storedPhotos = localStorage.getItem('petPhotos');
    if (storedPhotos) {
      setPetPhotos(JSON.parse(storedPhotos));
    }
  }, []);

  // Save pet photos to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('petPhotos', JSON.stringify(petPhotos));
  }, [petPhotos]);

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

  const uploadPetPhoto = () => {
    if (!currentUser) {
      alert('Please sign in to upload pet photos!');
      return;
    }

    if (!selectedFile) {
      alert('Please select a photo to upload!');
      return;
    }

    if (!petName.trim()) {
      alert('Please enter your pet\'s name!');
      return;
    }

    const newPetPhoto = {
      id: Date.now(),
      url: previewUrl,
      petName,
      caption: caption || 'My cute pet!',
      user: currentUser,
      timestamp: new Date().toLocaleString(),
      likes: 0,
      likedBy: []
    };

    setPetPhotos([newPetPhoto, ...petPhotos]);
    setPetName('');
    setCaption('');
    setSelectedFile(null);
    setPreviewUrl('');
  };

  const deletePetPhoto = (id) => {
    setPetPhotos(petPhotos.filter(photo => photo.id !== id));
  };

  const likePetPhoto = (id) => {
    if (!currentUser) {
      alert('Please sign in to like photos!');
      return;
    }

    setPetPhotos(petPhotos.map(photo => {
      if (photo.id === id) {
        // Check if user already liked this photo
        if (photo.likedBy.includes(currentUser)) {
          return photo; // User already liked it
        }
        
        return {
          ...photo,
          likes: photo.likes + 1,
          likedBy: [...photo.likedBy, currentUser]
        };
      }
      return photo;
    }));
  };

  return (
    <div className="container">
      <h2>Photos of our very awesome cool pets</h2>
      
      <div style={{
        border: '2px solid #ff6699',
        padding: '15px',
        backgroundColor: '#fff0f5',
        marginBottom: '20px'
      }}>
        <h3 style={{color: '#cc0066', textAlign: 'center'}}>Upload Pet Photo</h3>
        
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
            placeholder="Pet's Name"
            value={petName}
            onChange={(e) => setPetName(e.target.value)}
            disabled={!currentUser}
            style={{margin: '10px 0', width: '80%'}}
          />
          
          <textarea
            placeholder="Add a caption..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            disabled={!currentUser}
            style={{margin: '10px 0', width: '80%', height: '60px'}}
          />
          
          <button 
            onClick={uploadPetPhoto}
            disabled={!currentUser || !selectedFile || !petName.trim()}
            style={{marginTop: '10px'}}
          >
            Upload Photo
          </button>
        </div>
      </div>
      
      <div>
        <h3 style={{backgroundColor: '#ffccff', padding: '5px', textAlign: 'center'}}>
          Pet Gallery
        </h3>
        
        {petPhotos.length === 0 ? (
          <p style={{textAlign: 'center'}}>No pet photos uploaded yet. Show off your furry friends!</p>
        ) : (
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '20px'
          }}>
            {petPhotos.map(photo => (
              <div key={photo.id} style={{
                border: '2px solid #ff6699',
                padding: '15px',
                backgroundColor: '#fff6f9',
                width: '250px',
                position: 'relative'
              }}>
                <div style={{textAlign: 'center'}}>
                  <img 
                    src={photo.url} 
                    alt={photo.petName}
                    style={{
                      width: '220px',
                      height: '220px',
                      objectFit: 'cover',
                      border: '1px solid #000'
                    }}
                  />
                </div>
                
                <h4 style={{margin: '10px 0 5px 0', color: '#cc0066', textAlign: 'center'}}>
                  {photo.petName}
                </h4>
                
                <p style={{
                  margin: '5px 0', 
                  fontSize: '14px', 
                  fontStyle: 'italic',
                  textAlign: 'center'
                }}>
                  "{photo.caption}"
                </p>
                
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  margin: '10px 0'
                }}>
                  <span style={{fontSize: '12px'}}>
                    Uploaded by: {photo.user}
                  </span>
                  
                  <button 
                    onClick={() => likePetPhoto(photo.id)}
                    disabled={!currentUser || photo.likedBy.includes(currentUser)}
                    style={{
                      backgroundColor: photo.likedBy.includes(currentUser) ? '#cccccc' : '#ff99cc',
                      border: 'none',
                      padding: '3px 8px',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    ❤️ {photo.likes}
                  </button>
                </div>
                
                <p style={{margin: '0', fontSize: '10px', color: '#666'}}>
                  {photo.timestamp}
                </p>
                
                <button 
                  onClick={() => deletePetPhoto(photo.id)}
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

export default PetPhotosSection;