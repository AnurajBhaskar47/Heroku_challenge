# Study Bud Backend API

A production-ready Django REST API for the Study Bud application - an AI-powered learning companion that helps students organize their studies, create personalized study plans, and access intelligent learning resources.

## 🌟 Features

- **User Authentication**: JWT-based authentication with custom user model
- **Course Management**: Create and manage courses with assignments and progress tracking
- **Study Plans**: AI-generated study plans with progress tracking and milestones
- **Resource Library**: Curated learning resources with ratings and collections
- **AI Assistant**: Google Gemini-powered explanations, study recommendations, and chat
- **Vector Search Ready**: pgvector-ready architecture for semantic search
- **Production Ready**: Configured for Heroku deployment with PostgreSQL

## 🏗️ Architecture

### Apps Structure

```
backend/
├── apps/
│   ├── accounts/         # User management and authentication
│   ├── courses/          # Course and assignment management
│   ├── study_plans/      # Study plan creation and tracking
│   ├── resources/        # Learning resources and collections
│   └── ai_assistant/     # AI-powered features
├── study_bud/
│   └── settings/         # Environment-specific settings
├── utils/                # AI clients and utilities
├── management/
│   └── commands/         # Custom management commands
└── templates/            # React app template
```

### Key Models

- **User**: Extended Django user with academic information and preferences
- **Course**: Academic courses with assignments and metadata
- **Assignment**: Course assignments with due dates and progress tracking
- **StudyPlan**: AI-generated study plans with topics and milestones
- **Resource**: Learning materials with ratings and vector search support

## 🚀 Quick Start

### Local Development Setup

1. **Clone and setup environment**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

2. **Configure environment variables**
```bash
cp .env.example .env
# Edit .env file with your configuration
```

3. **Run database migrations**
```bash
python manage.py migrate
```

4. **Create superuser**
```bash
python manage.py createsuperuser
```

5. **Load demo data (optional)**
```bash
python manage.py seed_demo
```

6. **Run development server**
```bash
python manage.py runserver
```

The API will be available at http://localhost:8000/

### Frontend Integration

**Development Mode** (Recommended):
- Run React dev server separately at http://localhost:5173
- Django API server at http://localhost:8000
- CORS is configured to allow requests between them

**Production Mode** (Django serves React):
```bash
# Build the React app first
cd ../frontend
npm install
npm run build

# Then start Django (from backend directory)
cd ../backend
python manage.py collectstatic --noinput
python manage.py runserver
```

The full application (React + API) will be available at http://localhost:8000/

### API Documentation

- **Swagger UI**: http://localhost:8000/api/docs/
- **ReDoc**: http://localhost:8000/api/redoc/
- **OpenAPI Schema**: http://localhost:8000/api/schema/

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `SECRET_KEY` | Django secret key | - | ✅ |
| `DEBUG` | Enable debug mode | False | - |
| `DATABASE_URL` | PostgreSQL connection string | SQLite | Production |
| `GOOGLE_GEMINI_API_KEY` | Google Gemini API key | - | AI Features |
| `USE_VECTOR_SEARCH` | Enable vector search | False | - |
| `EMBEDDING_SERVICE` | Embedding service type | local | - |
| `CORS_ALLOWED_ORIGINS` | Allowed CORS origins | localhost | - |

### Settings Environments

