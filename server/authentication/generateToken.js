import jwt from 'jsonwebtoken';
const generateToken = (userId, res, rememberMe) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: rememberMe ? '7d' : '10m'
  });
  res.cookie('token', token, {
    httpOnly: true,
    maxAge: rememberMe ? 7 * 24 * 60 * 60 * 1000 : 10 * 60 * 1000,
  });
  return token;
};

export default generateToken;
