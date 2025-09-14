import { useState } from 'react';
import Card, { CardHeader, CardTitle, CardBody } from '../components/common/Card.jsx';
import Button from '../components/common/Button.jsx';
import Input from '../components/common/Input.jsx';
import { EmptySearchState } from '../components/common/EmptyState.jsx';

/**
 * Resources page component
 */
const ResourcesPage = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [resources, setResources] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;

        setIsLoading(true);
        setHasSearched(true);

        // Simulate API call
        setTimeout(() => {
            // Mock empty results for demo
            setResources([]);
            setIsLoading(false);
        }, 1000);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Resources</h1>
                <p className="text-gray-600">
                    Search for learning resources using AI-powered semantic search
                </p>
            </div>

            {/* Search Bar */}
            <Card>
                <CardBody>
                    <div className="flex space-x-4">
                        <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Search for learning resources..."
                            fullWidth
                        />
                        <Button
                            onClick={handleSearch}
                            disabled={!searchQuery.trim() || isLoading}
                            loading={isLoading}
                        >
                            Search
                        </Button>
                    </div>
                </CardBody>
            </Card>

            {/* Results */}
            {isLoading && (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-500">Searching resources...</p>
                </div>
            )}

            {!isLoading && hasSearched && resources.length === 0 && (
                <EmptySearchState searchQuery={searchQuery} />
            )}

            {!hasSearched && !isLoading && (
                <div className="text-center py-12">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 48 48">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Start searching</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        Use the search bar above to find learning resources on any topic.
                    </p>
                </div>
            )}

            {resources.length > 0 && (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {resources.map((resource) => (
                        <Card key={resource.id} hover>
                            <CardHeader>
                                <CardTitle className="text-base">{resource.title}</CardTitle>
                            </CardHeader>
                            <CardBody>
                                <p className="text-gray-600 text-sm mb-4">
                                    {resource.description}
                                </p>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                        {resource.resource_type}
                                    </span>
                                    <Button size="sm" variant="outline">
                                        View Resource
                                    </Button>
                                </div>
                            </CardBody>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ResourcesPage;
