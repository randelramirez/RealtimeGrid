import React, { useState, useEffect, useRef } from 'react';
import type { Employee } from '../types/Employee';
import { EmployeeService } from '../services/EmployeeService';
import { SignalRService } from '../services/SignalRService';
import toast from 'react-hot-toast';
import './EmployeeGrid.css';

interface EmployeeRowProps {
  employee: Employee;
  isLocked: boolean;
  isEditing: boolean;
  onEdit: (id: number) => void;
  onSave: (id: number) => void;
  onCancel: (id: number) => void;
  onFieldChange: (field: string, value: string) => void;
  editingData: Partial<Employee>;
}

const EmployeeRow: React.FC<EmployeeRowProps> = ({
  employee,
  isLocked,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  onFieldChange,
  editingData
}) => {
  if (isLocked && !isEditing) {
    return (
      <tr className="locked-row">
        <td><button className="btn btn-danger" disabled>Locked</button></td>
        <td style={{ color: 'blue' }}>{employee.name}</td>
        <td style={{ color: 'blue' }}>{employee.sex}</td>
        <td style={{ color: 'blue' }}>{employee.email}</td>
        <td style={{ color: 'blue' }}>${employee.salary.toLocaleString()}</td>
      </tr>
    );
  }

  if (isEditing) {
    return (
      <tr className="editing-row">
        <td>
          <button className="btn btn-success" onClick={() => onSave(employee.id)}>Save</button>
          <button className="btn btn-secondary ml-2" onClick={() => onCancel(employee.id)}>Cancel</button>
        </td>
        <td>
          <input
            type="text"
            value={editingData.name || ''}
            onChange={(e) => onFieldChange('name', e.target.value)}
            className="form-control"
          />
        </td>
        <td>
          <input
            type="text"
            value={editingData.sex || ''}
            onChange={(e) => onFieldChange('sex', e.target.value)}
            className="form-control"
          />
        </td>
        <td>
          <input
            type="email"
            value={editingData.email || ''}
            onChange={(e) => onFieldChange('email', e.target.value)}
            className="form-control"
          />
        </td>
        <td>
          <input
            type="number"
            value={editingData.salary || 0}
            onChange={(e) => onFieldChange('salary', e.target.value)}
            className="form-control"
          />
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td><button className="btn btn-primary" onClick={() => onEdit(employee.id)}>Edit</button></td>
      <td style={{color: 'blue'}}>{employee.name}</td>
      <td style={{color: 'blue'}}>{employee.sex}</td>
      <td style={{color: 'blue'}}>{employee.email}</td>
      <td style={{color: 'blue'}}>${employee.salary.toLocaleString()}</td>
    </tr>
  );
};

const EmployeeGrid: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingData, setEditingData] = useState<Partial<Employee>>({});
  const [lockedEmployees, setLockedEmployees] = useState<Set<number>>(new Set());
  const signalRService = useRef<SignalRService>(new SignalRService());

  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const data = await EmployeeService.getEmployees();
        setEmployees(data);
      } catch (error) {
        console.error('Failed to load employees:', error);
        toast.error('Failed to load employees');
      } finally {
        setLoading(false);
      }
    };

    const connectSignalR = async () => {
      try {
        await signalRService.current.connect();
        
        signalRService.current.on('LockEmployee', (id: number, _connectionId: string) => {
          setLockedEmployees(prev => new Set([...prev, id]));
          toast.success(`Employee ${id} locked by another user`);
        });

        signalRService.current.on('UnlockEmployee', (id: number) => {
          setLockedEmployees(prev => {
            const newSet = new Set(prev);
            newSet.delete(id);
            return newSet;
          });
        });

        signalRService.current.on('LockFailed', (id: number) => {
          toast.error(`Cannot edit employee ${id} - already locked by another user`);
        });

        signalRService.current.on('LockStatusUpdate', (lockStatus: Record<number, string>) => {
          setLockedEmployees(new Set(Object.keys(lockStatus).map(Number)));
        });

        signalRService.current.on('EmployeeUpdated', (id: number, propertyName: string, value: any) => {
          setEmployees(prev => prev.map(emp => 
            emp.id === id ? { ...emp, [propertyName]: value } : emp
          ));
          toast.success(`Employee ${id} updated by another user`);
        });

        // Get initial lock status
        await signalRService.current.getLockStatus();
      } catch (error) {
        console.error('Failed to connect to SignalR:', error);
        toast.error('Failed to connect to real-time updates');
      }
    };

    loadEmployees();
    connectSignalR();

    return () => {
      signalRService.current.disconnect();
    };
  }, []);

  const handleEdit = async (id: number) => {
    const employee = employees.find(emp => emp.id === id);
    if (!employee) return;

    // Check if employee is already locked
    if (lockedEmployees.has(id)) {
      toast.error('This employee is currently being edited by another user');
      return;
    }

    try {
      await signalRService.current.lockEmployee(id);
      setEditingId(id);
      setEditingData({ ...employee });
    } catch (error) {
      console.error('Failed to lock employee:', error);
      toast.error('Failed to lock employee for editing');
    }
  };

  const handleSave = async (id: number) => {
    try {
      await EmployeeService.updateEmployee(id, editingData);
      
      // Update local state
      setEmployees(prev => prev.map(emp => 
        emp.id === id ? { ...emp, ...editingData } : emp
      ));

      // Send updates through SignalR for each changed field
      const originalEmployee = employees.find(emp => emp.id === id);
      if (originalEmployee) {
        for (const [key, value] of Object.entries(editingData)) {
          if (originalEmployee[key as keyof Employee] !== value) {
            await signalRService.current.updateEmployee(id, key, value);
          }
        }
      }

      await signalRService.current.unlockEmployee(id);
      setEditingId(null);
      setEditingData({});
      
      // Remove from locked state locally (will be confirmed by SignalR)
      setLockedEmployees(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });

      toast.success('Employee updated successfully');
    } catch (error) {
      console.error('Failed to save employee:', error);
      toast.error('Failed to save employee');
    }
  };

  const handleCancel = async (id: number) => {
    try {
      await signalRService.current.unlockEmployee(id);
      setEditingId(null);
      setEditingData({});
      
      // Remove from locked state locally (will be confirmed by SignalR)
      setLockedEmployees(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    } catch (error) {
      console.error('Failed to unlock employee:', error);
    }
  };

  const handleFieldChange = (field: string, value: string) => {
    setEditingData(prev => ({
      ...prev,
      [field]: field === 'salary' ? parseFloat(value) || 0 : value
    }));
  };

  if (loading) {
    return <div className="loading">Loading employees...</div>;
  }

  return (
    <div className="employee-grid">
      <h1 style={{color:'blue'}}>Real-time Employee Grid</h1>
      <p className="instructions">
        Open this page in multiple browser windows/tabs to see real-time collaborative editing in action!
      </p>
      
      <table className="table">
        <thead>
          <tr>
            <th>Action</th>
            <th>Name</th>
            <th>Sex</th>
            <th>Email</th>
            <th>Salary</th>
          </tr>
        </thead>
        <tbody>
          {employees.map(employee => (
            <EmployeeRow
              key={employee.id}
              employee={employee}
              isLocked={lockedEmployees.has(employee.id)}
              isEditing={editingId === employee.id}
              onEdit={handleEdit}
              onSave={handleSave}
              onCancel={handleCancel}
              onFieldChange={handleFieldChange}
              editingData={editingData}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default EmployeeGrid;