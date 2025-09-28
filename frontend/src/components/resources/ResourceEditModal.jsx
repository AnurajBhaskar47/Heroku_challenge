import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Select from '../common/Select';
import TextArea from '../common/TextArea';
import Button from '../common/Button';
import { resourcesService } from '../../services/resources';

const ResourceEditModal = ({ isOpen, onClose, resource, courses, onUpdateSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [editForm, setEditForm] = useState({
        title: '',
        description: '',
        resource_type: 'pdf',
        course: '',
        subject: '',
        difficulty_level: 3,
        url: ''
    });

    // Initialize form when resource changes
    useEffect(() => {
        if (resource) {
            setEditForm({
                title: resource.title || '',
                description: resource.description || '',
                resource_type: resource.resource_type || 'pdf',
                course: resource.course || '',
                subject: resource.subject || '',
                difficulty_level: resource.difficulty_level || 3,
                url: resource.url || ''
            });
        }
    }, [resource]);

    const handleUpdateResource = async (e) => {
        e.preventDefault();
        
        if (!resource) return;
        
        try {
            setLoading(true);
            setError(null);
            
            await resourcesService.updateResource(resource.id, editForm);
            
            onClose();
            
            // Reload resources
            if (onUpdateSuccess) {
                await onUpdateSuccess();
            }
            
        } catch (err) {
            setError(err.message || 'Failed to update resource');
        } finally {
            setLoading(false);
        }
    };

    const resourceTypeOptions = [
        { value: 'pdf', label: 'PDF Document' }
    ];

    const difficultyOptions = [
        { value: 1, label: 'Very Easy' },
        { value: 2, label: 'Easy' },
        { value: 3, label: 'Medium' },
        { value: 4, label: 'Hard' },
        { value: 5, label: 'Very Hard' }
    ];

    if (!resource) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Edit Resource"
            size="lg"
        >
            <form onSubmit={handleUpdateResource} className="space-y-4">
                {/* Error Display */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-3">
                        <div className="flex">
                            <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            <p className="text-sm text-red-800">{error}</p>
                        </div>
                    </div>
                )}

                {/* Current File Info */}
                {resource.file && (
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                        <div className="flex items-center">
                            <svg className="w-5 h-5 text-blue-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <div>
                                <p className="text-sm font-medium text-blue-900">Current File</p>
                                <p className="text-sm text-blue-700">File cannot be changed. To replace the file, delete this resource and upload a new one.</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Title */}
                <Input
                    label="Title"
                    value={editForm.title}
                    onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter resource title"
                    required
                />

                {/* Description */}
                <TextArea
                    label="Description"
                    value={editForm.description}
                    onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of the resource content"
                    rows={3}
                />

                {/* Resource Type */}
                <Select
                    label="Resource Type"
                    value={editForm.resource_type}
                    onChange={(e) => setEditForm(prev => ({ ...prev, resource_type: e.target.value }))}
                    options={resourceTypeOptions}
                    required
                />

                {/* Course */}
                <Select
                    label="Course"
                    value={editForm.course}
                    onChange={(e) => setEditForm(prev => ({ ...prev, course: e.target.value }))}
                    options={[
                        { value: '', label: 'No course assigned' },
                        ...courses.map(course => ({ value: course.id, label: course.name }))
                    ]}
                />

                {/* Subject */}
                <Input
                    label="Subject/Topic"
                    value={editForm.subject}
                    onChange={(e) => setEditForm(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="e.g., Data Structures, Algorithms, etc."
                />

                {/* URL (for web links) */}
                <Input
                    label="URL (for web resources)"
                    value={editForm.url}
                    onChange={(e) => setEditForm(prev => ({ ...prev, url: e.target.value }))}
                    placeholder="https://example.com"
                    type="url"
                />

                {/* Difficulty Level */}
                <Select
                    label="Difficulty Level"
                    value={editForm.difficulty_level}
                    onChange={(e) => setEditForm(prev => ({ ...prev, difficulty_level: parseInt(e.target.value) }))}
                    options={difficultyOptions}
                />

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                        {loading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Updating...
                            </>
                        ) : (
                            'Update Resource'
                        )}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default ResourceEditModal;


