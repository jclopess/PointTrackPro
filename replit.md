# Sistema de Ponto - Time Tracking System

## Overview

This is a comprehensive time tracking and HR management application for Brazilian organizations with three user roles: admin (full system access), manager (employee oversight and user management), and employee (time tracking only). The system features sequential 4-times daily registration, department-based organization, comprehensive user management with CPF-based authentication, and employment type management with varying work hours. The application uses a PostgreSQL database via Neon with Drizzle ORM for data management.

## Recent Changes (July 15, 2025)

✓ Expanded database schema to include functions, employment types, and password reset requests tables
✓ Implemented admin user role with full system access and user management capabilities  
✓ Added comprehensive user registration form with CPF (000.000.000-00), phone (00) 90000-0000, employment details, and status management
✓ Created admin dashboard for managing users, departments, functions, and employment types
✓ Replaced public user registration with password recovery functionality on auth page
✓ Updated authentication system to use CPF as login credential instead of username
✓ Fixed React hooks error in authentication flow
✓ Added proper role-based access control with admin/manager/employee permissions

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack React Query for server state management
- **UI Framework**: Radix UI components with shadcn/ui styling system
- **Styling**: Tailwind CSS with CSS variables for theming
- **Build Tool**: Vite for development and bundling

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Runtime**: Node.js with ES modules
- **Authentication**: Passport.js with local strategy and express-session
- **Password Security**: Node.js crypto module with scrypt for hashing
- **Session Storage**: PostgreSQL-backed sessions using connect-pg-simple

### Database Architecture
- **Database**: PostgreSQL via Neon Database
- **ORM**: Drizzle ORM with TypeScript
- **Schema Management**: Drizzle Kit for migrations
- **Connection**: Neon serverless driver with WebSocket support

## Key Components

### Authentication System
- Session-based authentication using Passport.js
- Role-based access control (employee/manager)
- Secure password hashing with salt using Node.js crypto
- PostgreSQL session store for scalability

### Time Registration System
- Four-slot time tracking (entry1, exit1, entry2, exit2)
- Automatic time validation with 1-hour minimum intervals
- Real-time updates using React Query
- Date-based record organization

### Justification System
- Employee-initiated justification requests
- Manager approval workflow
- Status tracking (pending, approved, rejected)
- Multiple justification types (absence, late, early-leave, error)

### Manager Dashboard
- Employee overview with real-time status
- Time record management
- Justification approval interface
- Report generation capabilities

### Hour Bank System
- Monthly hour tracking and balance calculation
- Expected vs worked hours comparison
- Automated balance calculations

## Data Flow

1. **Authentication Flow**: Users authenticate via login form → Passport.js validates credentials → Session established → User data cached in React Query
2. **Time Registration Flow**: Employee clicks register → Frontend sends POST to `/api/time-records` → Backend validates timing rules → Database updated → UI refreshed via React Query
3. **Justification Flow**: Employee submits justification → Manager reviews in dashboard → Approval/rejection stored → Status updated across system
4. **Manager Oversight Flow**: Real-time employee status → Time record management → Report generation

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL connection via Neon
- **drizzle-orm**: Type-safe database queries
- **passport**: Authentication middleware
- **express-session**: Session management
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: Accessible UI components
- **tailwindcss**: Utility-first CSS framework

### Development Dependencies
- **vite**: Build tool and dev server
- **typescript**: Type safety
- **tsx**: TypeScript execution for development
- **esbuild**: Production bundling

## Deployment Strategy

### Build Process
- Frontend: Vite builds React app to `dist/public`
- Backend: ESBuild bundles server code to `dist/index.js`
- Single deployment artifact with static file serving

### Environment Variables
- `DATABASE_URL`: Neon PostgreSQL connection string
- `SESSION_SECRET`: Session encryption key
- `NODE_ENV`: Environment indicator

### Production Setup
- Express serves static files from `dist/public`
- API routes prefixed with `/api`
- Session store persisted in PostgreSQL
- WebSocket support for Neon database connections

### Database Management
- Schema defined in `shared/schema.ts`
- Migrations managed via Drizzle Kit
- Push schema changes with `npm run db:push`

The application follows a monorepo structure with shared TypeScript types between client and server, ensuring type safety across the full stack. The authentication system uses role-based access control to separate employee and manager functionality, while the time tracking system provides comprehensive oversight capabilities for workforce management.