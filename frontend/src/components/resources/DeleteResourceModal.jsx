import React, { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { resourcesService } from '../../services/resources';

const DeleteResourceModal = ({ isOpen, onClose, resource, onDeleteSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleDeleteResource = async () => {
        if (!resource) return;
        
        try {
            setLoading(true);
            setError(null);
            
            await resourcesService.deleteResource(resource.id);
            
            onClose();
            
            // Reload resources
            if (onDeleteSuccess) {
                await onDeleteSuccess();
            }
            
        } catch (err) {
            setError(err.message || 'Failed to delete resource');
        } finally {
            setLoading(false);
        }
    };

    if (!resource) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Delete Resource"
            size="md"
        >
            <div className="space-y-4">
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

                {/* Warning Message */}
                <div className="flex">
                    <div className="flex-shrink-0">
                        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>
                    <div className="ml-3">
                        <h3 className="text-sm font-medium text-gray-900">
                            Delete resource "{resource.title}"?
                        </h3>
                        <div className="mt-2 text-sm text-gray-500">
                            <p>
                                This action cannot be undone. The resource and its associated AI processing data will be permanently deleted.
                            </p>
                            {resource.file && (
                                <p className="mt-1 font-medium">
                                    The uploaded file will also be permanently removed.
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Resource Info */}
                <div className="bg-gray-50 rounded-md p-3">
                    <div className="flex items-start">
                        <div className="flex-shrink-0">
                            <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3 flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">{resource.title}</p>
                            <div className="flex items-center mt-1 space-x-2">
                                <span className="text-xs text-gray-500 uppercase">
                                    {resource.resource_type}
                                </span>
                                {resource.subject && (
                                    <>
                                        <span className="text-xs text-gray-400">•</span>
                                        <span className="text-xs text-gray-500">
                                            {resource.subject}
                                        </span>
                                    </>
                                )}
                            </div>
                            {resource.description && (
                                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                    {resource.description}
                                </p>
                            )}
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
                    <Button 
                        type="button"
                        variant="danger"
                        onClick={handleDeleteResource}
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Deleting...
                            </>
                        ) : (
                            'Delete Resource'
                        )}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default DeleteResourceModal;
