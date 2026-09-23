# Esports Management System

A secure full-stack web application for managing esports tournaments, teams, matches, registrations, results, and leaderboards.

## 🚀 Live Application

- **Frontend:** deployed on Render
- **Backend API:** deployed on Render
- **API Documentation:** https://<your-backend>.onrender.com/docs
- **Health Check:** https://<your-backend>.onrender.com/health

---

## 📌 Overview

The Esports Management System is a full-stack application designed to simplify the management of esports tournaments.

The system provides secure authentication, role-based access control, tournament management, team management, tournament registration, match scheduling, match result management, leaderboard generation, and administrative functionality.

The application follows a modern client-server architecture:

**React Frontend → FastAPI REST API → PostgreSQL Database**

The frontend and backend are both deployed on Render, with PostgreSQL hosted by Render as the database layer.

---

## 🏗️ System Architecture

```text
                         USERS
                           │
                           ▼
                ┌─────────────────────┐
                │   React + Vite      │
                │      Frontend       │
                │       Render        │
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