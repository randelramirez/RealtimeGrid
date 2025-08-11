import React, { useState, useEffect, useRef } from 'react';
import type { Employee } from '../types/Employee';
import { useEmployees, useUpdateEmployee, useEmployeeRealtimeUpdates } from '../hooks/useEmployees';
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
  // Use TanStack Query for employees data
  const { data: employees = [], isLoading, error } = useEmployees();
  const updateEmployeeMutation = useUpdateEmployee();
  const { updateEmployeeInCache } = useEmployeeRealtimeUpdates();
  
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingData, setEditingData] = useState<Partial<Employee>>({});
  const [lockedEmployees, setLockedEmployees] = useState<Set<number>>(new Set());
  const [connectionStatus, setConnectionStatus] = useState<'initial-connecting' | 'connected' | 'reconnecting' | 'disconnected'>('initial-connecting');
  const [hasEverConnected, setHasEverConnected] = useState(false);
  const initialConnectionAttemptedRef = useRef(false);
  const signalRService = useRef<SignalRService>(new SignalRService());

  useEffect(() => {
    // Define event handlers as stable references (only created once)
    const handleLockEmployee = (...args: unknown[]) => {
      const [id, lockingConnectionId] = args as [number, string];
      const currentConnectionId = signalRService.current.getConnectionId();
      
      // Only show notification if it's not from this connection
      if (lockingConnectionId !== currentConnectionId) {
        setLockedEmployees(prev => new Set([...prev, id]));
        toast.success(`Employee ${id} locked by another user`);
      } else {
        // Still update the state for our own locks
        setLockedEmployees(prev => new Set([...prev, id]));
      }
    };

    const handleUnlockEmployee = (...args: unknown[]) => {
      const [id] = args as [number];
      setLockedEmployees(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    };

    const handleLockFailed = (...args: unknown[]) => {
      const [id] = args as [number];
      toast.error(`Cannot edit employee ${id} - already locked by another user`);
    };

    const handleLockStatusUpdate = (...args: unknown[]) => {
      const [lockStatus] = args as [Record<number, string>];
      setLockedEmployees(new Set(Object.keys(lockStatus).map(Number)));
    };

    const handleEmployeeUpdated = (...args: unknown[]) => {
      const [id, propertyName, value, updatedByConnectionId] = args as [number, string, unknown, string];
      const currentConnectionId = signalRService.current.getConnectionId();
      
      // Update the employee data in the React Query cache
      updateEmployeeInCache(id, propertyName, value);
      
      // Only show notification if it's not from this connection
      if (updatedByConnectionId !== currentConnectionId) {
        toast.success(`Employee ${id} updated by another user`);
      }
    };

    // Add connection state monitoring
    const handleConnectionClosed = () => {
      console.log('Connection lost, attempting to reconnect...');
      if (hasEverConnected) {
        setConnectionStatus('reconnecting');
        // SignalR's automatic reconnect will handle this
      }
    };

    const handleConnectionReconnecting = () => {
      console.log('SignalR is attempting to reconnect...');
      setConnectionStatus('reconnecting');
    };

    const handleConnectionReconnected = () => {
      console.log('SignalR reconnected successfully');
      setConnectionStatus('connected');
      toast.success('Real-time connection restored!');
    };

    // Register event handlers only once
    const service = signalRService.current;
    service.on('LockEmployee', handleLockEmployee);
    service.on('UnlockEmployee', handleUnlockEmployee);
    service.on('LockFailed', handleLockFailed);
    service.on('LockStatusUpdate', handleLockStatusUpdate);
    service.on('EmployeeUpdated', handleEmployeeUpdated);
    service.on('ConnectionClosed', handleConnectionClosed);
    service.on('ConnectionReconnecting', handleConnectionReconnecting);
    service.on('ConnectionReconnected', handleConnectionReconnected);

    const connectSignalR = async () => {
      // Prevent multiple connection attempts
      if (initialConnectionAttemptedRef.current) {
        return;
      }
      
      initialConnectionAttemptedRef.current = true;
      setConnectionStatus('initial-connecting');
      
      try {
        await service.connect();
        setConnectionStatus('connected');
        setHasEverConnected(true);
        console.log('SignalR connected successfully');

        // Get initial lock status
        try {
          await service.getLockStatus();
        } catch (lockStatusError) {
          console.warn('Failed to get initial lock status:', lockStatusError);
        }
      } catch (error) {
        console.error('Failed to connect to SignalR on initial attempt:', error);
        setConnectionStatus('disconnected');
        
        // Only show error toast for initial connection failure
        toast.error('Could not establish real-time connection. Some features may be limited.');
      }
    };

    // No need to loadEmployees() - TanStack Query handles this
    connectSignalR();

    return () => {
      // Clean up event handlers
      service.off('LockEmployee', handleLockEmployee);
      service.off('UnlockEmployee', handleUnlockEmployee);
      service.off('LockFailed', handleLockFailed);
      service.off('LockStatusUpdate', handleLockStatusUpdate);
      service.off('EmployeeUpdated', handleEmployeeUpdated);
      service.off('ConnectionClosed', handleConnectionClosed);
      service.off('ConnectionReconnecting', handleConnectionReconnecting);
      service.off('ConnectionReconnected', handleConnectionReconnected);
      service.disconnect();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array intentional - we want this to run only once on mount

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
      // Use the mutation to update the employee
      await updateEmployeeMutation.mutateAsync({ id, data: editingData });

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

      // Note: Success toast is handled by the mutation
    } catch (error) {
      console.error('Failed to save employee:', error);
      // Error toast is handled by the mutation
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

  if (isLoading) {
    return <div className="loading">Loading employees...</div>;
  }

  if (error) {
    return <div className="error">Error loading employees. Please try refreshing the page.</div>;
  }

  const getConnectionStatusInfo = () => {
    switch (connectionStatus) {
      case 'initial-connecting':
        return {
          backgroundColor: '#fff3cd',
          borderColor: '#ffeaa7',
          message: '🔄 Connecting to real-time updates...'
        };
      case 'reconnecting':
        return {
          backgroundColor: '#fff3cd',
          borderColor: '#ffeaa7',
          message: '🔄 Reconnecting to real-time updates...'
        };
      case 'connected':
        return {
          backgroundColor: '#d4edda',
          borderColor: '#c3e6cb',
          message: '✅ Connected to real-time updates'
        };
      case 'disconnected':
        return {
          backgroundColor: '#f8d7da',
          borderColor: '#f5c6cb',
          message: hasEverConnected 
            ? '❌ Real-time updates disconnected - Please refresh the page'
            : '❌ Could not establish real-time connection - Limited functionality'
        };
      default:
        return {
          backgroundColor: '#f8d7da',
          borderColor: '#f5c6cb',
          message: '❌ Connection status unknown'
        };
    }
  };

  const statusInfo = getConnectionStatusInfo();

  return (
    <div className="employee-grid">
      <h1 style={{color:'blue'}}>Real-time Employee Grid</h1>
      <div className="status-bar" style={{ marginBottom: '1rem', padding: '0.5rem', backgroundColor: statusInfo.backgroundColor, border: '1px solid ' + statusInfo.borderColor, borderRadius: '0.25rem' }}>
        <strong>Connection Status:</strong> {statusInfo.message}
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