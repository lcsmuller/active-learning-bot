/**
 * Content Manager
 * Handles content sharing, active content display, and content operations
 */
export class ContentManager {
    constructor(wsManager, eventManager, classManager) {
        this.wsManager = wsManager;
        this.eventManager = eventManager;
        this.classManager = classManager;
        this.activeContentData = null;
        this.activeContentTimer = null;
        this.reactions = []; // Store reactions for active content
        this.answers = []; // Store answers for active content
    }

    init() {
        this.setupEventHandlers();
        this.initializePollOptions();
        this.updateContentSharingVisibility();
    }

    setupEventHandlers() {
        this.eventManager.onHighlight((eventId, message, type) => {
            this.highlightMessage(eventId, message, type);
        });
        
        // Listen for class state changes to hide active content when no class is active
        if (this.classManager && typeof this.classManager.onClassStateChange === 'function') {
            this.classManager.onClassStateChange((isActive) => {
                if (!isActive) {
                    this.hideActiveContentWhenNoClass();
                }
            });
        }
    }

    hideActiveContentWhenNoClass() {
        console.log('No active class - hiding active content');
        const activeContentDiv = document.getElementById('active-content');
        if (activeContentDiv) {
            activeContentDiv.classList.add('hidden');
        }
        
        // Clear timers but keep data in case class becomes active again
        this.clearActiveContentTimer();
        
        this.eventManager.addEvent('Active content hidden - no active class', 'system');
    }

    startDiscussion() {
        if (!this.classManager.isClassActive()) {
            alert('No active class to start discussion');
            return;
        }
        
        const messageInput = document.getElementById('discussion');
        if (!messageInput) {
            alert('Discussion input not found');
            return;
        }

        const message = messageInput.value;
        if (!message.trim()) {
            alert('Please enter the discussion message');
            return;
        }
        
        const currentClass = this.classManager.getCurrentClass();
        const discussionData = {
            classId: currentClass?.classId ?? 'default',
            message,
            type: 'info',
            teacherId: 'teacher_1'
        };
        
        const activeContentData = {
            classId: currentClass?.classId ?? 'default',
            content: `📢 **Discussion:** ${message}`,
            teacherId: 'teacher_1'
        };
        
        if (this.wsManager.send('send_discussion', discussionData) && this.wsManager.send('active_content', activeContentData)) {
            this.eventManager.addEvent(`Sent discussion: "${message}"`, 'system');
            this.updateActiveContent('Discussion', null, message);
            messageInput.value = '';
        } else {
            alert('Cannot start discussion - not connected to server');
        }
    }

    sendCodeSnippet() {
        if (!this.classManager.isClassActive()) {
            alert('No active class to send code snippet');
            return;
        }
        
        const codeInput = document.getElementById('code-snippet');
        const languageInput = document.getElementById('code-language');
        const titleInput = document.getElementById('code-title');
        
        if (!codeInput || !languageInput || !titleInput) {
            alert('Code snippet inputs not found');
            return;
        }

        const code = codeInput.value;
        const language = languageInput.value || 'Code';
        const title = titleInput.value;
        
        if (!code.trim()) {
            alert('Please enter the code snippet');
            return;
        }
        
        const currentClass = this.classManager.getCurrentClass();
        const codeData = {
            classId: currentClass?.classId ?? 'default',
            code,
            language,
            title: title || `${language} Code`,
            teacherId: 'teacher_1'
        };
        
        const displayTitle = title || `${language} Code`;
        const activeContentData = {
            classId: currentClass?.classId ?? 'default',
            content: `💻 **${displayTitle}**\n\`\`\`${language.toLowerCase()}\n${code}\n\`\`\``,
            teacherId: 'teacher_1'
        };
        
        if (this.wsManager.send('send_code', codeData) && this.wsManager.send('active_content', activeContentData)) {
            this.eventManager.addEvent(`Sent code snippet: "${displayTitle}"`, 'system');
            this.updateActiveContent('Code Snippet', displayTitle, `\`\`\`${language.toLowerCase()}\n${code}\n\`\`\``);
            codeInput.value = '';
            titleInput.value = '';
        } else {
            alert('Cannot send code snippet - not connected to server');
        }
    }

