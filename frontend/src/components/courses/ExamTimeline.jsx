import React, { useState, useEffect } from 'react';
import Button from '../common/Button';
import Modal from '../common/Modal';
import Input from '../common/Input';
import TextArea from '../common/TextArea';
import ConfirmationModal from '../common/ConfirmationModal';
import DropdownMenu from '../common/DropdownMenu';
import { coursesService } from '../../services/courses';
import { getErrorMessage } from '../../services/api';

/**
 * Exam Timeline component for displaying and managing course exams
 */
const ExamTimeline = ({ courseId }) => {
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [editingExam, setEditingExam] = useState(null);
    const [viewingExam, setViewingExam] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, exam: null });

    // Form data for exam
    const [formData, setFormData] = useState({
        name: '',
        exam_type: 'test',
        description: '',
        exam_date: '',
        duration_minutes: 120,
        location: '',
        syllabus_coverage: [],
        total_weightage: 100
    });

    // Syllabus coverage form
    const [syllabusItem, setSyllabusItem] = useState({ topic: '', weightage: '' });

    useEffect(() => {
        if (courseId) {
            loadExams();
        }
    }, [courseId]);


    const loadExams = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await coursesService.getExams(courseId);
            setExams(data.results || data || []);
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleAddSyllabusItem = () => {
        if (!syllabusItem.topic.trim() || !syllabusItem.weightage) {
            return;
        }

        const weightage = parseFloat(syllabusItem.weightage);
        if (isNaN(weightage) || weightage <= 0 || weightage > 100) {
            return;
        }

        const newItem = {
            topic: syllabusItem.topic.trim(),
            weightage: weightage
        };

        setFormData(prev => ({
            ...prev,
            syllabus_coverage: [...prev.syllabus_coverage, newItem]
        }));

        setSyllabusItem({ topic: '', weightage: '' });
    };

    const handleRemoveSyllabusItem = (index) => {
        setFormData(prev => ({
            ...prev,
            syllabus_coverage: prev.syllabus_coverage.filter((_, i) => i !== index)
        }));
    };

    const resetForm = () => {
        setFormData({
            name: '',
            exam_type: 'test',
            description: '',
            exam_date: '',
            duration_minutes: 120,
            location: '',
            syllabus_coverage: [],
            total_weightage: 100
        });
        setSyllabusItem({ topic: '', weightage: '' });
        setEditingExam(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.name.trim() || !formData.exam_date) {
            setError('Please provide exam name and date');
            return;
        }

        try {
            setIsSubmitting(true);
            setError(null);

            if (editingExam) {
                await coursesService.updateExam(courseId, editingExam.id, formData);
            } else {
                await coursesService.createExam(courseId, formData);
            }

            resetForm();
            setIsAddModalOpen(false);
            setIsEditModalOpen(false);
            await loadExams();
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleView = (exam) => {
        setViewingExam(exam);
        setIsViewModalOpen(true);
    };

    const handleEdit = (exam) => {
        setEditingExam(exam);
        setFormData({
            name: exam.name,
            exam_type: exam.exam_type,
            description: exam.description || '',
            exam_date: exam.exam_date ? new Date(exam.exam_date).toISOString().slice(0, 16) : '',
            duration_minutes: exam.duration_minutes || 120,
            location: exam.location || '',
            syllabus_coverage: exam.syllabus_coverage || [],
            total_weightage: exam.total_weightage || 100
        });
        setIsEditModalOpen(true);
    };

    const handleDeleteClick = (exam) => {
        setDeleteConfirm({ isOpen: true, exam });
    };

    const handleDelete = async () => {
        if (!deleteConfirm.exam) return;

        try {
            setIsSubmitting(true);
            await coursesService.deleteExam(courseId, deleteConfirm.exam.id);
            
            setDeleteConfirm({ isOpen: false, exam: null });
            await loadExams();
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const getExamTypeColor = (type) => {
        switch (type) {
            case 'final': return 'bg-red-100 text-red-800';
            case 'midterm': return 'bg-orange-100 text-orange-800';
            case 'quiz': return 'bg-blue-100 text-blue-800';
            case 'practical': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getTotalWeightage = () => {
        return formData.syllabus_coverage.reduce((total, item) => total + item.weightage, 0);
    };

    if (loading) {
        return <div className="text-center py-4 text-sm text-gray-500">Loading exams...</div>;
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-900">Exams</h4>
                <Button
                    size="sm"
                    onClick={() => setIsAddModalOpen(true)}
                    className="text-xs px-2 py-1"
                >
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Exam
                </Button>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded p-2 text-xs text-red-700">
                    {error}
                </div>
            )}

            {exams.length === 0 ? (
                <div className="text-center py-6 text-xs text-gray-500">
                    <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p>No exams scheduled yet</p>
                    <p className="text-gray-400">Add your first exam to start tracking</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {exams.map((exam, index) => {
                        // Create dropdown menu items for each exam
                        const menuItems = [
                            {
                                label: 'View',
                                icon: (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                ),
                                onClick: (e) => {
                                    e.stopPropagation();
                                    handleView(exam);
                                }
                            },
                            {
                                label: 'Edit',
                                icon: (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                ),
                                onClick: (e) => {
                                    e.stopPropagation();
                                    handleEdit(exam);
                                }
                            },
                            {
                                label: 'Delete',
                                icon: (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                ),
                                className: 'text-red-700 hover:bg-red-50 hover:text-red-900',
                                onClick: (e) => {
                                    e.stopPropagation();
                                    handleDeleteClick(exam);
                                }
                            }
                        ];

                        return (
                            <div key={exam.id} className="relative">
                                {/* Timeline line */}
                                <div className="flex items-start">
                                    {/* Timeline dot */}
                                    <div className="flex-shrink-0 w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow mt-1"></div>
                                    
                                    {/* Timeline line (except for last item) */}
                                    {index < exams.length - 1 && (
                                        <div className="absolute left-1.5 top-4 w-0.5 h-12 bg-gray-200"></div>
                                    )}
                                    
                                    {/* Exam content */}
                                    <div className="ml-4 flex-1 min-w-0">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1 min-w-0 pr-2">
                                                {/* Exam title with type badge on the right */}
                                                <div className="flex items-center justify-between mb-2">
                                                    <h5 className="text-sm font-semibold text-gray-900 leading-tight flex-1">
                                                        {exam.name}
                                                    </h5>
                                                    <span className={`px-2 py-0.5 text-xs rounded-full ml-2 flex-shrink-0 ${getExamTypeColor(exam.exam_type)}`}>
                                                        {exam.exam_type_display}
                                                    </span>
                                                </div>
                                                
                                                {/* Exam details with SVG icons */}
                                                <div className="space-y-1">
                                                    <p className="text-xs text-gray-600 flex items-center">
                                                        <svg className="w-3 h-3 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                        </svg>
                                                        <span>{formatDate(exam.exam_date)}</span>
                                                        {exam.location && (
                                                            <>
                                                                <span className="mx-1">•</span>
                                                                <svg className="w-3 h-3 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                </svg>
                                                                <span>{exam.location}</span>
                                                            </>
                                                        )}
                                                    </p>
                                                    {exam.syllabus_coverage && exam.syllabus_coverage.length > 0 && (
                                                        <p className="text-xs text-gray-500 flex items-center">
                                                            <svg className="w-3 h-3 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                                            </svg>
                                                            <span>{exam.syllabus_coverage.length} topics • {exam.total_weightage}% weightage</span>
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            {/* Dropdown menu */}
                                            <DropdownMenu
                                                items={menuItems}
                                                className="flex-shrink-0"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* View Exam Modal */}
            <Modal
                isOpen={isViewModalOpen}
                onClose={() => {
                    setIsViewModalOpen(false);
                    setViewingExam(null);
                }}
                title="Exam Details"
                size="lg"
            >
                {viewingExam && (
                    <div className="space-y-6">
                        {/* Basic Information */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">{viewingExam.name}</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Exam Type</label>
                                    <span className={`inline-flex px-3 py-1 text-sm rounded-full ${getExamTypeColor(viewingExam.exam_type)}`}>
                                        {viewingExam.exam_type_display}
                                    </span>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                    <span className={`inline-flex px-3 py-1 text-sm rounded-full ${
                                        viewingExam.status === 'upcoming' ? 'bg-blue-100 text-blue-800' :
                                        viewingExam.status === 'completed' ? 'bg-green-100 text-green-800' :
                                        'bg-gray-100 text-gray-800'
                                    }`}>
                                        {viewingExam.status_display}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Schedule Information */}
                        <div>
                            <h4 className="text-md font-medium text-gray-900 mb-3">Schedule</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
                                    <p className="text-sm text-gray-900">
                                        {new Date(viewingExam.exam_date).toLocaleDateString('en-US', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        {new Date(viewingExam.exam_date).toLocaleTimeString('en-US', {
                                            hour: 'numeric',
                                            minute: '2-digit',
                                            hour12: true
                                        })}
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                                    <p className="text-sm text-gray-900">{viewingExam.duration_minutes || 'Not specified'} minutes</p>
                                </div>
                            </div>
                            {viewingExam.location && (
                                <div className="mt-3">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                                    <p className="text-sm text-gray-900">{viewingExam.location}</p>
                                </div>
                            )}
                        </div>

                        {/* Description */}
                        {viewingExam.description && (
                            <div>
                                <h4 className="text-md font-medium text-gray-900 mb-3">Description</h4>
                                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{viewingExam.description}</p>
                            </div>
                        )}

                        {/* Syllabus Coverage */}
                        {viewingExam.syllabus_coverage && viewingExam.syllabus_coverage.length > 0 && (
                            <div>
                                <h4 className="text-md font-medium text-gray-900 mb-3">
                                    Syllabus Coverage ({viewingExam.total_weightage}% total weightage)
                                </h4>
                                <div className="space-y-2 max-h-40 overflow-y-auto bg-gray-50 p-3 rounded-lg">
                                    {viewingExam.syllabus_coverage.map((item, index) => (
                                        <div key={index} className="flex justify-between items-center text-sm">
                                            <span className="font-medium text-gray-900">{item.topic}</span>
                                            <span className="text-gray-600 bg-white px-2 py-1 rounded">{item.weightage}%</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex justify-end space-x-3 pt-4 border-t">
                            <Button
                                variant="secondary"
                                onClick={() => {
                                    setIsViewModalOpen(false);
                                    handleEdit(viewingExam);
                                }}
                            >
                                Edit Exam
                            </Button>
                            <Button
                                onClick={() => setIsViewModalOpen(false)}
                            >
                                Close
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Add/Edit Exam Modal */}
            <Modal
                isOpen={isAddModalOpen || isEditModalOpen}
                onClose={() => {
                    setIsAddModalOpen(false);
                    setIsEditModalOpen(false);
                    resetForm();
                    setError(null);
                }}
                title={editingExam ? 'Edit Exam' : 'Add New Exam'}
                size="lg"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Exam Name"
                            value={formData.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            placeholder="e.g., Midterm Exam"
                            required
                        />

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Exam Type
                            </label>
                            <select
                                value={formData.exam_type}
                                onChange={(e) => handleInputChange('exam_type', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="test">Test</option>
                                <option value="quiz">Quiz</option>
                                <option value="midterm">Midterm</option>
                                <option value="final">Final Exam</option>
                                <option value="practical">Practical Exam</option>
                                <option value="oral">Oral Exam</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Exam Date & Time"
                            type="datetime-local"
                            value={formData.exam_date}
                            onChange={(e) => handleInputChange('exam_date', e.target.value)}
                            required
                        />

                        <Input
                            label="Duration (minutes)"
                            type="number"
                            value={formData.duration_minutes}
                            onChange={(e) => handleInputChange('duration_minutes', parseInt(e.target.value) || 120)}
                            min="15"
                            max="480"
                        />
                    </div>

                    <Input
                        label="Location (Optional)"
                        value={formData.location}
                        onChange={(e) => handleInputChange('location', e.target.value)}
                        placeholder="e.g., Room 101, Online"
                    />

                    <TextArea
                        label="Description (Optional)"
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        placeholder="Additional notes about the exam..."
                        rows={3}
                    />

                    {/* Syllabus Coverage Section */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Syllabus Coverage
                        </label>
                        
                        {/* Add syllabus item */}
                        <div className="flex space-x-2 mb-3">
                            <input
                                type="text"
                                placeholder="Topic/Chapter name"
                                value={syllabusItem.topic}
                                onChange={(e) => setSyllabusItem(prev => ({ ...prev, topic: e.target.value }))}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            />
                            <input
                                type="number"
                                placeholder="Weight %"
                                value={syllabusItem.weightage}
                                onChange={(e) => setSyllabusItem(prev => ({ ...prev, weightage: e.target.value }))}
                                min="1"
                                max="100"
                                className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            />
                            <Button
                                type="button"
                                onClick={handleAddSyllabusItem}
                                size="sm"
                                disabled={!syllabusItem.topic.trim() || !syllabusItem.weightage}
                            >
                                Add
                            </Button>
                        </div>

                        {/* Syllabus items list */}
                        {formData.syllabus_coverage.length > 0 && (
                            <div className="space-y-2 max-h-32 overflow-y-auto border rounded-lg p-3 bg-gray-50">
                                {formData.syllabus_coverage.map((item, index) => (
                                    <div key={index} className="flex items-center justify-between text-sm">
                                        <span className="flex-1">{item.topic}</span>
                                        <span className="text-gray-600 mr-2">{item.weightage}%</span>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleRemoveSyllabusItem(index)}
                                            className="p-1 text-red-600 hover:text-red-700"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </Button>
                                    </div>
                                ))}
                                <div className="border-t pt-2 mt-2 text-sm font-medium">
                                    Total Weightage: {getTotalWeightage()}%
                                    {getTotalWeightage() > 100 && (
                                        <span className="text-red-600 ml-2">(Exceeds 100%)</span>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => {
                                setIsAddModalOpen(false);
                                setIsEditModalOpen(false);
                                resetForm();
                                setError(null);
                            }}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting || !formData.name.trim() || !formData.exam_date || getTotalWeightage() > 100}
                        >
                            {isSubmitting ? 'Saving...' : (editingExam ? 'Update Exam' : 'Add Exam')}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                isOpen={deleteConfirm.isOpen}
                onClose={() => setDeleteConfirm({ isOpen: false, exam: null })}
                onConfirm={handleDelete}
                title="Delete Exam"
                message={`Are you sure you want to delete "${deleteConfirm.exam?.name}"? This action cannot be undone.`}
                confirmText="Delete"
                confirmVariant="danger"
                isConfirming={isSubmitting}
            />
        </div>
    );
};

export default ExamTimeline;
