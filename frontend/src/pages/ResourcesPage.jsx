import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import { resourcesService } from '../services/resources';
import { coursesService } from '../services/courses';
import ResourceUploadModal from '../components/resources/ResourceUploadModal';
import AIStudyPlannerModal from '../components/resources/AIStudyPlannerModal';
import ResourceCard from '../components/resources/ResourceCard';
import ResourceDetailsModal from '../components/resources/ResourceDetailsModal';
import ResourceEditModal from '../components/resources/ResourceEditModal';
import DeleteResourceModal from '../components/resources/DeleteResourceModal';

const ResourcesPage = () => {
    const navigate = useNavigate();
    
    // State management
    const [resources, setResources] = useState([]);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    // Modal states
    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    const [aiPlannerModalOpen, setAiPlannerModalOpen] = useState(false);
    const [viewResourceModalOpen, setViewResourceModalOpen] = useState(false);
    const [editResourceModalOpen, setEditResourceModalOpen] = useState(false);
    const [deleteResourceModalOpen, setDeleteResourceModalOpen] = useState(false);
    const [selectedResource, setSelectedResource] = useState(null);

    // Load data
    const loadResources = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await resourcesService.getResources();
            setResources(data.results || data);
        } catch (err) {
            setError(err.message || 'Failed to load resources');
        } finally {
            setLoading(false);
        }
    }, []);

    const loadCourses = useCallback(async () => {
        try {
            const data = await coursesService.getCourses();
            setCourses(data.results || data);
        } catch (err) {
            console.error('Failed to load courses:', err);
        }
    }, []);

    useEffect(() => {
        loadResources();
        loadCourses();
    }, [loadResources, loadCourses]);

    // Generate AI study plan
    const handleGenerateAIStudyPlan = async (planRequest) => {
        try {
            setLoading(true);
            const response = await resourcesService.generateStudyPlan(planRequest);
            
            if (response.success && response.study_plan) {
                // Navigate to study plans with the new plan
                navigate('/study-plans', { 
                    state: { 
                        newPlan: response.study_plan,
                        message: 'RAG-powered AI study plan created successfully with context from your uploaded resources!' 
                    }
                });
            } else {
                throw new Error(response.error || 'Failed to generate study plan');
            }
            
        } catch (err) {
            setError(err.message || 'Failed to generate study plan');
            throw err; // Re-throw to let the modal handle it
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Study Resources</h1>
                        <p className="text-gray-600 mt-2">
                            Upload and manage your study materials, create AI-powered study plans
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <Button
                            onClick={() => setAiPlannerModalOpen(true)}
                            variant="outline"
                            className="flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                            AI Study Planner
                        </Button>
                        <Button
                            onClick={() => setUploadModalOpen(true)}
                            className="flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            Upload Resource
                        </Button>
                    </div>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
                        <div className="flex">
                            <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            <div className="ml-3">
                                <p className="text-sm text-red-800">{error}</p>
                            </div>
                            <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                    </div>
                )}

                {/* Resources Grid */}
                {loading ? (
                    <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                ) : resources.length === 0 ? (
                    <div className="text-center py-12">
                        <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} 
                                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No resources yet</h3>
                        <p className="text-gray-500 mb-6">
                            Upload your first study resource to get started with AI-powered learning
                        </p>
                        <Button onClick={() => setUploadModalOpen(true)}>
                            Upload Your First Resource
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {resources.map((resource) => (
                            <ResourceCard
                                key={resource.id}
                                resource={resource}
                                onView={(resource) => {
                                    setSelectedResource(resource);
                                    setViewResourceModalOpen(true);
                                }}
                                onEdit={(resource) => {
                                    setSelectedResource(resource);
                                    setEditResourceModalOpen(true);
                                }}
                                onDelete={(resource) => {
                                    setSelectedResource(resource);
                                    setDeleteResourceModalOpen(true);
                                }}
                            />
                        ))}
                    </div>
                )}

                {/* Modals */}
                <ResourceUploadModal
                    isOpen={uploadModalOpen}
                    onClose={() => setUploadModalOpen(false)}
                    courses={courses}
                    onUploadSuccess={loadResources}
                />

                <AIStudyPlannerModal
                    isOpen={aiPlannerModalOpen}
                    onClose={() => setAiPlannerModalOpen(false)}
                    courses={courses}
                    onGenerateSuccess={handleGenerateAIStudyPlan}
                    loading={loading}
                />

                <ResourceDetailsModal
                    isOpen={viewResourceModalOpen}
                    onClose={() => setViewResourceModalOpen(false)}
                    resource={selectedResource}
                />

                <ResourceEditModal
                    isOpen={editResourceModalOpen}
                    onClose={() => setEditResourceModalOpen(false)}
                    resource={selectedResource}
                    courses={courses}
                    onUpdateSuccess={loadResources}
                />

                <DeleteResourceModal
                    isOpen={deleteResourceModalOpen}
                    onClose={() => setDeleteResourceModalOpen(false)}
                    resource={selectedResource}
                    onDeleteSuccess={loadResources}
                />
            </div>
        </div>
    );
};

export default ResourcesPage;