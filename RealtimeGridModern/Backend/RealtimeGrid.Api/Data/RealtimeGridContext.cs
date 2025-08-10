using Microsoft.EntityFrameworkCore;
using RealtimeGrid.Api.Models;

namespace RealtimeGrid.Api.Data
{
    public class RealtimeGridContext : DbContext
    {
        public RealtimeGridContext(DbContextOptions<RealtimeGridContext> options) : base(options)
        {
        }

        public DbSet<Employee> Employees { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Seed data
            modelBuilder.Entity<Employee>().HasData(
                new Employee { Id = 1, Name = "John Doe", Email = "john@example.com", Sex = "Male", Salary = 50000, Locked = false },
                new Employee { Id = 2, Name = "Jane Smith", Email = "jane@example.com", Sex = "Female", Salary = 60000, Locked = false },
                new Employee { Id = 3, Name = "Bob Johnson", Email = "bob@example.com", Sex = "Male", Salary = 55000, Locked = false },
                new Employee { Id = 4, Name = "Alice Brown", Email = "alice@example.com", Sex = "Female", Salary = 65000, Locked = false },
                new Employee { Id = 5, Name = "Charlie Davis", Email = "charlie@example.com", Sex = "Male", Salary = 58000, Locked = false }
            );
        }
    }
}