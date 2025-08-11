import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';

export class SignalRService {
  private connection: HubConnection | null = null;
  private callbacks: Map<string, Function[]> = new Map();

  async connect(): Promise<void> {
    this.connection = new HubConnectionBuilder()
      .withUrl('http://localhost:5043/employeeHub')
      .build();

    // Set up event handlers
    this.connection.on('LockEmployee', (id: number, connectionId: string) => {
      this.trigger('LockEmployee', id, connectionId);
    });

    this.connection.on('UnlockEmployee', (id: number) => {
      this.trigger('UnlockEmployee', id);
    });

    this.connection.on('EmployeeUpdated', (id: number, propertyName: string, value: any) => {
      this.trigger('EmployeeUpdated', id, propertyName, value);
    });

    await this.connection.start();
    console.log('SignalR connected');
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      await this.connection.stop();
      this.connection = null;
    }
  }

  async lockEmployee(id: number): Promise<void> {
    if (this.connection) {
      await this.connection.invoke('Lock', id);
    }
  }

  async unlockEmployee(id: number): Promise<void> {
    if (this.connection) {
      await this.connection.invoke('Unlock', id);
    }
  }

  async updateEmployee(id: number, propertyName: string, value: any): Promise<void> {
    if (this.connection) {
      await this.connection.invoke('UpdateEmployee', id, propertyName, value);
    }
  }

  on(event: string, callback: Function): void {
    if (!this.callbacks.has(event)) {
      this.callbacks.set(event, []);
    }
    this.callbacks.get(event)!.push(callback);
  }

  off(event: string, callback: Function): void {
    const callbacks = this.callbacks.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private trigger(event: string, ...args: any[]): void {
    const callbacks = this.callbacks.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(...args));
    }
  }

  getConnectionId(): string | null {
    return this.connection?.connectionId || null;
  }
}