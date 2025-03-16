import ChatWidget from './chatWidget.js';

describe('ChatWidget', () => {
    let chatWidget;
    
    beforeEach(() => {
        // Clear the DOM
        document.body.innerHTML = '';
        // Create a new instance for each test
        chatWidget = new ChatWidget();
        chatWidget.init();
    });

    test('Chat widget renders properly', () => {
        const container = document.querySelector('.chat-widget');
        const messageList = document.querySelector('.chat-messages');
        const input = document.querySelector('.chat-input');
        const sendButton = document.querySelector('.chat-send-button');

        expect(container).toBeTruthy();
        expect(messageList).toBeTruthy();
        expect(input).toBeTruthy();
        expect(sendButton).toBeTruthy();
    });

    test('Sending a message adds it to the chat', () => {
        const input = document.querySelector('.chat-input');
        const sendButton = document.querySelector('.chat-send-button');

        // Simulate typing and sending a message
        input.value = 'Test message';
        sendButton.click();

        const messages = document.querySelectorAll('.chat-message');
        expect(messages.length).toBe(1);
        expect(messages[0].textContent).toBe('Test message');
    });

    test('Empty messages are not sent', () => {
        const input = document.querySelector('.chat-input');
        const sendButton = document.querySelector('.chat-send-button');

        // Try to send an empty message
        input.value = '   ';
        sendButton.click();

        const messages = document.querySelectorAll('.chat-message');
        expect(messages.length).toBe(0);
    });

    test('Messages are stored in the messages array', () => {
        const testMessage = 'Test message';
        chatWidget.addMessageToChat('user', testMessage);

        expect(chatWidget.messages.length).toBe(1);
        expect(chatWidget.messages[0]).toEqual({
            role: 'user',
            content: testMessage
        });
    });

    test('API error handling', async () => {
        // Mock failed API call
        global.fetch = jest.fn(() =>
            Promise.reject(new Error('API Error'))
        );

        const input = document.querySelector('.chat-input');
        const sendButton = document.querySelector('.chat-send-button');

        input.value = 'Test message';
        
        // Wait for the async operation to complete
        await chatWidget.sendMessage();

        const errorMessage = document.querySelector('.system-message');
        expect(errorMessage).toBeTruthy();
        expect(errorMessage.textContent).toContain('Error sending message');
    });
});
