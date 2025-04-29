import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Default to false
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('http://localhost:5000/protected', { withCredentials: true })
      .then(response => {
        setIsAuthenticated(true);
      })
      .catch(error => {
        setIsAuthenticated(false); 
        navigate('/login');
      });
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await axios.post('http://localhost:5000/logout', {}, { withCredentials: true });
      navigate('/login', { state: { message: 'You have logged out successfully.' } });
    } catch (err) {
      console.error('Logout Error:', err);
      alert('Error occurred while logging out. Please try again.');
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div>
      <h1>Welcome to the Home Page</h1>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}

export default Home;
