# Getting Started

<cite>
**Referenced Files in This Document**
- [README.md](file://README.md)
- [docker-compose.yml](file://docker-compose.yml)
- [nginx.conf](file://nginx/nginx.conf)
- [.env.example](file://.env.example)
- [backend/src/config/index.ts](file://backend/src/config/index.ts)
- [backend/src/index.ts](file://backend/src/index.ts)
- [frontend/vite.config.ts](file://frontend/vite.config.ts)
- [frontend/src/api/client.ts](file://frontend/src/api/client.ts)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Prerequisites](#prerequisites)
3. [Quick Setup](#quick-setup)
4. [Docker Deployment (Recommended)](#docker-deployment-recommended)
5. [Local Development Setup](#local-development-setup)
6. [Environment Variables](#environment-variables)
7. [Ports and Services](#ports-and-services)
8. [Accessing the Application](#accessing-the-application)
9. [Initial Registration](#initial-registration)
10. [Troubleshooting](#troubleshooting)
11. [Conclusion](#conclusion)

## Introduction
WebTerm is a browser-based SSH terminal that provides real-time terminal interaction, SFTP file management, and online code editing. It consists of a Vue 3 frontend and an Express.js backend, orchestrated by Docker Compose with an Nginx reverse proxy.

## Prerequisites
Before you begin, ensure you have the following installed:
- Node.js 20+ (for local development)
- Docker Engine
- Docker Compose

These requirements enable both Docker deployment and local development environments.

**Section sources**
- [README.md:168-184](file://README.md#L168-L184)

## Quick Setup
Choose one of the two deployment options below to get WebTerm running quickly.

## Docker Deployment (Recommended)
This is the fastest way to deploy WebTerm using pre-built containers.

Step-by-step instructions:
1. Clone the repository and navigate to the project directory
2. Copy the example environment file to `.env` and edit it
3. Start the services with Docker Compose
4. Access the application via your browser

Key steps explained:
- Clone and configure environment variables
- Edit `.env` to set security-related secrets
- Start services with Docker Compose
- Access the application at the configured port

Security note:
- You must change the security-related environment variables before deploying to production.

**Section sources**
- [README.md:139-184](file://README.md#L139-L184)
- [docker-compose.yml:24-34](file://docker-compose.yml#L24-L34)
- [.env.example:4-15](file://.env.example#L4-L15)

## Local Development Setup
Run the frontend and backend separately for development.

Frontend development server:
- Runs on port 5173
- Proxies API requests to the backend
- Uses Vite for fast development builds

Backend development server:
- Runs on port 3000
- Uses Express.js with TypeScript
- Supports hot reloading during development

Development workflow:
- Start backend in one terminal
- Start frontend in another terminal
- Access the frontend at http://localhost:5173

**Section sources**
- [README.md:166-184](file://README.md#L166-L184)
- [frontend/vite.config.ts:12-21](file://frontend/vite.config.ts#L12-L21)
- [backend/package.json:6-10](file://backend/package.json#L6-L10)

## Environment Variables
Configure WebTerm using environment variables. The most critical ones are security-related.

Essential security variables:
- MASTER_SECRET: Encryption key for storing SSH credentials (minimum 32 characters)
- JWT_SECRET: Secret for signing JWT tokens

Optional configuration variables:
- JWT_EXPIRES_IN: Token expiration time (default: 24h)
- MAX_SESSIONS_PER_USER: Maximum concurrent sessions per user (default: 5)
- SESSION_TIMEOUT_MINUTES: Inactivity timeout in minutes (default: 30)
- CORS_ORIGIN: Allowed origins for cross-origin requests (default: *)
- PORT: Backend service port (default: 3000)
- NODE_ENV: Runtime environment (development/production)
- ROCKSDB_PATH: Database storage path

Default values and behavior:
- Development defaults are provided for local testing
- Production deployments must override security variables
- Database persists data in a named volume

**Section sources**
- [README.md:186-199](file://README.md#L186-L199)
- [backend/src/config/index.ts:3-21](file://backend/src/config/index.ts#L3-L21)
- [docker-compose.yml:24-34](file://docker-compose.yml#L24-L34)
- [.env.example:4-15](file://.env.example#L4-L15)

## Ports and Services
Understanding the networking stack helps troubleshoot connectivity issues.

Docker deployment ports:
- Nginx exposes port 11112 externally mapped to internal port 80
- Backend service listens on port 3000 internally
- Frontend static files served by Nginx

Local development ports:
- Frontend development server: 5173
- Backend API server: 3000
- Frontend proxy forwards /api requests to backend

Reverse proxy configuration:
- Nginx serves static files and proxies API requests
- Special handling for SSE endpoints to maintain long-lived connections
- File upload size limited to 100MB for SFTP operations

**Section sources**
- [docker-compose.yml:4-12](file://docker-compose.yml#L4-L12)
- [frontend/vite.config.ts:12-21](file://frontend/vite.config.ts#L12-L21)
- [nginx/nginx.conf:1-54](file://nginx/nginx.conf#L1-L54)

## Accessing the Application
After deployment, access WebTerm using your browser.

Docker deployment:
- Open http://localhost:11112 in your browser
- Nginx handles routing to frontend static files and API proxy

Local development:
- Open http://localhost:5173 in your browser
- Frontend automatically proxies API requests to backend

Network considerations:
- Ensure the chosen port is not blocked by firewall rules
- Verify Docker port mappings if using Docker deployment
- Check localhost resolution in your browser

**Section sources**
- [README.md:164](file://README.md#L164)
- [docker-compose.yml:4-12](file://docker-compose.yml#L4-L12)

## Initial Registration
Complete the initial setup by registering a new user account.

Registration process:
1. Navigate to the registration page
2. Provide username and password
3. Complete the registration form
4. Log in with your new credentials

Post-registration:
- You can add SSH connections from the dashboard
- Manage multiple hosts with independent terminals and SFTP workspaces
- Use the file editor for remote file editing with syntax highlighting

**Section sources**
- [README.md:227-234](file://README.md#L227-L234)

## Troubleshooting
Common setup issues and their solutions:

Port conflicts:
- Docker deployment: Change the external port mapping in docker-compose.yml if port 11112 is in use
- Local development: Stop processes using ports 5173 or 3000 before starting services

Network connectivity:
- Verify Docker daemon is running
- Check firewall settings blocking container ports
- Ensure localhost resolves correctly in your browser

Permission issues:
- On Linux systems, Docker may require sudo privileges
- Ensure your user has permission to access Docker socket

Environment configuration:
- Confirm .env file exists and contains required security variables
- Verify MASTER_SECRET and JWT_SECRET are set with sufficient entropy
- Check that database volume permissions allow data persistence

Health checks:
- Docker Compose waits for backend health checks before starting Nginx
- Monitor container logs for startup errors

Frontend proxy issues:
- Local development requires backend to be running before frontend
- Verify Vite proxy configuration targets the correct backend address

**Section sources**
- [docker-compose.yml:36-42](file://docker-compose.yml#L36-L42)
- [frontend/vite.config.ts:14-19](file://frontend/vite.config.ts#L14-L19)
- [backend/src/index.ts:12-14](file://backend/src/index.ts#L12-L14)

## Conclusion
You now have two complete paths to deploy WebTerm:
- Docker deployment for production-like environments with minimal setup
- Local development for contributing to the codebase

Both approaches support the same core functionality: SSH terminal sessions, SFTP file management, and online code editing. Choose the Docker option for quick deployment or the local development setup for contributing to the project.