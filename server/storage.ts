import { tasks, users, type User, type InsertUser, type Task, type InsertTask } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Task operations
  getTasks(): Promise<Task[]>;
  getTasksByDate(date: string): Promise<Task[]>;
  getTask(id: number): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, task: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private tasksStore: Map<number, Task>;
  private userCurrentId: number;
  private taskCurrentId: number;

  constructor() {
    this.users = new Map();
    this.tasksStore = new Map();
    this.userCurrentId = 1;
    this.taskCurrentId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Task methods
  async getTasks(): Promise<Task[]> {
    return Array.from(this.tasksStore.values());
  }

  async getTasksByDate(date: string): Promise<Task[]> {
    return Array.from(this.tasksStore.values()).filter(
      (task) => task.date === date
    );
  }

  async getTask(id: number): Promise<Task | undefined> {
    return this.tasksStore.get(id);
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = this.taskCurrentId++;
    const task: Task = { ...insertTask, id };
    this.tasksStore.set(id, task);
    return task;
  }

  async updateTask(id: number, taskUpdate: Partial<InsertTask>): Promise<Task | undefined> {
    const existingTask = this.tasksStore.get(id);
    if (!existingTask) {
      return undefined;
    }
    
    const updatedTask: Task = { ...existingTask, ...taskUpdate };
    this.tasksStore.set(id, updatedTask);
    return updatedTask;
  }

  async deleteTask(id: number): Promise<boolean> {
    return this.tasksStore.delete(id);
  }
}

export const storage = new MemStorage();
