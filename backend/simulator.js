// Complete Backend Simulator for SquadPot
// This simulates the full backend with proper authentication and data persistence

const http = require('http');
const crypto = require('crypto');
const url = require('url');
const querystring = require('querystring');

const PORT = process.env.PORT || 3031;

// In-memory database
const db = {
  users: new Map(),
  sessions: new Map(),
  squads: new Map(),
  squadMembers: new Map(),
  picks: new Map(),
  games: [],
  payments: new Map()
};

// JWT-like token management
const JWT_SECRET = 'squadpot-simulator-secret-key-2024';

function createToken(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payloadBase64 = Buffer.from(JSON.stringify({
    ...payload,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
  })).toString('base64url');
  
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${payloadBase64}`)
    .digest('base64url');
  
  return `${header}.${payloadBase64}.${signature}`;
}

function verifyToken(token) {
  if (!token) return null;
  
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const header = parts[0];
    const payload = parts[1];
    const signature = parts[2];
    
    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${header}.${payload}`)
      .digest('base64url');
    
    if (signature !== expectedSignature) return null;
    
    // Decode payload
    const decodedPayload = JSON.parse(Buffer.from(payload, 'base64url').toString());
    
    // Check expiration
    if (decodedPayload.exp && decodedPayload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    
    return decodedPayload;
  } catch (e) {
    console.error('Token verification error:', e);
    return null;
  }
}

// Helper function to parse request body
async function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

// Helper to get auth token from headers
function getAuthToken(req) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  return authHeader.substring(7);
}

// Helper to send JSON response
function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data));
}

// Initialize some test data
function initializeTestData() {
  // Add some test games
  const today = new Date();
  for (let i = 0; i < 10; i++) {
    const gameDate = new Date(today);
    gameDate.setDate(today.getDate() + i);
    
    db.games.push({
      id: `game-${i + 1}`,
      homeTeam: ['Lakers', 'Warriors', 'Celtics', 'Heat', 'Nets'][i % 5],
      awayTeam: ['Suns', 'Nuggets', 'Bucks', 'Sixers', 'Mavs'][i % 5],
      commenceTime: gameDate.toISOString(),
      sport: 'basketball_nba',
      odds: {
        home: 1.9 + (Math.random() * 0.4),
        away: 1.8 + (Math.random() * 0.4)
      }
    });
  }
}

