import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';

export class SignalRService {
  private connection: HubConnection | null = null;
  private callbacks: Map<string, ((...args: unknown[]) => void)[]> = new Map();

  async connect(): Promise<void> {
    // Add a small delay before initial connection to ensure backend is ready
    await new Promise(resolve => setTimeout(resolve, 500));
    
    try {
      this.connection = new HubConnectionBuilder()
        .withUrl('http://localhost:5043/employeeHub', {
          timeout: 30000, // 30 seconds timeout
        })
        .withAutomaticReconnect([0, 1000, 2000, 5000, 10000]) // More aggressive initial retry
        .configureLogging('information')
        .build();

      // Set up event handlers with connection ID filtering
      this.connection.on('LockEmployee', (id: number, connectionId: string) => {
        this.trigger('LockEmployee', id, connectionId);
      });

      this.connection.on('UnlockEmployee', (id: number) => {
        this.trigger('UnlockEmployee', id);
      });

      this.connection.on('LockFailed', (id: number) => {
        this.trigger('LockFailed', id);
      });

      this.connection.on('LockStatusUpdate', (lockStatus: Record<number, string>) => {
        this.trigger('LockStatusUpdate', lockStatus);
      });

      this.connection.on('EmployeeUpdated', (id: number, propertyName: string, value: unknown, updatedByConnectionId: string) => {
        this.trigger('EmployeeUpdated', id, propertyName, value, updatedByConnectionId);
      });

      // Set up connection state change handlers
      this.connection.onclose(() => {
        console.log('SignalR connection closed');
      });

      this.connection.onreconnecting(() => {
        console.log('SignalR connection reconnecting');
      });

      this.connection.onreconnected(() => {
        console.log('SignalR connection reconnected');
      });

      await this.connection.start();
      console.log('SignalR connected successfully with connection ID:', this.connection.connectionId);
    } catch (error) {
      console.error('Failed to connect to SignalR:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      await this.connection.stop();
      this.connection = null;
    }
  }

  private ensureConnection(): void {
    if (!this.connection) {
      throw new Error('Cannot send data if the connection is not initialized.');
    }
    
    if (this.connection.state !== 'Connected') {
      throw new Error('Cannot send data if the connection is not in the \'Connected\' State.');
    }
  }

  async lockEmployee(id: number): Promise<void> {
    this.ensureConnection();
    if (this.connection) {
      await this.connection.invoke('Lock', id);
    }
  }

  async unlockEmployee(id: number): Promise<void> {
    this.ensureConnection();
    if (this.connection) {
      await this.connection.invoke('Unlock', id);
    }
  }

  async updateEmployee(id: number, propertyName: string, value: unknown): Promise<void> {
    this.ensureConnection();
    if (this.connection) {
      await this.connection.invoke('UpdateEmployee', id, propertyName, value);
    }
  }

  async getLockStatus(): Promise<void> {
    this.ensureConnection();
    if (this.connection) {
      await this.connection.invoke('GetLockStatus');
    }
  }

  on(event: string, callback: (...args: unknown[]) => void): void {
    if (!this.callbacks.has(event)) {
      this.callbacks.set(event, []);
    }
    this.callbacks.get(event)!.push(callback);
  }

  off(event: string, callback: (...args: unknown[]) => void): void {
    const callbacks = this.callbacks.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private trigger(event: string, ...args: unknown[]): void {
    const callbacks = this.callbacks.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(...args));
    }
  }

  getConnectionId(): string | null {
    return this.connection?.connectionId || null;
  }

  getConnectionState(): string | null {
    return this.connection?.state || null;
  }

  isConnected(): boolean {
    return this.connection?.state === 'Connected';
  }
}