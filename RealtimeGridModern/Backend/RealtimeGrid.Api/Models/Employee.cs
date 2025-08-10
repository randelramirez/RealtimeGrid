namespace RealtimeGrid.Api.Models
{
    public class Employee
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Sex { get; set; } = string.Empty;
        public decimal Salary { get; set; }
        public bool Locked { get; set; }
    }
}