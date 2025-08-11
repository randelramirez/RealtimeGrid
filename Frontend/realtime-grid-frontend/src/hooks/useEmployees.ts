import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { EmployeeService } from '../services/EmployeeService';
import type { Employee } from '../types/Employee';
import toast from 'react-hot-toast';
import { useEffect } from 'react';

export const EMPLOYEE_QUERY_KEY = 'employees';

export const useEmployees = () => {
  const query = useQuery({
    queryKey: [EMPLOYEE_QUERY_KEY],
    queryFn: EmployeeService.getEmployees,
    refetchOnWindowFocus: false, // Don't refetch when window gains focus
    refetchOnMount: true, // Refetch when component mounts
    staleTime: 1000 * 60 * 5, // Data is fresh for 5 minutes
    gcTime: 1000 * 60 * 10, // Keep in cache for 10 minutes
  });

  // Handle error when it occurs
  useEffect(() => {
    if (query.error) {
      console.error('Failed to load employees:', query.error);
      toast.error('Failed to load employees');
    }
  }, [query.error]);

  return query;
};

export const useUpdateEmployee = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Employee> }) =>
      EmployeeService.updateEmployee(id, data),
    
    // Optimistic update
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: [EMPLOYEE_QUERY_KEY] });

      // Snapshot the previous value
      const previousEmployees = queryClient.getQueryData<Employee[]>([EMPLOYEE_QUERY_KEY]);

      // Optimistically update to the new value
      queryClient.setQueryData<Employee[]>([EMPLOYEE_QUERY_KEY], (old) => {
        if (!old) return old;
        return old.map((emp) => (emp.id === id ? { ...emp, ...data } : emp));
      });

      // Return a context with the previous and new data
      return { previousEmployees, id, data };
    },
    
    // If the mutation fails, use the context to roll back
    onError: (error: unknown, _variables, context) => {
      if (context?.previousEmployees) {
        queryClient.setQueryData([EMPLOYEE_QUERY_KEY], context.previousEmployees);
      }
      console.error('Failed to save employee:', error);
      toast.error('Failed to save employee');
    },
    
    // Always refetch after error or success to ensure we have the latest data
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [EMPLOYEE_QUERY_KEY] });
    },
    
    onSuccess: () => {
      toast.success('Employee updated successfully');
    },
  });
};

// Hook for real-time updates from SignalR
export const useEmployeeRealtimeUpdates = () => {
  const queryClient = useQueryClient();

  const updateEmployeeInCache = (id: number, field: string, value: unknown) => {
    queryClient.setQueryData<Employee[]>([EMPLOYEE_QUERY_KEY], (old) => {
      if (!old) return old;
      return old.map((emp) => (emp.id === id ? { ...emp, [field]: value } : emp));
    });
  };

  return { updateEmployeeInCache };
};