- **Development** (`study_bud.settings.development`): SQLite, debug enabled, permissive CORS
- **Production** (`study_bud.settings.heroku`): PostgreSQL, security headers, strict CORS

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register/` - User registration
- `POST /api/auth/login/` - User login (JWT)
- `POST /api/auth/refresh/` - Refresh JWT token
- `GET/PATCH /api/profile/` - User profile management

### Courses & Assignments
- `GET/POST /api/courses/` - List/create courses
- `GET/PUT/DELETE /api/courses/{id}/` - Course details
- `GET/POST /api/courses/{courseId}/assignments/` - List/create course assignments
- `GET/PUT/DELETE /api/courses/{courseId}/assignments/{assignmentId}/` - Assignment CRUD
- `POST /api/courses/{courseId}/assignments/{assignmentId}/mark-completed/` - Mark assignment complete
- `GET /api/assignments/upcoming/` - Get upcoming assignments (across all courses)
- `GET /api/assignments/overdue/` - Get overdue assignments (across all courses)

### Study Plans
- `GET/POST /api/study-plans/` - List/create study plans
- `GET/PUT/DELETE /api/study-plans/{id}/` - Study plan details
- `POST /api/study-plans/{id}/update-progress/` - Update progress

### Resources
- `GET/POST /api/resources/` - List/create resources
- `POST /api/resources/search/` - Advanced resource search
- `POST /api/resources/{id}/rate/` - Rate a resource

### AI Assistant
- `POST /api/ai-assistant/explain/` - Get AI explanation
- `POST /api/ai-assistant/enhanced-study-plan/` - Generate study plan
- `POST /api/ai-assistant/semantic-search/` - Semantic search
- `POST /api/ai-assistant/chat/` - Chat with AI assistant

## 🤖 AI Features

### Google Gemini Integration

The application integrates with Google's Gemini AI for:
- **Explanations**: Context-aware topic explanations
- **Study Plans**: Personalized study plan generation
- **Chat Assistant**: Interactive learning support

### Vector Search (pgvector-ready)

Prepared for semantic search capabilities:
- **Embeddings**: Generate embeddings for resources and study plans
- **Semantic Search**: Find relevant content using vector similarity
- **Feature Flags**: Enable/disable vector search functionality

## 🛠️ Management Commands

### Seed Demo Data
```bash
python manage.py seed_demo --users 3 --courses 5 --resources 20
```

### Generate Embeddings
```bash
python manage.py generate_embeddings --model all --batch-size 10
```

## 🚀 Deployment

### Heroku Deployment

1. **Create Heroku app**
```bash
heroku create studybud-api
```

2. **Set environment variables**
```bash
heroku config:set DJANGO_SETTINGS_MODULE=study_bud.settings.heroku
heroku config:set SECRET_KEY=your-production-secret-key
heroku config:set GOOGLE_GEMINI_API_KEY=your-api-key
```

3. **Add PostgreSQL**
```bash
heroku addons:create heroku-postgresql:mini
```

4. **Build React app (for integrated deployment)**
```bash
cd frontend
npm install
npm run build
cd ../backend
```

5. **Deploy**
```bash
git add .
git commit -m "Deploy with React build"
git push heroku main
```

6. **Run migrations**
```bash
heroku run python manage.py migrate
heroku run python manage.py createsuperuser
```

**Note**: The Procfile automatically runs `collectstatic` during deployment to serve the React build files.

### Environment-specific Settings

The application uses different settings for different environments:

- **Development**: `DJANGO_SETTINGS_MODULE=study_bud.settings.development`
- **Production**: `DJANGO_SETTINGS_MODULE=study_bud.settings.heroku`

## 🔒 Security Features

- JWT authentication with refresh tokens
- CORS configuration for frontend integration
- Security headers for production
- Input validation and sanitization
- Rate limiting ready (via Django REST framework)

## 📊 Monitoring & Health Checks

- **Health Check**: `GET /health/` - API health status
- **AI Service Status**: `GET /api/ai-assistant/status/` - AI services status
- **Admin Interface**: `/admin/` - Django admin panel

## 🧪 Testing

### Demo User Accounts

When using `seed_demo` command, these accounts are created:

| Username | Email | Password | Major |
|----------|--------|----------|--------|
| alice_student | alice@example.com | demo123! | Computer Science |
| bob_learner | bob@example.com | demo123! | Mathematics |
| charlie_dev | charlie@example.com | demo123! | Software Engineering |

### API Testing

Use the Swagger UI at `/api/docs/` for interactive API testing, or use tools like:
- Postman
- curl
- HTTPie

Example API call:
```bash
# Login
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username": "alice_student", "password": "demo123!"}'

# Use the returned access token for authenticated requests
curl -X GET http://localhost:8000/api/courses/ \
  -H "Authorization: Bearer your-access-token"
```

## 🔮 Future Enhancements

### Planned Features
- **pgvector Integration**: Full vector search with PostgreSQL
- **Real-time Features**: WebSocket support for live updates
- **Advanced Analytics**: Study progress analytics and insights
- **Mobile API**: Optimized endpoints for mobile applications
- **Third-party Integrations**: Canvas, Blackboard, Google Classroom

### Scaling Considerations
- **Caching**: Redis integration for performance
- **Background Tasks**: Celery for async processing
- **CDN Integration**: Static asset optimization
- **Database Optimization**: Query optimization and indexing

## 📝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the API documentation at `/api/docs/`
- Review the admin interface at `/admin/`

---

Built with ❤️ for students everywhere. Study smart with Study Bud!
