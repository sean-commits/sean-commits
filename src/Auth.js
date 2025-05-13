import React, { useState, useEffect } from 'react';
import { auth, loginUser, registerUser, logoutUser } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

function Auth({ setCurrentUser }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      // Set the currentUser state in parent component with display name if available
      if (currentUser) {
        setCurrentUser(currentUser.displayName || currentUser.email);
      } else {
        setCurrentUser(null);
      }
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, [setCurrentUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let result;
      
      if (isLogin) {
        result = await loginUser(email, password);
      } else {
        // For registration, make sure display name is provided
        if (!displayName.trim()) {
          throw new Error("Please provide a display name");
        }
        result = await registerUser(email, password, displayName);
      }

      if (result.error) {
        setError(result.error);
      } else {
        // Clear form fields on success
        setEmail('');
        setPassword('');
        setDisplayName('');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      const result = await logoutUser();
      if (result.error) {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      maxWidth: '400px',
      margin: '0 auto',
      padding: '20px',
      backgroundColor: '#f0f8ff',
      borderRadius: '8px',
      border: '1px solid #3399ff'
    }}>
      {user ? (
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ color: '#0066cc' }}>Welcome, {user.displayName || user.email}!</h3>
          <button 
            onClick={handleLogout}
            disabled={loading}
            style={{
              padding: '8px 16px',
              backgroundColor: loading ? '#cccccc' : '#ff6b6b',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Logging out...' : 'Logout'}
          </button>
        </div>
      ) : (
        <>
          <h3 style={{ color: '#0066cc', textAlign: 'center' }}>
            {isLogin ? 'Login' : 'Create Account'}
          </h3>
          
          {error && (
            <div style={{
              padding: '10px',
              marginBottom: '15px',
              backgroundColor: '#ffebee',
              color: '#c62828',
              borderRadius: '4px',
              border: '1px solid #ef9a9a'
            }}>
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>
                  Display Name:
                </label>
                <input 
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #ced4da'
                  }}
                  required={!isLogin}
                />
              </div>
            )}
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>
                Email:
              </label>
              <input 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #ced4da'
                }}
                required
              />
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>
                Password:
              </label>
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #ced4da'
                }}
                required
              />
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button 
                type="submit"
                disabled={loading}
                style={{
                  padding: '8px 16px',
                  backgroundColor: loading ? '#cccccc' : '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Processing...' : isLogin ? 'Login' : 'Register'}
              </button>
              
              <button 
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError(null);
                }}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: '#0066cc',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                {isLogin ? 'Need an account? Register' : 'Have an account? Login'}
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}

export default Auth;