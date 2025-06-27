/**
 * Main Dashboard Application
 * Orchestrates all managers and initializes the application
 */
import { WebSocketManager } from './modules/websocket-manager.js';
import { EventManager } from './modules/event-manager.js';
import { ClassManager } from './modules/class-manager.js';
import { ContentManager } from './modules/content-manager.js';
import { StatusManager } from './modules/status-manager.js';

class DashboardApp {
    constructor() {
        this.wsManager = null;
        this.eventManager = null;
        this.classManager = null;
        this.contentManager = null;
        this.statusManager = null;
    }

    async init() {
        try {
            // Initialize managers
            this.wsManager = new WebSocketManager();
            this.eventManager = new EventManager();
            this.statusManager = new StatusManager();
            this.classManager = new ClassManager(this.wsManager, this.eventManager);
            this.contentManager = new ContentManager(this.wsManager, this.eventManager, this.classManager);

            this.classManager.setContentManager(this.contentManager);

            // Expose contentManager to window for onclick handlers
            window.contentManager = this.contentManager;

            this.statusManager.init();
            this.eventManager.init();
            this.classManager.init();
            this.contentManager.init();

            this.wsManager.onStatusUpdate((type, status, connected) => {
                this.statusManager.handleStatusUpdate(type, status, connected);
            });
            this.wsManager.onMessage('class_metrics', (data) => {
                console.log('Dashboard received class metrics:', data);
                this.showClassMetrics(data);
            });

            this.wsManager.onMessage('bot_event', (data) => {
                console.log('Dashboard received bot_event with data:', data);
                console.log('Data type:', typeof data);
                console.log('Data structure:', JSON.stringify(data, null, 2));
                
                const message = { event: 'bot_event', data };
                console.log('Calling class manager with reconstructed message:', message);
                this.classManager.handleBotEvent(message);
                this.statusManager.markBotConnected();
                
                if (data?.event) {
                    const { event: eventType, payload } = data;
                    console.log(`Processing student event: ${eventType}`, payload);
                    
                    switch (eventType) {
                        case 'student_joined':
                            this.eventManager.addEvent(`Student ${payload.username} joined the class`, 'engagement');
                            break;
                        case 'student_voice_joined':
                            if (payload.currentChannelId === payload.activeChannelId) {
                                this.eventManager.addEvent(`Student ${payload.username} joined the voice channel`, 'engagement');
                                this.classManager?.addStudentToVoice(payload);
                            }
                            break;
                        case 'student_voice_left':
                            if (payload.currentChannelId !== payload.activeChannelId) {
                                this.eventManager.addEvent(`Student ${payload.username} left the voice channel`, 'engagement');
                                this.classManager?.removeStudentFromVoice(payload);
                            }
                            break;
                        case 'question_asked':
                            this.eventManager.addEvent(`Student ${payload.username} asks: "${payload.question}"`, 'question');
                            break;
                        case 'activity_response':
                            this.eventManager.addEvent(`Poll response: "${payload.response}"`, 'engagement');
                            break;
                        case 'reaction_added':
                            this.contentManager?.handleReactionAdded(payload);
                            break;
                        case 'answer_submitted':
                            this.contentManager?.handleAnswerSubmitted(payload);
                            break;
                        default:
                            if (['discussion_started', 'poll_created', 'code_shared', 'start_class_ack', 'class_ended', 'discussion_sent', 'active_content_sent', 'poll_created'].includes(eventType)) {
                                break; // These are handled by class manager, no need to add to events here
                            }
                            console.error(`Unhandled student event: ${eventType}`, payload);
                            this.eventManager.addEvent(`Unhandled student event: ${eventType}`, 'system');
                            break;
                    }
                }
            });

            this.wsManager.onMessage('event', (eventData) => {
                this.eventManager.addEvent(eventData.message, eventData.type);
            });

            this.eventManager.onHighlight((eventId, message, type) => {
                this.contentManager.highlightMessage(eventId, message, type);
            });

            this.wsManager.connect();

            // Setup global references for onclick handlers
            this.setupGlobalReferences();

            // Setup DOM event listeners
            this.setupEventListeners();

            console.log('Dashboard application initialized successfully');
        } catch (error) {
            console.error('Failed to initialize dashboard application:', error);
        }
    }

    setupGlobalReferences() {
        window.dashboardApp = this;
        window.wsManager = this.wsManager;
        window.eventManager = this.eventManager;
        window.classManager = this.classManager;
        window.contentManager = this.contentManager;
        window.statusManager = this.statusManager;
        
        // Global functions that components expect
        window.startClass = () => this.classManager.startClass();
        window.endClass = () => this.classManager.endClass();
        window.startDiscussion = () => this.contentManager.startDiscussion();
        window.sendCodeSnippet = () => this.contentManager.sendCodeSnippet();
        window.createPoll = () => this.contentManager.createPoll();
        window.addPollOption = () => this.contentManager.addPollOption();
        window.stopActiveContent = () => this.contentManager.stopActiveContent();
        window.eventManager = this.eventManager;
        window.classManager = this.classManager;
        window.contentManager = this.contentManager;
        window.statusManager = this.statusManager;

        // Global functions for onclick handlers
        window.startClass = () => this.classManager.startClass();
        window.endClass = () => this.classManager.endClass();
        window.startDiscussion = () => this.contentManager.startDiscussion();
        window.sendCodeSnippet = () => this.contentManager.sendCodeSnippet();
        window.createPoll = () => this.contentManager.createPoll();
        window.addPollOption = () => this.contentManager.addPollOption();
    }

