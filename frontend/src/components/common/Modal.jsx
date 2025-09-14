import { useEffect } from 'react';
import Button from './Button.jsx';

/**
 * Modal component for dialogs and overlays
 */
const Modal = ({
    isOpen,
    onClose,
    title,
    children,
    size = 'md',
    showCloseButton = true,
    closeOnOverlayClick = true,
    className = '',
}) => {
    const sizeClasses = {
        xs: 'max-w-xs',
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        '2xl': 'max-w-2xl',
        '4xl': 'max-w-4xl',
        full: 'max-w-full mx-4',
    };

    // Handle escape key press
    useEffect(() => {
        const handleEscape = (event) => {
            if (event.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? 'modal-title' : undefined}
        >
            {/* Backdrop */}
            <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
                    onClick={closeOnOverlayClick ? onClose : undefined}
                />

                {/* Center modal */}
                <span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">
                    &#8203;
                </span>

                <div
                    className={[
                        'relative inline-block transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:p-6 sm:align-middle',
                        sizeClasses[size],
                        className,
                    ].filter(Boolean).join(' ')}
                >
                    {/* Header */}
                    {(title || showCloseButton) && (
                        <div className="flex items-center justify-between mb-4">
                            {title && (
                                <h3 id="modal-title" className="text-lg font-semibold text-gray-900">
                                    {title}
                                </h3>
                            )}
                            {showCloseButton && (
                                <button
                                    onClick={onClose}
                                    className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    aria-label="Close modal"
                                >
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    )}

                    {/* Content */}
                    <div>{children}</div>
                </div>
            </div>
        </div>
    );
};

/**
 * Modal Header component
 */
export const ModalHeader = ({ children, className = '' }) => (
    <div className={`border-b border-gray-200 pb-4 mb-4 ${className}`}>
        {children}
    </div>
);

/**
 * Modal Body component
 */
export const ModalBody = ({ children, className = '' }) => (
    <div className={`py-2 ${className}`}>
        {children}
    </div>
);

/**
 * Modal Footer component
 */
export const ModalFooter = ({
    children,
    className = '',
    onCancel,
    onConfirm,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    confirmVariant = 'primary',
    showDefaultActions = false,
}) => (
    <div className={`border-t border-gray-200 pt-4 mt-4 flex justify-end space-x-3 ${className}`}>
        {showDefaultActions ? (
            <>
                {onCancel && (
                    <Button variant="secondary" onClick={onCancel}>
                        {cancelText}
                    </Button>
                )}
                {onConfirm && (
                    <Button variant={confirmVariant} onClick={onConfirm}>
                        {confirmText}
                    </Button>
                )}
            </>
        ) : (
            children
        )}
    </div>
);

/**
 * Confirmation Modal
 */
export const ConfirmModal = ({
    isOpen,
    onClose,
    onConfirm,
    title = 'Confirm Action',
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'danger',
}) => (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
        <div className="sm:flex sm:items-start">
            <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
            </div>
            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <div className="mt-2">
                    <p className="text-sm text-gray-500">{message}</p>
                </div>
            </div>
        </div>
        <ModalFooter className="sm:flex sm:flex-row-reverse">
            <Button
                variant={variant}
                onClick={onConfirm}
                className="w-full sm:w-auto sm:ml-3"
            >
                {confirmText}
            </Button>
            <Button
                variant="secondary"
                onClick={onClose}
                className="mt-3 w-full sm:mt-0 sm:w-auto"
            >
                {cancelText}
            </Button>
        </ModalFooter>
    </Modal>
);

export default Modal;
