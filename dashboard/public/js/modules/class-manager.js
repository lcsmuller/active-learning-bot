/**
 * Class Manager
 * Handles class state, start/end operations, and UI updates
 */
export class ClassManager {
    constructor(wsManager, eventManager) {
        this.wsManager = wsManager;
        this.eventManager = eventManager;
        this.currentClass = null;
        this.pendingClassStart = null;
        this.startTimeout = null;
        this.startTimeoutDuration = 3000; // 3 seconds
        this.studentsInVoice = new Map();
        this.contentManager = null; // Will be set by dashboard app
    }

    setContentManager(contentManager) {
        this.contentManager = contentManager;
    }

    init() {
        this.updateClassStatus(null);
        this.updateUIForClassState(false);
        this.updateStudentCount();
        this.ensureEventsAlwaysVisible();
    }

    ensureEventsAlwaysVisible() {
        // Events should always be visible regardless of class state
        const eventsContainer = document.querySelector('.events-container');
        if (eventsContainer) {
            eventsContainer.classList.remove('hidden');
        }
    }

    handleBotEvent(message) {
        if (message.event === 'bot_event') {
            const { event: eventType, payload } = message.data;
            
            switch (eventType) {
                case 'start_class_ack':
                    this.handleClassStartAck(payload);
                    break;
                case 'class_ended':
                    this.handleClassEnded(payload);
                    break;
                case 'discussion_started':
                case 'poll_created':
                case 'code_shared':
                    this.eventManager.addEvent(`Bot event: ${eventType}`, 'system');
                    break;
                default:
                    if (['student_joined', 'question_asked', 'activity_response', 'reaction_added', 'discussion_sent', 'active_content_sent'].includes(eventType)) {
                        break; // These are handled by the dashboard app
                    }
                    console.error(`Unhandled bot event: ${eventType}`, payload);
                    this.eventManager.addEvent(`Unhandled bot event: ${eventType}`, 'system');
                    break;
            }
        }
    }

    handleClassStartAck(payload) {
        if (this.pendingClassStart && payload.success) {
            this.currentClass = this.pendingClassStart;
            this.pendingClassStart = null;
            this.clearStartTimeout();
            this.clearStudentCount();
            
            this.eventManager.addEvent(`Class started successfully: "${this.currentClass.title}" (Code: ${this.currentClass.classCode})`, 'system');
            this.updateClassStatus(this.currentClass);
            this.updateUIForClassState(true);
            
            const startBtn = document.getElementById('start-class-btn');
            if (startBtn) {
                startBtn.disabled = false;
                startBtn.textContent = 'Start Class';
            }
        } else {
            this.cancelStartClass("Class code is not valid");
        }
    }

    startClass() {
        const titleInput = document.getElementById('class-title');
        const codeInput = document.getElementById('class-code');
        
        if (!titleInput || !codeInput) {
            alert('Class input fields not found');
            return;
        }

        const title = titleInput.value || 'Untitled Class';
        const classCode = codeInput.value || 'CLASS' + Math.floor(Math.random() * 1000);
        
        const classData = {
            classId: 'class_' + Date.now(),
            title,
            classCode,
            teacherId: 'teacher_1'
        };
        
        if (this.wsManager.send('start_class', classData)) {
            this.pendingClassStart = classData;
            
            const startBtn = document.getElementById('start-class-btn');
            if (startBtn) {
                startBtn.disabled = true;
                startBtn.textContent = 'Starting Class...';
            }
            
            this.eventManager.addEvent(`Requesting to start class: "${title}" (Code: ${classCode})`, 'system');
            
            this.startTimeout = setTimeout(() => {
                this.cancelStartClass("timeout");
            }, this.startTimeoutDuration);
        } else {
            alert('Cannot start class - not connected to server');
        }
    }

    cancelStartClass(reason) {
        if (!this.pendingClassStart) return;

        this.pendingClassStart = null;
        this.clearStartTimeout();
        
        const startBtn = document.getElementById('start-class-btn');
        if (startBtn) {
            startBtn.disabled = false;
            startBtn.textContent = 'Start Class';
        }

        this.eventManager.addEvent('Cancelled class start request', 'system');
        alert(`Failed to start class - bot is not responding. Reason: ${reason}`);
    }

    endClass() {
        if (!this.currentClass) {
            alert('No active class to end');
            return;
        }
        
        if (this.wsManager.send('end_class', { classId: this.currentClass.classId, classCode: this.currentClass.classCode })) {
            const endedClassName = this.currentClass.title;
            this.eventManager.addEvent(`Ended class: "${endedClassName}"`, 'system');
            
            // Clear any active content when ending the class
            if (this.contentManager && this.contentManager.clearActiveContent) {
                this.contentManager.clearActiveContent();
            }
            
            // Clear student count
            this.clearStudentCount();
            
            this.currentClass = null;
            this.updateClassStatus(null);
            this.updateUIForClassState(false);
            this.clearInputFields();
            
            console.log(`Successfully ended class: ${endedClassName}`);
        } else {
            alert('Cannot end class - not connected to server');
        }
    }

