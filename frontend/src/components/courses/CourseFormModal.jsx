import { useState, useEffect } from 'react';
import Modal from '../common/Modal.jsx';
import Button from '../common/Button.jsx';
import Input from '../common/Input.jsx';
import Select from '../common/Select.jsx';
import { DIFFICULTY_LEVELS, VALIDATION } from '../../utils/constants.js';
import { getErrorMessage } from '../../services/api.js';

/**
 * Modal for creating/editing courses
 */
const CourseFormModal = ({
    isOpen,
    onClose,
    onSubmit,
    course = null, // null for create, course object for edit
    isSubmitting = false,
}) => {
    const isEdit = !!course;

    const [formData, setFormData] = useState({
        name: '',
        code: '',
        description: '',
        instructor: '',
        credits: '',
        semester: '',
        start_date: '',
        end_date: '',
        difficulty_level: '',
        syllabus_text: '',
    });

    const [errors, setErrors] = useState({});

    // Initialize form data when course changes
    useEffect(() => {
        if (course) {
            setFormData({
                name: course.name || '',
                code: course.code || '',
                description: course.description || '',
                instructor: course.instructor || '',
                credits: course.credits?.toString() || '',
                semester: course.semester || '',
                start_date: course.start_date ? course.start_date.split('T')[0] : '',
                end_date: course.end_date ? course.end_date.split('T')[0] : '',
                difficulty_level: course.difficulty_level?.toString() || '',
                syllabus_text: course.syllabus_text || '',
            });
        } else {
            setFormData({
                name: '',
                code: '',
                description: '',
                instructor: '',
                credits: '',
                semester: '',
                start_date: '',
                end_date: '',
                difficulty_level: '',
                syllabus_text: '',
            });
        }
        setErrors({});
    }, [course, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Clear field error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        // Required fields
        if (!formData.name.trim()) {
            newErrors.name = 'Course name is required';
        }

        if (!formData.credits || isNaN(formData.credits) || Number(formData.credits) < 0) {
            newErrors.credits = 'Valid credit hours are required';
        }

        // Date validation
        if (formData.start_date && formData.end_date) {
            const startDate = new Date(formData.start_date);
            const endDate = new Date(formData.end_date);
            if (endDate <= startDate) {
                newErrors.end_date = 'End date must be after start date';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        // Clean up form data
        const cleanedData = {
            ...formData,
            credits: formData.credits ? Number(formData.credits) : null,
            difficulty_level: formData.difficulty_level ? Number(formData.difficulty_level) : null,
            start_date: formData.start_date || null,
            end_date: formData.end_date || null,
        };

        try {
            await onSubmit(cleanedData);
        } catch (error) {
            setErrors({ general: getErrorMessage(error) });
        }
    };

    const currentYear = new Date().getFullYear();
    const semesterOptions = [
        { value: `Fall ${currentYear}`, label: `Fall ${currentYear}` },
        { value: `Spring ${currentYear + 1}`, label: `Spring ${currentYear + 1}` },
        { value: `Summer ${currentYear}`, label: `Summer ${currentYear}` },
        { value: `Winter ${currentYear}`, label: `Winter ${currentYear}` },
    ];

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEdit ? 'Edit Course' : 'Add New Course'}
            size="lg"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                {errors.general && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-3">
                        <p className="text-sm text-red-600">{errors.general}</p>
                    </div>
                )}

                {/* Basic Information */}
                <div className="space-y-4">
                    <h4 className="text-sm font-medium text-gray-700">Basic Information</h4>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Input
                            label="Course Name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            error={errors.name}
                            required
                            placeholder="e.g., Introduction to Computer Science"
                        />

                        <Input
                            label="Course Code"
                            name="code"
                            value={formData.code}
                            onChange={handleChange}
                            error={errors.code}
                            placeholder="e.g., CS101"
                        />
                    </div>

                    <Input
                        label="Description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        error={errors.description}
                        placeholder="Brief description of the course"
                        multiline
                        rows={3}
                    />

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Input
                            label="Instructor"
                            name="instructor"
                            value={formData.instructor}
                            onChange={handleChange}
                            error={errors.instructor}
                            placeholder="Professor name"
                        />

                        <Input
                            label="Credits"
                            name="credits"
                            type="number"
                            min="0"
                            max="10"
                            value={formData.credits}
                            onChange={handleChange}
                            error={errors.credits}
                            required
                            placeholder="3"
                        />
                    </div>
                </div>

                {/* Schedule Information */}
                <div className="space-y-4">
                    <h4 className="text-sm font-medium text-gray-700">Schedule Information</h4>

                    <Select
                        label="Semester"
                        name="semester"
                        value={formData.semester}
                        onChange={handleChange}
                        options={semesterOptions}
                        placeholder="Select semester"
                    />

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Input
                            label="Start Date"
                            name="start_date"
                            type="date"
                            value={formData.start_date}
                            onChange={handleChange}
                            error={errors.start_date}
                        />

                        <Input
                            label="End Date"
                            name="end_date"
                            type="date"
                            value={formData.end_date}
                            onChange={handleChange}
                            error={errors.end_date}
                        />
                    </div>

                    <Select
                        label="Difficulty Level"
                        name="difficulty_level"
                        value={formData.difficulty_level}
                        onChange={handleChange}
                        options={DIFFICULTY_LEVELS}
                        placeholder="Select difficulty"
                    />
                </div>

                {/* Syllabus */}
                <div className="space-y-4">
                    <h4 className="text-sm font-medium text-gray-700">Additional Information</h4>

                    <Input
                        label="Syllabus/Notes"
                        name="syllabus_text"
                        value={formData.syllabus_text}
                        onChange={handleChange}
                        error={errors.syllabus_text}
                        placeholder="Course syllabus, learning objectives, or additional notes"
                        multiline
                        rows={4}
                    />
                </div>

                {/* Form Actions */}
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
                        {isEdit ? 'Update Course' : 'Create Course'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default CourseFormModal;
