import type { Employee } from '../types/Employee';

const API_BASE_URL = 'http://localhost:5000/api';

export class EmployeeService {
  static async getEmployees(): Promise<Employee[]> {
    const response = await fetch(`${API_BASE_URL}/employees`);
    if (!response.ok) {
      throw new Error('Failed to fetch employees');
    }
    return response.json();
  }

  static async updateEmployee(id: number, employee: Partial<Employee>): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/employees/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...employee, id }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update employee');
    }
  }

  static async createEmployee(employee: Omit<Employee, 'id'>): Promise<Employee> {
    const response = await fetch(`${API_BASE_URL}/employees`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(employee),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create employee');
    }
    return response.json();
  }

  static async deleteEmployee(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/employees/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete employee');
    }
  }
}