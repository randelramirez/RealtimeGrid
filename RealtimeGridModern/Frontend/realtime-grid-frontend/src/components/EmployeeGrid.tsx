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
  const [signalRConnected, setSignalRConnected] = useState(false);
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

    const connectSignalR = async (retryCount = 0) => {
      const maxRetries = 5; // Increased retry count
      
      try {
        const service = signalRService.current;
        
        // Add a delay before connection, especially on first attempt
        if (retryCount === 0) {
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second on first attempt
        }
        
        await service.connect();
        setSignalRConnected(true);
        console.log('SignalR connected successfully');
        
        service.on('LockEmployee', (...args: unknown[]) => {
          const [id, lockingConnectionId] = args as [number, string];
          const currentConnectionId = service.getConnectionId();
          
          // Only show notification if it's not from this connection
          if (lockingConnectionId !== currentConnectionId) {
            setLockedEmployees(prev => new Set([...prev, id]));
            toast.success(`Employee ${id} locked by another user`);
          } else {
            // Still update the state for our own locks
            setLockedEmployees(prev => new Set([...prev, id]));
          }
        });

        service.on('UnlockEmployee', (...args: unknown[]) => {
          const [id] = args as [number];
          setLockedEmployees(prev => {
            const newSet = new Set(prev);
            newSet.delete(id);
            return newSet;
          });
        });

        service.on('LockFailed', (...args: unknown[]) => {
          const [id] = args as [number];
          toast.error(`Cannot edit employee ${id} - already locked by another user`);
        });

        service.on('LockStatusUpdate', (...args: unknown[]) => {
          const [lockStatus] = args as [Record<number, string>];
          setLockedEmployees(new Set(Object.keys(lockStatus).map(Number)));
        });

        service.on('EmployeeUpdated', (...args: unknown[]) => {
          const [id, propertyName, value, updatedByConnectionId] = args as [number, string, unknown, string];
          const currentConnectionId = service.getConnectionId();
          
          // Update the employee data regardless of who updated it
          setEmployees(prev => prev.map(emp => 
            emp.id === id ? { ...emp, [propertyName]: value } : emp
          ));
          
          // Only show notification if it's not from this connection
          if (updatedByConnectionId !== currentConnectionId) {
            toast.success(`Employee ${id} updated by another user`);
          }
        });

        // Get initial lock status
        try {
          await service.getLockStatus();
        } catch (lockStatusError) {
          console.warn('Failed to get initial lock status:', lockStatusError);
        }
      } catch (error) {
        console.error('Failed to connect to SignalR:', error);
        setSignalRConnected(false);
        
        if (retryCount < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, retryCount), 5000); // Exponential backoff up to 5 seconds
          console.log(`Retrying SignalR connection in ${delay}ms... (attempt ${retryCount + 1}/${maxRetries})`);
          
          // Only show toast on first failure and final failure
          if (retryCount === 0) {
            toast.error('Connection to real-time updates failed. Retrying...');
          }
          
          setTimeout(() => connectSignalR(retryCount + 1), delay);
        } else {
          toast.error('Failed to connect to real-time updates after multiple attempts. Refreshing the page may help.');
        }
      }
    };

    loadEmployees();
    connectSignalR();

    const service = signalRService.current;
    return () => {
      service.disconnect();
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

    // Check if SignalR is connected
    if (!signalRService.current.isConnected()) {
      toast.error('Real-time connection is not available. Cannot edit employee.');
      return;
    }

    try {
      await signalRService.current.lockEmployee(id);
      setEditingId(id);
      setEditingData({ ...employee });
    } catch (error) {
      console.error('Failed to lock employee:', error);
      toast.error('Failed to lock employee for editing. Please check your connection.');
    }
  };

  const handleSave = async (id: number) => {
    try {
      await EmployeeService.updateEmployee(id, editingData);
      
      // Update local state
      setEmployees(prev => prev.map(emp => 
        emp.id === id ? { ...emp, ...editingData } : emp
      ));

      // Send updates through SignalR for each changed field (only if connected)
      if (signalRService.current.isConnected()) {
        const originalEmployee = employees.find(emp => emp.id === id);
        if (originalEmployee) {
          for (const [key, value] of Object.entries(editingData)) {
            if (originalEmployee[key as keyof Employee] !== value) {
              try {
                await signalRService.current.updateEmployee(id, key, value);
              } catch (signalRError) {
                console.warn('Failed to send real-time update:', signalRError);
              }
            }
          }
        }
      }

      // Unlock the employee (with error handling)
      if (signalRService.current.isConnected()) {
        try {
          await signalRService.current.unlockEmployee(id);
        } catch (signalRError) {
          console.warn('Failed to unlock employee via SignalR:', signalRError);
        }
      }
      
      setEditingId(null);
      setEditingData({});
      
      // Remove from locked state locally (will be confirmed by SignalR if connected)
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
      // Unlock the employee (with error handling)
      if (signalRService.current.isConnected()) {
        try {
          await signalRService.current.unlockEmployee(id);
        } catch (signalRError) {
          console.warn('Failed to unlock employee via SignalR:', signalRError);
        }
      }
      
      setEditingId(null);
      setEditingData({});
      
      // Remove from locked state locally (will be confirmed by SignalR if connected)
      setLockedEmployees(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    } catch (error) {
      console.error('Failed to cancel edit:', error);
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
      <div className="status-bar" style={{ marginBottom: '1rem', padding: '0.5rem', backgroundColor: signalRConnected ? '#d4edda' : '#f8d7da', border: '1px solid ' + (signalRConnected ? '#c3e6cb' : '#f5c6cb'), borderRadius: '0.25rem' }}>
        <strong>Connection Status:</strong> {signalRConnected ? '✅ Connected to real-time updates' : '❌ Disconnected - Limited functionality'}
      </div>
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