export interface Task {
  id: number;
  title: string;
  description: string | null;
  time: string | null;
  priority: "low" | "medium" | "high";
  completed: boolean;
  date: string;
}

export interface TaskFormData {
  title: string;
  description: string;
  time: string;
  priority: "low" | "medium" | "high";
  date: string;
}
