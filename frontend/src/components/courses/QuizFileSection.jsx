import { useState, useEffect } from 'react';
import Card, { CardHeader, CardTitle, CardBody } from '../common/Card.jsx';
import Button from '../common/Button.jsx';
import Modal from '../common/Modal.jsx';
import Input from '../common/Input.jsx';
import TextArea from '../common/TextArea.jsx';
import ConfirmationModal from '../common/ConfirmationModal.jsx';
import { coursesService } from '../../services/courses.js';
import { getErrorMessage } from '../../services/api.js';

/**
 * Quiz Files Section Component
 * Handles quiz file uploads and management for a course
 */
const QuizFileSection = ({ courseId }) => {
    const [quizFiles, setQuizFiles] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, quiz: null });

    // Form data for quiz upload
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        file: null
    });

    // Fetch quiz files
    const fetchQuizFiles = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await coursesService.getQuizFiles(courseId);
            setQuizFiles(response.results || response || []);
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (courseId) {
            fetchQuizFiles();
        }
    }, [courseId]);

    // Auto-refresh for processing files
    useEffect(() => {
        const hasProcessingFiles = quizFiles.some(quiz => !quiz.is_processed && !quiz.processing_error);
        
        if (hasProcessingFiles) {
            const interval = setInterval(() => {
                fetchQuizFiles();
            }, 5000); // Check every 5 seconds
            
            return () => clearInterval(interval);
        }
    }, [quizFiles]);

    // Handle form input changes
    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Handle file selection
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setFormData(prev => ({
            ...prev,
            file: file,
            title: prev.title || (file ? file.name.replace(/\.[^/.]+$/, '') : '')
        }));
    };

    // Handle quiz upload
    const handleUploadQuiz = async (e) => {
        e.preventDefault();
        
        if (!formData.file || !formData.title.trim()) {
            setError('Please provide both a title and a file');
            return;
        }

        try {
            setIsSubmitting(true);
            setError(null);
            
            await coursesService.uploadQuizFile(courseId, formData);
            
            // Reset form and close modal
            setFormData({ title: '', description: '', file: null });
            setIsUploadModalOpen(false);
            
            // Refresh quiz files list
            await fetchQuizFiles();
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle quiz deletion
    const handleDeleteQuiz = async () => {
        if (!deleteConfirm.quiz) return;

        try {
            setIsSubmitting(true);
            await coursesService.deleteQuizFile(courseId, deleteConfirm.quiz.id);
            
            setDeleteConfirm({ isOpen: false, quiz: null });
            await fetchQuizFiles();
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setIsSubmitting(false);
        }
    };

    // Format file size
    const formatFileSize = (bytes) => {
        if (!bytes) return 'Unknown';
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let unitIndex = 0;
        
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        
        return `${size.toFixed(1)} ${units[unitIndex]}`;
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Quiz Files</CardTitle>
                </CardHeader>
                <CardBody>
                    <div className="text-center py-4">Loading quiz files...</div>
                </CardBody>
            </Card>
        );
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>Quiz Files</CardTitle>
                        <div className="flex space-x-2">
                            <Button size="sm" onClick={() => setIsUploadModalOpen(true)}>
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                                Upload Quiz
                            </Button>
                            {quizFiles.some(quiz => !quiz.is_processed && !quiz.processing_error) && (
                                <Button size="sm" variant="ghost" onClick={fetchQuizFiles} title="Refresh processing status">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                </Button>
                            )}
                        </div>
                    </div>
                </CardHeader>
                <CardBody className="h-[325px] flex flex-col">
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    )}

                    {quizFiles.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center">
                            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p className="text-gray-600 text-sm mb-4">
                                No quiz files uploaded yet. Upload quiz files to help with AI study planning.
                            </p>
                            <Button size="sm" onClick={() => setIsUploadModalOpen(true)} fullWidth>
                                Upload Quiz File
                            </Button>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 pr-2">
                            <div className="space-y-3">
                                {quizFiles.map((quiz) => (
                                <div key={quiz.id} className="border rounded-lg p-3 hover:bg-gray-50">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h4 className="font-medium text-gray-900 mb-1">{quiz.title}</h4>
                                            {quiz.description && (
                                                <p className="text-sm text-gray-600 mb-2">{quiz.description}</p>
                                            )}
                                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                                                <span className="flex items-center">
                                                    <svg className="w-3 h-3 mr-1 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                                    </svg>
                                                    {quiz.file_type?.toUpperCase() || 'File'}
                                                </span>
                                                <span>{formatFileSize(quiz.file_size)}</span>
                                                <span 
                                                    className={`px-2 py-1 rounded-full text-xs font-medium cursor-help ${
                                                        quiz.is_processed 
                                                            ? 'bg-green-100 text-green-700' 
                                                            : quiz.processing_error
                                                            ? 'bg-red-100 text-red-700'
                                                            : 'bg-yellow-100 text-yellow-700'
                                                    }`}
                                                    title={quiz.processing_error || (quiz.is_processed ? 'Successfully processed through RAG pipeline' : 'Processing through RAG pipeline for AI features')}
                                                >
                                                    {quiz.is_processed 
                                                        ? '✓ Processed' 
                                                        : quiz.processing_error 
                                                        ? '✗ Failed' 
                                                        : '⏳ Processing...'
                                                    }
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2 ml-4">
                                            <Button
                                                variant="ghost" 
                                                size="sm"
                                                onClick={() => setDeleteConfirm({ isOpen: true, quiz })}
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                                ))}
                            </div>
                        </div>
                    )}
                </CardBody>
            </Card>

            {/* Upload Quiz Modal */}
            <Modal
                isOpen={isUploadModalOpen}
                onClose={() => {
                    setIsUploadModalOpen(false);
                    setFormData({ title: '', description: '', file: null });
                    setError(null);
                }}
                title="Upload Quiz File"
                size="lg"
            >
                <form onSubmit={handleUploadQuiz} className="space-y-4">
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Quiz File *
                        </label>
                        <input
                            type="file"
                            accept=".pdf"
                            onChange={handleFileChange}
                            required
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Supported format: PDF only
                        </p>
                    </div>

                    <Input
                        label="Quiz Title"
                        value={formData.title}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                        placeholder="e.g., Midterm Quiz - Data Structures"
                        required
                    />

                    <TextArea
                        label="Description (Optional)"
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        placeholder="Brief description of the quiz content..."
                        rows={3}
                    />

                    <div className="flex justify-end space-x-3 pt-4">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setIsUploadModalOpen(false)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting || !formData.file || !formData.title.trim()}
                        >
                            {isSubmitting ? 'Uploading...' : 'Upload Quiz'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                isOpen={deleteConfirm.isOpen}
                onClose={() => setDeleteConfirm({ isOpen: false, quiz: null })}
                onConfirm={handleDeleteQuiz}
                title="Delete Quiz File"
                message={`Are you sure you want to delete "${deleteConfirm.quiz?.title}"? This action cannot be undone.`}
                confirmText="Delete"
                isConfirming={isSubmitting}
            />
        </>
    );
};

export default QuizFileSection;
