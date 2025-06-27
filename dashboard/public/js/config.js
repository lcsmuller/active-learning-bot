/**
 * Dashboard Configuration
 */
export const DashboardConfig = {
    // WebSocket settings
    websocket: {
        reconnectAttempts: 5,
        reconnectDelay: 3000,
        startClassTimeout: 3000
    },

    // Event settings
    events: {
        maxEvents: 100,
        autoScrollToTop: true
    },

    // Content settings
    content: {
        defaultPollDuration: 60,
        minPollOptions: 2,
        maxPollOptions: 10,
        defaultCodeLanguage: 'Python'
    },

    // UI settings
    ui: {
        animationDuration: 200,
        toastDuration: 3000
    },

    // API endpoints (if needed for future extensions)
    api: {
        baseUrl: '/api',
        endpoints: {
            classes: '/classes',
            events: '/events',
            content: '/content'
        }
    },

    // Feature flags
    features: {
        enableComponentLoader: true,
        enableAdvancedPolls: false,
        enableFileSharing: false,
        enableClassRecording: false
    },

    // Default values
    defaults: {
        teacherId: 'teacher_1',
        classCodePrefix: 'CLASS',
        eventTypes: {
            SYSTEM: 'system',
            ENGAGEMENT: 'engagement',
            QUESTION: 'question'
        }
    }
};
