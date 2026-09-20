# Esports Management System

A secure full-stack web application for managing esports tournaments, teams, matches, registrations, results, and leaderboards.

## 🚀 Live Application

- **Frontend:** https://esports-management-system.vercel.app/
- **Backend API:** https://esports-management-system.onrender.com/
- **API Documentation:** https://esports-management-system.onrender.com/docs
- **Health Check:** https://esports-management-system.onrender.com/health

---

## 📌 Overview

The Esports Management System is a full-stack application designed to simplify the management of esports tournaments.

The system provides secure authentication, role-based access control, tournament management, team management, tournament registration, match scheduling, match result management, leaderboard generation, and administrative functionality.

The application follows a modern client-server architecture:

**React Frontend → FastAPI REST API → PostgreSQL Database**

The frontend is deployed using Vercel and the backend is deployed using Render.

---

## 🏗️ System Architecture

```text
                         USERS
                           │
                           ▼
                ┌─────────────────────┐
                │   React + Vite      │
                │      Frontend       │
                │       Vercel        │
                └──────────┬──────────┘
                           │
                     HTTP / REST API
                           │
                           ▼
                ┌─────────────────────┐
                │       FastAPI       │
                │       Backend       │
                │       Render        │
                └──────────┬──────────┘
                           │
             ┌─────────────┼─────────────┐
             │             │             │
             ▼             ▼             ▼
        JWT Auth      Business Logic   RBAC
             │             │             │
             └─────────────┼─────────────┘
                           │
                           ▼
                ┌─────────────────────┐
                │     SQLAlchemy      │
                │        ORM          │
                └──────────┬──────────┘
                           │
                           ▼
                ┌─────────────────────┐
                │     PostgreSQL      │
                │      Database       │
                └─────────────────────┘