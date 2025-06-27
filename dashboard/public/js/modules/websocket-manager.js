/**
 * WebSocket Connection Manager
 * Handles connection, reconnection, and message passing to/from the bot
 */
export class WebSocketManager {
    constructor() {
        this.ws = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 3000;
        this.messageHandlers = new Map();
        this.statusUpdateCallback = null;
    }

    connect() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}`;
        
        this.ws = new WebSocket(wsUrl);
        
        this.ws.onopen = () => {
            console.log('Connected to server');
            this.isConnected = true;
            this.reconnectAttempts = 0;
            
            // Authenticate as dashboard
            this.send('authenticate', { type: 'dashboard' });
            
            if (this.statusUpdateCallback) {
                this.statusUpdateCallback('dashboard', 'Connected', true);
            }
            
            this.notifyHandlers('system', 'Dashboard connected to server');
        };
        
        this.ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                console.log('WebSocket received:', message);
                
                // Handle messages based on their structure
                if (message.event) {
                    console.log(`Routing message with event: ${message.event}`);
                    // Message has an event property, route to appropriate handlers
                    if (this.messageHandlers.has(message.event)) {
                        const handlers = this.messageHandlers.get(message.event);
                        console.log(`Found ${handlers.length} handlers for event: ${message.event}`);
                        handlers.forEach(handler => {
                            console.log('Calling handler with data:', message.data || message);
                            handler(message.data || message);
                        });
                    } else {
                        console.log(`No handlers found for event: ${message.event}, trying generic handler`);
                        // For unknown events, try generic handler
                        this.handleMessage(message);
                    }
                } else {
                    console.log('Message has no event property, using generic handler');
                    // For backward compatibility, try to handle as generic message
                    this.handleMessage(message);
                }
            } catch (err) {
                console.error('Error parsing message:', err);
            }
        };
        
        this.ws.onclose = () => {
            console.log('Disconnected from server');
            this.isConnected = false;
            
            if (this.statusUpdateCallback) {
                this.statusUpdateCallback('dashboard', 'Disconnected', false);
                this.statusUpdateCallback('bot', 'Disconnected', false);
            }
            
            this.notifyHandlers('system', 'Connection lost. Attempting to reconnect...');
            
            // Attempt reconnection
            this.scheduleReconnect();
        };
        
        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            this.notifyHandlers('system', 'Connection error occurred');
        };
    }

    scheduleReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            this.notifyHandlers('system', 'Max reconnection attempts reached. Please refresh the page.');
            return;
        }

        this.reconnectAttempts++;
        setTimeout(() => {
            this.notifyHandlers('system', `Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
            this.connect();
        }, this.reconnectDelay);
    }

    send(event, data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ event, data }));
            return true;
        }
        return false;
    }

    handleMessage(message) {
        const { event, data } = message;
        
        if (this.messageHandlers.has(event)) {
            const handlers = this.messageHandlers.get(event);
            handlers.forEach(handler => handler(data));
        }
    }

    onMessage(event, handler) {
        if (!this.messageHandlers.has(event)) {
            this.messageHandlers.set(event, []);
        }
        this.messageHandlers.get(event).push(handler);
        console.log(`Registered handler for event: ${event}. Total handlers: ${this.messageHandlers.get(event).length}`);
    }

    offMessage(event, handler) {
        if (this.messageHandlers.has(event)) {
            const handlers = this.messageHandlers.get(event);
            const index = handlers.indexOf(handler);
            if (index > -1) {
                handlers.splice(index, 1);
            }
        }
    }

    onStatusUpdate(callback) {
        this.statusUpdateCallback = callback;
    }

    notifyHandlers(type, message) {
        if (this.messageHandlers.has('event')) {
            const handlers = this.messageHandlers.get('event');
            handlers.forEach(handler => handler({ type, message }));
        }
    }

    get connected() {
        return this.isConnected && this.ws && this.ws.readyState === WebSocket.OPEN;
    }
}
