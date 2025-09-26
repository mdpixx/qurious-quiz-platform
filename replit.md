# Overview

Qurious is a gamified quiz platform built for the Indian market, designed to serve working professionals, students, and teachers. The application combines real-time multiplayer quiz functionality with AI-powered question generation, supporting multiple languages and offering flexible scoring modes. The platform emphasizes engagement through game mechanics while providing professional analytics and insights.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

The frontend is built with React and TypeScript using a component-based architecture. The application uses Vite for development and bundling, with the following key design decisions:

- **UI Framework**: Utilizes Radix UI primitives with shadcn/ui components for consistent, accessible design
- **Styling**: TailwindCSS with CSS variables for dual theme support (playful/minimal themes)
- **State Management**: React Query for server state management and React hooks for local state
- **Routing**: Wouter for lightweight client-side routing
- **Real-time Communication**: Custom WebSocket client for live quiz interactions

The application supports Progressive Web App (PWA) features for mobile-first usage and includes internationalization support for English and Hindi languages.

## Backend Architecture

The backend follows a REST API design with WebSocket support for real-time features:

- **Server Framework**: Express.js with TypeScript
- **Database Layer**: Drizzle ORM with PostgreSQL, using connection pooling via Neon Database
- **Real-time Engine**: WebSocket server for live quiz sessions and participant interactions
- **AI Integration**: OpenAI GPT-5 integration for automated quiz generation from various content sources
- **Session Management**: In-memory storage with plans for database persistence

The server implements middleware for request logging, error handling, and CORS management.

## Data Storage Solutions

- **Primary Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Schema Design**: 
  - Users table with role-based access (professional/student/teacher)
  - Quizzes with JSONB for flexible question storage
  - Sessions for live quiz management with participant tracking
  - Responses for answer collection and analytics
  - Question bank for reusable content management

## Authentication and Authorization

Currently implements a simplified authentication system:
- Email-based login/registration
- User roles (professional, student, teacher) for feature access control
- Session-based authentication with localStorage for client state
- Plans for OAuth integration and secure session management

## External Dependencies

- **Database**: Neon Database (PostgreSQL-compatible serverless database)
- **AI Services**: OpenAI API for quiz generation from documents, URLs, and text content
- **UI Components**: Radix UI for accessible component primitives
- **Development Tools**: 
  - Replit-specific development plugins and runtime error handling
  - Cartographer for enhanced development experience
- **Real-time Communication**: Native WebSocket implementation
- **Styling**: TailwindCSS with PostCSS for processing
- **Build Tools**: Vite for frontend bundling, esbuild for server compilation

The architecture prioritizes scalability for the Indian market with mobile-first design, low-bandwidth optimization, and multi-language support.