    createPoll() {
        if (!this.classManager.isClassActive()) {
            alert('No active class to create poll');
            return;
        }
        
        const questionInput = document.getElementById('poll-question');
        const durationInput = document.getElementById('poll-duration');
        
        if (!questionInput || !durationInput) {
            alert('Poll inputs not found');
            return;
        }

        const question = questionInput.value;
        const duration = parseInt(durationInput.value);
        
        if (!question.trim()) {
            alert('Please enter a poll question');
            return;
        }
        
        // Get options from the dynamic inputs
        const optionInputs = document.querySelectorAll('#poll-options-container .poll-option-input');
        const options = [];
        
        optionInputs.forEach(input => {
            const value = input.value.trim();
            if (value) {
                options.push(value);
            }
        });
        
        if (options.length < 2) {
            alert('Please provide at least 2 options');
            return;
        }
        
        const currentClass = this.classManager.getCurrentClass();
        const pollData = {
            classId: currentClass?.classId ?? 'default',
            question,
            options,
            duration,
            teacherId: 'teacher_1'
        };
        
        // Format options for Discord with numbered list
        const formattedOptions = options.map((option, index) => `${index + 1}. ${option}`).join('\n');
        const activeContentData = {
            classId: currentClass?.classId ?? 'default',
            content: `📊 **Poll:** ${question}\n\n${formattedOptions}\n\n*React with the corresponding number!*`,
            teacherId: 'teacher_1'
        };
        
        if (this.wsManager.send('create_poll', pollData) && this.wsManager.send('active_content', activeContentData)) {
            this.eventManager.addEvent(`Created poll: "${question}" with ${options.length} options`, 'system');
            this.updateActiveContent('Poll', question, `Options: ${options.join(', ')}`, duration);
            questionInput.value = '';
            this.resetPollOptions();
        } else {
            alert('Cannot create poll - not connected to server');
        }
    }

    highlightMessage(eventId, message, type) {
        // Highlighted messages should always be visible, regardless of class state
        const currentClass = this.classManager.getCurrentClass();
        const classId = currentClass ? currentClass.classId : 'no-active-class';
        
        const data = {
            classId: classId,
            content: `⭐ **Highlighted ${type === 'question' ? 'Question' : 'Message'}:** ${message}`,
            messageId: eventId,
            messageType: type,
            teacherId: 'teacher_1',
            timestamp: new Date().toISOString()
        };
        
        console.log('Sending highlight_message event:', data);
        
        // Send highlight_message event for metrics tracking (separate from active_content)
        this.wsManager.send('highlight_message', data);
        
        const messageType = type === 'question' ? 'Highlighted Question' : 'Highlighted Message';
        this.showHighlightedMessage(messageType, message);
        
        this.eventManager.addEvent(`Mensagem destacada: "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}"`, 'system');
    }

    showHighlightedMessage(type, message) {
        const highlightedDiv = document.getElementById('highlighted-messages');
        const typeElement = document.getElementById('highlighted-message-type');
        const textElement = document.getElementById('highlighted-message-text');
        const timeElement = document.getElementById('highlighted-message-time');

        if (!highlightedDiv || !typeElement || !textElement || !timeElement) {
            console.error('Highlighted message elements not found');
            return;
        }

        typeElement.textContent = `⭐ ${type}`;
        textElement.textContent = message;
        timeElement.textContent = `Highlighted at ${new Date().toLocaleTimeString()}`;
        
        highlightedDiv.classList.remove('hidden');
        
        // Store highlighted message data
        this.highlightedMessageData = { type, message, timestamp: new Date().toISOString() };
    }

    dismissHighlightedMessage() {
        const highlightedDiv = document.getElementById('highlighted-messages');
        if (highlightedDiv) {
            highlightedDiv.classList.add('hidden');
        }
        
        this.highlightedMessageData = null;
        this.eventManager.addEvent('Dismissed highlighted message', 'system');
    }

