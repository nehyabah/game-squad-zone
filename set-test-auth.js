// Copy and paste this entire block into your browser console at http://localhost:8080

localStorage.setItem('authToken', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXItMTIzIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiaWF0IjoxNzU3NDQwNzEzLCJleHAiOjE3NTc0NDQzMTN9.d_E1MboiqDWhYCT7WN6NzyXVYNZjaNCH3YGC-RkoduE');

localStorage.setItem('user', JSON.stringify({
  id: 'test-user-123',
  email: 'test@example.com',
  username: 'testuser',
  firstName: 'Test',
  lastName: 'User'
}));

console.log('✅ Test authentication set! Reloading page...');
setTimeout(() => location.reload(), 1000);