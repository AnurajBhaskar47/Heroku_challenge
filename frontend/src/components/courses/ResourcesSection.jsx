import { useState, useEffect } from 'react';
import Card, { CardHeader, CardTitle, CardBody } from '../common/Card.jsx';
import Button from '../common/Button.jsx';
import Modal from '../common/Modal.jsx';
import { resourcesService } from '../../services/resources.js';
import { getErrorMessage } from '../../services/api.js';
import ResourceCard from '../resources/ResourceCard.jsx';
import ResourceUploadModal from '../resources/ResourceUploadModal.jsx';
import ResourceDetailsModal from '../resources/ResourceDetailsModal.jsx';
import ResourceEditModal from '../resources/ResourceEditModal.jsx';
import DeleteResourceModal from '../resources/DeleteResourceModal.jsx';

/**
 * Resources Section Component
 * Handles course-specific resources display and management
 */
const ResourcesSection = ({ courseId }) => {
    const [resources, setResources] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Modal states
    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    const [viewResourceModalOpen, setViewResourceModalOpen] = useState(false);
    const [editResourceModalOpen, setEditResourceModalOpen] = useState(false);
    const [deleteResourceModalOpen, setDeleteResourceModalOpen] = useState(false);
    const [selectedResource, setSelectedResource] = useState(null);

    // Fetch course resources
    const fetchResources = async () => {
        try {
            setIsLoading(true);
            setError(null);
            // Filter resources by course_id if the API supports it
            const response = await resourcesService.getResources({ course_id: courseId });
            setResources(response.results || response || []);
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (courseId) {
            fetchResources();
        }
    }, [courseId]);

    // Handle resource actions
    const handleViewResource = (resource) => {
        setSelectedResource(resource);
        setViewResourceModalOpen(true);
    };

    const handleEditResource = (resource) => {
        setSelectedResource(resource);
        setEditResourceModalOpen(true);
    };

    const handleDeleteResource = (resource) => {
        setSelectedResource(resource);
        setDeleteResourceModalOpen(true);
    };

    const handleUploadSuccess = () => {
        fetchResources();
        setUploadModalOpen(false);
    };

    const handleUpdateSuccess = () => {
        fetchResources();
        setEditResourceModalOpen(false);
        setSelectedResource(null);
    };

    const handleDeleteSuccess = () => {
        fetchResources();
        setDeleteResourceModalOpen(false);
        setSelectedResource(null);
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <div className="flex justify-between items-center px-4">
                    <CardTitle>Course Resources</CardTitle>
                    <Button size="sm" onClick={() => setUploadModalOpen(true)}>
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Add Resource
                    </Button>
                </div>
            </CardHeader>

            <CardBody className="h-[325px] flex flex-col">
                {error && (
                    <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3">
                        <p className="text-sm text-red-800">{error}</p>
                    </div>
                )}

                {isLoading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : resources.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center">
                        <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} 
                                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <h3 className="text-sm font-medium text-gray-900 mb-2">No resources yet</h3>
                        <p className="text-sm text-gray-500 mb-4">
                            Upload course materials to get started
                        </p>
                        <Button size="sm" onClick={() => setUploadModalOpen(true)}>
                            Upload Resource
                        </Button>
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pr-2">
                            {resources.map((resource) => (
                                <div key={resource.id} className="scale-95 origin-top-left">
                                    <ResourceCard
                                        resource={resource}
                                        onView={handleViewResource}
                                        onEdit={handleEditResource}
                                        onDelete={handleDeleteResource}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardBody>

            {/* Upload Modal */}
            <ResourceUploadModal
                isOpen={uploadModalOpen}
                onClose={() => setUploadModalOpen(false)}
                courses={[{ id: courseId }]} // Pass current course for pre-selection
                onUploadSuccess={handleUploadSuccess}
                preSelectedCourseId={courseId}
            />

            {/* View Modal */}
            <ResourceDetailsModal
                isOpen={viewResourceModalOpen}
                onClose={() => setViewResourceModalOpen(false)}
                resource={selectedResource}
            />

            {/* Edit Modal */}
            <ResourceEditModal
                isOpen={editResourceModalOpen}
                onClose={() => setEditResourceModalOpen(false)}
                resource={selectedResource}
                courses={[{ id: courseId }]}
                onUpdateSuccess={handleUpdateSuccess}
            />

            {/* Delete Modal */}
            <DeleteResourceModal
                isOpen={deleteResourceModalOpen}
                onClose={() => setDeleteResourceModalOpen(false)}
                resource={selectedResource}
                onDeleteSuccess={handleDeleteSuccess}
            />
        </Card>
    );
};

export default ResourcesSection;