    updateActiveContent(type, title, content, duration = null, isHighlighted = false) {
        // Only show active content if a class is active
        if (!this.classManager.isClassActive()) {
            console.log('No active class - not displaying active content');
            return;
        }
        
        const activeContentDiv = document.getElementById('active-content');
        const typeElement = document.getElementById('active-content-type');
        const textElement = document.getElementById('active-content-text');
        const timeElement = document.getElementById('active-content-time');
        const timerElement = document.getElementById('active-content-timer');
        const actionsElement = document.querySelector('.active-content-actions');
        const reactionsElement = document.getElementById('active-content-reactions');

        if (!activeContentDiv || !typeElement || !textElement || !timeElement || !timerElement) {
            console.error('Active content elements not found');
            return;
        }

        // Clear any existing timer, reactions, and answers
        this.clearActiveContentTimer();
        this.clearReactions();
        this.clearAnswers();
        
        // Store active content data
        this.activeContentData = { type, title, content, duration, isHighlighted };
        
        // Special styling for highlighted messages
        if (isHighlighted) {
            activeContentDiv.style.borderLeftColor = '#f39c12';
            const bodyElement = document.getElementById('active-content-body');
            if (bodyElement) {
                bodyElement.style.background = '#fff3cd';
                bodyElement.style.borderColor = '#ffc107';
            }
            typeElement.textContent = `⭐ ${type}`;
        } else {
            activeContentDiv.style.borderLeftColor = '#e67e22';
            const bodyElement = document.getElementById('active-content-body');
            if (bodyElement) {
                bodyElement.style.background = '#fdf6e3';
                bodyElement.style.borderColor = '#f1c40f';
            }
            typeElement.textContent = type;
        }
        
        textElement.innerHTML = title ? `<strong>${title}</strong><br>${content}` : content;
        timeElement.textContent = isHighlighted ? 
            `Highlighted at ${new Date().toLocaleTimeString()}` : 
            `Active since ${new Date().toLocaleTimeString()}`;
        
        if (reactionsElement) {
            reactionsElement.classList.remove('hidden');
            const reactionsList = document.getElementById('reactions-list');
            if (reactionsList && this.reactions.length === 0) {
                reactionsList.innerHTML = '<div class="no-reactions">No reactions yet. Students can react to this content on Discord.</div>';
            }
        }
        
        const answersElement = document.getElementById('active-content-answers');
        if (answersElement) {
            answersElement.classList.remove('hidden');
            const answersList = document.getElementById('answers-list');
            if (answersList && this.answers.length === 0) {
                answersList.innerHTML = '<div class="no-answers">No answers yet. Students can use /answer command on Discord.</div>';
            }
            const answersCount = document.getElementById('answers-count');
            if (answersCount) {
                answersCount.textContent = `${this.answers.length} answer${this.answers.length !== 1 ? 's' : ''}`;
            }
        }
        
        if (actionsElement) {
            actionsElement.innerHTML = `
                <button class="stop-button" onclick="window.contentManager.stopActiveContent()">
                    Stop ${isHighlighted ? 'Highlight' : type}
                </button>
            `;
        }
        
        if (duration && duration > 0 && !isHighlighted) {
            this.startContentTimer(duration, timerElement);
        } else {
            timerElement.classList.add('hidden');
        }
        
        activeContentDiv.classList.remove('hidden');
    }

    startContentTimer(duration, timerElement) {
        let remainingTime = duration;
        timerElement.textContent = `Stopping in ${remainingTime} seconds`;
        timerElement.classList.remove('hidden');
        
        this.activeContentTimer = setInterval(() => {
            remainingTime--;
            timerElement.textContent = `Stopping in ${remainingTime} seconds`;
            
            if (remainingTime <= 0) {
                this.clearActiveContentTimer();
                timerElement.classList.add('hidden');
                
                // Auto-hide the active content when timer expires
                const activeContentDiv = document.getElementById('active-content');
                if (activeContentDiv) {
                    activeContentDiv.classList.add('hidden');
                }
                this.activeContentData = null;
            }
        }, 1000);
    }

    clearActiveContentTimer() {
        if (this.activeContentTimer) {
            clearInterval(this.activeContentTimer);
            this.activeContentTimer = null;
        }
    }

