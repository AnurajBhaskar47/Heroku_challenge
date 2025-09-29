import React, { useState, useEffect } from 'react';
import Card, { CardHeader, CardTitle, CardBody } from '../common/Card';
import Button from '../common/Button';
import Modal from '../common/Modal';
import Input from '../common/Input';
import TextArea from '../common/TextArea';
import Select from '../common/Select';
import ConfirmationModal from '../common/ConfirmationModal';
import DropdownMenu from '../common/DropdownMenu';
import { coursesService } from '../../services/courses';

/**
 * TopicsSection component for managing course topics and individual topic items.
 * Displays topics as individual cards with title, description, and difficulty.
 */
const TopicsSection = ({ courseId, onTopicUpdate }) => {
    // State for course topics (syllabus content)
    const [courseTopics, setCourseTopics] = useState([]);
    const [courseTopicsLoading, setCourseTopicsLoading] = useState(true);
    const [courseTopicsError, setCourseTopicsError] = useState(null);

    // State for individual topic items (cards)
    const [topicItems, setTopicItems] = useState([]);
    const [topicItemsLoading, setTopicItemsLoading] = useState(true);
    const [topicItemsError, setTopicItemsError] = useState(null);

    // Modal states
    const [syllabusModalOpen, setSyllabusModalOpen] = useState(false);
    const [editingTopic, setEditingTopic] = useState(null);
    const [topicItemModalOpen, setTopicItemModalOpen] = useState(false);
    const [editingTopicItem, setEditingTopicItem] = useState(null);
    const [viewTopicModalOpen, setViewTopicModalOpen] = useState(false);
    const [viewingTopicItem, setViewingTopicItem] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Delete confirmation states
    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, topic: null, topicItem: null });

    // Form states
    const [syllabusForm, setSyllabusForm] = useState({
        syllabus_text: '',
        syllabus_file: null
    });
    const [topicItemForm, setTopicItemForm] = useState({
        title: '',
        description: '',
        difficulty: 'intermediate'
    });

    // Load data on mount
    useEffect(() => {
        if (courseId) {
            loadCourseTopics();
            loadTopicItems();
        }
    }, [courseId]);

    /**
     * Load course topics (syllabus content)
     */
    const loadCourseTopics = async () => {
        try {
            setCourseTopicsLoading(true);
            setCourseTopicsError(null);
            const data = await coursesService.getCourseTopics(courseId);
            
            // Ensure data is always an array
            if (Array.isArray(data)) {
                setCourseTopics(data);
            } else if (data && Array.isArray(data.results)) {
                // Handle paginated response
                setCourseTopics(data.results);
            } else {
                console.warn('API returned non-array data for course topics:', data);
                setCourseTopics([]);
            }
        } catch (error) {
            console.error('Error loading course topics:', error);
            setCourseTopicsError('Failed to load course topics');
            setCourseTopics([]); // Ensure it's always an array even on error
        } finally {
            setCourseTopicsLoading(false);
        }
    };

    /**
     * Load individual topic items
     */
    const loadTopicItems = async () => {
        try {
            setTopicItemsLoading(true);
            setTopicItemsError(null);
            const data = await coursesService.getCourseTopicItems(courseId);
            // Ensure data is always an array
            if (Array.isArray(data)) {
                setTopicItems(data);
            } else if (data && Array.isArray(data.results)) {
                // Handle paginated response
                setTopicItems(data.results);
            } else {
                console.warn('API returned non-array data:', data);
                setTopicItems([]);
            }
        } catch (error) {
            console.error('Error loading topic items:', error);
            setTopicItemsError('Failed to load topic items');
            setTopicItems([]); // Ensure it's always an array even on error
        } finally {
            setTopicItemsLoading(false);
        }
    };

    /**
     * Handle syllabus form submission
     */
    const handleSyllabusSubmit = async (e) => {
        e.preventDefault();
        if (!syllabusForm.syllabus_text.trim() && !syllabusForm.syllabus_file) {
            return;
        }

        try {
            setIsSubmitting(true);
            const formData = new FormData();
            
            if (syllabusForm.syllabus_text.trim()) {
                formData.append('syllabus_text', syllabusForm.syllabus_text);
            }
            
            if (syllabusForm.syllabus_file) {
                formData.append('syllabus_file', syllabusForm.syllabus_file);
            }

            if (editingTopic) {
                await coursesService.updateCourseTopics(courseId, editingTopic.id, formData);
            } else {
                await coursesService.createCourseTopics(courseId, formData);
            }

            // Reload data
            await loadCourseTopics();
            await loadTopicItems();
            
            // Notify parent component of data update
            if (onTopicUpdate) {
                onTopicUpdate();
            }
            
            // Close modal and reset form
            setSyllabusModalOpen(false);
            setEditingTopic(null);
            setSyllabusForm({ syllabus_text: '', syllabus_file: null });
        } catch (error) {
            console.error('Error saving syllabus:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    /**
     * Handle topic item form submission
     */
    const handleTopicItemSubmit = async (e) => {
        e.preventDefault();
        if (!topicItemForm.title.trim()) return;

        try {
            setIsSubmitting(true);
            if (editingTopicItem) {
                await coursesService.updateCourseTopicItem(courseId, editingTopicItem.id, topicItemForm);
            } else {
                await coursesService.createCourseTopicItem(courseId, topicItemForm);
            }

            await loadTopicItems();
            
            // Notify parent component of data update
            if (onTopicUpdate) {
                onTopicUpdate();
            }
            
            setTopicItemModalOpen(false);
            setEditingTopicItem(null);
            setTopicItemForm({ title: '', description: '', difficulty: 'intermediate' });
        } catch (error) {
            console.error('Error saving topic item:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    /**
     * Handle topic item completion toggle
     */
    const handleToggleCompletion = async (topicItem) => {
        try {
            await coursesService.toggleTopicItemCompletion(courseId, topicItem.id);
            
            // Update the local state immediately for better UX
            setTopicItems(prevItems => 
                prevItems.map(item => 
                    item.id === topicItem.id 
                        ? { ...item, is_completed: !item.is_completed }
                        : item
                )
            );
            
            // Notify parent component of data update (for ProgressTracker)
            if (onTopicUpdate) {
                onTopicUpdate();
            }
        } catch (error) {
            console.error('Error toggling topic completion:', error);
            // Reload on error to ensure consistency
            await loadTopicItems();
        }
    };

    /**
     * Handle topic item deletion
     */
    const handleDeleteTopicItem = async (topicItem) => {
        try {
            await coursesService.deleteCourseTopicItem(courseId, topicItem.id);
            
            // Remove item from local state immediately
            setTopicItems(prevItems => prevItems.filter(item => item.id !== topicItem.id));
            setDeleteConfirm({ isOpen: false, topic: null, topicItem: null });
            
            // Notify parent component of data update
            if (onTopicUpdate) {
                onTopicUpdate();
            }
        } catch (error) {
            console.error('Error deleting topic item:', error);
            // Reload on error to ensure consistency
            await loadTopicItems();
        }
    };

    /**
     * Handle syllabus deletion
     */
    const handleDeleteSyllabus = async (topic) => {
        try {
            await coursesService.deleteCourseTopics(courseId, topic.id);
            await loadCourseTopics();
            await loadTopicItems(); // Reload topic items as they might be deleted too
            setDeleteConfirm({ isOpen: false, topic: null, topicItem: null });
            
            // Notify parent component of data update
            if (onTopicUpdate) {
                onTopicUpdate();
            }
        } catch (error) {
            console.error('Error deleting syllabus:', error);
        }
    };

    /**
     * Open syllabus modal for editing
     */
    const handleEditSyllabus = (topic) => {
        setEditingTopic(topic);
        setSyllabusForm({
            syllabus_text: topic.syllabus_text || '',
            syllabus_file: null
        });
        setSyllabusModalOpen(true);
    };

    /**
     * Open topic item modal for editing
     */
    const handleEditTopicItem = (topicItem) => {
        setEditingTopicItem(topicItem);
        setTopicItemForm({
            title: topicItem.title || '',
            description: topicItem.description || '',
            difficulty: topicItem.difficulty || 'intermediate'
        });
        setTopicItemModalOpen(true);
    };

    /**
     * Get difficulty color class for badges
     */
    const getDifficultyColor = (difficulty) => {
        switch (difficulty) {
            case 'beginner':
                return 'bg-blue-100 text-blue-700';
            case 'intermediate':
                return 'bg-orange-100 text-orange-700';
            case 'advanced':
                return 'bg-red-100 text-red-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    /**
     * Get difficulty-based card background color
     */
    const getDifficultyCardColor = (difficulty) => {
        switch (difficulty) {
            case 'beginner':
                return 'bg-blue-100 text-blue-800';
            case 'intermediate':
                return 'bg-orange-100 text-orange-800';
            case 'advanced':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    /**
     * Handle viewing topic item details
     */
    const handleViewTopicItem = (topicItem) => {
        setViewingTopicItem(topicItem);
        setViewTopicModalOpen(true);
    };

    return (
        <Card className="w-full">
            <CardHeader className="px-4">
                <div className="flex justify-between items-center w-full">
                    <CardTitle>Topics</CardTitle>
                    <div className="flex space-x-2">
                        <Button size="sm" onClick={() => setSyllabusModalOpen(true)} className="whitespace-nowrap">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Add Topic
                        </Button>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setTopicItemModalOpen(true)}
                            className="whitespace-nowrap"
                        >
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Add Card
                        </Button>
                    </div>
                </div>
            </CardHeader>

            <CardBody className="h-[500px] flex flex-col">
                {/* Error displays */}
                {(courseTopicsError || topicItemsError) && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-700 text-sm">
                            {courseTopicsError || topicItemsError}
                        </p>
                    </div>
                )}

                {/* Loading states */}
                {(courseTopicsLoading || topicItemsLoading) ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                            <p className="text-gray-600 text-sm">Loading topics...</p>
                        </div>
                    </div>
                ) : !Array.isArray(topicItems) || topicItems.length === 0 ? (
                    // Empty state
                    <div className="flex-1 flex flex-col justify-center items-center px-4 py-6">
                        <div className="text-center max-w-sm">
                            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                            </svg>
                            <h3 className="text-sm font-medium text-gray-900 mb-2">No Course Topics</h3>
                            <p className="text-gray-600 text-xs mb-6 leading-relaxed">
                                Add your syllabus content to automatically extract course topics, or create individual topic cards manually.
                            </p>
                            <div className="space-y-2">
                                <Button size="sm" onClick={() => setSyllabusModalOpen(true)} fullWidth>
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                    </svg>
                                    Add Syllabus Content
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => setTopicItemModalOpen(true)} fullWidth>
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                    Create Topic Card
                                </Button>
                            </div>
                        </div>
                    </div>
                ) : (
                    // Topic items display
                    <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                        <div className="space-y-3 pr-2">
                            {(Array.isArray(topicItems) ? topicItems : []).map((item) => {
                                // Create dropdown menu items
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
                                            handleViewTopicItem(item);
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
                                            handleEditTopicItem(item);
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
                                            setDeleteConfirm({ isOpen: true, topic: null, topicItem: item });
                                        }
                                    }
                                ];

                                return (
                                    <div
                                        key={item.id}
                                        className={`group border rounded-lg p-4 transition-all duration-200 hover:shadow-sm ${
                                            item.is_completed 
                                                ? 'bg-green-50 border-green-200' 
                                                : `${getDifficultyCardColor(item.difficulty)} border-gray-300`
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                                                <input
                                                    type="checkbox"
                                                    checked={item.is_completed}
                                                    onChange={() => handleToggleCompletion(item)}
                                                    className="form-checkbox h-4 w-4 text-blue-600 transition duration-150 ease-in-out rounded focus:ring-blue-500 flex-shrink-0 cursor-pointer"
                                                />
                                                <h4 className={`font-medium truncate ${
                                                    item.is_completed 
                                                        ? 'line-through text-green-700' 
                                                        : getDifficultyCardColor(item.difficulty).includes('text-blue-800') ? 'text-blue-900'
                                                        : getDifficultyCardColor(item.difficulty).includes('text-orange-800') ? 'text-orange-900'
                                                        : getDifficultyCardColor(item.difficulty).includes('text-red-800') ? 'text-red-900'
                                                        : 'text-gray-900'
                                                }`}>
                                                    {item.title}
                                                </h4>
                                            </div>
                                            
                                            {/* Dropdown menu - only visible on hover */}
                                            <DropdownMenu
                                                items={menuItems}
                                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        
                    </div>
                )}
            </CardBody>

            {/* Syllabus Modal */}
            <Modal
                isOpen={syllabusModalOpen}
                onClose={() => {
                    setSyllabusModalOpen(false);
                    setEditingTopic(null);
                    setSyllabusForm({ syllabus_text: '', syllabus_file: null });
                }}
                title={editingTopic ? 'Edit Syllabus Content' : 'Add Syllabus Content'}
                size="lg"
            >
                <form onSubmit={handleSyllabusSubmit} className="space-y-4">
                    <p className="text-xs text-gray-500">
                        AI will automatically extract individual topics from your syllabus content
                    </p>
                    
                    <TextArea
                        label="Syllabus Text"
                        value={syllabusForm.syllabus_text}
                        onChange={(e) => setSyllabusForm(prev => ({ ...prev, syllabus_text: e.target.value }))}
                        rows={6}
                        placeholder="Paste your syllabus content here..."
                    />
                    
                    <div className="text-center text-gray-500 text-sm">OR</div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Upload Syllabus File
                        </label>
                        <input
                            type="file"
                            accept=".pdf"
                            onChange={(e) => setSyllabusForm(prev => ({ ...prev, syllabus_file: e.target.files[0] }))}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Supported format: PDF only
                        </p>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setSyllabusModalOpen(false);
                                setEditingTopic(null);
                                setSyllabusForm({ syllabus_text: '', syllabus_file: null });
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting || (!syllabusForm.syllabus_text.trim() && !syllabusForm.syllabus_file)}
                        >
                            {isSubmitting ? 'Processing...' : editingTopic ? 'Update Topics' : 'Extract Topics'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Topic Item Modal */}
            <Modal
                isOpen={topicItemModalOpen}
                onClose={() => {
                    setTopicItemModalOpen(false);
                    setEditingTopicItem(null);
                    setTopicItemForm({ title: '', description: '', difficulty: 'intermediate' });
                }}
                title={editingTopicItem ? 'Edit Topic Card' : 'Create Topic Card'}
            >
                <form onSubmit={handleTopicItemSubmit} className="space-y-4">
                    <Input
                        label="Title"
                        value={topicItemForm.title}
                        onChange={(e) => setTopicItemForm(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="e.g., Binary Trees"
                        required
                    />
                    
                    <TextArea
                        label="Description"
                        value={topicItemForm.description}
                        onChange={(e) => setTopicItemForm(prev => ({ ...prev, description: e.target.value }))}
                        rows={3}
                        placeholder="Describe what this topic covers..."
                    />
                    
                    <Select
                        label="Difficulty"
                        value={topicItemForm.difficulty}
                        onChange={(e) => setTopicItemForm(prev => ({ ...prev, difficulty: e.target.value }))}
                    >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                    </Select>

                    <div className="flex justify-end space-x-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setTopicItemModalOpen(false);
                                setEditingTopicItem(null);
                                setTopicItemForm({ title: '', description: '', difficulty: 'intermediate' });
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting || !topicItemForm.title.trim()}
                        >
                            {isSubmitting ? 'Saving...' : editingTopicItem ? 'Update Topic' : 'Create Topic'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* View Topic Modal */}
            <Modal
                isOpen={viewTopicModalOpen}
                onClose={() => {
                    setViewTopicModalOpen(false);
                    setViewingTopicItem(null);
                }}
                title="Topic Details"
            >
                {viewingTopicItem && (
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                {viewingTopicItem.title}
                            </h3>
                            <div className="flex items-center space-x-3 mb-4">
                                <span className={`px-3 py-1 text-sm font-medium rounded-full ${getDifficultyColor(viewingTopicItem.difficulty)}`}>
                                    {viewingTopicItem.difficulty_display || viewingTopicItem.difficulty}
                                </span>
                                <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                                    viewingTopicItem.is_completed 
                                        ? 'bg-green-100 text-green-700' 
                                        : 'bg-gray-100 text-gray-700'
                                }`}>
                                    {viewingTopicItem.is_completed ? 'Completed' : 'In Progress'}
                                </span>
                            </div>
                        </div>

                        {viewingTopicItem.description && (
                            <div>
                                <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                                <p className="text-gray-600 leading-relaxed">
                                    {viewingTopicItem.description}
                                </p>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <h4 className="font-medium text-gray-900 mb-1">Order</h4>
                                <p className="text-gray-600">#{viewingTopicItem.order}</p>
                            </div>
                            <div>
                                <h4 className="font-medium text-gray-900 mb-1">Difficulty</h4>
                                <p className="text-gray-600 capitalize">{viewingTopicItem.difficulty}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <h4 className="font-medium text-gray-900 mb-1">Created</h4>
                                <p className="text-gray-600">
                                    {new Date(viewingTopicItem.created_at).toLocaleDateString()}
                                </p>
                            </div>
                            <div>
                                <h4 className="font-medium text-gray-900 mb-1">Updated</h4>
                                <p className="text-gray-600">
                                    {new Date(viewingTopicItem.updated_at).toLocaleDateString()}
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 pt-4 border-t">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setViewTopicModalOpen(false);
                                    setViewingTopicItem(null);
                                }}
                            >
                                Close
                            </Button>
                            <Button
                                onClick={() => {
                                    setViewTopicModalOpen(false);
                                    handleEditTopicItem(viewingTopicItem);
                                }}
                            >
                                Edit Topic
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                isOpen={deleteConfirm.isOpen}
                onClose={() => setDeleteConfirm({ isOpen: false, topic: null, topicItem: null })}
                onConfirm={() => {
                    if (deleteConfirm.topicItem) {
                        handleDeleteTopicItem(deleteConfirm.topicItem);
                    } else if (deleteConfirm.topic) {
                        handleDeleteSyllabus(deleteConfirm.topic);
                    }
                }}
                title={deleteConfirm.topicItem ? 'Delete Topic' : 'Delete Syllabus'}
                message={
                    deleteConfirm.topicItem
                        ? `Are you sure you want to delete "${deleteConfirm.topicItem?.title}"? This action cannot be undone.`
                        : 'Are you sure you want to delete this syllabus content? This will also delete all extracted topics. This action cannot be undone.'
                }
                confirmText="Delete"
                confirmVariant="danger"
            />
        </Card>
    );
};

export default TopicsSection;