import { forwardRef } from 'react';

/**
 * Textarea component with label and error support
 */
const TextArea = forwardRef(({
    label,
    error,
    helperText,
    required = false,
    disabled = false,
    fullWidth = false,
    className = '',
    id,
    name,
    placeholder,
    rows = 4,
    maxLength,
    ...props
}, ref) => {
    const textareaId = id || name || `textarea-${Math.random().toString(36).substr(2, 9)}`;

    const textareaClasses = [
        'block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 transition-colors duration-200 resize-vertical',
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
                    htmlFor={textareaId}
                    className="block text-sm font-medium text-gray-700 mb-1"
                >
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}

            <textarea
                ref={ref}
                id={textareaId}
                name={name}
                rows={rows}
                className={textareaClasses}
                placeholder={placeholder}
                disabled={disabled}
                maxLength={maxLength}
                aria-invalid={error ? 'true' : 'false'}
                aria-describedby={
                    error ? `${textareaId}-error` : helperText ? `${textareaId}-helper` : undefined
                }
                {...props}
            />

            {maxLength && (
                <div className="mt-1 text-right">
                    <span className="text-xs text-gray-500">
                        {props.value?.length || 0}/{maxLength}
                    </span>
                </div>
            )}

            {error && (
                <p id={`${textareaId}-error`} className="mt-1 text-sm text-red-600">
                    {error}
                </p>
            )}

            {!error && helperText && (
                <p id={`${textareaId}-helper`} className="mt-1 text-sm text-gray-500">
                    {helperText}
                </p>
            )}
        </div>
    );
});

TextArea.displayName = 'Textarea';

export default TextArea;