    handleClassEnded(_payload) {
        if (!this.currentClass) {
            this.eventManager.addEvent('Bot reported class ended, but no active class found', 'system');
            console.warn('Bot reported class ended, but no active class found');
            return;
        }

        const endedClassName = this.currentClass.title;
        this.eventManager.addEvent(`Class ended by bot: "${endedClassName}"`, 'system');
        
        // Clear any active content when class ends
        if (this.contentManager && this.contentManager.clearActiveContent) {
            this.contentManager.clearActiveContent();
        }
        
        this.clearStudentCount();
        this.currentClass = null;
        this.updateClassStatus(null);
        this.updateUIForClassState(false);
        this.clearInputFields();
        
        console.log(`Bot ended class: ${endedClassName}`);
    }

    updateClassStatus(classData) {
        const headerNoClass = document.getElementById('header-no-class');
        const headerClassInfo = document.getElementById('header-class-info');
        const headerTitleElement = document.getElementById('header-class-title');
        const headerCodeElement = document.getElementById('header-class-code');
        const headerTimeElement = document.getElementById('header-class-time');
        
        if (classData) {
            headerNoClass?.classList.add('hidden');
            headerClassInfo?.classList.remove('hidden');
            
            if (headerTitleElement) headerTitleElement.textContent = classData.title;
            if (headerCodeElement) headerCodeElement.textContent = classData.classCode;
            if (headerTimeElement) {
                headerTimeElement.textContent = new Date().toLocaleTimeString('en-US', {
                    hour12: false,
                    hour: '2-digit',
                    minute: '2-digit'
                });
            }
        } else {
            headerNoClass?.classList.remove('hidden');
            headerClassInfo?.classList.add('hidden');
        }
    }

    updateUIForClassState(hasActiveClass) {
        const startBtn = document.getElementById('start-class-btn');
        const endBtn = document.getElementById('end-class-btn');
        const contentSharingSection = document.getElementById('content-sharing-section');
        const classInputs = document.getElementById('class-inputs');
        // Note: events container should always be visible, removed from this function
        
        if (hasActiveClass) {
            startBtn?.classList.add('hidden');
            endBtn?.classList.remove('hidden');
            contentSharingSection?.classList.remove('hidden');
            classInputs?.classList.add('hidden');
        } else {
            startBtn?.classList.remove('hidden');
            endBtn?.classList.add('hidden');
            contentSharingSection?.classList.add('hidden');
            classInputs?.classList.remove('hidden');
        }
        this.contentManager?.updateContentSharingVisibility?.();
    }

    clearInputFields() {
        const titleInput = document.getElementById('class-title');
        const codeInput = document.getElementById('class-code');
        if (titleInput) titleInput.value = '';
        if (codeInput) codeInput.value = '';
    }

    clearStartTimeout() {
        if (this.startTimeout) {
            clearTimeout(this.startTimeout);
            this.startTimeout = null;
        }
    }

    getCurrentClass() {
        return this.currentClass;
    }

    isClassActive() {
        return !!this.currentClass;
    }

    addStudentToVoice(studentData) {
        const { userId, username, timestamp } = studentData;
        const userIdStr = userId.toString();
        
        if (!this.studentsInVoice.has(userIdStr)) {
            this.studentsInVoice.set(userIdStr, {
                username,
                joinTime: timestamp
            });
            this.updateStudentCount();
            console.log(`Student ${username} joined voice channel. Total: ${this.studentsInVoice.size}`);
        }
    }

    removeStudentFromVoice(studentData) {
        const { userId, username } = studentData;
        const userIdStr = userId.toString();
        
        // Only remove if present
        if (this.studentsInVoice.has(userIdStr)) {
            this.studentsInVoice.delete(userIdStr);
            this.updateStudentCount();
            console.log(`Student ${username} left voice channel. Total: ${this.studentsInVoice.size}`);
        }
    }

    updateStudentCount() {
        const studentCountElement = document.getElementById('header-student-count');
        if (!studentCountElement) {
            console.error('Student count element not found');
            return;
        }

        const count = this.studentsInVoice.size;
        studentCountElement.textContent = `${count} student${count !== 1 ? 's' : ''} online`;
        if (count === 0) {
            studentCountElement.classList.add('zero-students');
        } else {
            studentCountElement.classList.remove('zero-students');
        }
    }

    clearStudentCount() {
        this.studentsInVoice.clear();
        this.updateStudentCount();
    }

    getStudentCount() {
        return this.studentsInVoice.size;
    }

    getStudentsInVoice() {
        return Array.from(this.studentsInVoice.values());
    }
}
