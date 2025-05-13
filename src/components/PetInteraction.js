import React, { useState } from 'react';

function PetInteraction() {
  const [tobiDancing, setTobiDancing] = useState(false);
  const [hachiDancing, setHachiDancing] = useState(false);
  const [petsFed, setPetsFed] = useState(0);

  const handleTobiClick = () => {
    setTobiDancing(true);
    setTimeout(() => setTobiDancing(false), 3000);
  };

  const handleHachiClick = () => {
    setHachiDancing(true);
    setTimeout(() => setHachiDancing(false), 3000);
  };

  const feedPets = () => {
    setPetsFed(petsFed + 1);
  };

  return (
    <div className="container">
      <h2>🐾 Tobi & Hachi 🐾</h2>
      
      <div style={{textAlign: 'center'}}>
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
          </div>
        </div>
        
        <div style={{marginTop: '20px'}}>
          <button onClick={feedPets}>Feed Pets</button>
          <p style={{marginTop: '10px'}}>
            Pets have been fed {petsFed} times today!
          </p>
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