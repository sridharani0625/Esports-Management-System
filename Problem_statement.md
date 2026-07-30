# Problem Statement

## 1. Title

Secure Esports Tournament Management Platform

---

## 2. Domain

Cyber Security / Esports Management

---

## 3. Who is the user? (2-3 user types, with roles)

### Admin
- Manages users and tournaments.
- Views audit logs.
- Controls system settings.

### Tournament Organizer
- Creates tournaments.
- Registers teams.
- Schedules matches.
- Publishes match results.

### Player / Team Captain
- Registers a team.
- Views tournament schedules.
- Checks match results and leaderboard.

---

## 4. What problem are we solving?

Many esports tournaments are managed manually using spreadsheets or messaging applications. This can lead to unauthorized result modifications, poor access control, missing audit records, and inefficient tournament management. Organizers also face difficulty tracking teams, matches, and player registrations securely. The proposed system provides a centralized and secure platform for managing tournaments while protecting sensitive tournament data.

---

## 5. Proposed Solution

The application will provide:

- Secure user registration and login
- Role-based authentication and authorization
- Tournament creation and management
- Team registration
- Match scheduling
- Secure result management
- Audit logging for important actions
- Dashboard for different user roles

---

## 6. Core Entities / Database Tables

1. Users
2. Teams
3. Players
4. Tournaments
5. Matches
6. Match Results
7. Team Registrations
8. Audit Logs

---

## 7. User Roles & Permissions

### Admin
- Manage users
- View all tournaments
- View audit logs
- Manage organizers

### Tournament Organizer
- Create tournaments
- Schedule matches
- Publish match results
- Manage registered teams

### Player / Team Captain
- Register team
- View tournaments
- View schedules
- View results

---

## 8. Success Criteria

- Users can register and log in securely.
- Organizers can create tournaments successfully.
- Teams can register without errors.
- Match schedules can be published.
- Only authorized users can update match results.
- All important actions are recorded in audit logs.

---

## 9. Out of Scope

The following features are not included:

- Live game streaming
- Online payments
- Voice or text chat
- Real-time gameplay
- AI-based match prediction

---

## 10. Chosen Track

Python (FastAPI)