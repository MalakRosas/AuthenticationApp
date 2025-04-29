import express from 'express';
import bcrypt from 'bcrypt';
import axios from 'axios'; 
import USER from '../schemas/users.js';
import LoginLog from '../schemas/loginlog.js';
import generateToken from '../authentication/generateToken.js';
import authenticateToken from '../middleware/authenticate.js';

const router = express.Router();

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'All fields are required.' });
  }
  try {
    const existingName = await USER.findOne({ name });
    if (existingName) {
      return res.status(400).json({ message: 'Name already exists.' });
    }
    
    const existingEmail = await USER.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: 'Email already exists.' });
    }    
    const newUser = new USER({
      name,
      email,
      password
    });

    await newUser.save();

    res.status(201).json({ message: 'User registered successfully.' });
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password, rememberMe } = req.body;
  let loginStatus = 'failure'; 
  let userId = null; // assign if available

  try {
    if (!email || !password) {
      console.log("Missing fields.");
      await new LoginLog({
        user_id: null,
        ip_address: req.ip,
        timestamp: new Date(),
        status: loginStatus,
        reason: 'Missing fields'
      }).save();

      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await USER.findOne({ email });
    if (user) {
      userId = user._id;
    }
    if (!user) {
      await new LoginLog({
        user_id: null,
        ip_address: req.ip,
        timestamp: new Date(),
        status: loginStatus,
        reason: 'User not found'
      }).save();
      return res.status(400).json({ message: 'Invalid credentials.' });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      await new LoginLog({
        user_id: userId,
        ip_address: req.ip,
        timestamp: new Date(),
        status: loginStatus,
        reason: 'Invalid password'
      }).save();

      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    loginStatus = 'success';
    generateToken(user._id, res, rememberMe);

    await new LoginLog({
      user_id: userId,
      ip_address: req.ip,
      timestamp: new Date(),
      status: loginStatus,
      reason: 'Login successful'
    }).save();

    res.status(200).json({ message: 'Login successful.' });

  } catch (error) {
    console.error('Login Error:', error);

    await new LoginLog({
      user_id: userId,
      ip_address: req.ip,
      timestamp: new Date(),
      status: 'failure',
      reason: 'Server error'
    }).save();

    res.status(500).json({ message: 'An error occurred.' });
  }
});

router.post('/logout', authenticateToken, (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
  });
  res.status(200).json({ message: 'Logged out successfully.' });
});
// disable caching
router.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

router.get('/protected', authenticateToken, (req, res) => {
  res.status(200).json({ message: 'Authenticated.' });
});


router.get('/oauth/github', (req, res) => {
  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID,
    scope: 'user:email',
  });
  res.redirect(`https://github.com/login/oauth/authorize?${params}`);
});

router.get('/oauth/github/callback', async (req, res) => {
  const code = req.query.code;
  let loginStatus = 'failure';
  const rememberMe = req.query.rememberMe === 'true';
  let userId = null;

  if (!code) {
    await new LoginLog({
      user_id: null,
      ip_address: req.ip,
      timestamp: new Date(),
      status: loginStatus,
      reason: 'No code provided'
    }).save();
    return res.status(400).json({ message: 'No code provided' });
  }

  try {
    // Exchange code for access token
    const tokenResponse = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code: code,
      },
      { headers: { accept: 'application/json' } }
    );

    const accessToken = tokenResponse.data.access_token;

    if (!accessToken) {
      await new LoginLog({
        user_id: null,
        ip_address: req.ip,
        timestamp: new Date(),
        status: loginStatus,
        reason: 'Failed to retrieve access token'
      }).save();
      return res.status(400).json({ message: 'Failed to retrieve access token' });
    }

    const userResponse = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const { id: githubId, login } = userResponse.data;

    const emailResponse = await axios.get('https://api.github.com/user/emails', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    const emails = emailResponse.data;
    const primaryEmailObj = emails.find(e => e.primary && e.verified);
    const email = primaryEmailObj ? primaryEmailObj.email : null;

    let user = await USER.findOne({ github_id: githubId });

    if (!user) {
      const existingEmailUser = email ? await USER.findOne({ email: email }) : null;

      if (existingEmailUser) {
        await new LoginLog({
          user_id: null,
          ip_address: req.ip,
          timestamp: new Date(),
          status: loginStatus,
          reason: 'Email already associated with another user'
        }).save();

        return res.status(409).json({ message: 'Email already associated with another account' });
      }

      user = new USER({
        name: login,
        email: email || undefined,
        auth_method: 'github',
        github_id: githubId
      });

      await user.save();
    }

    userId = user._id;
    loginStatus = 'success';

    generateToken(user._id, res, rememberMe);

    await new LoginLog({
      user_id: userId,
      ip_address: req.ip,
      timestamp: new Date(),
      status: loginStatus,
      reason: 'OAuth login successful'
    }).save();

    res.redirect('http://localhost:3000/Home');

  } catch (error) {
    console.error('GitHub OAuth Error:', error.response?.data || error.message);

    await new LoginLog({
      user_id: userId,
      ip_address: req.ip,
      timestamp: new Date(),
      status: 'failure',
      reason: 'OAuth login failed'
    }).save();

    res.status(500).json({ message: 'OAuth login failed' });
  }
});


export default router;
