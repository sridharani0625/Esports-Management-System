# Secure Esports Tournament Management Platform

## 1. Project Overview

The **Secure Esports Tournament Management Platform** is a web-based application developed to manage esports tournaments in a centralized and secure manner.

Many esports tournaments are currently managed manually using spreadsheets, messaging applications, or other disconnected methods. This can lead to unauthorized result modifications, poor access control, missing records, and difficulty in managing tournament information.

Our proposed system provides a centralized platform for user authentication and tournament management.

The current implementation focuses on two core modules:

1. User Authentication
2. Tournament Management

The application follows a frontend → backend → database architecture.

---

## 2. Problem Statement

Many esports tournaments are managed manually using spreadsheets or messaging applications. This can lead to unauthorized result modifications, poor access control, missing audit records, and inefficient tournament management.

Organizers also face difficulty in tracking teams, matches, and player registrations securely.

The proposed system provides a centralized and secure platform for managing tournaments while protecting sensitive tournament data.

---

## 3. Proposed Solution

The application provides:

- Secure user registration and login
- JWT-based authentication
- Tournament creation and management
- Frontend and backend integration
- Database storage
- API-based communication
- Initial architecture and database design

Future versions will include additional tournament management and security features.

---

## 4. User Roles

The planned system contains the following user roles:

### Admin

- Manage users
- View tournaments
- View audit logs
- Manage organizers
- Control system settings

### Tournament Organizer

- Create tournaments
- Register teams
- Schedule matches
- Publish match results
- Manage registered teams

### Player / Team Captain

- Register a team
- View tournaments
- View tournament schedules
- View match results
- View leaderboard

---

## 5. Current Modules

### Module 1 - User Authentication

The User Authentication module provides:

- User signup
- User login
- Email and password validation
- JWT token generation
- Authentication response
- Login success and failure handling

### Module 2 - Tournament Management

The Tournament Management module provides:

- Tournament creation
- Tournament data storage
- Tournament retrieval
- Displaying tournaments in the frontend
- Communication between frontend and backend

---

## 6. Module Connection

The two modules are connected through the application flow.

