import React, { useRef, useEffect, useState } from 'react';

function Whiteboard({ currentUser }) {
  const canvasRef = useRef(null);
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(5);
  const [savedDrawings, setSavedDrawings] = useState([]);

  // Load saved drawings from localStorage on component mount
  useEffect(() => {
    const storedDrawings = localStorage.getItem('savedDrawings');
    if (storedDrawings) {
      setSavedDrawings(JSON.parse(storedDrawings));
    }
  }, []);

  // Save drawings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('savedDrawings', JSON.stringify(savedDrawings));
  }, [savedDrawings]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let drawing = false;

    // Fill canvas with white
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const startDrawing = (e) => {
      if (!currentUser) {
        alert('Please sign in to draw!');
        return;
      }
      
      drawing = true;
      draw(e);
    };
    
    const stopDrawing = () => {
      drawing = false;
      ctx.beginPath();
    };
    
    const draw = (e) => {
      if (!drawing) return;
      
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.strokeStyle = color;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, y);
    };

    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseout', stopDrawing);

    return () => {
      canvas.removeEventListener('mousedown', startDrawing);
      canvas.removeEventListener('mouseup', stopDrawing);
      canvas.removeEventListener('mousemove', draw);
      canvas.removeEventListener('mouseout', stopDrawing);
    };
  }, [color, brushSize, currentUser]);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const saveDrawing = () => {
    if (!currentUser) {
      alert('Please sign in to save your drawing!');
      return;
    }
    
    const canvas = canvasRef.current;
    const drawingURL = canvas.toDataURL('image/png');
    
    const newDrawing = {
      image: drawingURL,
      user: currentUser,
      timestamp: new Date().toLocaleString()
    };
    
    setSavedDrawings([newDrawing, ...savedDrawings]);
    clearCanvas();
  };

  const deleteDrawing = (index) => {
    const updatedDrawings = [...savedDrawings];
    updatedDrawings.splice(index, 1);
    setSavedDrawings(updatedDrawings);
  };

  return (
    <div className="container">
      <h2>Whiteboard</h2>
      
      <div style={{textAlign: 'center', marginBottom: '10px'}}>
        <label style={{marginRight: '10px'}}>
          Color:
          <input 
            type="color" 
            value={color} 
            onChange={(e) => setColor(e.target.value)}
            style={{marginLeft: '5px'}}
            disabled={!currentUser}
          />
        </label>
        
        <label>
          Brush Size:
          <select 
            value={brushSize} 
            onChange={(e) => setBrushSize(parseInt(e.target.value))}
            style={{marginLeft: '5px'}}
            disabled={!currentUser}
          >
            <option value="1">Small</option>
            <option value="5">Medium</option>
            <option value="10">Large</option>
            <option value="20">Extra Large</option>
          </select>
        </label>
        
        <button onClick={clearCanvas} style={{marginLeft: '15px'}} disabled={!currentUser}>Clear</button>
        <button onClick={saveDrawing} style={{marginLeft: '15px'}} disabled={!currentUser}>Save & Share</button>
      </div>
      
      <div style={{display: 'flex', justifyContent: 'center'}}>
        <canvas 
          ref={canvasRef} 
          width="500" 
          height="400" 
          style={{
            border: '3px solid #000000',
            borderRadius: '5px',
            cursor: currentUser ? 'crosshair' : 'not-allowed',
            backgroundColor: '#ffffff'
          }} 
        />
      </div>
      
      {/* Saved Drawings Gallery */}
      <div style={{marginTop: '30px'}}>
        <h3 style={{backgroundColor: '#ccffcc', padding: '5px', textAlign: 'center'}}>
          Shared Masterpieces
        </h3>
        
        {savedDrawings.length === 0 ? (
          <p style={{textAlign: 'center'}}>No drawings yet. Be the first artist!</p>
        ) : (
          <div style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '20px'}}>
            {savedDrawings.map((drawing, index) => (
              <div key={index} style={{
                border: '2px solid #9933cc',
                padding: '10px',
                backgroundColor: '#f0f0ff',
                width: '250px',
                position: 'relative'
              }}>
                <p style={{fontWeight: 'bold', color: '#0000FF'}}>Artist: {drawing.user}</p>
                <p style={{fontSize: '12px'}}>{drawing.timestamp}</p>
                <img 
                  src={drawing.image} 
                  alt={`Drawing by ${drawing.user}`}
                  style={{width: '100%', height: 'auto', border: '1px solid #000'}}
                />
                <button 
                  onClick={() => deleteDrawing(index)}
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

export default Whiteboard;