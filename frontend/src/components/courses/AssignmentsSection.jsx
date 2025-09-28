import { useState, useEffect } from 'react';
import Card, { CardHeader, CardTitle, CardBody } from '../common/Card.jsx';
import Button from '../common/Button.jsx';
import Modal from '../common/Modal.jsx';
import Input from '../common/Input.jsx';
import TextArea from '../common/TextArea.jsx';
import ConfirmationModal from '../common/ConfirmationModal.jsx';
import AssignmentFormModal from '../assignments/AssignmentFormModal.jsx';
import { coursesService } from '../../services/courses.js';
import { getErrorMessage } from '../../services/api.js';
import { formatDate } from '../../utils/formatters.js';

/**
 * Integrated Assignments Section Component
 * Handles both assignment file uploads (which auto-create assignments) and manual assignment tracking
 */
const AssignmentsSection = ({ courseId, onUpdateAssignmentStatus }) => {
    const [assignmentFiles, setAssignmentFiles] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isManualAssignmentModalOpen, setIsManualAssignmentModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingAssignment, setEditingAssignment] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, item: null, type: null });

    // Form data for assignment upload
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        file: null
    });

    // Fetch assignment files and assignments
    const fetchData = async () => {
        try {
            setIsLoading(true);
            setError(null);

            // Fetch both assignment files and regular assignments in parallel
            const [filesResponse, assignmentsResponse] = await Promise.all([
                coursesService.getAssignmentFiles(courseId),
                coursesService.getAssignments(courseId)
            ]);

            setAssignmentFiles(filesResponse.results || filesResponse || []);
            setAssignments(assignmentsResponse.results || assignmentsResponse || []);
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (courseId) {
            fetchData();
        }
    }, [courseId]);

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

    // Handle assignment file upload
    const handleUploadAssignment = async (e) => {
        e.preventDefault();
        
        if (!formData.file || !formData.title.trim()) {
            setError('Please provide both a title and a file');
            return;
        }

        try {
            setIsSubmitting(true);
            setError(null);
            
            await coursesService.uploadAssignmentFile(courseId, formData);
            
            // Reset form and close modal
            setFormData({ title: '', description: '', file: null });
            setIsUploadModalOpen(false);
            
            // Refresh data
            await fetchData();
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle manual assignment creation/editing
    const handleSubmitManualAssignment = async (assignmentData) => {
        try {
            setIsSubmitting(true);
            setError(null);
            
            if (editingAssignment) {
                await coursesService.updateAssignment(courseId, editingAssignment.id, assignmentData);
            } else {
                await coursesService.createAssignment(courseId, assignmentData);
            }
            
            setIsManualAssignmentModalOpen(false);
            setEditingAssignment(null);
            await fetchData();
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle assignment status update
    const handleUpdateAssignmentStatus = async (assignmentId, newStatus) => {
        try {
            if (newStatus === 'completed') {
                await coursesService.markAssignmentCompleted(courseId, assignmentId);
            } else if (newStatus === 'in_progress') {
                await coursesService.markAssignmentInProgress(courseId, assignmentId);
            }
            
            await fetchData();
            if (onUpdateAssignmentStatus) {
                onUpdateAssignmentStatus();
            }
        } catch (err) {
            setError(getErrorMessage(err));
        }
    };

    // Handle file deletion
    const handleDeleteFile = async () => {
        if (!deleteConfirm.item || deleteConfirm.type !== 'file') return;

        try {
            setIsSubmitting(true);
            await coursesService.deleteAssignmentFile(courseId, deleteConfirm.item.id);
            
            setDeleteConfirm({ isOpen: false, item: null, type: null });
            await fetchData();
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle assignment deletion
    const handleDeleteAssignment = async () => {
        if (!deleteConfirm.item || deleteConfirm.type !== 'assignment') return;

        try {
            setIsSubmitting(true);
            await coursesService.deleteAssignment(courseId, deleteConfirm.item.id);
            
            setDeleteConfirm({ isOpen: false, item: null, type: null });
            await fetchData();
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

    // Get status color
    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'text-green-600 bg-green-100';
            case 'in_progress': return 'text-blue-600 bg-blue-100';
            case 'submitted': return 'text-purple-600 bg-purple-100';
            case 'overdue': return 'text-red-600 bg-red-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    // Combine and sort all assignments
    const allAssignments = [
        // Assignment files that created assignments
        ...assignmentFiles
            .filter(file => file.assignment)
            .map(file => ({
                ...file.assignment,
                sourceFile: file,
                isFromFile: true
            })),
        // Manual assignments without source files
        ...assignments.filter(assignment => 
            !assignmentFiles.some(file => file.assignment?.id === assignment.id)
        ).map(assignment => ({
            ...assignment,
            isFromFile: false
        }))
    ].sort((a, b) => new Date(a.due_date) - new Date(b.due_date));

    // Assignment files without extracted assignments
    const unprocessedFiles = assignmentFiles.filter(file => !file.assignment);

    // Auto-refresh for processing files
    useEffect(() => {
        const hasProcessingFiles = unprocessedFiles.some(file => !file.is_processed && !file.processing_error);
        
        if (hasProcessingFiles) {
            const interval = setInterval(() => {
                fetchData();
            }, 5000); // Check every 5 seconds
            
            return () => clearInterval(interval);
        }
    }, [unprocessedFiles]);

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Assignments</CardTitle>
                </CardHeader>
                <CardBody>
                    <div className="text-center py-4">Loading assignments...</div>
                </CardBody>
            </Card>
        );
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>Assignments</CardTitle>
                        <div className="flex space-x-2">
                            <Button size="sm" onClick={() => setIsUploadModalOpen(true)}>
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                                Upload File
                            </Button>
                            <Button size="sm" onClick={() => setIsManualAssignmentModalOpen(true)} variant="secondary">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                Add Manual
                            </Button>
                            {unprocessedFiles.some(file => !file.is_processed && !file.processing_error) && (
                                <Button size="sm" variant="ghost" onClick={fetchData} title="Refresh processing status">
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

                    <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 pr-2">
                        {/* Processed Assignments */}
                        {allAssignments.length > 0 && (
                            <div className="space-y-4 mb-8">
                                <h4 className="font-medium text-gray-900 mb-4">Active Assignments</h4>
                                {allAssignments.map((assignment) => (
                                <div key={`assignment-${assignment.id}`} className="border rounded-lg p-4 hover:bg-gray-50 mb-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-2 mb-3">
                                                <h4 className="font-medium text-gray-900">{assignment.title}</h4>
                                                {assignment.isFromFile && (
                                                    <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                                                        From File
                                                    </span>
                                                )}
                                                <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(assignment.status)}`}>
                                                    {assignment.status.replace('_', ' ').toUpperCase()}
                                                </span>
                                            </div>
                                            
                                            {assignment.description && (
                                                <p className="text-sm text-gray-600 mb-3">{assignment.description}</p>
                                            )}
                                            
                                            <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mb-2">
                                                <span className="flex items-center">
                                                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                                    </svg>
                                                    Due: {formatDate(assignment.due_date)}
                                                </span>
                                                <span className="text-gray-600 font-medium">{assignment.assignment_type}</span>
                                                {assignment.estimated_hours && (
                                                    <span className="flex items-center">
                                                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                                        </svg>
                                                        {assignment.estimated_hours}h estimated
                                                    </span>
                                                )}
                                                {assignment.weight && (
                                                    <span className="flex items-center">
                                                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                        </svg>
                                                        {assignment.weight}% weight
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center space-x-2 ml-4">
                                            {assignment.sourceFile?.file_url && (
                                                <Button
                                                    variant="ghost" 
                                                    size="sm"
                                                    onClick={() => window.open(assignment.sourceFile.file_url, '_blank')}
                                                    title="View file"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                </Button>
                                            )}
                                            
                                            {assignment.status === 'not_started' && (
                                                <Button
                                                    variant="ghost" 
                                                    size="sm"
                                                    onClick={() => handleUpdateAssignmentStatus(assignment.id, 'in_progress')}
                                                    title="Start working"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                                        <polygon points="5,3 19,12 5,21" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                </Button>
                                            )}
                                            
                                            {assignment.status === 'in_progress' && (
                                                <Button
                                                    variant="ghost" 
                                                    size="sm"
                                                    onClick={() => handleUpdateAssignmentStatus(assignment.id, 'completed')}
                                                    title="Mark complete"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </Button>
                                            )}
                                            
                                            <Button
                                                variant="ghost" 
                                                size="sm"
                                                onClick={() => {
                                                    setEditingAssignment(assignment);
                                                    setIsManualAssignmentModalOpen(true);
                                                }}
                                                title="Edit"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </Button>
                                            
                                            <Button
                                                variant="ghost" 
                                                size="sm"
                                                onClick={() => setDeleteConfirm({ isOpen: true, item: assignment, type: 'assignment' })}
                                                title="Delete"
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
                        )}

                        {/* Unprocessed Files */}
                        {unprocessedFiles.length > 0 && (
                            <div className="border-t pt-6">
                                <h4 className="font-medium text-gray-900 mb-4">Processing Files</h4>
                                {unprocessedFiles.map((file) => (
                                <div key={`file-${file.id}`} className="border rounded-lg p-4 hover:bg-gray-50 mb-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h4 className="font-medium text-gray-900 mb-2">{file.title}</h4>
                                            {file.description && (
                                                <p className="text-sm text-gray-600 mb-3">{file.description}</p>
                                            )}
                                            <div className="flex items-center space-x-3 text-xs text-gray-500 mb-2">
                                                <span className="flex items-center bg-gray-100 px-2 py-1 rounded">
                                                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                        <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" />
                                                    </svg>
                                                    {file.file_type?.toUpperCase() || 'File'}
                                                </span>
                                                <span className="bg-gray-100 px-2 py-1 rounded">{formatFileSize(file.file_size)}</span>
                                                <span 
                                                    className={`px-2 py-1 rounded text-xs font-medium cursor-help ${
                                                        file.is_processed 
                                                            ? 'bg-green-100 text-green-700' 
                                                            : file.processing_error
                                                            ? 'bg-red-100 text-red-700'
                                                            : 'bg-yellow-100 text-yellow-700'
                                                    }`}
                                                    title={file.processing_error || (file.is_processed ? 'Successfully processed through RAG pipeline and assignment created' : 'Processing through RAG pipeline to extract assignment details')}
                                                >
                                                    {file.is_processed 
                                                        ? '✓ Processed' 
                                                        : file.processing_error 
                                                        ? '✗ Failed' 
                                                        : '⏳ Processing...'
                                                    }
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2 ml-4">
                                            {file.file_url && (
                                                <Button
                                                    variant="ghost" 
                                                    size="sm"
                                                    onClick={() => window.open(file.file_url, '_blank')}
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                </Button>
                                            )}
                                            <Button
                                                variant="ghost" 
                                                size="sm"
                                                onClick={() => setDeleteConfirm({ isOpen: true, item: file, type: 'file' })}
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
                        )}

                        {/* Empty State */}
                        {allAssignments.length === 0 && unprocessedFiles.length === 0 && (
                            <div className="flex-1 flex flex-col items-center justify-center text-center">
                                <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                </svg>
                                <p className="text-gray-600 text-sm mb-4">
                                    No assignments yet. Upload assignment files to automatically extract details, or create assignments manually.
                                </p>
                                <div className="flex justify-center space-x-2">
                                    <Button size="sm" onClick={() => setIsUploadModalOpen(true)}>
                                        Upload Assignment File
                                    </Button>
                                    <Button size="sm" variant="secondary" onClick={() => setIsManualAssignmentModalOpen(true)}>
                                        Add Manual Assignment
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </CardBody>
            </Card>

            {/* Upload Assignment Modal */}
            <Modal
                isOpen={isUploadModalOpen}
                onClose={() => {
                    setIsUploadModalOpen(false);
                    setFormData({ title: '', description: '', file: null });
                    setError(null);
                }}
                title="Upload Assignment File"
                size="lg"
            >
                <form onSubmit={handleUploadAssignment} className="space-y-4">
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Assignment File *
                        </label>
                        <input
                            type="file"
                            accept=".pdf,.doc,.docx,.txt"
                            onChange={handleFileChange}
                            required
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Supported formats: PDF, DOC, DOCX, TXT
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                            🤖 AI will automatically extract assignment details and create an assignment entry
                        </p>
                    </div>

                    <Input
                        label="Assignment Title"
                        value={formData.title}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                        placeholder="e.g., Final Project Requirements"
                        required
                    />

                    <TextArea
                        label="Description (Optional)"
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        placeholder="Brief description of the assignment..."
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
                            {isSubmitting ? 'Uploading...' : 'Upload & Extract'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Manual Assignment Modal */}
            <AssignmentFormModal
                isOpen={isManualAssignmentModalOpen}
                onClose={() => {
                    setIsManualAssignmentModalOpen(false);
                    setEditingAssignment(null);
                }}
                onSubmit={handleSubmitManualAssignment}
                assignment={editingAssignment}
                isSubmitting={isSubmitting}
            />

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                isOpen={deleteConfirm.isOpen}
                onClose={() => setDeleteConfirm({ isOpen: false, item: null, type: null })}
                onConfirm={deleteConfirm.type === 'file' ? handleDeleteFile : handleDeleteAssignment}
                title={`Delete ${deleteConfirm.type === 'file' ? 'Assignment File' : 'Assignment'}`}
                message={`Are you sure you want to delete "${deleteConfirm.item?.title}"? This action cannot be undone.`}
                confirmText="Delete"
                isConfirming={isSubmitting}
            />
        </>
    );
};

export default AssignmentsSection;