// Main request handler
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const query = parsedUrl.query;
  
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    res.end();
    return;
  }

  console.log(`[${new Date().toISOString()}] ${req.method} ${pathname}`);

  try {
    // Health check
    if (pathname === '/health' || pathname === '/api/health') {
      return sendJSON(res, 200, {
        status: 'ok',
        message: 'SquadPot Simulator Backend',
        timestamp: new Date().toISOString(),
        version: '2.0'
      });
    }

    // Auth endpoints
    if (pathname === '/api/auth/login' && req.method === 'GET') {
      // Return Auth0 login URL
      const domain = 'dev-xfta2nvjhpm5pku5.us.auth0.com';
      const clientId = 'uBX39CJShJPMpgtLH9drNZkMaPsMVM7V';
      const redirectUri = 'http://localhost:8080/auth/callback';
      
      const authUrl = 
        `https://${domain}/authorize?` +
        `response_type=code&` +
        `client_id=${clientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=openid profile email`;
      
      return sendJSON(res, 200, { authUrl });
    }

    // Auth callback handler
    if (pathname === '/api/auth/callback' && req.method === 'GET') {
      const code = query.code;
      const error = query.error;
      
      if (error) {
        res.writeHead(302, {
          'Location': `http://localhost:8080/auth/success?error=${encodeURIComponent(error)}`
        });
        res.end();
        return;
      }
      
      if (!code) {
        res.writeHead(302, {
          'Location': 'http://localhost:8080/auth/success?error=no_code'
        });
        res.end();
        return;
      }
      
      // Simulate successful authentication
      // Create or get test user
      const testEmail = 'test@squadpot.dev';
      let user = Array.from(db.users.values()).find(u => u.email === testEmail);
      
      if (!user) {
        user = {
          id: 'user-' + Date.now(),
          email: testEmail,
          username: 'testuser',
          firstName: 'Test',
          lastName: 'User',
          displayName: 'Test User',
          emailVerified: true,
          status: 'active',
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString()
        };
        db.users.set(user.id, user);
      } else {
        user.lastLoginAt = new Date().toISOString();
      }
      
      // Create JWT token
      const token = createToken({
        sub: user.id,
        email: user.email
      });
      
      // Create session
      const sessionId = 'session-' + Date.now();
      db.sessions.set(sessionId, {
        userId: user.id,
        token: token,
        createdAt: new Date().toISOString()
      });
      
      // Redirect to frontend with token
      res.writeHead(302, {
        'Location': `http://localhost:8080/auth/success?token=${token}`
      });
      res.end();
      return;
    }

    // Get current user
    if (pathname === '/api/auth/me' && req.method === 'GET') {
      const token = getAuthToken(req);
      const payload = verifyToken(token);
      
      if (!payload) {
        return sendJSON(res, 401, { error: 'Authentication required' });
      }
      
      const user = db.users.get(payload.sub);
      if (!user) {
        return sendJSON(res, 404, { error: 'User not found' });
      }
      
      return sendJSON(res, 200, user);
    }

    // Get user stats
    if (pathname === '/api/auth/me/stats' && req.method === 'GET') {
      const token = getAuthToken(req);
      const payload = verifyToken(token);
      
      if (!payload) {
        return sendJSON(res, 401, { error: 'Authentication required' });
      }
      
      // Calculate stats
      const userSquads = Array.from(db.squads.values()).filter(s => 
        s.ownerId === payload.sub || 
        Array.from(db.squadMembers.values()).some(m => 
          m.squadId === s.id && m.userId === payload.sub
        )
      );
      
      const ownedSquads = userSquads.filter(s => s.ownerId === payload.sub);
      const memberSquads = userSquads.filter(s => s.ownerId !== payload.sub);
      
      return sendJSON(res, 200, {
        squads: {
          owned: ownedSquads.length,
          member: memberSquads.length,
          total: userSquads.length
        },
        payments: {
          count: Array.from(db.payments.values()).filter(p => p.userId === payload.sub).length,
          totalAmount: Array.from(db.payments.values())
            .filter(p => p.userId === payload.sub)
            .reduce((sum, p) => sum + p.amount, 0)
        }
      });
    }

    // Update profile
    if (pathname === '/api/auth/me' && req.method === 'PUT') {
      const token = getAuthToken(req);
      const payload = verifyToken(token);
      
      if (!payload) {
        return sendJSON(res, 401, { error: 'Authentication required' });
      }
      
      const user = db.users.get(payload.sub);
      if (!user) {
        return sendJSON(res, 404, { error: 'User not found' });
      }
      
      const body = await parseBody(req);
      Object.assign(user, body);
      
      return sendJSON(res, 200, user);
    }

    // Logout
    if (pathname === '/api/auth/logout' && req.method === 'POST') {
      // In a real app, you'd invalidate the session
      return sendJSON(res, 200, { message: 'Logged out successfully' });
    }

    // Create squad
    if (pathname === '/api/squads' && req.method === 'POST') {
      const token = getAuthToken(req);
      const payload = verifyToken(token);
      
      if (!payload) {
        return sendJSON(res, 401, { error: 'Authentication required' });
      }
      
      const body = await parseBody(req);
      const squad = {
        id: 'squad-' + Date.now(),
        name: body.name || 'New Squad',
        description: body.description || '',
        sport: body.sport || 'nba',
        maxMembers: body.maxMembers || 10,
        entryFee: body.entryFee || 10,
        isPrivate: body.isPrivate || false,
        inviteCode: body.isPrivate ? crypto.randomBytes(4).toString('hex').toUpperCase() : null,
        ownerId: payload.sub,
        createdAt: new Date().toISOString(),
        memberCount: 1
      };
      
      db.squads.set(squad.id, squad);
      
      // Add owner as member
      const memberId = 'member-' + Date.now();
      db.squadMembers.set(memberId, {
        id: memberId,
        squadId: squad.id,
        userId: payload.sub,
        role: 'owner',
        joinedAt: new Date().toISOString()
      });
      
      return sendJSON(res, 201, squad);
    }

    // Get user profile (wallet/profile endpoint)
    if (pathname === '/api/profile' && req.method === 'GET') {
      const token = getAuthToken(req);
      const payload = verifyToken(token);
      
      if (!payload) {
        return sendJSON(res, 401, { error: 'Authentication required' });
      }
      
      const user = db.users.get(payload.sub);
      if (!user) {
        return sendJSON(res, 404, { error: 'User not found' });
      }
      
      return sendJSON(res, 200, {
        ...user,
        walletBalance: 100.00,
        walletCurrency: 'USD'
      });
    }

    // Get user's squads
    if (pathname === '/api/squads' && req.method === 'GET') {
      const token = getAuthToken(req);
      const payload = verifyToken(token);
      
      if (!payload) {
        return sendJSON(res, 401, { error: 'Authentication required' });
      }
      
      const userSquads = Array.from(db.squads.values()).filter(s => {
        // Check if user is owner
        if (s.ownerId === payload.sub) return true;
        // Check if user is member
        return Array.from(db.squadMembers.values()).some(m => 
          m.squadId === s.id && m.userId === payload.sub
        );
      });
      
      return sendJSON(res, 200, userSquads);
    }

    // Join squad
    if (pathname === '/api/squads/join' && req.method === 'POST') {
      const token = getAuthToken(req);
      const payload = verifyToken(token);
      
      if (!payload) {
        return sendJSON(res, 401, { error: 'Authentication required' });
      }
      
      const body = await parseBody(req);
      const inviteCode = body.inviteCode;
      
      // Find squad by invite code
      const squad = Array.from(db.squads.values()).find(s => s.inviteCode === inviteCode);
      
      if (!squad) {
        return sendJSON(res, 404, { error: 'Invalid invite code' });
      }
      
      // Check if already a member
      const existingMember = Array.from(db.squadMembers.values()).find(m => 
        m.squadId === squad.id && m.userId === payload.sub
      );
      
      if (existingMember) {
        return sendJSON(res, 400, { error: 'Already a member of this squad' });
      }
      
      // Add as member
      const memberId = 'member-' + Date.now();
      db.squadMembers.set(memberId, {
        id: memberId,
        squadId: squad.id,
        userId: payload.sub,
        role: 'member',
        joinedAt: new Date().toISOString()
      });
      
      squad.memberCount = (squad.memberCount || 0) + 1;
      
      return sendJSON(res, 200, {
        message: 'Successfully joined squad',
        squad: squad
      });
    }

    // Get games
    if (pathname === '/api/games' && req.method === 'GET') {
      return sendJSON(res, 200, db.games);
    }

    // Submit picks
    if (pathname === '/api/picks' && req.method === 'POST') {
      const token = getAuthToken(req);
      const payload = verifyToken(token);
      
      if (!payload) {
        return sendJSON(res, 401, { error: 'Authentication required' });
      }
      
      const body = await parseBody(req);
      const pick = {
        id: 'pick-' + Date.now(),
        userId: payload.sub,
        squadId: body.squadId,
        gameId: body.gameId,
        selection: body.selection, // 'home' or 'away'
        amount: body.amount || 10,
        createdAt: new Date().toISOString()
      };
      
      db.picks.set(pick.id, pick);
      
      return sendJSON(res, 201, pick);
    }

    // Get squad details
    if (pathname.startsWith('/api/squads/') && req.method === 'GET') {
      const squadId = pathname.split('/').pop();
      const squad = db.squads.get(squadId);
      
      if (!squad) {
        return sendJSON(res, 404, { error: 'Squad not found' });
      }
      
      // Get members
      const members = Array.from(db.squadMembers.values())
        .filter(m => m.squadId === squadId)
        .map(m => {
          const user = db.users.get(m.userId);
          return {
            ...m,
            user: user ? {
              id: user.id,
              username: user.username,
              displayName: user.displayName
            } : null
          };
        });
      
      return sendJSON(res, 200, {
        ...squad,
        members
      });
    }

    // Create checkout session (simulate payment)
    if (pathname === '/api/checkout/sessions' && req.method === 'POST') {
      const token = getAuthToken(req);
      const payload = verifyToken(token);
      
      if (!payload) {
        return sendJSON(res, 401, { error: 'Authentication required' });
      }
      
      const body = await parseBody(req);
      
      return sendJSON(res, 200, {
        sessionId: 'cs_test_' + Date.now(),
        url: `http://localhost:8080/success?session_id=cs_test_${Date.now()}`
      });
    }

    // Default 404
    sendJSON(res, 404, { error: 'Endpoint not found' });
    
  } catch (error) {
    console.error('Server error:', error);
    sendJSON(res, 500, { error: 'Internal server error', message: error.message });
  }
});