```text
User
 |
 v
Login / Signup
 |
 v
Authentication
 |
 v
JWT Token
 |
 v
Tournament Management
 |
 v
Create / View Tournament
 |
 v
FastAPI Backend
 |
 v
SQLite Database

7. Technology Stack
Frontend
HTML
CSS
JavaScript
Backend
Python
FastAPI
Uvicorn
Database
SQLite
SQLAlchemy
Data Validation
Pydantic
Authentication
JWT
Version Control
Git
GitHub
8. System Architecture

The system follows a three-layer architecture.

+---------------------------+
|        Frontend           |
|     HTML / CSS / JS       |
+-------------+-------------+
              |
              | HTTP Requests
              v
+---------------------------+
|        FastAPI            |
|         Backend           |
|                           |
|  Authentication API       |
|  Tournament API           |
+-------------+-------------+
              |
              | SQLAlchemy ORM
              v
+---------------------------+
|       SQLite Database     |
|                           |
|   Users                   |
|   Tournaments             |
+---------------------------+
Execution Flow
The user interacts with the frontend.
JavaScript sends an HTTP request to the FastAPI backend.
FastAPI receives and validates the request.
SQLAlchemy communicates with the SQLite database.
The database stores or retrieves the required information.
FastAPI sends the response back to the frontend.
The frontend displays the result to the user.
9. Project Structure
Esports-Management-System/
│
├── app/
│   ├── api/
│   │   ├── users.py
│   │   └── tournaments.py
│   │
│   ├── models/
│   │   ├── user.py
│   │   └── tournament.py
│   │
│   ├── schemas/
│   │   ├── user.py
│   │   └── tournament.py
│   │
│   ├── database.py
│   └── main.py
│
├── docs/
│   └── diagrams/
│       ├── ER.png
│       ├── architecture.drawio.png
│       └── classdiagram.png
│
├── frontend/
│   ├── index.html
│   ├── script.js
│   └── style.css
│
├── esports.db
├── Problem_statement.md
├── README.md
├── requirements.txt
├── .env.example
├── .gitignore
└── LICENSE
10. Important Backend Files
app/main.py

This is the main entry point of the FastAPI application.

It:

Creates the FastAPI application
Connects API routers
Initializes database tables
Provides the main application configuration
app/database.py

This file contains the database configuration.

It:

Creates the SQLite database connection
Creates the SQLAlchemy engine
Provides the database session
Defines the SQLAlchemy Base
app/api/users.py

This file contains the authentication API endpoints.

It handles:

Signup
Login
User validation
JWT authentication
app/api/tournaments.py

This file contains the Tournament Management API endpoints.

It handles:

Creating tournaments
Retrieving tournaments
Database operations related to tournaments
app/models/user.py

This contains the SQLAlchemy User model.

It represents the users table in the database.

app/models/tournament.py

This contains the SQLAlchemy Tournament model.

It represents the tournaments table in the database.

app/schemas/user.py

This contains Pydantic schemas used to validate user input.

app/schemas/tournament.py

This contains Pydantic schemas used to validate tournament input.

11. Frontend Files
frontend/index.html

Contains the structure of the frontend pages and forms.

frontend/style.css

Contains the styling and layout of the application.

frontend/script.js

Contains the JavaScript logic.

It:

Sends requests to the FastAPI backend
Handles signup
Handles login
Receives the JWT token
Redirects the user after successful login
Sends tournament requests
Displays tournament information
12. Database

The project currently uses SQLite as the relational database.

The database file is:

esports.db

SQLAlchemy is used as the ORM layer.

The current database contains the data required for the implemented modules.

Current Core Tables
Users
Tournaments

Additional tables planned for future modules include:

Players
Matches
Match Results
Team Registrations
Audit Logs
13. Authentication Flow

The authentication process works as follows:

User enters email and password
              |
              v
        Frontend
              |
              | POST request
              v
       FastAPI /login
              |
              v
      Validate credentials
              |
              v
       Check Users table
              |
              v
       Authentication success
              |
              v
        Generate JWT
              |
              v
        Return response
              |
              v
      Tournament Management
Signup Flow
User enters username, email and password
              |
              v
       Frontend Signup
              |
              v
        POST /signup
              |
              v
        FastAPI Backend
              |
              v
       Validate input
              |
              v
       Create User object
              |
              v
        SQLite Database
14. Tournament Management Flow
Successful Login
       |
       v
Tournament Management Page
       |
       v
Enter Tournament Details
       |
       v
Create Tournament
       |
       v
FastAPI Tournament API
       |
       v
SQLAlchemy
       |
       v
SQLite Database
       |
       v
Tournament Stored
       |
       v
GET Tournament Data
       |
       v
Display Tournament
15. API Endpoints
User Authentication
Method	Endpoint	Description
POST	/signup	Creates a new user
POST	/login	Authenticates a user and returns authentication information
Tournament Management
Method	Endpoint	Description
POST	/tournaments	Creates a new tournament
GET	/tournaments	Retrieves tournament information

The exact endpoint paths can be verified through the FastAPI Swagger documentation at /docs.

16. API Documentation

FastAPI automatically provides interactive API documentation.

After starting the backend, open:

http://127.0.0.1:8000/docs

The Swagger UI can be used to:

View available APIs
View request methods
Enter request data
Execute API requests
View API responses
Test the backend
17. Prerequisites

Before running the project, install:

Python 3.x
Git
A modern web browser
Visual Studio Code (recommended)
18. Installation

Clone the repository:

git clone https://github.com/sridharani0625/Esports-Management-System.git

Move into the project directory:

cd Esports-Management-System

Install the required Python packages:

pip install -r requirements.txt
19. Running the Backend

Open a terminal in the project root:

C:\Capstone\Esports-Management-System

Run:

python -m uvicorn app.main:app

The backend will start at:

http://127.0.0.1:8000

FastAPI documentation:

http://127.0.0.1:8000/docs
20. Running the Frontend

Open the frontend folder:

frontend

Open:

frontend/index.html

in a web browser.

The frontend communicates with the FastAPI backend running at:

http://127.0.0.1:8000

Make sure the backend is running before using the frontend.

21. Complete Application Execution Flow
                 START
                   |
                   v
             Start FastAPI
                   |
                   v
          Open Frontend Page
                   |
                   v
            Signup / Login
                   |
                   v
          FastAPI Authentication
                   |
                   v
           Check SQLite Database
                   |
                   v
           Generate JWT Token
                   |
                   v
       Successful Authentication
                   |
                   v
       Tournament Management Page
                   |
                   v
          Create Tournament
                   |
                   v
        FastAPI Tournament API
                   |
                   v
         SQLAlchemy ORM
                   |
                   v
          SQLite Database
                   |
                   v
        Retrieve Tournament
                   |
                   v
          Display in Frontend
                   |
                   v
                  END
22. Security Features in Current Version

The current implementation includes:

User authentication
JWT-based authentication
Input validation using Pydantic
Database constraints for unique username and email
API-based separation between frontend and backend
Authentication before accessing the tournament management flow
Planned Security Enhancements

Future versions will include:

Password hashing using a secure password hashing algorithm
Stronger authorization checks
Role-based access control
Protected tournament APIs
Audit logging
Improved token validation
Secure environment variable management
23. Success Criteria

The project aims to achieve the following:

Users can register successfully.
Users can log in successfully.
Authentication generates a JWT token.
Users can access the Tournament Management module after login.
Organizers can create tournaments.
Tournament information is stored in the database.
Tournament information can be retrieved from the database.
Frontend and backend communicate successfully.
Backend and database communicate successfully.
24. Out of Scope

The following features are not included in the current scope:

Live game streaming
Online payments
Voice or text chat
Real-time gameplay
AI-based match prediction

25. Future Enhancements

Future development will include:

Role-based authorization
Admin dashboard
Team registration
Player management
Match scheduling
Match result management
Leaderboard
Audit logging
Password hashing
Additional security controls

26. Documentation

The project documentation is available in:

docs/diagrams/

The repository contains:

Architecture Diagram
ER Diagram
Class Diagram

The problem statement is available in:

Problem_statement.md

27. Project Status
Completed
Project problem statement
Initial system architecture
ER diagram
Class diagram
User signup
User login
JWT authentication
Tournament creation
Tournament retrieval
Frontend implementation
FastAPI backend
SQLite database
SQLAlchemy integration
Frontend-backend integration
GitHub repository
In Progress / Future Modules
Team management
Player management
Match scheduling
Match results
Audit logging
Role-based authorization
Admin dashboard
Leaderboard
Additional security enhancements

28. Repository

GitHub repository:

https://github.com/sridharani0625/Esports-Management-System
29. Project Track

Chosen Track: Python (FastAPI)

Domain: Cyber Security / Esports Management

Project: Secure Esports Tournament Management Platform