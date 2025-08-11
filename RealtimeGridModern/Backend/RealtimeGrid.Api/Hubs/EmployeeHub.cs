using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using RealtimeGrid.Api.Data;
using RealtimeGrid.Api.Models;
using System.Collections.Concurrent;

namespace RealtimeGrid.Api.Hubs
{
    public class EmployeeHub : Hub
    {
        private readonly RealtimeGridContext _context;
        // In-memory storage for locked employees (employeeId -> connectionId)
        private static readonly ConcurrentDictionary<int, string> _lockedEmployees = new();
        // Track which employees each connection has locked
        private static readonly ConcurrentDictionary<string, List<int>> _connectionMappings = new();

        public EmployeeHub(RealtimeGridContext context)
        {
            _context = context;
        }

        public override async Task OnConnectedAsync()
        {
            _connectionMappings.TryAdd(Context.ConnectionId, new List<int>());
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            if (_connectionMappings.TryGetValue(Context.ConnectionId, out var lockedEmployees))
            {
                // Unlock all employees that were locked by this connection
                foreach (var employeeId in lockedEmployees)
                {
                    _lockedEmployees.TryRemove(employeeId, out _);
                    await Clients.Others.SendAsync("UnlockEmployee", employeeId);
                }
                _connectionMappings.TryRemove(Context.ConnectionId, out _);
            }
            
            await base.OnDisconnectedAsync(exception);
        }

        public async Task Lock(int id)
        {
            // Check if employee is already locked by another connection
            if (_lockedEmployees.TryAdd(id, Context.ConnectionId))
            {
                // Successfully locked, add to connection mappings
                if (_connectionMappings.TryGetValue(Context.ConnectionId, out var list))
                {
                    list.Add(id);
                }
                
                // Notify other clients that this employee is now locked
                await Clients.Others.SendAsync("LockEmployee", id, Context.ConnectionId);
            }
            else
            {
                // Employee is already locked, notify the caller
                await Clients.Caller.SendAsync("LockFailed", id);
            }
        }

        public async Task Unlock(int id)
        {
            // Check if this connection owns the lock
            if (_lockedEmployees.TryGetValue(id, out var lockingConnectionId) && 
                lockingConnectionId == Context.ConnectionId)
            {
                _lockedEmployees.TryRemove(id, out _);
                
                if (_connectionMappings.TryGetValue(Context.ConnectionId, out var list))
                {
                    list.Remove(id);
                }
                
                // Notify other clients that this employee is now unlocked
                await Clients.Others.SendAsync("UnlockEmployee", id);
            }
        }

        public async Task UpdateEmployee(int id, string propertyName, object value)
        {
            // Only allow updates if the current connection has the employee locked
            if (_lockedEmployees.TryGetValue(id, out var lockingConnectionId) && 
                lockingConnectionId == Context.ConnectionId)
            {
                var employee = await _context.Employees.FindAsync(id);
                if (employee != null)
                {
                    switch (propertyName.ToLower())
                    {
                        case "name":
                            employee.Name = value?.ToString() ?? string.Empty;
                            break;
                        case "email":
                            employee.Email = value?.ToString() ?? string.Empty;
                            break;
                        case "sex":
                            employee.Sex = value?.ToString() ?? string.Empty;
                            break;
                        case "salary":
                            if (decimal.TryParse(value?.ToString(), out var salary))
                                employee.Salary = salary;
                            break;
                    }

                    _context.Entry(employee).State = EntityState.Modified;
                    await _context.SaveChangesAsync();
                    
                    // Notify only OTHER clients (not the caller) of the update, include the connection ID
                    await Clients.Others.SendAsync("EmployeeUpdated", id, propertyName, value, Context.ConnectionId);
                }
            }
        }

        // Method to get the current lock status for all employees
        public async Task GetLockStatus()
        {
            await Clients.Caller.SendAsync("LockStatusUpdate", _lockedEmployees.ToDictionary(kvp => kvp.Key, kvp => kvp.Value));
        }
    }
}