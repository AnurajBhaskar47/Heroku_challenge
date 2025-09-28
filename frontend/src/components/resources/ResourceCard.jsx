import React from 'react';
import Card from '../common/Card';
import DropdownMenu from '../common/DropdownMenu';

const ResourceCard = ({ resource, onView, onEdit, onDelete }) => {
    const getResourceTypeIcon = (type) => {
        // Since we only support PDF now, always return PDF icon
        return (
            <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
            </svg>
        );
    };

    const getDifficultyColor = (level) => {
        const colors = {
            1: 'bg-green-100 text-green-800',
            2: 'bg-blue-100 text-blue-800',
            3: 'bg-yellow-100 text-yellow-800',
            4: 'bg-orange-100 text-orange-800',
            5: 'bg-red-100 text-red-800'
        };
        return colors[level] || colors[3];
    };

    const getDifficultyLabel = (level) => {
        const labels = {
            1: 'Very Easy',
            2: 'Easy',
            3: 'Medium',
            4: 'Hard',
            5: 'Very Hard'
        };
        return labels[level] || 'Medium';
    };

    const formatFileSize = (bytes) => {
        if (!bytes) return '';
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const dropdownMenuItems = [
        {
            label: 'Edit',
            onClick: (e) => {
                e.stopPropagation();
                onEdit(resource);
            },
            icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
            )
        },
        {
            label: 'Delete',
            onClick: (e) => {
                e.stopPropagation();
                onDelete(resource);
            },
            icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
            ),
            className: 'text-red-600 hover:text-red-700 hover:bg-red-50'
        }
    ];

    return (
        <Card className="group hover:shadow-lg transition-all duration-200">
            <div className="p-6">
                {/* Header with icon, title and dropdown */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center flex-1 min-w-0">
                        <div className="flex-shrink-0">
                            {getResourceTypeIcon(resource.resource_type)}
                        </div>
                        <div className="ml-3 flex-1 min-w-0">
                            <h3 className="text-sm font-medium text-gray-900 truncate">
                                {resource.title}
                            </h3>
                            <div className="flex items-center mt-1 space-x-2">
                                <span className="text-xs text-gray-500 uppercase">
                                    {resource.resource_type}
                                </span>
                                {resource.file_size && (
                                    <>
                                        <span className="text-xs text-gray-400">•</span>
                                        <span className="text-xs text-gray-500">
                                            {formatFileSize(resource.file_size)}
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                        <DropdownMenu
                            items={dropdownMenuItems}
                            className="relative"
                            position="right"
                        />
                    </div>
                </div>

                {/* Content */}
                <div className="space-y-3">
                    {/* Subject */}
                    {resource.subject && (
                        <div className="flex items-center text-sm">
                            <svg className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                            <span className="text-gray-600 truncate">{resource.subject}</span>
                        </div>
                    )}
                    
                    {/* Description */}
                    {resource.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                            {resource.description}
                        </p>
                    )}
                </div>
                
                {/* Footer with difficulty, rating, and date */}
                <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100">
                    <div className="flex items-center space-x-3">
                        {/* Difficulty Badge */}
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDifficultyColor(resource.difficulty_level)}`}>
                            {getDifficultyLabel(resource.difficulty_level)}
                        </span>
                        
                        {/* Rating */}
                        {resource.rating && (
                            <div className="flex items-center">
                                <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                                <span className="text-xs text-gray-500 ml-1">{resource.rating.toFixed(1)}</span>
                            </div>
                        )}
                    </div>
                    
                    {/* Upload Date */}
                    <span className="text-xs text-gray-500">
                        {formatDate(resource.created_at)}
                    </span>
                </div>

                {/* Processing Status */}
                {resource.processing_status && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                        {resource.processing_status === 'processing' && (
                            <div className="flex items-center text-xs text-blue-600">
                                <svg className="animate-spin -ml-1 mr-2 h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                AI Processing...
                            </div>
                        )}
                        
                        {resource.processing_status === 'completed' && (
                            <div className="flex items-center text-xs text-green-600">
                                <svg className="w-3 h-3 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                Ready for AI Study Plans
                            </div>
                        )}
                        
                        {resource.processing_status === 'failed' && (
                            <div className="flex items-center text-xs text-red-600">
                                <svg className="w-3 h-3 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                Processing Failed
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Card>
    );
};

export default ResourceCard;
