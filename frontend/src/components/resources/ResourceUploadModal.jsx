import React, { useState } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Select from '../common/Select';
import Textarea from '../common/Textarea';
import Button from '../common/Button';
import { resourcesService } from '../../services/resources';

const ResourceUploadModal = ({ isOpen, onClose, courses, onUploadSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [uploadForm, setUploadForm] = useState({
        title: '',
        description: '',
        resource_type: 'pdf',
        course: '',
        subject: '',
        difficulty_level: 3,
        file: null
    });

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setUploadForm(prev => ({
                ...prev,
                file,
                title: prev.title || file.name.replace(/\.[^/.]+$/, "")
            }));
        }
    };

    const handleUploadResource = async (e) => {
        e.preventDefault();
        
        if (!uploadForm.file) {
            setError('Please select a file to upload');
            return;
        }
        
        try {
            setLoading(true);
            setError(null);
            
            const formData = new FormData();
            Object.keys(uploadForm).forEach(key => {
                if (key === 'file') {
                    formData.append(key, uploadForm[key]);
                } else {
                    formData.append(key, uploadForm[key]);
                }
            });
            
            await resourcesService.uploadResource(formData);
            
            // Reset form and close modal
            setUploadForm({
                title: '',
                description: '',
                resource_type: 'pdf',
                course: '',
                subject: '',
                difficulty_level: 3,
                file: null
            });
            onClose();
            
            // Reload resources
            if (onUploadSuccess) {
                await onUploadSuccess();
            }
            
        } catch (err) {
            setError(err.message || 'Failed to upload resource');
        } finally {
            setLoading(false);
        }
    };

    const resourceTypeOptions = [
        { value: 'pdf', label: 'PDF Document' },
        { value: 'docx', label: 'Word Document' },
        { value: 'txt', label: 'Text File' },
        { value: 'pptx', label: 'PowerPoint' },
        { value: 'url', label: 'Web Link' },
        { value: 'video', label: 'Video' }
    ];

    const difficultyOptions = [
        { value: 1, label: 'Very Easy' },
        { value: 2, label: 'Easy' },
        { value: 3, label: 'Medium' },
        { value: 4, label: 'Hard' },
        { value: 5, label: 'Very Hard' }
    ];

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Upload Study Resource"
            size="lg"
        >
            <form onSubmit={handleUploadResource} className="space-y-4">
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

                {/* File Upload */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select File *
                    </label>
                    <input
                        type="file"
                        accept=".pdf,.docx,.doc,.txt,.pptx"
                        onChange={handleFileSelect}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                </div>

                {/* Title */}
                <Input
                    label="Title *"
                    value={uploadForm.title}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter resource title"
                    required
                />

                {/* Description */}
                <Textarea
                    label="Description"
                    value={uploadForm.description}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of the resource content"
                    rows={3}
                />

                {/* Resource Type */}
                <Select
                    label="Resource Type *"
                    value={uploadForm.resource_type}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, resource_type: e.target.value }))}
                    options={resourceTypeOptions}
                    required
                />

                {/* Course */}
                <Select
                    label="Course *"
                    value={uploadForm.course}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, course: e.target.value }))}
                    options={[
                        { value: '', label: 'Select a course' },
                        ...courses.map(course => ({ value: course.id, label: course.name }))
                    ]}
                    required
                />

                {/* Subject */}
                <Input
                    label="Subject/Topic"
                    value={uploadForm.subject}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="e.g., Data Structures, Algorithms, etc."
                />

                {/* Difficulty Level */}
                <Select
                    label="Difficulty Level"
                    value={uploadForm.difficulty_level}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, difficulty_level: parseInt(e.target.value) }))}
                    options={difficultyOptions}
                />

                {/* AI Processing Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                    <div className="flex">
                        <svg className="w-5 h-5 text-blue-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <div>
                            <h4 className="text-sm font-medium text-blue-900">AI Processing</h4>
                            <p className="text-sm text-blue-700 mt-1">
                                Your resource will be automatically processed with AI to extract topics, 
                                create searchable content, and enable smart study plan generation.
                            </p>
                        </div>
                    </div>
                </div>

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
                                Processing...
                            </>
                        ) : (
                            'Upload Resource'
                        )}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default ResourceUploadModal;
