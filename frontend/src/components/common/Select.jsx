import { forwardRef } from 'react';

/**
 * Select component with label and error support
 */
const Select = forwardRef(({
    label,
    error,
    helperText,
    required = false,
    disabled = false,
    fullWidth = false,
    className = '',
    id,
    name,
    placeholder = 'Select an option...',
    options = [],
    children,
    ...props
}, ref) => {
    const selectId = id || name || `select-${Math.random().toString(36).substr(2, 9)}`;

    const selectClasses = [
        'block w-full px-3 py-2 border rounded-md shadow-sm bg-white transition-colors duration-200',
        'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
        error
            ? 'border-red-300 text-red-900 focus:ring-red-500 focus:border-red-500'
            : 'border-gray-300 text-gray-900',
        disabled && 'bg-gray-50 cursor-not-allowed',
        className,
    ].filter(Boolean).join(' ');

    return (
        <div className={fullWidth ? 'w-full' : ''}>
            {label && (
                <label
                    htmlFor={selectId}
                    className="block text-sm font-medium text-gray-700 mb-1"
                >
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}

            <select
                ref={ref}
                id={selectId}
                name={name}
                className={selectClasses}
                disabled={disabled}
                aria-invalid={error ? 'true' : 'false'}
                aria-describedby={
                    error ? `${selectId}-error` : helperText ? `${selectId}-helper` : undefined
                }
                {...props}
            >
                {placeholder && (
                    <option value="" disabled>
                        {placeholder}
                    </option>
                )}

                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}

                {children}
            </select>

            {error && (
                <p id={`${selectId}-error`} className="mt-1 text-sm text-red-600">
                    {error}
                </p>
            )}

            {!error && helperText && (
                <p id={`${selectId}-helper`} className="mt-1 text-sm text-gray-500">
                    {helperText}
                </p>
            )}
        </div>
    );
});

Select.displayName = 'Select';

export default Select;
