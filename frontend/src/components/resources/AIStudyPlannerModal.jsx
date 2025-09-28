import React, { useState } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Select from '../common/Select';
import TextArea from '../common/TextArea';
import Button from '../common/Button';

const AIStudyPlannerModal = ({ isOpen, onClose, courses, onGenerateSuccess, loading }) => {
    const [error, setError] = useState(null);
    const [aiPlannerForm, setAiPlannerForm] = useState({
        course: '',
        query: '',
        preferences: {
            study_hours_per_day: 2,
            difficulty_progression: 'gradual',
            target_grade: '',
            priority_topics: []
        }
    });

    const handleGenerateAIStudyPlan = async (e) => {
        e.preventDefault();
        
        try {
            setError(null);
            
            const planRequest = {
                course_id: aiPlannerForm.course,
                query: aiPlannerForm.query,
                preferences: aiPlannerForm.preferences
            };
            
            await onGenerateSuccess(planRequest);
            
            // Reset form and close modal on success
            setAiPlannerForm({
                course: '',
                query: '',
                preferences: {
                    study_hours_per_day: 2,
                    difficulty_progression: 'gradual',
                    target_grade: '',
                    priority_topics: []
                }
            });
            onClose();
            
        } catch (err) {
            setError(err.message || 'Failed to generate study plan');
        }
    };

    const difficultyProgressionOptions = [
        { value: 'gradual', label: 'Gradual Increase' },
        { value: 'mixed', label: 'Mixed Difficulty' },
        { value: 'front_loaded', label: 'Hardest Topics First' },
        { value: 'back_loaded', label: 'Easier Topics First' }
    ];

    const exampleQueries = [
        "Create a comprehensive study plan for Machine Learning. I have 6 weeks and prefer practical projects over theory."
    ];

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="AI Study Planner"
            size="lg"
        >
            <form onSubmit={handleGenerateAIStudyPlan} className="space-y-4">
                {/* AI Info Banner */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg mb-6 border border-blue-200">
                    <div className="flex items-start">
                        <div className="flex-shrink-0">
                            <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <h4 className="text-sm font-medium text-blue-900">AI-Powered Study Planning</h4>
                            <p className="text-sm text-blue-700 mt-1">
                                Describe your learning goals and constraints. We will analyze 
                                your uploaded resources to create a personalized study plan optimized for your success.
                            </p>
                        </div>
                    </div>
                </div>

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

                {/* Course Selection */}
                <Select
                    label="Course"
                    value={aiPlannerForm.course}
                    onChange={(e) => setAiPlannerForm(prev => ({ ...prev, course: e.target.value }))}
                    options={[
                        { value: '', label: 'Select a course' },
                        ...courses.map(course => ({ value: course.id, label: course.name }))
                    ]}
                    required
                />

                {/* Study Plan Request */}
                <div>
                    <TextArea
                        label="Study Plan Request"
                        value={aiPlannerForm.query}
                        onChange={(e) => setAiPlannerForm(prev => ({ ...prev, query: e.target.value }))}
                        placeholder="Describe your study goals, timeline, strengths, weaknesses, and any constraints..."
                        rows={4}
                        required
                    />
                    
                    {/* Example Queries */}
                    <div className="mt-3">
                        <p className="text-sm text-gray-600 mb-2">Example requests:</p>
                        <div className="space-y-2">
                            {exampleQueries.slice(0, 2).map((example, index) => (
                                <button
                                    key={index}
                                    type="button"
                                    onClick={() => setAiPlannerForm(prev => ({ ...prev, query: example }))}
                                    className="block text-left text-sm text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-md transition-colors duration-200 w-full"
                                >
                                    "{example}"
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Preferences Section */}
                <div className="border-t pt-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Study Preferences</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Study Hours per Day */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Study Hours per Day
                            </label>
                            <input
                                type="number"
                                min="0.5"
                                max="12"
                                step="0.5"
                                value={aiPlannerForm.preferences.study_hours_per_day}
                                onChange={(e) => setAiPlannerForm(prev => ({
                                    ...prev,
                                    preferences: {
                                        ...prev.preferences,
                                        study_hours_per_day: parseFloat(e.target.value)
                                    }
                                }))}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* Difficulty Progression */}
                        <Select
                            label="Difficulty Progression"
                            value={aiPlannerForm.preferences.difficulty_progression}
                            onChange={(e) => setAiPlannerForm(prev => ({
                                ...prev,
                                preferences: {
                                    ...prev.preferences,
                                    difficulty_progression: e.target.value
                                }
                            }))}
                            options={difficultyProgressionOptions}
                        />
                    </div>

                    {/* Target Grade */}
                    <div className="mt-4">
                        <Input
                            label="Target Grade (Optional)"
                            value={aiPlannerForm.preferences.target_grade}
                            onChange={(e) => setAiPlannerForm(prev => ({
                                ...prev,
                                preferences: {
                                    ...prev.preferences,
                                    target_grade: e.target.value
                                }
                            }))}
                            placeholder="e.g., A, B+, 85%, etc."
                        />
                    </div>
                </div>

                {/* AI Features Info */}
                <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
                    <h5 className="text-sm font-medium text-gray-900 mb-2">What our AI will create:</h5>
                    <ul className="text-sm text-gray-600 space-y-1">
                        <li className="flex items-center">
                            <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Personalized daily study schedule
                        </li>
                        <li className="flex items-center">
                            <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Topic sequencing based on prerequisites
                        </li>
                        <li className="flex items-center">
                            <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Resource recommendations from your uploads
                        </li>
                        <li className="flex items-center">
                            <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Progress milestones and checkpoints
                        </li>
                    </ul>
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
                    <Button type="submit" disabled={loading || !aiPlannerForm.course || !aiPlannerForm.query}>
                        {loading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Generating Plan...
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                Generate AI Study Plan
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default AIStudyPlannerModal;
