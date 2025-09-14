import { useState } from 'react';
import { formatDate } from '../../utils/formatters.js';
import DropdownMenu from '../common/DropdownMenu.jsx';
import ConfirmationModal from '../common/ConfirmationModal.jsx';

/**
 * Assignment card component for display in lists
 */
const AssignmentCard = ({ assignment, onEdit, onDelete, onUpdateStatus }) => {
    const [isDeleting, setIsDeleting] = useState(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

    const handleStatusUpdate = async (status) => {
        await onUpdateStatus(assignment, status);
    };

    const handleDelete = () => {
        setIsDeleteConfirmOpen(true);
    };

    const confirmDelete = async () => {
        setIsDeleting(true);
        const result = await onDelete(assignment);
        if (!result.success) {
            setIsDeleting(false);
        }
        setIsDeleteConfirmOpen(false);
    };

    const menuItems = [
        {
            label: 'Mark In Progress',
            onClick: () => handleStatusUpdate('in_progress'),
            disabled: assignment.status === 'in_progress',
        },
        {
            label: 'Mark Completed',
            onClick: () => handleStatusUpdate('completed'),
            disabled: assignment.status === 'completed',
        },
        {
            label: 'Edit',
            onClick: () => onEdit(assignment),
        },
        {
            label: 'Delete',
            onClick: handleDelete,
            className: 'text-red-600 hover:text-red-800',
        },
    ];

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-800';
            case 'in_progress': return 'bg-blue-100 text-blue-800';
            case 'overdue': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (isDeleting) {
        return (
            <div className="p-3 bg-red-50 rounded-lg text-center text-sm text-red-600">
                Deleting...
            </div>
        );
    }

    return (
        <>
            <div className="p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <h5 className="font-medium text-sm text-gray-900">{assignment.title}</h5>
                        {assignment.due_date && (
                            <p className="text-xs text-gray-600">
                                Due: {formatDate(assignment.due_date)}
                            </p>
                        )}
                    </div>
                    <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(assignment.status)}`}>
                            {assignment.status?.replace('_', ' ')}
                        </span>
                        <DropdownMenu items={menuItems} />
                    </div>
                </div>

            </div>

            <ConfirmationModal
                isOpen={isDeleteConfirmOpen}
                onClose={() => setIsDeleteConfirmOpen(false)}
                onConfirm={confirmDelete}
                title="Delete Assignment"
                message={`Are you sure you want to delete "${assignment.title}"?`}
                confirmText="Delete"
                isConfirming={isDeleting}
            />
        </>
    );
};

export default AssignmentCard;
