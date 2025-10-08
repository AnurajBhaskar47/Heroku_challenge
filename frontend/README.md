# Study Bud - Frontend

A React frontend for the Study Bud AI-powered study assistant application.

## Features

-  **Modern Tech Stack**: React 18 + Vite + Tailwind CSS
-  **JWT Authentication**: Secure login/register with token refresh
-  **Responsive Design**: Mobile-first approach with Tailwind CSS
-  **React Router v6**: Client-side routing with protected routes
-  **Context-based State**: Minimal state management with React Context
-  **Component Library**: Reusable UI components with consistent design
-  **Accessible**: Built with accessibility best practices
-  **API Integration**: Axios with interceptors for seamless backend communication

## Tech Stack

- **Frontend Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with PostCSS and Autoprefixer
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Node Version**: 18.x compatible

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm or yarn

### Installation

1. **Clone the repository and navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```

4. **Edit `.env` file with your configuration:**
   ```env
   # API Base URL - used for development
   VITE_API_BASE_URL=http://localhost:8080/api
   
   # Environment
   VITE_NODE_ENV=development
   ```

5. **Start the development server:**
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:3000`

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API base URL for development | `http://localhost:8080/api` |
| `VITE_NODE_ENV` | Environment mode | `development` |

**Note**: In production, the API base URL automatically uses `window.location.origin + "/api"`

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint for code quality checks |

## Project Structure

```
frontend/
├── public/                 # Static assets
│   ├── vite.svg           # App favicon
│   └── index.html         # HTML template
├── src/
│   ├── components/        # React components
│   │   ├── common/        # Reusable UI components
│   │   │   ├── Button.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Layout.jsx
│   │   │   ├── Loader.jsx
│   │   │   └── EmptyState.jsx
│   │   └── auth/          # Authentication components
│   │       ├── LoginForm.jsx
│   │       ├── RegisterForm.jsx
│   │       └── ProfileForm.jsx
│   ├── pages/             # Page components
│   │   ├── LoginPage.jsx
│   │   ├── RegisterPage.jsx
│   │   ├── DashboardPage.jsx
│   │   ├── CoursesPage.jsx
│   │   ├── CourseDetailPage.jsx
│   │   ├── StudyPlansPage.jsx
│   │   ├── AssistantPage.jsx
│   │   ├── ResourcesPage.jsx
│   │   └── SettingsPage.jsx
│   ├── services/          # API services
│   │   ├── api.js         # Axios configuration
│   │   ├── auth.js        # Authentication API calls
│   │   ├── courses.js     # Course management API calls
│   │   ├── plans.js       # Study plans API calls
│   │   ├── ai.js          # AI assistant API calls
│   │   └── resources.js   # Resources API calls
│   ├── hooks/             # Custom React hooks
│   │   └── useAuth.js     # Authentication context and hooks
│   ├── utils/             # Utility functions
│   │   ├── formatters.js  # Data formatting utilities
│   │   └── constants.js   # Application constants
│   ├── styles/            # Additional styles (if needed)
│   ├── App.jsx            # Main app component with routing
│   ├── main.jsx           # Application entry point
│   └── index.css          # Global styles and Tailwind imports
├── .env.example           # Environment variables template
├── .eslintrc.cjs          # ESLint configuration
├── index.html             # HTML entry point
├── package.json           # Dependencies and scripts
├── postcss.config.js      # PostCSS configuration
├── tailwind.config.js     # Tailwind CSS configuration
├── vite.config.js         # Vite configuration
└── README.md             # This file
```

## API Integration

### Backend Connection

The frontend is designed to work with a Spring Boot REST API backend. The API configuration:

- **Development**: Uses `VITE_API_BASE_URL` from environment (default: `http://localhost:8080/api`)
- **Production**: Automatically uses `${window.location.origin}/api`
- **Proxy**: Vite dev server proxies `/api` requests to `http://localhost:8080`

### Authentication Flow