    stopActiveContent() {
        if (!this.activeContentData) {
            return;
        }
        
        // Different handling for highlighted messages vs regular content
        if (this.activeContentData.isHighlighted) {
            const confirmMessage = 'Are you sure you want to dismiss this highlighted message?';
            if (!confirm(confirmMessage)) {
                return;
            }
            
            // Simply hide the active content for highlighted messages
            const activeContentDiv = document.getElementById('active-content');
            if (activeContentDiv) {
                activeContentDiv.classList.add('hidden');
            }
            this.activeContentData = null;
            this.clearReactions();
            this.clearAnswers();
            
            this.eventManager.addEvent('Dismissed highlighted message', 'system');
            return;
        }
        
        const confirmMessage = `Are you sure you want to stop the active ${this.activeContentData.type.toLowerCase()}?`;
        if (!confirm(confirmMessage)) {
            return;
        }
        
        this.clearActiveContentTimer();
        
        let stopEvent = '';
        const currentClass = this.classManager.getCurrentClass();
        const stopData = {
            classId: currentClass ? currentClass.classId : 'default',
            teacherId: 'teacher_1'
        };
        
        switch (this.activeContentData.type.toLowerCase()) {
            case 'poll':
                stopEvent = 'stop_poll';
                break;
            case 'discussion':
                stopEvent = 'stop_discussion';
                break;
            case 'code snippet':
                stopEvent = 'stop_code';
                break;
            default:
                stopEvent = 'stop_content';
        }
        
        if (this.wsManager.send(stopEvent, stopData)) {
            this.eventManager.addEvent(`Stopped active ${this.activeContentData.type.toLowerCase()}`, 'system');
            
            // Hide active content and clear reactions
            const activeContentDiv = document.getElementById('active-content');
            if (activeContentDiv) {
                activeContentDiv.classList.add('hidden');
            }
            this.activeContentData = null;
            this.clearReactions();
            this.clearAnswers();
        } else {
            alert('Cannot stop content - not connected to server');
        }
    }

    addPollOption() {
        const container = document.getElementById('poll-options-container');
        if (!container) return;

        const optionCount = container.querySelectorAll('.poll-option-item').length + 1;
        
        const optionDiv = document.createElement('div');
        optionDiv.className = 'poll-option-item';
        optionDiv.innerHTML = `
            <input type="text" class="poll-option-input" placeholder="Option ${optionCount}" value="">
            <button type="button" class="poll-option-remove" onclick="window.contentManager.removePollOption(this)">×</button>
        `;
        
        container.appendChild(optionDiv);
    }

    removePollOption(button) {
        const container = document.getElementById('poll-options-container');
        if (!container) return;

        const optionItems = container.querySelectorAll('.poll-option-item');
        
        // Don't allow removing if there are only 2 options left
        if (optionItems.length <= 2) {
            alert('A poll must have at least 2 options');
            return;
        }
        
        button.parentElement.remove();
    }

    resetPollOptions() {
        const container = document.getElementById('poll-options-container');
        if (!container) return;

        container.innerHTML = `
            <div class="poll-option-item">
                <input type="text" class="poll-option-input" placeholder="Option 1" value="">
                <button type="button" class="poll-option-remove" onclick="window.contentManager.removePollOption(this)">×</button>
            </div>
            <div class="poll-option-item">
                <input type="text" class="poll-option-input" placeholder="Option 2" value="">
                <button type="button" class="poll-option-remove" onclick="window.contentManager.removePollOption(this)">×</button>
            </div>
        `;
    }

    initializePollOptions() {
        this.resetPollOptions();
    }

    updateContentSharingVisibility() {
        const contentSharingSection = document.getElementById('content-sharing-section');
        const isActive = this.classManager.isClassActive();
        
        if (isActive) {
            contentSharingSection?.classList.remove('hidden');
        } else {
            contentSharingSection?.classList.add('hidden');
        }
    }

    handleReactionAdded(data) {
        console.log('Reaction added:', data);
        
        if (!this.classManager.isClassActive()) {
            console.log('No active class - ignoring reaction');
            return;
        }
        
        this.reactions.push({
            userId: data.userId,
            emoji: data.emoji,
            timestamp: data.timestamp
        });
        
        this.updateReactionsDisplay();
        
        this.eventManager.addEvent(`Student reacted with ${data.emoji}`, 'reaction');
        
        const reactionsElement = document.getElementById('active-content-reactions');
        if (reactionsElement) {
            reactionsElement.classList.remove('hidden');
        }
    }

