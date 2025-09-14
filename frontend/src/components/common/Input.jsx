import { forwardRef } from 'react';

/**
 * Input component with label and error support
 */
const Input = forwardRef(({
    label,
    error,
    helperText,
    required = false,
    disabled = false,
    fullWidth = false,
    className = '',
    id,
    name,
    type = 'text',
    placeholder,
    ...props
}, ref) => {
    const inputId = id || name || `input-${Math.random().toString(36).substr(2, 9)}`;

    const inputClasses = [
        'block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 transition-colors duration-200',
        'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
        error
            ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500'
            : 'border-gray-300 text-gray-900',
        disabled && 'bg-gray-50 cursor-not-allowed',
        className,
    ].filter(Boolean).join(' ');

    return (
        <div className={fullWidth ? 'w-full' : ''}>
            {label && (
                <label
                    htmlFor={inputId}
                    className="block text-sm font-medium text-gray-700 mb-1"
                >
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}

            <input
                ref={ref}
                id={inputId}
                name={name}
                type={type}
                className={inputClasses}
                placeholder={placeholder}
                disabled={disabled}
                aria-invalid={error ? 'true' : 'false'}
                aria-describedby={
                    error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
                }
                {...props}
            />

            {error && (
                <p id={`${inputId}-error`} className="mt-1 text-sm text-red-600">
                    {error}
                </p>
            )}

            {!error && helperText && (
                <p id={`${inputId}-helper`} className="mt-1 text-sm text-gray-500">
                    {helperText}
                </p>
            )}
        </div>
    );
});

Input.displayName = 'Input';

export default Input;
