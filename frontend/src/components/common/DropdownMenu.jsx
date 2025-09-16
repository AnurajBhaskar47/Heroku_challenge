import { useState, useRef, useEffect } from 'react';
import Button from './Button.jsx';

/**
 * Dropdown menu component
 */
const DropdownMenu = ({ items, className = '', trigger = null }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleItemClick = (item, event) => {
        setIsOpen(false);
        if (item.onClick) {
            item.onClick(event);
        }
    };

    const defaultTrigger = (
        <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
                e.stopPropagation();
                setIsOpen(!isOpen);
            }}
            className="p-2"
        >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
        </Button>
    );

    return (
        <div className={`relative inline-block ${className}`} ref={dropdownRef}>
            {trigger || defaultTrigger}

            {isOpen && (
                <div className="absolute right-0 z-10 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="py-1" role="none">
                        {items.map((item, index) => (
                            <button
                                key={index}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleItemClick(item, e);
                                }}
                                className={`${item.className || 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                                    } group flex items-center px-4 py-2 text-sm w-full text-left transition-colors`}
                                role="menuitem"
                            >
                                {item.icon && (
                                    <span className="mr-3 text-gray-400 group-hover:text-gray-500">
                                        {item.icon}
                                    </span>
                                )}
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default DropdownMenu;
