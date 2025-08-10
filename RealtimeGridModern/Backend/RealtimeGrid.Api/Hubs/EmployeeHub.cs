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
                foreach (var employeeId in lockedEmployees)
                {
                    var employee = await _context.Employees.FindAsync(employeeId);
                    if (employee != null)
                    {
                        employee.Locked = false;
                        _context.Entry(employee).State = EntityState.Modified;
                        await _context.SaveChangesAsync();
                        await Clients.Others.SendAsync("UnlockEmployee", employeeId);
                    }
                }
                _connectionMappings.TryRemove(Context.ConnectionId, out _);
            }
            
            await base.OnDisconnectedAsync(exception);
        }

        public async Task Lock(int id)
        {
            var employee = await _context.Employees.FindAsync(id);
            if (employee != null && !employee.Locked)
            {
                employee.Locked = true;
                _context.Entry(employee).State = EntityState.Modified;
                await _context.SaveChangesAsync();
                
                if (_connectionMappings.TryGetValue(Context.ConnectionId, out var list))
                {
                    list.Add(id);
                }
                
                await Clients.Others.SendAsync("LockEmployee", id, Context.ConnectionId);
            }
        }

        public async Task Unlock(int id)
        {
            var employee = await _context.Employees.FindAsync(id);
            if (employee != null)
            {
                employee.Locked = false;
                _context.Entry(employee).State = EntityState.Modified;
                await _context.SaveChangesAsync();
                
                if (_connectionMappings.TryGetValue(Context.ConnectionId, out var list))
                {
                    list.Remove(id);
                }
                
                await Clients.Others.SendAsync("UnlockEmployee", id);
            }
        }

        public async Task UpdateEmployee(int id, string propertyName, object value)
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
                
                await Clients.Others.SendAsync("EmployeeUpdated", id, propertyName, value);
            }
        }
    }
}