    /** Setup DOM event listeners */
    setupEventListeners() {
        // Form submissions
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' && event.ctrlKey) {
                const activeElement = document.activeElement;
                
                // Handle Ctrl+Enter in different contexts
                if (activeElement.id === 'discussion') {
                    this.contentManager.startDiscussion();
                } else if (activeElement.id === 'code-snippet') {
                    this.contentManager.sendCodeSnippet();
                } else if (activeElement.id === 'poll-question') {
                    this.contentManager.createPoll();
                }
            }
        });

        // Handle visibility change to reconnect if needed
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && !this.wsManager.connected) {
                console.log('Page became visible, checking connection...');
                setTimeout(() => {
                    if (!this.wsManager.connected) {
                        this.wsManager.connect();
                    }
                }, 1000);
            }
        });

        // Handle page unload
        window.addEventListener('beforeunload', () => {
            if (this.wsManager.connected) {
                this.wsManager.ws.close();
            }
        });
    }



    showClassMetrics(metricsData) {
        console.log('Displaying class metrics:', metricsData);
        try {
            this.createMetricsModal(metricsData);
        } catch (error) {
            console.error('Error displaying class metrics:', error);
        }
    }

    createMetricsModal(metrics) {
        const existingModal = document.getElementById('metrics-modal');
        if (existingModal) {
            existingModal.remove();
        }

        const modal = document.createElement('div');
        modal.id = 'metrics-modal';
        modal.className = 'metrics-modal';
        
        const duration = metrics.totalDuration || 0;
        const hours = Math.floor(duration / 3600);
        const minutes = Math.floor((duration % 3600) / 60);
        const seconds = duration % 60;
        const durationStr = hours > 0 ? 
            `${hours}h ${minutes}m ${seconds}s` : 
            minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

        modal.innerHTML = `
            <div class="metrics-modal-content">
                <div class="metrics-header">
                    <h2>📊 Class Session Report</h2>
                    <button class="metrics-close" onclick="this.closest('.metrics-modal').remove()">×</button>
                </div>
                
                <div class="metrics-body">
                    <div class="metrics-section">
                        <h3>📋 Class Overview</h3>
                        <div class="metrics-grid">
                            <div class="metric-item">
                                <span class="metric-label">Class ID:</span>
                                <span class="metric-value">${metrics.classInfo?.classId || 'Unknown'}</span>
                            </div>
                            <div class="metric-item">
                                <span class="metric-label">Duration:</span>
                                <span class="metric-value">${durationStr}</span>
                            </div>
                            <div class="metric-item">
                                <span class="metric-label">Start Time:</span>
                                <span class="metric-value">${metrics.classStartTime ? new Date(metrics.classStartTime).toLocaleString() : 'N/A'}</span>
                            </div>
                            <div class="metric-item">
                                <span class="metric-label">End Time:</span>
                                <span class="metric-value">${metrics.classEndTime ? new Date(metrics.classEndTime).toLocaleString() : 'N/A'}</span>
                            </div>
                        </div>
                    </div>

                    <div class="metrics-section">
                        <h3>👥 Student Engagement</h3>
                        <div class="metrics-grid">
                            <div class="metric-item">
                                <span class="metric-label">Unique Students:</span>
                                <span class="metric-value">${metrics.uniqueStudents?.length || 0}</span>
                            </div>
                            <div class="metric-item">
                                <span class="metric-label">Peak Attendance:</span>
                                <span class="metric-value">${metrics.peakStudentCount || 0}</span>
                            </div>
                            <div class="metric-item">
                                <span class="metric-label">Total Join Events:</span>
                                <span class="metric-value">${metrics.totalStudentJoins || 0}</span>
                            </div>
                            <div class="metric-item">
                                <span class="metric-label">Total Answers:</span>
                                <span class="metric-value">${metrics.studentAnswers?.length || 0}</span>
                            </div>
                        </div>
                    </div>

                    <div class="metrics-section">
                        <h3>📚 Active Content Sessions</h3>
                        <div class="content-sessions">
                            ${this.generateContentSessionsHTML(metrics.activeContentHistory || [])}
                        </div>
                    </div>

                    <div class="metrics-section">
                        <h3>⭐ Highlighted Messages</h3>
                        <div class="highlighted-messages">
                            ${this.generateHighlightedMessagesHTML(metrics.highlightedMessages || [])}
                        </div>
                    </div>

                    <div class="metrics-section">
                        <h3>💬 Student Answers Timeline</h3>
                        <div class="answers-timeline">
                            ${this.generateAnswersTimelineHTML(metrics.studentAnswers || [])}
                        </div>
                    </div>
                </div>

                <div class="metrics-footer">
                    <button class="btn-primary" onclick="this.closest('.metrics-modal').remove()">Close Report</button>
                    <button class="btn-secondary" onclick="window.downloadMetrics(${JSON.stringify(metrics).replace(/"/g, '&quot;')})">Download Data</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        window.downloadMetrics = (metricsData) => {
            const dataStr = JSON.stringify(metricsData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `class-metrics-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            URL.revokeObjectURL(url);
        };
    }

    generateContentSessionsHTML(contentHistory) {
        if (!contentHistory?.length) {
            return '<div class="no-sessions">No active content sessions recorded</div>';
        }

        return contentHistory.map((session) => {
            const duration = session.duration || 0;
            const durationStr = duration > 60 ? 
                `${Math.floor(duration / 60)}m ${duration % 60}s` : 
                `${duration}s`;

            return `
                <div class="session-item">
                    <div class="session-header">
                        <span class="session-type">${session.type}</span>
                        <span class="session-duration">${durationStr}</span>
                    </div>
                    <div class="session-content">
                        <strong>${session.title || 'Untitled'}</strong>
                        ${session.content ? `<div class="session-preview">${this.formatContentPreview(session.content)}</div>` : ''}
                        <div class="session-stats">
                            <span>👆 ${session.reactions?.length || 0} reactions</span>
                            <span>💬 ${session.answers?.length || 0} answers</span>
                        </div>
                        <div class="session-time">
                            ${new Date(session.startTime).toLocaleTimeString()} - 
                            ${session.endTime ? new Date(session.endTime).toLocaleTimeString() : 'Ongoing'}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    generateHighlightedMessagesHTML(highlightedMessages) {
        if (!highlightedMessages?.length) {
            return '<div class="no-highlighted">No highlighted messages recorded</div>';
        }

        return highlightedMessages.map((message) => {
            return `
                <div class="highlighted-item">
                    <div class="highlighted-header">
                        <span class="highlighted-type">${message.type}</span>
                        <span class="highlighted-time">${new Date(message.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <div class="highlighted-content">
                        <strong>${message.title || 'Untitled'}</strong>
                        ${message.content ? `<div class="highlighted-preview">${this.formatContentPreview(message.content)}</div>` : ''}
                        <div class="highlighted-stats">
                            <span>👆 ${message.reactions?.length || 0} reactions</span>
                            <span>💬 ${message.answers?.length || 0} answers</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    formatContentPreview(content) {
        if (!content) return '';
        
        // Clean up markdown and emojis for preview
        let preview = content
            .replace(/\*\*(.*?)\*\*/g, '$1')  // Remove bold markdown
            .replace(/```[\s\S]*?```/g, '[Code Block]')  // Replace code blocks
            .replace(/[📢💻📊]/g, '')  // Remove emojis
            .replace(/\n+/g, ' ')  // Replace newlines with spaces
            .trim();
        
        // Truncate if too long
        return preview.length > 100 ? preview.substring(0, 100) + '...' : preview;
    }

    generateAnswersTimelineHTML(studentAnswers) {
        if (!studentAnswers?.length) {
            return '<div class="no-answers">No student answers recorded</div>';
        }

        const sortedAnswers = [...studentAnswers].sort((a, b) => 
            new Date(a.timestamp) - new Date(b.timestamp)
        );

        return sortedAnswers.map(answer => {
            return `
                <div class="answer-timeline-item">
                    <div class="answer-time">${new Date(answer.timestamp).toLocaleTimeString()}</div>
                    <div class="answer-content">
                        <strong>${answer.username}</strong>
                        <div class="answer-context">During: ${answer.activeContentType || 'No Active Content'}</div>
                        <div class="answer-text">"${answer.answer}"</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    getStatus() {
        return {
            wsConnected: this.wsManager ? this.wsManager.connected : false,
            activeClass: this.classManager ? this.classManager.getCurrentClass() : null,
            activeContent: this.contentManager ? this.contentManager.activeContentData : null,
            ...this.statusManager.getStatus()
        };
    }

    shutdown() {
        if (this.wsManager && this.wsManager.connected) {
            this.wsManager.ws.close();
        }
        
        if (this.contentManager) {
            this.contentManager.clearActiveContentTimer();
        }

        console.log('Dashboard application shutdown');
    }
}

// Initialize application when components are loaded
document.addEventListener('componentsLoaded', () => {
    console.log('Components loaded, initializing dashboard app...');
    const app = new DashboardApp();
    app.init();
    window.dashboardApp = app;
});

// Fallback initialization if componentsLoaded event doesn't fire
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (!window.dashboardApp) {
            console.log('Fallback initialization...');
            const app = new DashboardApp();
            app.init();
            window.dashboardApp = app;
        }
    }, 2000);
});

// Export for testing or external access
export { DashboardApp };
