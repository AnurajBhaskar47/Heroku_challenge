/**
 * Loader component for loading states
 */
const Loader = ({
    size = 'md',
    color = 'primary',
    className = '',
    text,
    fullScreen = false,
}) => {
    const sizeClasses = {
        xs: 'h-3 w-3',
        sm: 'h-4 w-4',
        md: 'h-8 w-8',
        lg: 'h-12 w-12',
        xl: 'h-16 w-16',
    };

    const colorClasses = {
        primary: 'border-primary-600',
        secondary: 'border-secondary-600',
        white: 'border-white',
        gray: 'border-gray-600',
    };

    const spinnerClasses = [
        'animate-spin rounded-full border-2 border-t-transparent',
        sizeClasses[size],
        colorClasses[color],
        className,
    ].filter(Boolean).join(' ');

    const LoaderContent = () => (
        <div className="flex flex-col items-center justify-center">
            <div className={spinnerClasses} />
            {text && (
                <p className="mt-2 text-sm text-gray-600 animate-pulse">{text}</p>
            )}
        </div>
    );

    if (fullScreen) {
        return (
            <div className="fixed inset-0 bg-white bg-opacity-75 z-50 flex items-center justify-center">
                <LoaderContent />
            </div>
        );
    }

    return <LoaderContent />;
};

/**
 * Skeleton loader for content placeholders
 */
export const Skeleton = ({
    className = '',
    width = 'w-full',
    height = 'h-4',
    rounded = 'rounded',
    animate = true,
}) => {
    const classes = [
        'bg-gray-200',
        width,
        height,
        rounded,
        animate && 'animate-pulse',
        className,
    ].filter(Boolean).join(' ');

    return <div className={classes} />;
};

/**
 * Text skeleton with multiple lines
 */
export const TextSkeleton = ({ lines = 3, className = '' }) => (
    <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }).map((_, index) => (
            <Skeleton
                key={index}
                height="h-4"
                width={index === lines - 1 ? 'w-3/4' : 'w-full'}
            />
        ))}
    </div>
);

/**
 * Card skeleton
 */
export const CardSkeleton = ({ className = '' }) => (
    <div className={`bg-white p-6 rounded-lg border border-gray-200 ${className}`}>
        <div className="space-y-4">
            <Skeleton height="h-6" width="w-3/4" />
            <TextSkeleton lines={2} />
            <div className="flex space-x-2">
                <Skeleton height="h-8" width="w-20" rounded="rounded-md" />
                <Skeleton height="h-8" width="w-20" rounded="rounded-md" />
            </div>
        </div>
    </div>
);

export default Loader;