    updateReactionsDisplay() {
        const reactionsList = document.getElementById('reactions-list');
        if (!reactionsList) return;
        
        if (this.reactions.length === 0) {
            reactionsList.innerHTML = '<div class="no-reactions">No reactions yet. Students can react to this content on Discord.</div>';
            return;
        }
        
        const groupedReactions = {};
        this.reactions.forEach(reaction => {
            if (!groupedReactions[reaction.emoji]) {
                groupedReactions[reaction.emoji] = {
                    count: 0,
                    users: [],
                    latestTime: 0
                };
            }
            groupedReactions[reaction.emoji].count++;
            groupedReactions[reaction.emoji].users.push(reaction.userId);
            groupedReactions[reaction.emoji].latestTime = Math.max(
                groupedReactions[reaction.emoji].latestTime, 
                reaction.timestamp
            );
        });
        
        // Update display
        reactionsList.innerHTML = '';
        Object.entries(groupedReactions).forEach(([emoji, data]) => {
            const reactionItem = document.createElement('div');
            reactionItem.className = 'reaction-item';
            
            const timeStr = new Date(data.latestTime * 1000).toLocaleTimeString();
            
            reactionItem.innerHTML = `
                <span class="reaction-emoji">${emoji}</span>
                <div class="reaction-info">
                    <span class="reaction-user">${data.count} student${data.count > 1 ? 's' : ''}</span>
                    <span class="reaction-time">${timeStr}</span>
                </div>
            `;
            
            reactionsList.appendChild(reactionItem);
        });
    }

    clearReactions() {
        this.reactions = [];
        const reactionsList = document.getElementById('reactions-list');
        if (reactionsList) {
            reactionsList.innerHTML = '<div class="no-reactions">No reactions yet. Students can react to this content on Discord.</div>';
        }
    }

    handleAnswerSubmitted(data) {
        console.log('Answer submitted:', data);
        
        if (!this.classManager.isClassActive()) {
            console.log('No active class - ignoring answer');
            return;
        }
        
        this.answers.push({
            userId: data.studentId,
            username: data.username,
            answer: data.answer,
            timestamp: data.timestamp
        });
        
        this.updateAnswersDisplay();
        
        const displayName = data.username === 'Anonymous' ? 'Anonymous' : data.username;
        this.eventManager.addEvent(`${displayName} submitted an answer`, 'answer');
        
        const answersElement = document.getElementById('active-content-answers');
        if (answersElement) {
            answersElement.classList.remove('hidden');
        }
    }

    updateAnswersDisplay() {
        const answersList = document.getElementById('answers-list');
        if (!answersList) return;
        
        if (this.answers.length === 0) {
            answersList.innerHTML = '<div class="no-answers">No answers yet. Students can use /answer command on Discord.</div>';
            return;
        }
        
        const sortedAnswers = [...this.answers].sort((a, b) => b.timestamp - a.timestamp);
        
        answersList.innerHTML = '';
        sortedAnswers.forEach((answerData, index) => {
            const answerItem = document.createElement('div');
            answerItem.className = 'answer-item';
            
            const timeStr = new Date(parseInt(answerData.timestamp)).toLocaleTimeString();
            
            answerItem.innerHTML = `
                <div class="answer-header">
                    <span class="answer-username">${answerData.username}</span>
                    <span class="answer-time">${timeStr}</span>
                </div>
                <div class="answer-content">${answerData.answer}</div>
            `;
            
            answersList.appendChild(answerItem);
        });
        
        const answersCount = document.getElementById('answers-count');
        if (answersCount) {
            answersCount.textContent = `${this.answers.length} answer${this.answers.length !== 1 ? 's' : ''}`;
        }
    }

    clearAnswers() {
        this.answers = [];
        const answersList = document.getElementById('answers-list');
        if (answersList) {
            answersList.innerHTML = '<div class="no-answers">No answers yet. Students can use /answer command on Discord.</div>';
        }
        const answersCount = document.getElementById('answers-count');
        if (answersCount) {
            answersCount.textContent = '0 answers';
        }
    }

    clearActiveContent() {
        console.log('Clearing active content, current data:', this.activeContentData);
        
        const contentType = this.activeContentData?.type || 'unknown content';
        
        this.clearActiveContentTimer();
        this.clearReactions();
        this.clearAnswers();
        
        const activeContentDiv = document.getElementById('active-content');
        if (activeContentDiv) {
            activeContentDiv.classList.add('hidden');
        }
        
        this.activeContentData = null;
        
        if (this.eventManager) {
            this.eventManager.addEvent(`Active content cleared: ${contentType}`, 'system');
        }
        
        console.log(`Active content cleared: ${contentType}`);
    }
}
