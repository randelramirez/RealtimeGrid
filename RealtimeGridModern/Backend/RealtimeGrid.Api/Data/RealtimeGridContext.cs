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

            // Seed data - 50+ employees
            var employees = new List<Employee>
            {
                new Employee { Id = 1, Name = "John Doe", Email = "john.doe@company.com", Sex = "Male", Salary = 50000, Locked = false },
                new Employee { Id = 2, Name = "Jane Smith", Email = "jane.smith@company.com", Sex = "Female", Salary = 60000, Locked = false },
                new Employee { Id = 3, Name = "Bob Johnson", Email = "bob.johnson@company.com", Sex = "Male", Salary = 55000, Locked = false },
                new Employee { Id = 4, Name = "Alice Brown", Email = "alice.brown@company.com", Sex = "Female", Salary = 65000, Locked = false },
                new Employee { Id = 5, Name = "Charlie Davis", Email = "charlie.davis@company.com", Sex = "Male", Salary = 58000, Locked = false },
                new Employee { Id = 6, Name = "Emma Wilson", Email = "emma.wilson@company.com", Sex = "Female", Salary = 62000, Locked = false },
                new Employee { Id = 7, Name = "Michael Torres", Email = "michael.torres@company.com", Sex = "Male", Salary = 53000, Locked = false },
                new Employee { Id = 8, Name = "Sarah Martinez", Email = "sarah.martinez@company.com", Sex = "Female", Salary = 67000, Locked = false },
                new Employee { Id = 9, Name = "David Anderson", Email = "david.anderson@company.com", Sex = "Male", Salary = 59000, Locked = false },
                new Employee { Id = 10, Name = "Lisa Garcia", Email = "lisa.garcia@company.com", Sex = "Female", Salary = 61000, Locked = false },
                new Employee { Id = 11, Name = "James Miller", Email = "james.miller@company.com", Sex = "Male", Salary = 56000, Locked = false },
                new Employee { Id = 12, Name = "Michelle Thompson", Email = "michelle.thompson@company.com", Sex = "Female", Salary = 63000, Locked = false },
                new Employee { Id = 13, Name = "Robert Lee", Email = "robert.lee@company.com", Sex = "Male", Salary = 52000, Locked = false },
                new Employee { Id = 14, Name = "Jennifer White", Email = "jennifer.white@company.com", Sex = "Female", Salary = 64000, Locked = false },
                new Employee { Id = 15, Name = "Christopher Martin", Email = "christopher.martin@company.com", Sex = "Male", Salary = 57000, Locked = false },
                new Employee { Id = 16, Name = "Amanda Jackson", Email = "amanda.jackson@company.com", Sex = "Female", Salary = 66000, Locked = false },
                new Employee { Id = 17, Name = "Matthew Harris", Email = "matthew.harris@company.com", Sex = "Male", Salary = 54000, Locked = false },
                new Employee { Id = 18, Name = "Ashley Clark", Email = "ashley.clark@company.com", Sex = "Female", Salary = 68000, Locked = false },
                new Employee { Id = 19, Name = "Daniel Lewis", Email = "daniel.lewis@company.com", Sex = "Male", Salary = 51000, Locked = false },
                new Employee { Id = 20, Name = "Jessica Rodriguez", Email = "jessica.rodriguez@company.com", Sex = "Female", Salary = 69000, Locked = false },
                new Employee { Id = 21, Name = "Anthony Walker", Email = "anthony.walker@company.com", Sex = "Male", Salary = 58000, Locked = false },
                new Employee { Id = 22, Name = "Nicole Hall", Email = "nicole.hall@company.com", Sex = "Female", Salary = 62000, Locked = false },
                new Employee { Id = 23, Name = "Joshua Young", Email = "joshua.young@company.com", Sex = "Male", Salary = 55000, Locked = false },
                new Employee { Id = 24, Name = "Elizabeth Allen", Email = "elizabeth.allen@company.com", Sex = "Female", Salary = 65000, Locked = false },
                new Employee { Id = 25, Name = "Andrew King", Email = "andrew.king@company.com", Sex = "Male", Salary = 53000, Locked = false },
                new Employee { Id = 26, Name = "Megan Wright", Email = "megan.wright@company.com", Sex = "Female", Salary = 67000, Locked = false },
                new Employee { Id = 27, Name = "Kevin Scott", Email = "kevin.scott@company.com", Sex = "Male", Salary = 56000, Locked = false },
                new Employee { Id = 28, Name = "Stephanie Green", Email = "stephanie.green@company.com", Sex = "Female", Salary = 64000, Locked = false },
                new Employee { Id = 29, Name = "Brian Adams", Email = "brian.adams@company.com", Sex = "Male", Salary = 59000, Locked = false },
                new Employee { Id = 30, Name = "Rachel Baker", Email = "rachel.baker@company.com", Sex = "Female", Salary = 61000, Locked = false },
                new Employee { Id = 31, Name = "Steven Nelson", Email = "steven.nelson@company.com", Sex = "Male", Salary = 52000, Locked = false },
                new Employee { Id = 32, Name = "Lauren Hill", Email = "lauren.hill@company.com", Sex = "Female", Salary = 63000, Locked = false },
                new Employee { Id = 33, Name = "Timothy Ramirez", Email = "timothy.ramirez@company.com", Sex = "Male", Salary = 57000, Locked = false },
                new Employee { Id = 34, Name = "Samantha Campbell", Email = "samantha.campbell@company.com", Sex = "Female", Salary = 66000, Locked = false },
                new Employee { Id = 35, Name = "Ryan Mitchell", Email = "ryan.mitchell@company.com", Sex = "Male", Salary = 54000, Locked = false },
                new Employee { Id = 36, Name = "Katherine Roberts", Email = "katherine.roberts@company.com", Sex = "Female", Salary = 68000, Locked = false },
                new Employee { Id = 37, Name = "Jason Carter", Email = "jason.carter@company.com", Sex = "Male", Salary = 51000, Locked = false },
                new Employee { Id = 38, Name = "Heather Phillips", Email = "heather.phillips@company.com", Sex = "Female", Salary = 69000, Locked = false },
                new Employee { Id = 39, Name = "Eric Evans", Email = "eric.evans@company.com", Sex = "Male", Salary = 58000, Locked = false },
                new Employee { Id = 40, Name = "Christine Turner", Email = "christine.turner@company.com", Sex = "Female", Salary = 62000, Locked = false },
                new Employee { Id = 41, Name = "Jeffrey Parker", Email = "jeffrey.parker@company.com", Sex = "Male", Salary = 55000, Locked = false },
                new Employee { Id = 42, Name = "Deborah Collins", Email = "deborah.collins@company.com", Sex = "Female", Salary = 65000, Locked = false },
                new Employee { Id = 43, Name = "Gregory Edwards", Email = "gregory.edwards@company.com", Sex = "Male", Salary = 53000, Locked = false },
                new Employee { Id = 44, Name = "Maria Stewart", Email = "maria.stewart@company.com", Sex = "Female", Salary = 67000, Locked = false },
                new Employee { Id = 45, Name = "Jacob Sanchez", Email = "jacob.sanchez@company.com", Sex = "Male", Salary = 56000, Locked = false },
                new Employee { Id = 46, Name = "Susan Morris", Email = "susan.morris@company.com", Sex = "Female", Salary = 64000, Locked = false },
                new Employee { Id = 47, Name = "Patrick Rogers", Email = "patrick.rogers@company.com", Sex = "Male", Salary = 59000, Locked = false },
                new Employee { Id = 48, Name = "Helen Reed", Email = "helen.reed@company.com", Sex = "Female", Salary = 61000, Locked = false },
                new Employee { Id = 49, Name = "Nathan Cook", Email = "nathan.cook@company.com", Sex = "Male", Salary = 52000, Locked = false },
                new Employee { Id = 50, Name = "Kimberly Bell", Email = "kimberly.bell@company.com", Sex = "Female", Salary = 63000, Locked = false },
                new Employee { Id = 51, Name = "Carl Murphy", Email = "carl.murphy@company.com", Sex = "Male", Salary = 57000, Locked = false },
                new Employee { Id = 52, Name = "Amy Bailey", Email = "amy.bailey@company.com", Sex = "Female", Salary = 66000, Locked = false },
                new Employee { Id = 53, Name = "Harold Rivera", Email = "harold.rivera@company.com", Sex = "Male", Salary = 54000, Locked = false },
                new Employee { Id = 54, Name = "Donna Cooper", Email = "donna.cooper@company.com", Sex = "Female", Salary = 68000, Locked = false },
                new Employee { Id = 55, Name = "Arthur Richardson", Email = "arthur.richardson@company.com", Sex = "Male", Salary = 51000, Locked = false }
            };

            modelBuilder.Entity<Employee>().HasData(employees);
        }
    }
}