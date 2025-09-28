import React, { useState, useRef, useEffect } from 'react';
import Button from './Button';
import { useAuth } from '../../hooks/useAuth';
import { chatService } from '../../services/chat';
import { ChatInputValidator, FrontendRateLimiter } from '../../utils/chatSecurity';

/**
 * ChatBot component for AI assistance
 */
const ChatBot = ({ courseId }) => {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    
    // Get user's first name, fallback to "there" if not available
    const firstName = user?.first_name || "there";
    
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [courseContext, setCourseContext] = useState(null);
    const [isLoadingContext, setIsLoadingContext] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // Load course context when courseId changes
    useEffect(() => {
        if (courseId && isOpen) {
            loadCourseContext();
        }
    }, [courseId, isOpen]);

    // Initialize welcome message when user data is available
    useEffect(() => {
        const welcomeMessage = {
            id: 1,
            type: 'bot',
            content: `Hey ${firstName}! 👋\n\nHaving trouble with course? Ask me anything from study planning to course questions, I'm here to help you!${courseId ? '\n\nI have access to your course content including topics, assignments, quizzes, and resources to provide personalized assistance.' : ''}`,
            timestamp: new Date()
        };
        
        setMessages([welcomeMessage]);
    }, [firstName, courseId]);

    const loadCourseContext = async () => {
        if (!courseId) return;
        
        try {
            setIsLoadingContext(true);
            const context = await chatService.getCourseContext(courseId);
            setCourseContext(context);
        } catch (error) {
            console.error('Error loading course context:', error);
        } finally {
            setIsLoadingContext(false);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const handleSendMessage = async () => {
        if (!inputMessage.trim()) return;

        // Frontend security validation
        const validation = ChatInputValidator.validateInput(inputMessage);
        if (!validation.isValid) {
            const errorMessage = {
                id: Date.now(),
                type: 'bot',
                content: validation.error,
                timestamp: new Date(),
                isError: true,
                isSecurityBlock: true
            };
            setMessages(prev => [...prev, errorMessage]);
            return;
        }

        // Rate limiting check
        const rateLimitCheck = FrontendRateLimiter.checkLimit();
        if (!rateLimitCheck.allowed) {
            const rateLimitMessage = {
                id: Date.now(),
                type: 'bot',
                content: `Please wait ${Math.ceil(rateLimitCheck.waitTime / 60)} minutes before sending more messages.`,
                timestamp: new Date(),
                isError: true,
                isRateLimit: true
            };
            setMessages(prev => [...prev, rateLimitMessage]);
            return;
        }

        // Sanitize input
        const sanitizedMessage = ChatInputValidator.sanitizeInput(inputMessage);

        const userMessage = {
            id: Date.now(),
            type: 'user',
            content: sanitizedMessage,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        const currentMessage = sanitizedMessage;
        setInputMessage('');
        setIsTyping(true);

        try {
            let response;
            
            if (courseId && courseContext) {
                // Use enhanced context for course-specific queries
                response = await chatService.sendMessageWithContext(currentMessage, courseId);
            } else if (courseId) {
                // Use basic course context
                response = await chatService.sendMessage(currentMessage, courseId);
            } else {
                // General chat without course context
                response = await chatService.sendMessage(currentMessage);
            }

            const botResponse = {
                id: Date.now() + 1,
                type: 'bot',
                content: response.response || "I'm sorry, I couldn't process your request right now. Please try again.",
                timestamp: new Date(),
                metadata: {
                    service_used: response.service_used,
                    response_time_ms: response.response_time_ms,
                    context_used: !!courseContext
                }
            };

            setMessages(prev => [...prev, botResponse]);
        } catch (error) {
            console.error('Error sending message:', error);
            
            const errorResponse = {
                id: Date.now() + 1,
                type: 'bot',
                content: "I'm sorry, I'm having trouble connecting right now. Please check your internet connection and try again.",
                timestamp: new Date(),
                isError: true
            };

            setMessages(prev => [...prev, errorResponse]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const formatMessage = (content) => {
        return content.split('\n').map((line, index) => (
            <React.Fragment key={index}>
                {line}
                {index < content.split('\n').length - 1 && <br />}
            </React.Fragment>
        ));
    };

    return (
        <>
            {/* Chat Button */}
            <div className="fixed bottom-6 right-6 z-50">
                <Button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-14 h-14 rounded-full shadow-lg bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center"
                >
                    {isOpen ? (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    ) : (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                    )}
                </Button>
            </div>

            {/* Chat Box */}
            {isOpen && (
                <div className="fixed bottom-24 right-6 z-40 w-96 h-[500px] bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col">
                    {/* Header */}
                    <div className="bg-blue-500 text-white px-4 py-3 rounded-t-lg flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <div className="relative">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                </svg>
                                {courseContext && (
                                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border border-white" title="Course context loaded"></div>
                                )}
                                {isLoadingContext && (
                                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full border border-white animate-pulse" title="Loading course context"></div>
                                )}
                            </div>
                            <div className="flex flex-col">
                                <span className="font-medium">AI Assistant</span>
                                {courseContext && (
                                    <span className="text-xs text-blue-100">Course context active</span>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-white hover:text-gray-200 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                        message.type === 'user'
                                            ? 'bg-blue-600 text-white'
                                            : message.isSecurityBlock
                                            ? 'bg-orange-50 text-orange-800 border border-orange-200'
                                            : message.isRateLimit
                                            ? 'bg-yellow-50 text-yellow-800 border border-yellow-200'
                                            : message.isError
                                            ? 'bg-red-50 text-red-800 border border-red-200'
                                            : 'bg-white text-gray-800 border border-gray-200'
                                    }`}
                                >
                                    <p className="text-sm whitespace-pre-wrap">
                                        {formatMessage(message.content)}
                                    </p>
                                    <div className={`flex items-center justify-between mt-1 text-xs ${
                                        message.type === 'user' 
                                            ? 'text-blue-100' 
                                            : message.isSecurityBlock 
                                            ? 'text-orange-600' 
                                            : message.isRateLimit 
                                            ? 'text-yellow-600' 
                                            : message.isError 
                                            ? 'text-red-500' 
                                            : 'text-gray-500'
                                    }`}>
                                        <span>
                                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        {message.metadata && (
                                            <div className="flex items-center space-x-1">
                                                {message.metadata.context_used && (
                                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs bg-green-100 text-green-800" title="Used course context">
                                                        <svg className="w-2.5 h-2.5 mr-0.5" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                        </svg>
                                                        Context
                                                    </span>
                                                )}
                                                {message.metadata.response_time_ms && (
                                                    <span className="text-xs opacity-75" title={`Response time: ${message.metadata.response_time_ms}ms`}>
                                                        {message.metadata.response_time_ms}ms
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Typing Indicator */}
                        {isTyping && (
                            <div className="flex justify-start">
                                <div className="bg-white text-gray-800 border border-gray-200 px-4 py-2 rounded-lg">
                                    <div className="flex space-x-1">
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-4 border-t border-gray-200 bg-white rounded-b-lg">
                        <div className="flex space-x-2">
                            <div className="flex-1 relative">
                                <textarea
                                    ref={inputRef}
                                    value={inputMessage}
                                    onChange={(e) => setInputMessage(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Ask your doubt"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    rows="2"
                                />
                                <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                                    {inputMessage.length}/3,000
                                </div>
                            </div>
                            <Button
                                onClick={handleSendMessage}
                                disabled={!inputMessage.trim() || isTyping}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg self-end"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ChatBot;
