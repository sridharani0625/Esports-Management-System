# Changelog

All notable changes to the Esports Management System are documented here.

## [1.0.0] - 2026-09-20

### Added
- User registration and login
- JWT-based authentication
- Role-based access control
- Tournament creation and management
- Team creation and management
- Team member management
- Tournament registration
- Match scheduling and management
- Match result management
- Leaderboard functionality
- Admin management functionality
- Audit logging
- PostgreSQL database integration
- React + Vite frontend
- FastAPI backend
- Swagger/OpenAPI API documentation
- Cloud deployment using Render and Vercel
- Health-check endpoint
- Restricted CORS configuration

### Security
- Passwords are stored using bcrypt hashing.
- JWT authentication is used for protected API operations.
- Role-based authorization is implemented for protected operations.
- Database access is handled through SQLAlchemy ORM.

### Deployment
- Backend deployed on Render.
- Frontend deployed on Vercel.
- Production database hosted using PostgreSQL.