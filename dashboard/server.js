const express = require('express');
const http = require('http');
const path = require('path');
const { WebSocketServer } = require('ws');

const app = express();
const server = http.createServer(app);

// Basic middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const wss = new WebSocketServer({ server });

let botSocket = null;
let dashboardSocket = null;

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
 * Send class metrics to dashboard when class ends
 */
function sendMetricsToDashboard() {
  if (dashboardSocket?.readyState === 1 && classMetrics.classInfo) {
    const metricsMessage = {
      event: 'class_metrics',
      data: serializeMetrics()
    };
    
    console.log('Sending class metrics to dashboard:', metricsMessage.data);
    dashboardSocket.send(JSON.stringify(metricsMessage));
  } else {
    console.log('Cannot send metrics - dashboard not connected or no class data');
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
          dashboardSocket = ws;
          console.log('Dashboard connected');
        }
      } else if (ws.type === 'bot') {
        console.log(`Forwarding bot message to dashboard: ${message.event}`);
        
        // Track metrics for bot events
        if (message.event === 'bot_event') {
          trackBotEvent(message.data);
        }
        
        if (dashboardSocket?.readyState === 1) {
          dashboardSocket.send(JSON.stringify(message));
        }
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
    } else if (ws === dashboardSocket) {
      dashboardSocket = null;
      console.log('Dashboard disconnected');
    }
  });

  ws.on('error', (err) => {
    console.error(`WebSocket error on ${socketId}:`, err);
  });
});

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    connections: {
      bot: botSocket ? 'connected' : 'disconnected',
      dashboard: dashboardSocket ? 'connected' : 'disconnected'
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

// Serve frontend for all other routes
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`Educational Bot Dashboard running on port ${PORT}`);
  console.log(`Dashboard: http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
