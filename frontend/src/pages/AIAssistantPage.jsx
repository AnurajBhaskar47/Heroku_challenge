import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Select from '../components/common/Select';
import TextArea from '../components/common/TextArea';
import { resourcesService } from '../services/resources';
import { coursesService } from '../services/courses';
import { chatService } from '../services/chat';

const AIAssistantPage = () => {
    const [searchParams] = useSearchParams();
    const [messages, setMessages] = useState([
        {
            id: 'welcome',
            type: 'assistant',
            content: 'Hello! I\'m your AI study assistant. I can help you with questions about your courses, including:\n\n• 📚 Course resources and materials\n• 📝 Quiz files and exam preparation\n• 📋 Assignment tracking and deadlines\n• 🎯 Course topics and progress\n• 📅 Upcoming exams and schedules\n• 💡 Study strategies and explanations\n\nSelect a course for personalized context, or ask general study questions. What would you like help with today?',
            timestamp: new Date().toISOString()
        }
    ]);
    const [inputMessage, setInputMessage] = useState('');
    const [selectedCourse, setSelectedCourse] = useState('');
    const [selectedExam, setSelectedExam] = useState('');
    const [selectedTopic, setSelectedTopic] = useState('');
    const [contextType, setContextType] = useState('general');
    const [courses, setCourses] = useState([]);
    const [exams, setExams] = useState([]);
    const [topics, setTopics] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const messagesEndRef = useRef(null);

    // Auto-scroll to bottom when new messages arrive
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Load courses on mount
    useEffect(() => {
        loadCourses();
        
        // Check for initial course selection from URL params
        const courseId = searchParams.get('course');
        if (courseId) {
            setSelectedCourse(courseId);
        }
    }, [searchParams]);

    const loadCourses = async () => {
        try {
            const data = await coursesService.getCourses();
            setCourses(data.results || data);
        } catch (err) {
            console.error('Failed to load courses:', err);
        }
    };

    const loadExams = async (courseId) => {
        try {
            const data = await coursesService.getExams(courseId);
            setExams(data.results || data);
        } catch (err) {
            console.error('Failed to load exams:', err);
            setExams([]);
        }
    };

    const loadTopics = async (courseId) => {
        try {
            const data = await coursesService.getCourseTopicItems(courseId);
            setTopics(data.results || data);
        } catch (err) {
            console.error('Failed to load topics:', err);
            setTopics([]);
        }
    };

    const handleCourseChange = async (courseId) => {
        setSelectedCourse(courseId);
        setSelectedExam(''); // Reset exam selection
        setSelectedTopic(''); // Reset topic selection
        
        if (courseId) {
            // Load exams and topics for the selected course
            await Promise.all([
                loadExams(courseId),
                loadTopics(courseId)
            ]);
        } else {
            // Clear exams and topics if no course selected
            setExams([]);
            setTopics([]);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        
        if (!inputMessage.trim() || loading) return;

        const userMessage = {
            id: Date.now().toString(),
            type: 'user',
            content: inputMessage.trim(),
            timestamp: new Date().toISOString()
        };

        // Add user message immediately
        setMessages(prev => [...prev, userMessage]);
        const currentMessage = inputMessage.trim();
        setInputMessage('');
        setLoading(true);
        setError(null);

        try {
            // Prepare additional context based on selections
            const additionalContext = {
                context_type: contextType,
                source: 'ai_assistant_page'
            };

            // Add specific exam context if selected
            if (selectedExam) {
                const selectedExamData = exams.find(exam => exam.id === parseInt(selectedExam));
                if (selectedExamData) {
                    additionalContext.selected_exam = {
                        id: selectedExamData.id,
                        name: selectedExamData.name,
                        type: selectedExamData.exam_type,
                        date: selectedExamData.exam_date,
                        syllabus_coverage: selectedExamData.syllabus_coverage
                    };
                }
            }

            // Add specific topic context if selected
            if (selectedTopic) {
                const selectedTopicData = topics.find(topic => topic.id === parseInt(selectedTopic));
                if (selectedTopicData) {
                    additionalContext.selected_topic = {
                        id: selectedTopicData.id,
                        title: selectedTopicData.title,
                        description: selectedTopicData.description,
                        difficulty: selectedTopicData.difficulty,
                        is_completed: selectedTopicData.is_completed
                    };
                }
            }

            // Use the same chat service as CourseDetailPage ChatBot for full context
            const response = await chatService.sendMessage(
                currentMessage,
                selectedCourse ? parseInt(selectedCourse) : null,
                additionalContext
            );

            // Create assistant message
            const assistantMessage = {
                id: (Date.now() + 1).toString(),
                type: 'assistant',
                content: response.response,
                sources: response.sources || [],
                confidence: response.confidence || 0.8,
                timestamp: new Date().toISOString(),
                course_id: response.course_id,
                rag_context_used: response.rag_enhanced || response.course_context_used
            };

            setMessages(prev => [...prev, assistantMessage]);

        } catch (err) {
            console.error('AI Assistant error:', err);
            setError(err.message || 'Failed to get response from AI assistant');
            
            // Add error message
            const errorMessage = {
                id: (Date.now() + 1).toString(),
                type: 'error',
                content: 'I apologize, but I encountered an error while processing your question. Please try again or rephrase your question.',
                timestamp: new Date().toISOString()
            };

            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setLoading(false);
        }
    };

    const handleClearChat = () => {
        setMessages([
            {
                id: 'welcome',
                type: 'assistant',
                content: 'Hello! I\'m your AI study assistant. I can help you with questions about your courses, including:\n\n• 📚 Course resources and materials\n• 📝 Quiz files and exam preparation\n• 📋 Assignment tracking and deadlines\n• 🎯 Course topics and progress\n• 📅 Upcoming exams and schedules\n• 💡 Study strategies and explanations\n\nSelect a course for personalized context, or ask general study questions. What would you like help with today?',
                timestamp: new Date().toISOString()
            }
        ]);
        setError(null);
    };

    const contextTypeOptions = [
        { value: 'general', label: 'General Question' },
        { value: 'concept', label: 'Concept Explanation' },
        { value: 'homework', label: 'Homework Help' },
        { value: 'exam_prep', label: 'Exam Preparation' },
        { value: 'study_strategy', label: 'Study Strategy' }
    ];

    const formatTimestamp = (timestamp) => {
        return new Date(timestamp).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit'
        });
    };

    const renderMessage = (message) => {
        const isUser = message.type === 'user';
        const isError = message.type === 'error';

        return (
            <div key={message.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
                <div className={`flex max-w-3xl ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                    {/* Avatar */}
                    <div className={`flex-shrink-0 ${isUser ? 'ml-3' : 'mr-3'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            isUser 
                                ? 'bg-blue-600 text-white' 
                                : isError 
                                    ? 'bg-red-600 text-white'
                                    : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                        }`}>
                            {isUser ? (
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                </svg>
                            ) : isError ? (
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            ) : (
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            )}
                        </div>
                    </div>

                    {/* Message Content */}
                    <div className={`rounded-lg px-4 py-2 ${
                        isUser 
                            ? 'bg-blue-600 text-white' 
                            : isError 
                                ? 'bg-red-50 border border-red-200 text-red-800'
                                : 'bg-gray-100 text-gray-900'
                    }`}>
                        <div className="text-sm leading-relaxed whitespace-pre-wrap">
                            {message.content}
                        </div>
                        
                        {/* Sources for AI responses */}
                        {message.sources && message.sources.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                                <p className="text-xs text-gray-600 mb-2 font-medium">Sources:</p>
                                <div className="space-y-1">
                                    {message.sources.map((source, index) => (
                                        <div key={index} className="text-xs bg-white rounded p-2 border">
                                            <div className="font-medium text-gray-900">{source.resource_title}</div>
                                            <div className="text-gray-600 mt-1">{source.chunk_text.substring(0, 100)}...</div>
                                            <div className="text-gray-500 mt-1">
                                                Relevance: {(source.relevance_score * 100).toFixed(1)}%
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Metadata for AI responses */}
                        {message.rag_context_used && (
                            <div className="mt-2 flex items-center text-xs text-gray-500">
                                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Enhanced with your uploaded resources
                                {message.confidence && (
                                    <span className="ml-2">
                                        • Confidence: {(message.confidence * 100).toFixed(1)}%
                                    </span>
                                )}
                            </div>
                        )}
                        
                        <div className={`text-xs mt-1 ${isUser ? 'text-blue-100' : 'text-gray-500'}`}>
                            {formatTimestamp(message.timestamp)}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                                <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center mr-3">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                </div>
                                AI Study Assistant
                            </h1>
                            <p className="text-gray-600 mt-2">
                                Get personalized help with your studies using AI-powered insights from your courses, resources, assignments, and exam schedules
                            </p>
                        </div>
                        
                        <Button
                            onClick={handleClearChat}
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Clear Chat
                        </Button>
                    </div>
                </div>

                {/* Controls */}
                <Card className="mb-6 p-4">
                    <div className="space-y-4">
                        {/* Course and Question Type Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Select
                                label="Course Context (Optional)"
                                value={selectedCourse}
                                onChange={(e) => handleCourseChange(e.target.value)}
                                options={[
                                    { value: '', label: 'No specific course' },
                                    ...courses.map(course => ({ value: course.id, label: course.name }))
                                ]}
                            />
                            
                            <Select
                                label="Question Type"
                                value={contextType}
                                onChange={(e) => setContextType(e.target.value)}
                                options={contextTypeOptions}
                            />
                        </div>

                        {/* Exam and Topic Selection Row - Show when course is selected OR show disabled preview */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-gray-200">
                            {!selectedCourse && (
                                <div className="col-span-full">
                                    <p className="text-sm text-gray-600 mb-2">
                                        Select a course above to unlock exam and topic-specific questions
                                    </p>
                                </div>
                            )}
                            <Select
                                label="Specific Exam (Optional)"
                                value={selectedExam}
                                onChange={(e) => setSelectedExam(e.target.value)}
                                disabled={!selectedCourse}
                                options={selectedCourse ? [
                                    { value: '', label: 'No specific exam' },
                                    ...exams.map(exam => ({ 
                                        value: exam.id, 
                                        label: `${exam.name} (${exam.exam_type}) - ${new Date(exam.exam_date).toLocaleDateString()}`
                                    }))
                                ] : [
                                    { value: '', label: 'Select a course first to see exams' }
                                ]}
                            />
                            
                            <Select
                                label="Specific Topic (Optional)"
                                value={selectedTopic}
                                onChange={(e) => setSelectedTopic(e.target.value)}
                                disabled={!selectedCourse}
                                options={selectedCourse ? [
                                    { value: '', label: 'No specific topic' },
                                    ...topics.map(topic => ({ 
                                        value: topic.id, 
                                        label: `${topic.title} (${topic.difficulty})${topic.is_completed ? ' ✓' : ''}`
                                    }))
                                ] : [
                                    { value: '', label: 'Select a course first to see topics' }
                                ]}
                            />
                        </div>

                        {/* Context Info */}
                        {(selectedCourse || selectedExam || selectedTopic) && (
                            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                                <div className="flex items-start">
                                    <svg className="w-5 h-5 text-blue-400 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                    <div className="text-sm text-blue-800">
                                        <p className="font-medium mb-1">Context Selected:</p>
                                        <ul className="space-y-1">
                                            {selectedCourse && (
                                                <li>• Course: {courses.find(c => c.id === parseInt(selectedCourse))?.name}</li>
                                            )}
                                            {selectedExam && (
                                                <li>• Exam: {exams.find(e => e.id === parseInt(selectedExam))?.name}</li>
                                            )}
                                            {selectedTopic && (
                                                <li>• Topic: {topics.find(t => t.id === parseInt(selectedTopic))?.title}</li>
                                            )}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </Card>

                {/* Error Display */}
                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
                        <div className="flex">
                            <svg className="w-5 h-5 text-red-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            <div>
                                <p className="text-sm text-red-800">{error}</p>
                                <button onClick={() => setError(null)} className="text-red-600 hover:text-red-700 text-sm underline mt-1">
                                    Dismiss
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Chat Messages */}
                <Card className="mb-6">
                    <div className="h-96 overflow-y-auto p-4 space-y-4">
                        {messages.map(renderMessage)}
                        
                        {/* Loading indicator */}
                        {loading && (
                            <div className="flex justify-start mb-4">
                                <div className="flex">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white flex items-center justify-center mr-3">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div className="bg-gray-100 rounded-lg px-4 py-2">
                                        <div className="flex items-center space-x-1">
                                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        <div ref={messagesEndRef} />
                    </div>
                </Card>

                {/* Input Form */}
                <form onSubmit={handleSendMessage}>
                    <Card className="p-4">
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <TextArea
                                    value={inputMessage}
                                    onChange={(e) => setInputMessage(e.target.value)}
                                    placeholder="Ask me about your courses, assignments, exams, resources, or any study-related questions..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                    rows={3}
                                    disabled={loading}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendMessage(e);
                                        }
                                    }}
                                />
                            </div>
                            <div className="flex flex-col justify-end">
                                <Button
                                    type="submit"
                                    disabled={!inputMessage.trim() || loading}
                                    className="flex items-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Thinking...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                            </svg>
                                            Send
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            Press Enter to send, Shift+Enter for new line
                        </p>
                    </Card>
                </form>
            </div>
        </div>
    );
};

export default AIAssistantPage;


