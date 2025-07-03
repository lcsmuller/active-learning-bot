const express = require('express');
const http = require('http');
const path = require('path');
const { WebSocketServer } = require('ws');
const session = require('express-session');

const app = express();
const server = http.createServer(app);

// Demo credentials
const DEMO_CREDENTIALS = {
  email: 'demo@ufpr.br',
  password: 'demo'
};

// Session middleware
app.use(session({
  secret: 'tccbot-dashboard-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true if using HTTPS
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Authentication middleware
function requireAuth(req, res, next) {
  if (req.session && req.session.authenticated) {
    return next();
  } else {
    return res.redirect('/login');
  }
}

// Serve static files only for authenticated users (except login page)
app.use('/public', requireAuth, express.static(path.join(__dirname, 'public')));
app.use('/js', requireAuth, express.static(path.join(__dirname, 'public/js')));
app.use('/css', requireAuth, express.static(path.join(__dirname, 'public/css')));
app.use('/components', requireAuth, express.static(path.join(__dirname, 'public/components')));

const wss = new WebSocketServer({ server });

let botSocket = null;
let dashboardSockets = new Set(); // Support multiple dashboard connections

let classMetrics = {
  classInfo: null,
  classStartTime: null,
  classEndTime: null,
  totalDuration: 0,
  activeContentHistory: [],
  currentActiveContentId: null,
  highlightedMessages: [],
  studentAnswers: [],
  peakStudentCount: 0,
  totalStudentJoins: 0,
  uniqueStudents: new Set()
};

function serializeMetrics() {
  return {
    ...classMetrics,
    uniqueStudents: Array.from(classMetrics.uniqueStudents),
    totalDuration: classMetrics.classStartTime && classMetrics.classEndTime ? 
      Math.round((new Date(classMetrics.classEndTime) - new Date(classMetrics.classStartTime)) / 1000) : 0
  };
}

/**
 * Extract a title from content for display purposes
 */
function extractTitleFromContent(content) {
  if (!content) return 'Untitled Content';
  
  // For discussions
  if (content.includes('**Discussion:**')) {
    const match = content.match(/\*\*Discussion:\*\*\s*(.+?)(?:\n|$)/);
    if (match) return match[1].substring(0, 50) + (match[1].length > 50 ? '...' : '');
  }
  
  // For polls
  if (content.includes('**Poll:**')) {
    const match = content.match(/\*\*Poll:\*\*\s*(.+?)(?:\n|$)/);
    if (match) return match[1].substring(0, 50) + (match[1].length > 50 ? '...' : '');
  }
  
  // For code snippets
  if (content.includes('💻 **') && content.includes('**\n```')) {
    const match = content.match(/💻 \*\*(.+?)\*\*/);
    if (match) return match[1];
  }
  
  // Generic fallback - take first 50 characters and clean markdown
  const clean = content.replace(/[*_`#📢💻📊]/g, '').replace(/\n/g, ' ').trim();
  return clean.substring(0, 50) + (clean.length > 50 ? '...' : '');
}

/**
 * Extract content type from content
 */
function extractContentType(content) {
  if (content.includes('📢 **Discussion:**')) return 'Discussion';
  if (content.includes('💻 **') && content.includes('```')) return 'Code Snippet';
  if (content.includes('📊 **Poll:**')) return 'Poll';
  return 'Content';
}

/**
 * Track metrics for dashboard-initiated events (start_class, end_class, active_content, etc.)
 */
function trackDashboardEvent(message) {
  try {
    if (message.event === 'start_class') {
      console.log('Tracking class start:', message.data);
      classMetrics.classInfo = {
        classId: message.data.classId,
        title: message.data.title,
        classCode: message.data.classCode,
        teacherId: message.data.teacherId
      };
      classMetrics.classStartTime = new Date().toISOString();
      classMetrics.classEndTime = null;
      classMetrics.activeContentHistory = [];
      classMetrics.highlightedMessages = [];
      classMetrics.studentAnswers = [];
      classMetrics.peakStudentCount = 0;
      classMetrics.totalStudentJoins = 0;
      classMetrics.uniqueStudents = new Set();
      console.log('Class metrics initialized for class start');
    } else if (message.event === 'end_class') {
      console.log('Tracking class end:', message.data);
      if (classMetrics.classInfo) {
        classMetrics.classEndTime = new Date().toISOString();
        
        // End any active content session that wasn't properly closed
        if (classMetrics.currentActiveContentId && classMetrics.activeContentHistory.length > 0) {
          const lastSession = classMetrics.activeContentHistory[classMetrics.activeContentHistory.length - 1];
          if (lastSession.id === classMetrics.currentActiveContentId && !lastSession.endTime) {
            lastSession.endTime = classMetrics.classEndTime;
            lastSession.duration = Math.round((new Date(lastSession.endTime) - new Date(lastSession.startTime)) / 1000);
          }
          classMetrics.currentActiveContentId = null;
        }
        
        console.log('Class metrics finalized for class end');
        
        // Send metrics to dashboard when class ends
        setTimeout(() => {
          sendMetricsToDashboard();
        }, 1000); // Small delay to ensure class end processing is complete
      }
    } else if (message.event === 'active_content') {
      console.log('Tracking active content:', message.data);
      const contentSession = {
        id: Date.now(),
        type: message.data.type || extractContentType(message.data.content),
        title: message.data.title || extractTitleFromContent(message.data.content),
        content: message.data.content,
        startTime: new Date().toISOString(),
        teacherId: message.data.teacherId,
        reactions: [],
        answers: []
      };
      classMetrics.activeContentHistory.push(contentSession);
      classMetrics.currentActiveContentId = contentSession.id;
    } else if (message.event === 'highlight_message') {
      console.log('Tracking highlighted message:', message.data);
      const highlightedMessage = {
        id: Date.now(),
        type: message.data.type || extractContentType(message.data.content),
        title: message.data.title || extractTitleFromContent(message.data.content),
        content: message.data.content,
        timestamp: new Date().toISOString(),
        teacherId: message.data.teacherId,
        reactions: [],
        answers: []
      };
      classMetrics.highlightedMessages.push(highlightedMessage);
    } else if (message.event && (message.event.startsWith('stop_') || message.event === 'stop_content')) {
      console.log('Tracking content stop:', message.event);
      // End the current active content session
      if (classMetrics.currentActiveContentId && classMetrics.activeContentHistory.length > 0) {
        const lastSession = classMetrics.activeContentHistory[classMetrics.activeContentHistory.length - 1];
        if (lastSession.id === classMetrics.currentActiveContentId && !lastSession.endTime) {
          lastSession.endTime = new Date().toISOString();
          lastSession.duration = Math.round((new Date(lastSession.endTime) - new Date(lastSession.startTime)) / 1000);
        }
        classMetrics.currentActiveContentId = null;
      }
    }
  } catch (error) {
    console.error('Error tracking dashboard event:', error);
  }
}

/**
 * Track metrics for bot-initiated events (student activities, class confirmations, etc.)
 */
function trackBotEvent(data) {
  try {
    const { event: eventType, payload } = data;
    
    switch (eventType) {
      case 'student_joined':
        console.log('Tracking student joined:', payload);
        if (payload.userId) {
          classMetrics.uniqueStudents.add(payload.userId.toString());
          classMetrics.totalStudentJoins++;
        }
        break;
        
      case 'student_voice_joined':
        console.log('Tracking student voice joined:', payload);
        if (payload.userId && payload.currentChannelId === payload.activeChannelId) {
          classMetrics.uniqueStudents.add(payload.userId.toString());
          // Update peak count (this is approximate, real count would need voice state tracking)
          classMetrics.peakStudentCount = Math.max(classMetrics.peakStudentCount, classMetrics.uniqueStudents.size);
        }
        break;
        
      case 'answer_submitted':
        console.log('Tracking answer submitted:', payload);
        if (payload) {
          // Find current active content session
          const currentSession = classMetrics.activeContentHistory.find(
            session => session.id === classMetrics.currentActiveContentId
          );
          
          const answer = {
            userId: payload.userId,
            username: payload.username,
            answer: payload.answer,
            contentId: classMetrics.currentActiveContentId,
            activeContentType: currentSession ? currentSession.type : 'Unknown',
            activeContentTitle: currentSession ? currentSession.title : 'Unknown Content',
            timestamp: new Date().toISOString()
          };
          
          // Add to global answers list
          classMetrics.studentAnswers.push(answer);
          
          // Add to current session's answers if active session exists
          if (currentSession) {
            currentSession.answers.push({
              userId: payload.userId,
              username: payload.username,
              answer: payload.answer,
              timestamp: new Date().toISOString()
            });
          }
        }
        break;
        
      case 'reaction_added':
        console.log('Tracking reaction added:', payload);
        if (payload && classMetrics.currentActiveContentId) {
          // Find current active content session and add reaction
          const currentSession = classMetrics.activeContentHistory.find(
            session => session.id === classMetrics.currentActiveContentId
          );
          
          if (currentSession) {
            currentSession.reactions.push({
              userId: payload.userId,
              username: payload.username,
              emoji: payload.emoji,
              timestamp: new Date().toISOString()
            });
          }
        }
        break;
        
      case 'class_ended':
        console.log('Bot confirmed class ended');
        if (classMetrics.classInfo && !classMetrics.classEndTime) {
          classMetrics.classEndTime = new Date().toISOString();
          
          // End any active content session that wasn't properly closed
          if (classMetrics.currentActiveContentId && classMetrics.activeContentHistory.length > 0) {
            const lastSession = classMetrics.activeContentHistory[classMetrics.activeContentHistory.length - 1];
            if (lastSession.id === classMetrics.currentActiveContentId && !lastSession.endTime) {
              lastSession.endTime = classMetrics.classEndTime;
              lastSession.duration = Math.round((new Date(lastSession.endTime) - new Date(lastSession.startTime)) / 1000);
            }
            classMetrics.currentActiveContentId = null;
          }
          
          setTimeout(() => {
            sendMetricsToDashboard();
          }, 500);
        }
        break;
        
      default:
        // Don't log every event to avoid noise
        break;
    }
  } catch (error) {
    console.error('Error tracking bot event:', error);
  }
}

/**
 * Send class metrics to all connected dashboards when class ends
 */
function sendMetricsToDashboard() {
  if (dashboardSockets.size > 0 && classMetrics.classInfo) {
    const metricsMessage = {
      event: 'class_metrics',
      data: serializeMetrics()
    };
    
    console.log(`Sending class metrics to ${dashboardSockets.size} dashboard(s):`, metricsMessage.data);
    
    // Send to all connected dashboards
    dashboardSockets.forEach(dashboardSocket => {
      if (dashboardSocket.readyState === 1) {
        dashboardSocket.send(JSON.stringify(metricsMessage));
      } else {
        // Remove disconnected sockets
        dashboardSockets.delete(dashboardSocket);
      }
    });
  } else {
    console.log('Cannot send metrics - no dashboards connected or no class data');
  }
}

wss.on('connection', (ws) => {
  const socketId = Math.random().toString(36).substring(7);
  console.log(`New WebSocket connection: ${socketId}`);

  ws.on('message', (data) => {
    try {
      console.log('Received data:', data.toString());
      const message = JSON.parse(data.toString());

      if (message.event === 'authenticate') {
        if (message.data.type === 'bot') {
          ws.type = 'bot';
          botSocket = ws;
          console.log('Bot connected');
        } else if (message.data.type === 'dashboard') {
          ws.type = 'dashboard';
          dashboardSockets.add(ws);
          console.log(`Dashboard connected. Total dashboards: ${dashboardSockets.size}`);
        }
      } else if (ws.type === 'bot') {
        console.log(`Forwarding bot message to ${dashboardSockets.size} dashboard(s): ${message.event}`);
        
        // Track metrics for bot events
        if (message.event === 'bot_event') {
          trackBotEvent(message.data);
        }
        
        // Send to all connected dashboards
        dashboardSockets.forEach(dashboardSocket => {
          if (dashboardSocket.readyState === 1) {
            dashboardSocket.send(JSON.stringify(message));
          } else {
            // Remove disconnected sockets
            dashboardSockets.delete(dashboardSocket);
          }
        });
      } else if (ws.type === 'dashboard') {
        console.log(`Forwarding dashboard message to bot: ${message.event}`);
        
        // Track metrics for dashboard events
        trackDashboardEvent(message);
        
        if (botSocket?.readyState === 1) {
          botSocket.send(JSON.stringify(message));
        }
      } else {
        console.log(`Unhandled message from unknown source: ${message.event}`);
      }
    } catch (err) {
      console.error('Error parsing message:', err);
    }
  });

  ws.on('close', () => {
    console.log(`WebSocket disconnected: ${socketId}`);
    if (ws === botSocket) {
      botSocket = null;
      console.log('Bot disconnected');
    } else if (ws.type === 'dashboard') {
      dashboardSockets.delete(ws);
      console.log(`Dashboard disconnected. Remaining dashboards: ${dashboardSockets.size}`);
    }
  });

  ws.on('error', (err) => {
    console.error(`WebSocket error on ${socketId}:`, err);
  });
});

// Authentication routes
app.get('/login', (req, res) => {
  if (req.session && req.session.authenticated) {
    return res.redirect('/');
  }
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TCC Bot Dashboard - Login</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0;
        }
        .login-container {
            background: white;
            padding: 2rem;
            border-radius: 10px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.2);
            width: 100%;
            max-width: 400px;
        }
        .login-header {
            text-align: center;
            margin-bottom: 2rem;
        }
        .login-header h1 {
            color: #333;
            margin: 0;
            font-size: 1.8rem;
        }
        .login-header p {
            color: #666;
            margin: 0.5rem 0 0;
        }
        .form-group {
            margin-bottom: 1.5rem;
        }
        label {
            display: block;
            margin-bottom: 0.5rem;
            color: #333;
            font-weight: 500;
        }
        input[type="email"], input[type="password"] {
            width: 100%;
            padding: 0.75rem;
            border: 2px solid #ddd;
            border-radius: 5px;
            font-size: 1rem;
            transition: border-color 0.3s;
            box-sizing: border-box;
        }
        input[type="email"]:focus, input[type="password"]:focus {
            outline: none;
            border-color: #667eea;
        }
        .login-btn {
            width: 100%;
            padding: 0.75rem;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 5px;
            font-size: 1rem;
            font-weight: 500;
            cursor: pointer;
            transition: transform 0.2s;
        }
        .login-btn:hover {
            transform: translateY(-2px);
        }
        .error {
            color: #e74c3c;
            margin-top: 1rem;
            text-align: center;
        }
        .demo-info {
            background: #f8f9fa;
            padding: 1rem;
            border-radius: 5px;
            margin-bottom: 1.5rem;
            border-left: 4px solid #667eea;
        }
        .demo-info h3 {
            margin: 0 0 0.5rem;
            color: #333;
            font-size: 0.9rem;
        }
        .demo-info p {
            margin: 0;
            font-size: 0.8rem;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="login-container">
        <div class="login-header">
            <h1>🤖 TCC Bot Dashboard</h1>
            <p>Educational Discord Bot Management</p>
        </div>
        
        <div class="demo-info">
            <h3>Demo Credentials:</h3>
            <p><strong>Email:</strong> demo@ufpr.br</p>
            <p><strong>Password:</strong> demo</p>
        </div>
        
        <form method="POST" action="/login">
            <div class="form-group">
                <label for="email">Email:</label>
                <input type="email" id="email" name="email" required>
            </div>
            <div class="form-group">
                <label for="password">Password:</label>
                <input type="password" id="password" name="password" required>
            </div>
            <button type="submit" class="login-btn">Login</button>
            ${req.query.error ? '<div class="error">Invalid credentials. Please try again.</div>' : ''}
        </form>
    </div>
</body>
</html>
  `);
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;
  
  if (email === DEMO_CREDENTIALS.email && password === DEMO_CREDENTIALS.password) {
    req.session.authenticated = true;
    req.session.userEmail = email;
    res.redirect('/');
  } else {
    res.redirect('/login?error=1');
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    connections: {
      bot: botSocket ? 'connected' : 'disconnected',
      dashboards: dashboardSockets.size
    }
  });
});

// Metrics endpoint for debugging
app.get('/metrics', (_req, res) => {
  res.json(serializeMetrics());
});

// Reset metrics endpoint for testing (POST for safety)
app.post('/reset-metrics', (_req, res) => {
  classMetrics = {
    classInfo: null,
    classStartTime: null,
    classEndTime: null,
    totalDuration: 0,
    activeContentHistory: [],
    currentActiveContentId: null,
    highlightedMessages: [],
    studentAnswers: [],
    peakStudentCount: 0,
    totalStudentJoins: 0,
    uniqueStudents: new Set()
  };
  console.log('Server metrics reset');
  res.json({ success: true, message: 'Metrics reset successfully' });
});

// Send current metrics to dashboard (POST for safety)
app.post('/send-metrics', (_req, res) => {
  if (classMetrics.classInfo) {
    sendMetricsToDashboard();
    res.json({ success: true, message: 'Metrics sent to dashboard' });
  } else {
    res.json({ success: false, message: 'No class metrics available' });
  }
});

// Serve frontend for authenticated users only
app.get('/', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Catch all other routes and redirect to login if not authenticated
app.get('*', (req, res) => {
  if (req.session && req.session.authenticated) {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  } else {
    res.redirect('/login');
  }
});

const PORT = process.env.PORT || 3001;
const DOMAIN = process.env.NODE_ENV === 'production' ? 'tcc.muller.codes' : 'localhost';

server.listen(PORT, () => {
  console.log(`Educational Bot Dashboard running on port ${PORT}`);
  console.log(`Dashboard: http://${DOMAIN}:${PORT}`);
  console.log(`Health check: http://${DOMAIN}:${PORT}/health`);
});
