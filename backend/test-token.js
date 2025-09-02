const jwt = require('jsonwebtoken');

const secret = 'your-super-secret-jwt-key-at-least-32-characters-long';

const token = jwt.sign(
  {
    sub: 'test-user-123',
    email: 'test@example.com'
  },
  secret,
  { expiresIn: '1h' }
);

console.log('Bearer ' + token);