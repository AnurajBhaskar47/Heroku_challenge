import { useState } from 'react';
import Card, { CardHeader, CardTitle, CardBody } from '../components/common/Card.jsx';
import Button from '../components/common/Button.jsx';
import { EmptyStudyPlansState } from '../components/common/EmptyState.jsx';

/**
 * Study Plans page component
 */
const StudyPlansPage = () => {
    const [studyPlans] = useState([]); // Will be populated from API
    const [isLoading] = useState(false);

    const handleCreatePlan = () => {
        // TODO: Implement create study plan
        alert('Create study plan functionality will be implemented soon!');
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-900">Study Plans</h1>
                </div>
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-500">Loading study plans...</p>
                </div>
            </div>
        );
    }

    if (studyPlans.length === 0) {
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-900">Study Plans</h1>
                    <Button onClick={handleCreatePlan}>Create Study Plan</Button>
                </div>
                <EmptyStudyPlansState onCreatePlan={handleCreatePlan} />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Study Plans</h1>
                    <p className="text-gray-600">
                        Create and manage your personalized study plans
                    </p>
                </div>
                <Button onClick={handleCreatePlan}>Create Study Plan</Button>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {studyPlans.map((plan) => (
                    <Card key={plan.id} hover clickable>
                        <CardHeader>
                            <CardTitle>{plan.title}</CardTitle>
                        </CardHeader>
                        <CardBody>
                            <p className="text-gray-600 text-sm mb-4">
                                {plan.description || 'No description available'}
                            </p>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500">Progress</span>
                                    <span className="font-medium">{plan.progress_percentage}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${plan.progress_percentage}%` }}
                                    ></div>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default StudyPlansPage;
