import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { resourcesService } from '../../services/resources';

const ResourceDetailsModal = ({ isOpen, onClose, resource }) => {
    const [loading, setLoading] = useState(false);
    const [processingInfo, setProcessingInfo] = useState(null);
    const [extractedTopics, setExtractedTopics] = useState([]);
    const [documentChunks, setDocumentChunks] = useState([]);

    // Load additional resource information when modal opens
    useEffect(() => {
        if (isOpen && resource?.id) {
            loadResourceDetails();
        }
    }, [isOpen, resource?.id]);

    const loadResourceDetails = async () => {
        if (!resource?.id) return;
        
        try {
            setLoading(true);
            
            // Load processing status and additional info
            const [statusData, topicsData, chunksData] = await Promise.allSettled([
                resourcesService.getProcessingStatus(resource.id),
                resourcesService.getExtractedTopics(resource.id),
                resourcesService.getDocumentChunks(resource.id)
            ]);

            if (statusData.status === 'fulfilled') {
                setProcessingInfo(statusData.value);
            }
            
            if (topicsData.status === 'fulfilled') {
                setExtractedTopics(topicsData.value || []);
            }
            
            if (chunksData.status === 'fulfilled') {
                setDocumentChunks(chunksData.value || []);
            }
            
        } catch (error) {
            console.error('Failed to load resource details:', error);
        } finally {
            setLoading(false);
        }
    };

    const getResourceTypeIcon = (type) => {
        return (
            <svg fill="currentColor" width="16" height="16" viewBox="0 0 56 56" xmlns="http://www.w3.org/2000/svg">
                <path d="M 15.5547 53.125 L 40.4453 53.125 C 45.2969 53.125 47.7109 50.6640 47.7109 45.7890 L 47.7109 24.5078 C 47.7109 21.4844 47.3828 20.1718 45.5078 18.2500 L 32.5703 5.1015 C 30.7891 3.2734 29.3359 2.8750 26.6875 2.8750 L 15.5547 2.8750 C 10.7266 2.8750 8.2891 5.3594 8.2891 10.2344 L 8.2891 45.7890 C 8.2891 50.6875 10.7266 53.125 15.5547 53.125 Z M 15.7422 49.3515 C 13.3281 49.3515 12.0625 48.0625 12.0625 45.7187 L 12.0625 10.3047 C 12.0625 7.9844 13.3281 6.6484 15.7656 6.6484 L 26.1718 6.6484 L 26.1718 20.2656 C 26.1718 23.2187 27.6718 24.6718 30.5781 24.6718 L 43.9375 24.6718 L 43.9375 45.7187 C 43.9375 48.0625 42.6953 49.3515 40.2578 49.3515 Z M 31.0000 21.1328 C 30.0859 21.1328 29.7109 20.7578 29.7109 19.8203 L 29.7109 7.3750 L 43.2109 21.1328 Z"/>
            </svg>
        );
    };

    const getDifficultyLabel = (level) => {
        const labels = {
            1: 'Very Easy',
            2: 'Easy', 
            3: 'Medium',
            4: 'Hard',
            5: 'Very Hard'
        };
        return labels[level] || 'Medium';
    };

    const formatFileSize = (bytes) => {
        if (!bytes) return 'Unknown size';
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Unknown date';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleOpenResource = () => {
        if (resource?.file_url || resource?.url) {
            window.open(resource.file_url || resource.url, '_blank');
        }
    };

    if (!resource) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={
                <div className="flex items-center space-x-2">
                    {getResourceTypeIcon(resource.resource_type)}
                    <span>{resource.title}</span>
                </div>
            }
            size="lg"
        >
            <div className="space-y-6">
                {/* Resource Overview */}
                <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                        <div>
                            <span className="font-medium text-gray-700">Type:</span>
                            <span className="ml-2 text-gray-900 capitalize">{resource.resource_type}</span>
                        </div>
                        
                        <div>
                            <span className="font-medium text-gray-700">Difficulty:</span>
                            <span className="ml-2 text-gray-900">{getDifficultyLabel(resource.difficulty_level)}</span>
                        </div>
                        
                        {resource.file_size && (
                            <div>
                                <span className="font-medium text-gray-700">Size:</span>
                                <span className="ml-2 text-gray-900">{formatFileSize(resource.file_size)}</span>
                            </div>
                        )}
                        
                        {resource.estimated_time && (
                            <div>
                                <span className="font-medium text-gray-700">Est. Time:</span>
                                <span className="ml-2 text-gray-900">{resource.estimated_time} hours</span>
                            </div>
                        )}
                        
                        {resource.rating && (
                            <div>
                                <span className="font-medium text-gray-700">Rating:</span>
                                <div className="ml-2 inline-flex items-center">
                                    <span className="text-gray-900">{resource.rating.toFixed(1)}</span>
                                    <svg className="w-4 h-4 text-yellow-400 ml-1" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                </div>
                            </div>
                        )}
                        
                        <div>
                            <span className="font-medium text-gray-700">Uploaded:</span>
                            <span className="ml-2 text-gray-900">{formatDate(resource.created_at)}</span>
                        </div>
                    </div>
                </div>

                {/* Description */}
                {resource.description && (
                    <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Description</h4>
                        <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">
                            {resource.description}
                        </p>
                    </div>
                )}

                {/* Subject/Topic */}
                {resource.subject && (
                    <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Subject</h4>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {resource.subject}
                        </span>
                    </div>
                )}

                {/* AI Processing Status */}
                {processingInfo && (
                    <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">AI Processing Status</h4>
                        <div className="bg-gray-50 rounded-lg p-3">
                            {processingInfo.status === 'processing' && (
                                <div className="flex items-center text-blue-600">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <div>
                                        <p className="font-medium">Processing in progress...</p>
                                        <p className="text-sm text-gray-600 mt-1">Your resource is being analyzed by AI for smart study plan generation.</p>
                                    </div>
                                </div>
                            )}
                            
                            {processingInfo.status === 'completed' && (
                                <div className="flex items-center text-green-600">
                                    <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    <div>
                                        <p className="font-medium">Ready for AI study plans!</p>
                                        <p className="text-sm text-gray-600 mt-1">This resource has been processed and is available for personalized study planning.</p>
                                    </div>
                                </div>
                            )}
                            
                            {processingInfo.status === 'failed' && (
                                <div className="flex items-center text-red-600">
                                    <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    <div>
                                        <p className="font-medium">Processing failed</p>
                                        <p className="text-sm text-gray-600 mt-1">There was an issue processing this resource. You can still use it manually.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Extracted Topics */}
                {extractedTopics.length > 0 && (
                    <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">AI-Extracted Topics</h4>
                        <div className="flex flex-wrap gap-2">
                            {extractedTopics.map((topic, index) => (
                                <span
                                    key={index}
                                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                                >
                                    {topic}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Document Analysis */}
                {documentChunks.length > 0 && (
                    <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Content Analysis</h4>
                        <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Content Sections:</span>
                                <span className="font-medium text-gray-900">{documentChunks.length}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Total Words:</span>
                                <span className="font-medium text-gray-900">
                                    {documentChunks.reduce((total, chunk) => total + (chunk.word_count || 0), 0).toLocaleString()}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Est. Study Time:</span>
                                <span className="font-medium text-gray-900">
                                    {Math.round(documentChunks.reduce((total, chunk) => total + (chunk.estimated_study_time || 0), 0) / 60)} hours
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-between pt-4 border-t border-gray-200">
                    <Button
                        variant="outline"
                        onClick={onClose}
                    >
                        Close
                    </Button>
                    
                    <div className="flex gap-3">
                        {(resource.file_url || resource.url) && (
                            <Button
                                onClick={handleOpenResource}
                                className="flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                                Open Resource
                            </Button>
                        )}
                    </div>
                </div>

                {/* AI Features Promotion */}
                {processingInfo?.status === 'completed' && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start">
                            <svg className="w-5 h-5 text-blue-500 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                            <div>
                                <h5 className="text-sm font-medium text-blue-900">Ready for AI Study Planning!</h5>
                                <p className="text-sm text-blue-700 mt-1">
                                    This resource has been analyzed and can now be used to create personalized study plans. 
                                    Try the AI Study Planner to get customized recommendations based on this content.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {loading && (
                <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
                    <div className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="text-sm text-gray-600">Loading details...</span>
                    </div>
                </div>
            )}
        </Modal>
    );
};

export default ResourceDetailsModal;
