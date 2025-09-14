import { useState, useEffect } from 'react';
import Modal from '../common/Modal.jsx';
import Button from '../common/Button.jsx';
import Input from '../common/Input.jsx';
import Select from '../common/Select.jsx';
import { ASSIGNMENT_TYPES, ASSIGNMENT_STATUS } from '../../utils/constants.js';
import { getErrorMessage } from '../../services/api.js';

/**
 * Modal for creating/editing assignments
 */
const AssignmentFormModal = ({
    isOpen,
    onClose,
    onSubmit,
    assignment = null, // null for create, assignment object for edit
    isSubmitting = false,
}) => {
    const isEdit = !!assignment;

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        assignment_type: 'homework',
        due_date: '',
        estimated_hours: '',
        weight: '',
        status: 'not_started',
    });

    const [errors, setErrors] = useState({});

    // Initialize form data when assignment changes
    useEffect(() => {
        if (assignment) {
            setFormData({
                title: assignment.title || '',
                description: assignment.description || '',
                assignment_type: assignment.assignment_type || 'homework',
                due_date: assignment.due_date ? new Date(assignment.due_date).toISOString().slice(0, 16) : '',
                estimated_hours: assignment.estimated_hours?.toString() || '',
                weight: assignment.weight?.toString() || '',
                status: assignment.status || 'not_started',
            });
        } else {
            setFormData({
                title: '',
                description: '',
                assignment_type: 'homework',
                due_date: '',
                estimated_hours: '',
                weight: '',
                status: 'not_started',
            });
        }
        setErrors({});
    }, [assignment, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.title.trim()) {
            newErrors.title = 'Title is required';
        }
        if (!formData.due_date) {
            newErrors.due_date = 'Due date is required';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        const cleanedData = {
            ...formData,
            estimated_hours: formData.estimated_hours ? Number(formData.estimated_hours) : null,
            weight: formData.weight ? Number(formData.weight) : null,
            due_date: formData.due_date ? new Date(formData.due_date).toISOString() : null,
        };

        try {
            await onSubmit(cleanedData);
        } catch (error) {
            setErrors({ general: getErrorMessage(error) });
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEdit ? 'Edit Assignment' : 'Add New Assignment'}
            size="lg"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                {errors.general && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-3">
                        <p className="text-sm text-red-600">{errors.general}</p>
                    </div>
                )}

                <Input
                    label="Title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    error={errors.title}
                    required
                    placeholder="e.g., Chapter 5 Problem Set"
                />

                <Input
                    label="Description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    error={errors.description}
                    placeholder="Brief description of the assignment"
                    multiline
                    rows={3}
                />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Select
                        label="Type"
                        name="assignment_type"
                        value={formData.assignment_type}
                        onChange={handleChange}
                        options={ASSIGNMENT_TYPES}
                    />

                    <Input
                        label="Due Date"
                        name="due_date"
                        type="datetime-local"
                        value={formData.due_date}
                        onChange={handleChange}
                        error={errors.due_date}
                        required
                    />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Input
                        label="Estimated Hours"
                        name="estimated_hours"
                        type="number"
                        min="0"
                        step="0.5"
                        value={formData.estimated_hours}
                        onChange={handleChange}
                        placeholder="e.g., 3.5"
                    />

                    <Input
                        label="Weight (%)"
                        name="weight"
                        type="number"
                        min="0"
                        max="100"
                        value={formData.weight}
                        onChange={handleChange}
                        placeholder="e.g., 15"
                    />
                </div>

                <Select
                    label="Status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    options={ASSIGNMENT_STATUS}
                />

                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        loading={isSubmitting}
                        disabled={isSubmitting}
                    >
                        {isEdit ? 'Update Assignment' : 'Create Assignment'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default AssignmentFormModal;
