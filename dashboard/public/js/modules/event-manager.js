/**
 * Event Manager
 * Handles event display, filtering, and highlighting
 */
export class EventManager {
    constructor() {
        this.maxEvents = 100;
        this.eventsListElement = null;
        this.studentFeedbackListElement = null;
        this.highlightCallback = null;
    }

    init() {
        this.eventsListElement = document.getElementById('events-list');
        this.studentFeedbackListElement = document.getElementById('student-feedback-list');
        
        if (!this.eventsListElement || !this.studentFeedbackListElement) {
            console.error('Event list elements not found');
        }
    }

    addEvent(message, type = 'system') {
        // Determine which list to add the event to
        let targetListElement = this.eventsListElement; // Default to real-time events
        
        if (type === 'engagement' || type === 'question') {
            targetListElement = this.studentFeedbackListElement;
        }

        if (!targetListElement) {
            console.error('Target list element not found for event type:', type);
            return;
        }

        const eventDiv = this.createEventElement(message, type);
        targetListElement.insertBefore(eventDiv, targetListElement.firstChild);
        
        while (targetListElement.children.length > this.maxEvents) {
            targetListElement.removeChild(targetListElement.lastChild);
        }
        
        targetListElement.scrollTop = 0;
    }

    /** Create event DOM element */
    createEventElement(message, type) {
        const eventDiv = document.createElement('div');
        eventDiv.className = 'event';
        
        // Add specific styling based on event type
        if (type === 'engagement') {
            eventDiv.classList.add('engaged-students');
        } else if (type === 'question') {
            eventDiv.classList.add('question-received');
        }
        
        const now = new Date();
        const timeStr = now.toLocaleTimeString('en-US', { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
        });
        
        // Create unique ID for student messages that can be highlighted
        const eventId = (type === 'engagement' || type === 'question') ? 'event_' + Date.now() : null;
        
        let eventContent = `
            <div class="event-time">${timeStr}</div>
            <div class="event-content">${message}</div>
        `;
        
        // Add highlight button for student feedback messages
        if (type === 'engagement' || type === 'question') {
            eventContent += `
                <div class="event-actions">
                    <button class="highlight-btn" onclick="window.eventManager.highlightMessage('${eventId}', this, '${type}')">
                        ⭐ Highlight
                    </button>
                </div>
            `;
            eventDiv.setAttribute('data-event-id', eventId);
            eventDiv.setAttribute('data-message', message);
        }
        
        eventDiv.innerHTML = eventContent;
        return eventDiv;
    }

    highlightMessage(eventId, buttonElement, type) {
        // Get the message from the parent event element
        const eventElement = buttonElement.closest('.event');
        const message = eventElement ? eventElement.getAttribute('data-message') : '';
        
        if (!message) {
            alert('No message found to highlight');
            return;
        }

        // Visual feedback - add highlighted class to the event
        if (eventElement) {
            eventElement.classList.add('highlighted-message');
        }

        // Call highlight callback if available
        if (this.highlightCallback) {
            this.highlightCallback(eventId, message, type);
        }
    }

    onHighlight(callback) {
        this.highlightCallback = callback;
    }

    clearEvents() {
        if (this.eventsListElement) {
            this.eventsListElement.innerHTML = '';
        }
        if (this.studentFeedbackListElement) {
            this.studentFeedbackListElement.innerHTML = '';
        }
    }

    filterEvents(type) {
        const allEvents = document.querySelectorAll('.event');
        allEvents.forEach(event => {
            if (type === 'all' || event.classList.contains(type)) {
                event.style.display = '';
            } else {
                event.style.display = 'none';
            }
        });
    }
}
