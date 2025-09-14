import { useState } from 'react';
import Card, { CardBody } from '../components/common/Card.jsx';
import Button from '../components/common/Button.jsx';
import Input from '../components/common/Input.jsx';

/**
 * AI Assistant page component
 */
const AssistantPage = () => {
    const [messages, setMessages] = useState([
        {
            id: 1,
            type: 'assistant',
            content: 'Hello! I\'m your AI study assistant. How can I help you today?',
            timestamp: new Date(),
        },
    ]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSendMessage = async () => {
        if (!inputMessage.trim()) return;

        const userMessage = {
            id: messages.length + 1,
            type: 'user',
            content: inputMessage,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInputMessage('');
        setIsLoading(true);

        // Simulate AI response
        setTimeout(() => {
            const assistantMessage = {
                id: messages.length + 2,
                type: 'assistant',
                content: 'Thanks for your message! The AI assistant functionality will be connected to the backend soon.',
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, assistantMessage]);
            setIsLoading(false);
        }, 1000);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">AI Assistant</h1>
                <p className="text-gray-600">
                    Get help with explanations, study plans, and resource recommendations
                </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-4">
                {/* Chat Messages */}
                <div className="lg:col-span-3">
                    <Card className="h-96 flex flex-col">
                        <CardBody className="flex-1 overflow-y-auto p-4">
                            <div className="space-y-4">
                                {messages.map((message) => (
                                    <div
                                        key={message.id}
                                        className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'
                                            }`}
                                    >
                                        <div
                                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${message.type === 'user'
                                                    ? 'bg-primary-600 text-white'
                                                    : 'bg-gray-100 text-gray-900'
                                                }`}
                                        >
                                            <p className="text-sm">{message.content}</p>
                                            <p className="text-xs mt-1 opacity-75">
                                                {message.timestamp.toLocaleTimeString()}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                {isLoading && (
                                    <div className="flex justify-start">
                                        <div className="bg-gray-100 px-4 py-2 rounded-lg">
                                            <div className="flex space-x-1">
                                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardBody>

                        {/* Message Input */}
                        <div className="border-t border-gray-200 p-4">
                            <div className="flex space-x-2">
                                <Input
                                    value={inputMessage}
                                    onChange={(e) => setInputMessage(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Ask me anything..."
                                    fullWidth
                                    disabled={isLoading}
                                />
                                <Button
                                    onClick={handleSendMessage}
                                    disabled={!inputMessage.trim() || isLoading}
                                    loading={isLoading}
                                >
                                    Send
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Quick Actions */}
                <div>
                    <Card>
                        <CardBody>
                            <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
                            <div className="space-y-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    fullWidth
                                    onClick={() => setInputMessage('Explain quantum physics basics')}
                                >
                                    Get Explanation
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    fullWidth
                                    onClick={() => setInputMessage('Generate a study plan for calculus')}
                                >
                                    Create Study Plan
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    fullWidth
                                    onClick={() => setInputMessage('Find resources for machine learning')}
                                >
                                    Find Resources
                                </Button>
                            </div>
                        </CardBody>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default AssistantPage;
