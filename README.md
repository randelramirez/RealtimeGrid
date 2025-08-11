# About this repo

A simple application that demonstrates SignalR, ASP.NET Core, and React as the frontend

# RealtimeGrid - Modernized

A real-time collaborative employee grid application built with .NET 9 Web API and React TypeScript, featuring modern state management and optimistic updates.

## Migration from Legacy Version

This modernized version replaces:
- **.NET Framework 4.5** → **.NET 9**
- **ASP.NET MVC** → **ASP.NET Core Web API**
- **jQuery + Knockout.js** → **React + TypeScript + TanStack Query**
- **SQL Server Compact** → **SQLite with EF Core**
- **Old SignalR 1.x** → **Modern SignalR Core**
- **Manual state management** → **TanStack Query with automatic caching**

The core functionality (real-time collaborative editing with row locking) remains the same but with a modern, maintainable architecture and superior user experience.

## ✨ Key Features

### 🚀 **Real-time Collaboration**
- Multiple users can edit the grid simultaneously with live updates
- Row locking prevents conflicts when multiple users try to edit the same record
- Real-time notifications when other users make changes
- Automatic reconnection when connection is lost

### 💾 **Modern State Management**
- **TanStack Query** for intelligent data fetching and caching
- **Optimistic updates** for immediate UI feedback
- **Automatic background synchronization**
- **Smart caching** reduces unnecessary API calls

### 🔄 **Enhanced User Experience**
- Instant visual feedback with optimistic updates
- Graceful error handling with automatic retry
- Professional connection status indicators
- Non-intrusive real-time notifications

### 🛠️ **Developer Experience**
- **React Query DevTools** for debugging data flow
- **TypeScript** for type safety
- **Hot module replacement** for fast development
- **Modern build tools** with Vite

## Architecture

### Backend (.NET 9 Web API)
- **RealtimeGrid.Api**: Web API with SignalR hub
- **Entity Framework Core**: ORM with SQLite provider
- **SignalR Hub**: Handles real-time communication for employee locking/unlocking and updates
- **Automatic reconnection**: Built-in connection resilience

### Frontend (React TypeScript + TanStack Query + Vite)
- **React 19**: Modern UI library with hooks
- **TypeScript**: Type safety and better developer experience
- **TanStack Query**: Powerful data fetching and state management
- **Vite**: Fast build tool and development server
- **SignalR Client**: Real-time communication with the backend
- **React Hot Toast**: Professional notification system

## Getting Started

### Prerequisites
- .NET 9 SDK
- Node.js (v18 or later)
- npm or yarn

### Running the Application

1. **Start the Backend API:**
   ```bash
   cd Backend/RealtimeGrid.Api
   dotnet run
   ```
   The API will start on `http://localhost:5043` by default.

2. **Start the Frontend (in a new terminal):**
   ```bash
   cd Frontend/realtime-grid-frontend
   npm install  # First time only
   npm run dev
   ```
   The frontend will start on `http://localhost:5173` (or next available port).

3. **Open the application:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5043
   - Swagger UI: http://localhost:5043/swagger

### Testing Real-time Features

1. **Multi-user Testing:**
   - Open the application in multiple browser windows/tabs
   - Open different browsers (Chrome, Firefox, Edge) for more realistic testing

2. **Row Locking:**
   - Start editing an employee in one window - you'll see it gets locked (blue background)
   - Try to edit the same employee in another window - it should show "Locked" button
   - Cancel or save the edit to unlock the row

3. **Real-time Updates:**
   - Make changes and save in one window
   - Other windows should see the updates instantly with a success notification
   - Changes appear immediately due to optimistic updates

4. **Connection Status:**
   - Monitor the connection status bar at the top
   - Test connection loss by stopping the backend - watch reconnection attempts
   - Restart backend to see automatic reconnection

5. **Data Persistence:**
   - Thanks to TanStack Query caching, data persists across page refreshes
   - Network requests are minimized through intelligent caching

## Database

The application uses SQLite with Entity Framework Core. The database is automatically created on first run with seed data for 55+ employees.

**Database file**: `realtimegrid.db` (in the API project directory)

## API Endpoints

- `GET /api/employees` - Get all employees
- `PUT /api/employees/{id}` - Update employee
- Additional CRUD endpoints available (see Swagger UI)

## SignalR Hub

