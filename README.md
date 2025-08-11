# RealtimeGrid - Modernized

A real-time collaborative employee grid application built with .NET 8 Web API and React TypeScript.

## Migration from Legacy Version

This modernized version replaces:
- **.NET Framework 4.5** → **.NET 8**
- **ASP.NET MVC** → **ASP.NET Core Web API**
- **jQuery + Knockout.js** → **React + TypeScript**
- **SQL Server Compact** → **SQLite with EF Core**
- **Old SignalR 1.x** → **Modern SignalR Core**

The core functionality (real-time collaborative editing with row locking) remains the same but with a modern, maintainable architecture.

## Features

- **Real-time collaboration**: Multiple users can edit the grid simultaneously with live updates
- **Row locking**: When a user starts editing a row, it gets locked for other users
- **SignalR integration**: Real-time communication between frontend and backend
- **Modern tech stack**: .NET 8 + React 18 + TypeScript + Vite
- **SQLite database**: Lightweight database for local development

## Architecture

### Backend (.NET 8 Web API)
- **RealtimeGrid.Api**: Web API with SignalR hub
- **Entity Framework Core**: ORM with SQLite provider
- **SignalR Hub**: Handles real-time communication for employee locking/unlocking and updates

### Frontend (React TypeScript + Vite)
- **React 18**: Modern UI library with hooks
- **TypeScript**: Type safety and better developer experience
- **Vite**: Fast build tool and development server
- **SignalR Client**: Real-time communication with the backend
- **React Hot Toast**: Notification system

## Getting Started

### Prerequisites
- .NET 8 SDK
- Node.js (v16 or later)
- npm or yarn

### Running the Application

1. **Start the Backend API:**
   ```bash
   cd RealtimeGridModern/Backend/RealtimeGrid.Api
   dotnet run --urls=http://localhost:5000
   ```

2. **Start the Frontend (in a new terminal):**
   ```bash
   cd RealtimeGridModern/Frontend/realtime-grid-frontend
   npm install  # First time only
   npm run dev
   ```

3. **Open the application:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000
   - Swagger UI: http://localhost:5000/swagger

### Testing Real-time Features

1. Open the application in multiple browser windows/tabs
2. Start editing an employee in one window - you'll see it gets locked
3. Try to edit the same employee in another window - it should be locked
4. Make changes and save - other windows should see the updates in real-time
5. Notifications will show when other users lock/update records

## Database

The application uses SQLite with Entity Framework Core. The database is automatically created on first run with seed data for 55 employees.

Database file: `realtimegrid.db` (in the API project directory)

## API Endpoints

- `GET /api/employees` - Get all employees
- `GET /api/employees/{id}` - Get employee by ID
- `POST /api/employees` - Create new employee
- `PUT /api/employees/{id}` - Update employee
- `DELETE /api/employees/{id}` - Delete employee

## SignalR Hub

- **Hub endpoint**: `/employeeHub`
- **Methods**:
  - `Lock(id)` - Lock employee for editing
  - `Unlock(id)` - Unlock employee
  - `UpdateEmployee(id, propertyName, value)` - Update employee property

## Development

### Backend Development
```bash
cd RealtimeGridModern/Backend/RealtimeGrid.Api
dotnet watch run --urls=http://localhost:5000
```

### Frontend Development
```bash
cd RealtimeGridModern/Frontend/realtime-grid-frontend
npm run dev
```

### Building for Production

**Backend:**
```bash
cd RealtimeGridModern/Backend/RealtimeGrid.Api
dotnet publish -c Release -o publish
```

**Frontend:**
```bash
cd RealtimeGridModern/Frontend/realtime-grid-frontend
npm run build
# Built files will be in the 'dist' directory
```