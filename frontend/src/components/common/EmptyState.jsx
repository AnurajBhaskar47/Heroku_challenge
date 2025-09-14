import Button from './Button.jsx';

/**
 * EmptyState component for empty data scenarios
 */
const EmptyState = ({
    title,
    description,
    icon,
    actionLabel,
    onAction,
    className = '',
}) => {
    const DefaultIcon = () => (
        <svg
            className="h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
            />
        </svg>
    );

    return (
        <div className={`text-center py-12 ${className}`}>
            <div className="flex justify-center mb-4">
                {icon || <DefaultIcon />}
            </div>

            {title && (
                <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
            )}

            {description && (
                <p className="text-gray-500 mb-6 max-w-md mx-auto">{description}</p>
            )}

            {actionLabel && onAction && (
                <Button onClick={onAction} variant="primary">
                    {actionLabel}
                </Button>
            )}
        </div>
    );
};

/**
 * Specific empty states for common scenarios
 */
export const EmptyCoursesState = ({ onAddCourse }) => (
    <EmptyState
        title="No courses yet"
        description="Get started by adding your first course to track assignments and create study plans."
        actionLabel="Add Course"
        onAction={onAddCourse}
        icon={
            <svg
                className="h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
            </svg>
        }
    />
);

export const EmptyStudyPlansState = ({ onCreatePlan }) => (
    <EmptyState
        title="No study plans yet"
        description="Create personalized study plans to organize your learning and track your progress."
        actionLabel="Create Study Plan"
        onAction={onCreatePlan}
        icon={
            <svg
                className="h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                />
            </svg>
        }
    />
);

export const EmptyAssignmentsState = ({ onAddAssignment }) => (
    <EmptyState
        title="No assignments yet"
        description="Add assignments to track your coursework and manage due dates."
        actionLabel="Add Assignment"
        onAction={onAddAssignment}
        icon={
            <svg
                className="h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
            </svg>
        }
    />
);

export const EmptySearchState = ({ searchQuery }) => (
    <EmptyState
        title="No results found"
        description={
            searchQuery
                ? `No results found for "${searchQuery}". Try adjusting your search terms.`
                : "Your search didn't return any results."
        }
        icon={
            <svg
                className="h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
            </svg>
        }
    />
);

export default EmptyState;