- **Hub endpoint**: `/employeeHub`
- **Client Methods (sent from server)**:
  - `LockEmployee(id, connectionId)` - Notify when employee is locked
  - `UnlockEmployee(id)` - Notify when employee is unlocked
  - `LockFailed(id)` - Notify when lock attempt fails
  - `EmployeeUpdated(id, propertyName, value, connectionId)` - Real-time data updates
  - `LockStatusUpdate(lockStatus)` - Initial lock status for new connections

- **Server Methods (called from client)**:
  - `Lock(id)` - Lock employee for editing
  - `Unlock(id)` - Unlock employee
  - `UpdateEmployee(id, propertyName, value)` - Broadcast property updates
  - `GetLockStatus()` - Get current lock status

## TanStack Query Integration

### Custom Hooks
- `useEmployees()` - Fetches and caches employee data with error handling
- `useUpdateEmployee()` - Handles updates with optimistic updates and rollback
- `useEmployeeRealtimeUpdates()` - Manages cache updates from SignalR events

### Query Features
- **Automatic caching** - Data is cached and shared between components
- **Background updates** - Fresh data fetched when stale
- **Optimistic updates** - UI updates immediately before server confirmation
- **Error handling** - Automatic retry with rollback on failure
- **DevTools integration** - Debug queries in development mode

## Connection Status Management

The application provides intelligent connection status feedback:

- **🔄 Initial Connection**: "Connecting to real-time updates..." (soft yellow)
- **✅ Connected**: "Connected to real-time updates" (green)
- **🔄 Reconnecting**: "Reconnecting to real-time updates..." (soft yellow)
- **❌ Disconnected**: Context-aware error messages (red)

**Smart Error Handling**:
- No error toasts during normal startup delays
- Progressive error messaging only after multiple failed attempts
- Different messages for initial connection vs. lost connection scenarios

## Development

### Backend Development
```bash
cd Backend/RealtimeGrid.Api
dotnet watch run  # Hot reload enabled
```

### Frontend Development
```bash
cd Frontend/realtime-grid-frontend
npm run dev  # Vite hot module replacement
```

**Development Tools:**
- **React Query DevTools**: Available in development mode (toggle with browser extension)
- **Vite HMR**: Instant updates without losing component state
- **TypeScript**: Compile-time type checking
- **ESLint**: Code quality enforcement

### Key Dependencies

**Frontend:**
- `@tanstack/react-query` - Data fetching and state management
- `@tanstack/react-query-devtools` - Development debugging tools
- `@microsoft/signalr` - Real-time communication
- `react-hot-toast` - Notification system
- `typescript` - Type safety

**Backend:**
- `Microsoft.AspNetCore.SignalR` - Real-time communication hub
- `Microsoft.EntityFrameworkCore.Sqlite` - Database ORM
- `.NET 9` - Modern runtime and APIs

### Building for Production

**Backend:**
```bash
cd Backend/RealtimeGrid.Api
dotnet publish -c Release -o publish
```

**Frontend:**
```bash
cd Frontend/realtime-grid-frontend
npm run build
# Built files will be in the 'dist' directory
```

## Troubleshooting

### Common Issues

1. **Port conflicts**: 
   - Backend default: `http://localhost:5043`
   - Frontend default: `http://localhost:5173`
   - Vite will use next available port if 5173 is busy

2. **Connection issues**:
   - Ensure backend is running before frontend
   - Check browser console for SignalR connection errors
   - Firewall may block WebSocket connections

3. **Database issues**:
   - Delete `realtimegrid.db*` files to reset database
   - Check Entity Framework migrations are applied

4. **Cache issues**:
   - React Query DevTools shows cache status
   - Clear browser cache if seeing stale data
   - Check Network tab for actual API calls

### Performance Tips

- **TanStack Query** automatically manages request deduplication
- **Optimistic updates** provide instant UI feedback
- **Background refetching** keeps data fresh without user interaction
- **SignalR automatic reconnection** handles network interruptions gracefully

## Recent Improvements

- ✅ **TanStack Query Migration** - Replaced manual useEffect data fetching
- ✅ **Optimistic Updates** - Immediate UI feedback before server confirmation  
- ✅ **Improved Connection UX** - Smart error messaging and status indicators
- ✅ **Fixed Toast Spam** - Eliminated repeated error notifications
- ✅ **Enhanced Caching** - Intelligent background data synchronization
- ✅ **Better Error Handling** - Automatic retry with rollback capabilities