1. **Login/Register**: POST to `/api/auth/login/` or `/api/auth/register/`
2. **Token Storage**: Access and refresh tokens stored in localStorage
3. **Auto Refresh**: Axios interceptors handle token refresh on 401 responses
4. **Protected Routes**: Routes automatically redirect to login if unauthenticated

### API Services

All API interactions are organized into service modules:

- `authService`: User authentication and profile management
- `coursesService`: Course and assignment management
- `plansService`: Study plan operations
- `aiService`: AI assistant interactions
- `resourcesService`: Resource discovery and management

## Component Library

### Common Components

- **Button**: Multiple variants (primary, secondary, outline, ghost, danger)
- **Input/TextArea/Select**: Form controls with validation and error states
- **Card**: Flexible container with header, body, and footer sections
- **Modal**: Overlay dialogs with customizable content
- **Layout**: Main application layout with sidebar navigation
- **Loader**: Loading states and skeleton placeholders
- **EmptyState**: Placeholder content for empty data states

### Authentication Components

- **LoginForm**: User login with validation
- **RegisterForm**: User registration with academic info
- **ProfileForm**: User profile editing and password change

## Styling

The application uses Tailwind CSS for styling with:

- **Custom Theme**: Extended color palette and typography
- **Component Classes**: Reusable utility classes for common patterns
- **Responsive Design**: Mobile-first breakpoints
- **Dark Mode Ready**: Foundation for dark theme (not yet implemented)

### Custom CSS Classes

```css
/* Button variants */
.btn-primary, .btn-secondary, .btn-outline, .btn-ghost, .btn-danger

/* Form elements */
.input-field, .input-field-error

/* Cards and layout */
.card, .card-hover, .card-header, .card-body, .card-footer

/* Status indicators */
.status-badge, .status-active, .status-completed, etc.

/* Navigation */
.nav-link, .nav-link-active, .sidebar-link, etc.
```

## Routing

The application uses React Router v6 with:

- **Public Routes**: `/login`, `/register` (redirect to dashboard if authenticated)
- **Protected Routes**: All other routes (redirect to login if not authenticated)
- **Layout Wrapper**: Protected routes wrapped with main layout component
- **404 Handling**: Catch-all route for non-existent pages

## Development

### Code Quality

- **ESLint**: Configured with React and accessibility rules
- **Error Boundaries**: Top-level error catching with user-friendly messages
- **TypeScript Ready**: JSDoc type annotations for better IDE support

### Best Practices

- **Accessibility**: ARIA labels, semantic HTML, keyboard navigation
- **Performance**: Code splitting, lazy loading, optimized bundle size
- **SEO**: Meta tags, semantic structure, proper heading hierarchy
- **Error Handling**: Graceful error states and user feedback

## Deployment

### Production Build

```bash
npm run build
```

This creates optimized static files in the `dist/` directory.

### Environment Configuration

For production deployment:

1. **API URL**: Set to use `window.location.origin + "/api"`
2. **Static Assets**: Configure your web server to serve the `dist/` folder
3. **Fallback Route**: Configure server to serve `index.html` for all routes (SPA routing)

### Heroku Deployment

The application is optimized for Heroku deployment:

1. **Build Process**: Runs automatically on Heroku
2. **Node Version**: Specified in `package.json` engines field
3. **Static Serving**: Configure buildpack to serve static files

## Browser Support

- **Modern Browsers**: Chrome, Firefox, Safari, Edge (latest 2 versions)
- **Mobile**: iOS Safari, Android Chrome
- **JavaScript**: ES2020+ features (supported by Vite's build target)

## Troubleshooting

### Common Issues

1. **Port 3000 in use**: Vite will automatically use next available port
2. **API connection errors**: Check `VITE_API_BASE_URL` in `.env` file
3. **Authentication loops**: Clear localStorage and refresh the page
4. **Build errors**: Ensure Node.js version >= 18.0.0

## License

This project is part of the Study Bud application suite.

## Support

For technical support or questions about the frontend implementation, please refer to the main project documentation.
