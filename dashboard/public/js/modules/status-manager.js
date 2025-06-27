/**
 * Status Manager
 * Handles status indicators and updates for bot and dashboard connections
 */
export class StatusManager {
    constructor() {
        this.botStatusElement = null;
        this.dashboardStatusElement = null;
        this.botConnected = false;
    }

    init() {
        this.botStatusElement = document.getElementById('bot-status');
        this.dashboardStatusElement = document.getElementById('dashboard-status');
        
        this.createStatusElements();
        this.updateBotStatus('Disconnected', false);
        this.updateDashboardStatus('Disconnected', false);
    }

    createStatusElements() {
        if (this.botStatusElement && !this.botStatusElement.innerHTML) {
            this.botStatusElement.innerHTML = `
                <div class="status-dot" id="bot-status-dot"></div>
                <span class="status-text" id="bot-status-text">Bot Disconnected</span>
            `;
        }

        if (this.dashboardStatusElement && !this.dashboardStatusElement.innerHTML) {
            this.dashboardStatusElement.innerHTML = `
                <div class="status-dot" id="dashboard-status-dot"></div>
                <span class="status-text" id="dashboard-status-text">Dashboard Disconnected</span>
            `;
        }
    }

    updateBotStatus(status, connected) {
        this.botConnected = connected;
        
        const statusText = document.getElementById('bot-status-text');
        const statusDot = document.getElementById('bot-status-dot');
        
        if (statusText) {
            statusText.textContent = connected ? `Bot ${status}` : 'Bot Disconnected';
        }
        
        if (statusDot) {
            statusDot.className = connected ? 'status-dot connected' : 'status-dot disconnected';
        }
    }

    updateDashboardStatus(status, connected) {
        const statusText = document.getElementById('dashboard-status-text');
        const statusDot = document.getElementById('dashboard-status-dot');
        
        if (statusText) {
            statusText.textContent = connected ? `Dashboard ${status}` : 'Dashboard Disconnected';
        }
        
        if (statusDot) {
            statusDot.className = connected ? 'status-dot connected' : 'status-dot disconnected';
        }
    }

    handleStatusUpdate(type, status, connected) {
        switch (type) {
            case 'bot':
                this.updateBotStatus(status, connected);
                break;
            case 'dashboard':
                this.updateDashboardStatus(status, connected);
                if (connected && !this.botConnected) {
                    // Bot status will be updated when bot events are received
                }
                break;
            default:
                console.warn('Unknown status type:', type);
        }
    }

    markBotConnected() {
        if (!this.botConnected) {
            this.botConnected = true;
            this.updateBotStatus('Connected & Active', true);
        }
    }

    getStatus() {
        return {
            botConnected: this.botConnected,
            dashboardConnected: this.dashboardStatusElement ? 
                this.dashboardStatusElement.querySelector('.status-dot').classList.contains('connected') : false
        };
    }
}
