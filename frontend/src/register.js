import React, { useState } from "react";
import { Link,useNavigate } from "react-router-dom";
import axios from 'axios';

function Register() {
  const [values, setValues] = useState({
    name: '',
    email: '',
    password: ''
  });
  const navigate = useNavigate();
  const validatePassword = (password) => {
    const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  };
  const [agreeTerms, setAgreeTerms] = useState(false); 

  const handleSubmit = async (event) => {
    event.preventDefault();
  
    if (!agreeTerms) {
      alert("You must agree to the terms and conditions.");
      return;
    }
  
    if (!validatePassword(values.password)) {
      alert("Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number and one special character.");
      return;
    }
  
    try {
      const res = await axios.post('http://localhost:5000/register', values);
      alert(res.data.message);
      navigate('/login');
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.message) {
        alert(err.response.data.message);
      } else {
        alert("An error occurred. Please try again.");
      }
    }
  };  

  return (
    <div className="container d-flex justify-content-center align-items-center min-vh-100">
      <div className="row justify-content-center border rounded-5 p-3 bg-white shadow box-area" style={{ width: "100%", maxWidth: "500px" }}>
        <div className="col-12">
          <div className="row align-items-center text-center">
            <div className="header-text mb-4">
              <h2>Signup</h2>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="input-group mb-3">
                <input type="text" className="form-control form-control-lg bg-light fs-6" placeholder="Username"
                  onChange={e => setValues({ ...values, name: e.target.value })}
                />
              </div>
              <div className="input-group mb-3">
                <input type="email" className="form-control form-control-lg bg-light fs-6" placeholder="Email"
                  onChange={e => setValues({ ...values, email: e.target.value })}
                />
              </div>
              <div className="input-group mb-3">
                <input type="password" className="form-control form-control-lg bg-light fs-6" placeholder="Password"
                  onChange={e => setValues({ ...values, password: e.target.value })}
                />
              </div>
              <div className="input-group mb-3 d-flex justify-content-between">
                <div className="form-check">
                  <input type="checkbox" className="form-check-input" id="formCheck" checked={agreeTerms}
                    onChange={() => setAgreeTerms(!agreeTerms)} 
                  />
                  <label htmlFor="formCheck" className="form-check-label text-secondary">
                    <small>Agree to Terms and Conditions</small>
                  </label>
                </div>
              </div>
              <div className="input-group mb-3">
                <button type="submit" className="btn btn-lg btn-primary w-100 fs-6">SIGN UP</button>
              </div>
            </form>

            <div className="row">
              <small>
                Already have an account?{" "}
                <Link to="/login">
                  Login
                </Link>
              </small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
