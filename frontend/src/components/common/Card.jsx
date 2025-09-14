/**
 * Card component for wrapping content
 */
const Card = ({
    children,
    className = '',
    padding = 'default',
    shadow = 'default',
    hover = false,
    clickable = false,
    ...props
}) => {
    const baseClasses = 'bg-white rounded-lg border border-gray-200';

    const paddingClasses = {
        none: '',
        sm: 'p-4',
        default: 'p-6',
        lg: 'p-8',
    };

    const shadowClasses = {
        none: '',
        sm: 'shadow-sm',
        default: 'shadow',
        lg: 'shadow-lg',
    };

    const classes = [
        baseClasses,
        paddingClasses[padding],
        shadowClasses[shadow],
        hover && 'transition-shadow duration-200 hover:shadow-lg',
        clickable && 'cursor-pointer',
        className,
    ].filter(Boolean).join(' ');

    return (
        <div className={classes} {...props}>
            {children}
        </div>
    );
};

/**
 * Card Header component
 */
export const CardHeader = ({ children, className = '' }) => (
    <div className={`border-b border-gray-200 pb-4 mb-4 ${className}`}>
        {children}
    </div>
);

/**
 * Card Title component
 */
export const CardTitle = ({ children, className = '' }) => (
    <h3 className={`text-lg font-semibold text-gray-900 ${className}`}>
        {children}
    </h3>
);

/**
 * Card Footer component
 */
export const CardFooter = ({ children, className = '' }) => (
    <div className={`border-t border-gray-200 pt-4 mt-4 ${className}`}>
        {children}
    </div>
);

/**
 * Card Body component
 */
export const CardBody = ({ children, className = '' }) => (
    <div className={className}>
        {children}
    </div>
);

export default Card;