// Start server
initializeTestData();
server.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('🚀 SquadPot Backend Simulator running on port', PORT);
  console.log('');
  console.log('📍 Available endpoints:');
  console.log('  Authentication:');
  console.log('    GET  http://localhost:' + PORT + '/api/auth/login');
  console.log('    GET  http://localhost:' + PORT + '/api/auth/callback');
  console.log('    GET  http://localhost:' + PORT + '/api/auth/me');
  console.log('    GET  http://localhost:' + PORT + '/api/auth/me/stats');
  console.log('    PUT  http://localhost:' + PORT + '/api/auth/me');
  console.log('    POST http://localhost:' + PORT + '/api/auth/logout');
  console.log('');
  console.log('  Squads:');
  console.log('    GET  http://localhost:' + PORT + '/api/squads');
  console.log('    POST http://localhost:' + PORT + '/api/squads');
  console.log('    POST http://localhost:' + PORT + '/api/squads/join');
  console.log('    GET  http://localhost:' + PORT + '/api/squads/{id}');
  console.log('');
  console.log('  Games & Picks:');
  console.log('    GET  http://localhost:' + PORT + '/api/games');
  console.log('    POST http://localhost:' + PORT + '/api/picks');
  console.log('');
  console.log('  Payments:');
  console.log('    POST http://localhost:' + PORT + '/api/checkout/sessions');
  console.log('');
  console.log('🔐 Test User Credentials:');
  console.log('  Email: test@squadpot.dev');
  console.log('  Will be auto-created on first login');
  console.log('');
});