import React, { useState, useEffect } from 'react';

function TrickSection({ currentUser }) {
  const [tricks, setTricks] = useState([]);
  const [trickName, setTrickName] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  // Load tricks from localStorage on component mount
  useEffect(() => {
    const storedTricks = localStorage.getItem('skateboardingTricks');
    if (storedTricks) {
      setTricks(JSON.parse(storedTricks));
    }
  }, []);

  // Save tricks to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('skateboardingTricks', JSON.stringify(tricks));
  }, [tricks]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      
      // Create a preview URL for the selected video
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadTrick = () => {
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

    const newTrick = {
      id: Date.now(),
      name: trickName,
      videoUrl: previewUrl,
      user: currentUser,
      timestamp: new Date().toLocaleString()
    };

    setTricks([newTrick, ...tricks]);
    setTrickName('');
    setSelectedFile(null);
    setPreviewUrl('');
  };

  const deleteTrick = (id) => {
    setTricks(tricks.filter(trick => trick.id !== id));
  };

  return (
    <div className="container">
      <h2>🛹 Skateboarding Tricks 🛹</h2>
      
      <div style={{
        border: '2px solid #33cc33',
        padding: '15px',
        backgroundColor: '#f0fff0',
        marginBottom: '20px',
        textAlign: 'center'
      }}>
        <h3 style={{color: '#006600'}}>Upload Trick Video</h3>
        
        <input 
          type="text"
          placeholder="Name your trick"
          value={trickName}
          onChange={(e) => setTrickName(e.target.value)}
          disabled={!currentUser}
          style={{margin: '10px 0', width: '80%'}}
        />
        
        <input 
          type="file" 
          accept="video/*" 
          onChange={handleFileChange}
          disabled={!currentUser}
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
                border: '1px solid #000'
              }}
            />
          </div>
        )}
        
        <button 
          onClick={uploadTrick}
          disabled={!currentUser || !selectedFile || !trickName.trim()}
          style={{marginTop: '10px'}}
        >
          Upload Trick
        </button>
      </div>
      
      <div>
        <h3 style={{backgroundColor: '#ccffcc', padding: '5px', textAlign: 'center'}}>
          Trick Videos
        </h3>
        
        {tricks.length === 0 ? (
          <p style={{textAlign: 'center'}}>No trick videos uploaded yet. Show off your skills!</p>
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
                position: 'relative'
              }}>
                <h4 style={{margin: '0 0 10px 0', color: '#006600', textAlign: 'center'}}>{trick.name}</h4>
                
                <div style={{textAlign: 'center'}}>
                  <video 
                    src={trick.videoUrl} 
                    controls
                    style={{
                      width: '100%',
                      border: '1px solid #000'
                    }}
                  />
                </div>
                
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  margin: '10px 0'
                }}>
                  <span style={{fontSize: '12px'}}>
                    Uploaded by: {trick.user}
                  </span>
                  
                  <span style={{fontSize: '10px', color: '#666'}}>
                    {trick.timestamp}
                  </span>
                </div>
                
                <button 
                  onClick={() => deleteTrick(trick.id)}
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
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

export default TrickSection;