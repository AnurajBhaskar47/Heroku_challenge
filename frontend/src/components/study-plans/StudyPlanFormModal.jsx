import { useState, useEffect } from 'react';
import Modal from '../common/Modal.jsx';
import Button from '../common/Button.jsx';
import Input from '../common/Input.jsx';
import Select from '../common/Select.jsx';
import TextArea from '../common/TextArea.jsx';
import { useCourses } from '../../hooks/useCourses.jsx';

/**
 * StudyPlanFormModal component for creating and editing study plans
 */
const StudyPlanFormModal = ({
    isOpen,
    onClose,
    onSubmit,
    studyPlan = null,
    isLoading = false,
}) => {
    const { courses, loadCourses } = useCourses();
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        course_id: '',
        start_date: '',
        end_date: '',
        status: 'draft',
        plan_data: {
            topics: [],
            milestones: [],
            estimated_hours: 0,
            difficulty_level: 3,
        },
    });

    const [errors, setErrors] = useState({});

    const isEditing = !!studyPlan;

    // Initialize form data when modal opens
    useEffect(() => {
        if (isOpen) {
            if (studyPlan) {
                setFormData({
                    title: studyPlan.title || '',
                    description: studyPlan.description || '',
                    course_id: studyPlan.course || '',
                    start_date: studyPlan.start_date || '',
                    end_date: studyPlan.end_date || '',
                    status: studyPlan.status || 'draft',
                    plan_data: studyPlan.plan_data || {
                        topics: [],
                        milestones: [],
                        estimated_hours: 0,
                        difficulty_level: 3,
                    },
                });
            } else {
                // Reset form for new study plan
                const today = new Date().toISOString().split('T')[0];
                const nextMonth = new Date();
                nextMonth.setMonth(nextMonth.getMonth() + 1);
                const endDate = nextMonth.toISOString().split('T')[0];

                setFormData({
                    title: '',
                    description: '',
                    course_id: '',
                    start_date: today,
                    end_date: endDate,
                    status: 'draft',
                    plan_data: {
                        topics: [],
                        milestones: [],
                        estimated_hours: 0,
                        difficulty_level: 3,
                    },
                });
            }
            setErrors({});
            // Only load courses if not already loaded
            if (courses.length === 0) {
                loadCourses();
            }
        }
    }, [isOpen, studyPlan, loadCourses, courses.length]);

    // Handle input changes
    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value,
        }));

        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: null,
            }));
        }
    };

    // Handle plan data changes
    const handlePlanDataChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            plan_data: {
                ...prev.plan_data,
                [field]: value,
            },
        }));
    };

    // Add a new topic
    const addTopic = () => {
        const newTopic = {
            id: Date.now().toString(),
            title: '',
            description: '',
            estimated_hours: 0.5,
            difficulty_level: 3,
            completed: false,
        };

        setFormData(prev => ({
            ...prev,
            plan_data: {
                ...prev.plan_data,
                topics: [...prev.plan_data.topics, newTopic],
            },
        }));
    };

    // Remove a topic
    const removeTopic = (topicId) => {
        setFormData(prev => ({
            ...prev,
            plan_data: {
                ...prev.plan_data,
                topics: prev.plan_data.topics.filter(t => t.id !== topicId),
            },
        }));
    };

    // Update a topic
    const updateTopic = (topicId, field, value) => {
        setFormData(prev => ({
            ...prev,
            plan_data: {
                ...prev.plan_data,
                topics: prev.plan_data.topics.map(topic =>
                    topic.id === topicId ? { ...topic, [field]: value } : topic
                ),
            },
        }));
    };

    // Add a new milestone
    const addMilestone = () => {
        const newMilestone = {
            id: Date.now().toString(),
            title: '',
            description: '',
            due_date: '',
            completed: false,
        };

        setFormData(prev => ({
            ...prev,
            plan_data: {
                ...prev.plan_data,
                milestones: [...prev.plan_data.milestones, newMilestone],
            },
        }));
    };

    // Remove a milestone
    const removeMilestone = (milestoneId) => {
        setFormData(prev => ({
            ...prev,
            plan_data: {
                ...prev.plan_data,
                milestones: prev.plan_data.milestones.filter(m => m.id !== milestoneId),
            },
        }));
    };

    // Update a milestone
    const updateMilestone = (milestoneId, field, value) => {
        setFormData(prev => ({
            ...prev,
            plan_data: {
                ...prev.plan_data,
                milestones: prev.plan_data.milestones.map(milestone =>
                    milestone.id === milestoneId ? { ...milestone, [field]: value } : milestone
                ),
            },
        }));
    };

    // Validate form
    const validateForm = () => {
        const newErrors = {};

        if (!formData.title.trim()) {
            newErrors.title = 'Title is required';
        }

        if (!formData.course_id) {
            newErrors.course_id = 'Course is required';
        }

        if (!formData.start_date) {
            newErrors.start_date = 'Start date is required';
        }

        if (!formData.end_date) {
            newErrors.end_date = 'End date is required';
        }

        if (formData.start_date && formData.end_date && formData.start_date >= formData.end_date) {
            newErrors.end_date = 'End date must be after start date';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle form submission
    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        // Ensure all topics have valid estimated_hours before submission
        const processedTopics = formData.plan_data.topics.map(topic => ({
            ...topic,
            estimated_hours: topic.estimated_hours === '' || topic.estimated_hours === null || topic.estimated_hours === undefined || parseFloat(topic.estimated_hours) < 0.5 
                ? 0.5 
                : parseFloat(topic.estimated_hours)
        }));

        // Calculate total estimated hours from processed topics
        const totalHours = processedTopics.reduce(
            (sum, topic) => sum + (parseFloat(topic.estimated_hours) || 0), 0
        );

        const submitData = {
            ...formData,
            plan_data: {
                ...formData.plan_data,
                topics: processedTopics,
                estimated_hours: totalHours,
            },
        };

        onSubmit(submitData);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditing ? 'Edit Study Plan' : 'Create Study Plan'}
            size="lg"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <Input
                            label="Title *"
                            value={formData.title}
                            onChange={(e) => handleInputChange('title', e.target.value)}
                            error={errors.title}
                            placeholder="e.g., Calculus I Midterm Prep"
                        />
                    </div>

                    <Select
                        label="Course *"
                        value={formData.course_id}
                        onChange={(e) => handleInputChange('course_id', e.target.value)}
                        error={errors.course_id}
                        options={[
                            { value: '', label: 'Select a course' },
                            ...courses.map(course => ({
                                value: course.id,
                                label: `${course.name} ${course.code ? `(${course.code})` : ''}`,
                            })),
                        ]}
                    />

                    <Select
                        label="Status"
                        value={formData.status}
                        onChange={(e) => handleInputChange('status', e.target.value)}
                        options={[
                            { value: 'draft', label: 'Draft' },
                            { value: 'active', label: 'Active' },
                            { value: 'paused', label: 'Paused' },
                            { value: 'completed', label: 'Completed' },
                        ]}
                    />

                    <Input
                        type="date"
                        label="Start Date *"
                        value={formData.start_date}
                        onChange={(e) => handleInputChange('start_date', e.target.value)}
                        error={errors.start_date}
                    />

                    <Input
                        type="date"
                        label="End Date *"
                        value={formData.end_date}
                        onChange={(e) => handleInputChange('end_date', e.target.value)}
                        error={errors.end_date}
                    />
                </div>

                <TextArea
                    label="Description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe your study goals and approach..."
                    rows={3}
                />

                {/* Plan Settings */}
                <div className="border-t pt-6">
                    <h3 className="text-lg font-medium mb-4">Plan Settings</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Select
                            label="Difficulty Level"
                            value={formData.plan_data.difficulty_level}
                            onChange={(e) => handlePlanDataChange('difficulty_level', parseInt(e.target.value))}
                            options={[
                                { value: 1, label: 'Very Easy' },
                                { value: 2, label: 'Easy' },
                                { value: 3, label: 'Medium' },
                                { value: 4, label: 'Hard' },
                                { value: 5, label: 'Very Hard' },
                            ]}
                        />
                    </div>
                </div>

                {/* Study Topics */}
                <div className="border-t pt-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium">Study Topics</h3>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addTopic}
                        >
                            Add Topic
                        </Button>
                    </div>

                    <div className="space-y-3">
                        {formData.plan_data.topics.map((topic, index) => (
                            <div key={topic.id} className="p-4 border rounded-lg">
                                <div className="flex justify-between items-start mb-3">
                                    <h4 className="font-medium text-sm">{topic.name || topic.title || `Topic ${index + 1}`}</h4>
                                    <button
                                        type="button"
                                        onClick={() => removeTopic(topic.id)}
                                        className="text-red-500 hover:text-red-700 text-sm"
                                    >
                                        Remove
                                    </button>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <Input
                                        label="Topic Name"
                                        value={topic.name || topic.title}
                                        onChange={(e) => updateTopic(topic.id, 'name', e.target.value)}
                                        placeholder="e.g., Binary Trees"
                                        size="sm"
                                    />
                                    
                                    <Input
                                        type="number"
                                        label="Est. Hours"
                                        value={topic.estimated_hours}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            // Allow empty string or any valid number input
                                            updateTopic(topic.id, 'estimated_hours', value === '' ? '' : parseFloat(value) || '');
                                        }}
                                        onBlur={(e) => {
                                            // Enforce minimum 0.5 when user leaves the field
                                            const value = e.target.value;
                                            if (value === '' || parseFloat(value) < 0.5) {
                                                updateTopic(topic.id, 'estimated_hours', 0.5);
                                            }
                                        }}
                                        min="0.5"
                                        step="0.5"
                                        size="sm"
                                    />
                                    
                                    <Select
                                        label="Difficulty"
                                        value={topic.difficulty_level}
                                        onChange={(e) => updateTopic(topic.id, 'difficulty_level', parseInt(e.target.value))}
                                        options={[
                                            { value: 1, label: 'Very Easy' },
                                            { value: 2, label: 'Easy' },
                                            { value: 3, label: 'Medium' },
                                            { value: 4, label: 'Hard' },
                                            { value: 5, label: 'Very Hard' },
                                        ]}
                                        size="sm"
                                    />
                                    
                                    <div className="md:col-span-2">
                                        <TextArea
                                            label="Description"
                                            value={topic.description}
                                            onChange={(e) => updateTopic(topic.id, 'description', e.target.value)}
                                            placeholder="Topic description or notes..."
                                            rows={2}
                                            size="sm"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                        
                        {formData.plan_data.topics.length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                                <p>No topics added yet. Click "Add Topic" to get started.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Milestones */}
                <div className="border-t pt-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium">Milestones</h3>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addMilestone}
                        >
                            Add Milestone
                        </Button>
                    </div>

                    <div className="space-y-3">
                        {formData.plan_data.milestones.map((milestone, index) => (
                            <div key={milestone.id} className="p-4 border rounded-lg">
                                <div className="flex justify-between items-start mb-3">
                                    <h4 className="font-medium text-sm">{milestone.name || milestone.title || `Milestone ${index + 1}`}</h4>
                                    <button
                                        type="button"
                                        onClick={() => removeMilestone(milestone.id)}
                                        className="text-red-500 hover:text-red-700 text-sm"
                                    >
                                        Remove
                                    </button>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <Input
                                        label="Milestone Name"
                                        value={milestone.name || milestone.title}
                                        onChange={(e) => updateMilestone(milestone.id, 'name', e.target.value)}
                                        placeholder="e.g., Master Binary Tree Operations"
                                        size="sm"
                                    />
                                    
                                    <Input
                                        type="date"
                                        label="Due Date"
                                        value={milestone.due_date}
                                        onChange={(e) => updateMilestone(milestone.id, 'due_date', e.target.value)}
                                        size="sm"
                                    />
                                    
                                    <div className="md:col-span-2">
                                        <TextArea
                                            label="Description"
                                            value={milestone.description}
                                            onChange={(e) => updateMilestone(milestone.id, 'description', e.target.value)}
                                            placeholder="Milestone description or requirements..."
                                            rows={2}
                                            size="sm"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                        
                        {formData.plan_data.milestones.length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                                <p>No milestones added yet. Click "Add Milestone" to set goals.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Summary */}
                {(formData.plan_data.topics.length > 0 || formData.plan_data.milestones.length > 0) && (
                    <div className="border-t pt-6">
                        <h3 className="text-lg font-medium mb-4">Study Plan Summary</h3>
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                    <span className="block text-gray-500">Topics</span>
                                    <span className="font-medium">{formData.plan_data.topics.length}</span>
                                </div>
                                <div>
                                    <span className="block text-gray-500">Milestones</span>
                                    <span className="font-medium">{formData.plan_data.milestones.length}</span>
                                </div>
                                <div>
                                    <span className="block text-gray-500">Est. Hours</span>
                                    <span className="font-medium">
                                        {formData.plan_data.topics.reduce(
                                            (sum, topic) => {
                                                const hours = topic.estimated_hours === '' || topic.estimated_hours === null || topic.estimated_hours === undefined ? 0 : (parseFloat(topic.estimated_hours) || 0);
                                                return sum + hours;
                                            }, 0
                                        ).toFixed(1)}h
                                    </span>
                                </div>
                                <div>
                                    <span className="block text-gray-500">Duration</span>
                                    <span className="font-medium">
                                        {formData.start_date && formData.end_date
                                            ? Math.ceil(
                                                (new Date(formData.end_date) - new Date(formData.start_date)) / (1000 * 60 * 60 * 24)
                                            ) + ' days'
                                            : 'Not set'
                                        }
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Form Actions */}
                <div className="flex justify-end gap-3 pt-6 border-t">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={isLoading}
                        loading={isLoading}
                    >
                        {isEditing ? 'Update Study Plan' : 'Create Study Plan'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default StudyPlanFormModal;
