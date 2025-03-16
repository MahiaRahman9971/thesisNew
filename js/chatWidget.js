class ChatWidget {
    constructor() {
        this.messages = [];
        this.container = null;
        this.messageList = null;
        this.inputField = null;
        this.sendButton = null;
        this.isProcessing = false;
    }

    init() {
        this.createChatInterface();
        this.attachEventListeners();
        this.addWelcomeMessage();
    }

    createChatInterface() {
        // Create main container
        this.container = document.createElement('div');
        this.container.className = 'chat-widget';
        
        // Create header
        const header = document.createElement('div');
        header.className = 'chat-header';
        header.innerHTML = '<h3>Economic Mobility Assistant</h3>';
        
        // Create messages container
        this.messageList = document.createElement('div');
        this.messageList.className = 'chat-messages';
        
        // Create input area
        const inputContainer = document.createElement('div');
        inputContainer.className = 'chat-input-container';
        
        this.inputField = document.createElement('input');
        this.inputField.type = 'text';
        this.inputField.className = 'chat-input';
        this.inputField.placeholder = 'Ask about opportunities for your family...';
        
        this.sendButton = document.createElement('button');
        this.sendButton.className = 'chat-send-button';
        this.sendButton.innerHTML = '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path></svg>';
        
        inputContainer.appendChild(this.inputField);
        inputContainer.appendChild(this.sendButton);
        
        this.container.appendChild(header);
        this.container.appendChild(this.messageList);
        this.container.appendChild(inputContainer);
        
        document.body.appendChild(this.container);
    }

    attachEventListeners() {
        // Send message on button click
        this.sendButton.addEventListener('click', () => this.sendMessage());
        
        // Send message on Enter key
        this.inputField.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });
    }

    addWelcomeMessage() {
        const welcomeMessage = `<h3>Welcome to Economic Mobility Guide! 👋</h3>
        <p>I'm here to help you:</p>
        <ul>
            <li>Find opportunities for your children</li>
            <li>Navigate our Opportunity Map</li>
            <li>Create personalized action plans</li>
            <li>Connect with community resources</li>
        </ul>
        <p>How can I assist you today?</p>`;
        
        this.addMessageToChat('assistant', welcomeMessage);
    }

    async sendMessage() {
        if (this.isProcessing) return;

        const message = this.inputField.value.trim();
        if (!message) return;

        try {
            this.isProcessing = true;
            this.updateUIState(true);

            // Add user message to chat
            this.addMessageToChat('user', message);
            this.inputField.value = '';

            // Show typing indicator
            this.showTypingIndicator();

            const response = await this.sendToOpenAI(message);
            
            // Remove typing indicator and add response
            this.removeTypingIndicator();
            this.addMessageToChat('assistant', response);
        } catch (error) {
            console.error('Error sending message:', error);
            this.removeTypingIndicator();
            this.addMessageToChat('system', 'Error: ' + (error.message || 'Failed to get response. Please try again.'));
        } finally {
            this.isProcessing = false;
            this.updateUIState(false);
        }
    }

    async sendToOpenAI(message) {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                message,
                history: this.messages.map(msg => ({
                    role: msg.role === 'assistant' ? 'assistant' : 'user',
                    content: msg.content
                }))
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.details || 'Failed to get response from server');
        }

        const data = await response.json();
        return data.response;
    }

    addMessageToChat(role, content) {
        const messageElement = document.createElement('div');
        messageElement.className = `chat-message ${role}-message`;
        
        // Safely render HTML content
        const sanitizedContent = this.sanitizeHTML(content);
        messageElement.innerHTML = sanitizedContent;
        
        this.messageList.appendChild(messageElement);
        this.messageList.scrollTop = this.messageList.scrollHeight;
        
        this.messages.push({ role, content });
    }

    sanitizeHTML(content) {
        // Allow specific HTML tags and attributes
        const allowedTags = {
            'h3': [],
            'p': [],
            'ul': [],
            'li': [],
            'strong': [],
            'a': ['href'],
            'br': [],
            'em': []
        };

        // Create a temporary element
        const temp = document.createElement('div');
        temp.innerHTML = content;

        // Recursively sanitize the content
        this.sanitizeNode(temp, allowedTags);

        return temp.innerHTML;
    }

    sanitizeNode(node, allowedTags) {
        const childNodes = Array.from(node.childNodes);
        
        childNodes.forEach(child => {
            if (child.nodeType === 1) { // Element node
                const tagName = child.tagName.toLowerCase();
                
                if (!allowedTags.hasOwnProperty(tagName)) {
                    // Replace disallowed tags with their text content
                    node.replaceChild(document.createTextNode(child.textContent), child);
                } else {
                    // Remove disallowed attributes
                    Array.from(child.attributes).forEach(attr => {
                        if (!allowedTags[tagName].includes(attr.name)) {
                            child.removeAttribute(attr.name);
                        }
                    });
                    
                    // Recursively sanitize children
                    this.sanitizeNode(child, allowedTags);
                }
            }
        });
    }

    showTypingIndicator() {
        const typingIndicator = document.createElement('div');
        typingIndicator.className = 'chat-message assistant-message typing-indicator';
        
        const dots = document.createElement('div');
        dots.className = 'typing-dots';
        for (let i = 0; i < 3; i++) {
            const dot = document.createElement('span');
            dot.className = 'dot';
            dots.appendChild(dot);
        }
        
        typingIndicator.appendChild(dots);
        this.messageList.appendChild(typingIndicator);
        this.messageList.scrollTop = this.messageList.scrollHeight;
    }

    removeTypingIndicator() {
        const typingIndicator = this.messageList.querySelector('.typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    updateUIState(isProcessing) {
        this.sendButton.disabled = isProcessing;
        this.inputField.disabled = isProcessing;
        this.sendButton.innerHTML = isProcessing ? 
            '<span class="loading"></span>' : 
            '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path></svg>';
    }
}

// Export the ChatWidget class
export default ChatWidget;
