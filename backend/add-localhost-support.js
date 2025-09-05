// Script to add environment variable for localhost support
// Add this to Railway environment variables:

console.log(`
To support localhost testing with Auth0, add these environment variables to Railway:

FRONTEND_URL_LOCALHOST=http://localhost:8083
ENABLE_LOCALHOST_AUTH=true

Then update the backend auth.routes.ts to check for localhost:
`);

// Show the code change needed
const codeChange = `
// In auth.routes.ts, update the /login endpoint:

app.get("/login", async (req, reply) => {
  const domain = process.env.OKTA_DOMAIN;
  const clientId = process.env.OKTA_CLIENT_ID;
  
  // Check if request is from localhost and use appropriate redirect
  const host = req.headers.host || '';
  const referer = req.headers.referer || '';
  const isLocalhost = host.includes('localhost') || referer.includes('localhost');
  
  let redirectUri = process.env.OKTA_REDIRECT_URI;
  
  // Use localhost URL if request is from localhost
  if (isLocalhost && process.env.FRONTEND_URL_LOCALHOST) {
    redirectUri = \`\${process.env.FRONTEND_URL_LOCALHOST}/auth/callback\`;
  } else if (!redirectUri || redirectUri.includes('localhost:3001')) {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:8080";
    redirectUri = \`\${frontendUrl}/auth/callback\`;
  }
  
  // ... rest of the code
});
`;

console.log(codeChange);