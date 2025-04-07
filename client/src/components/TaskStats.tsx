import React from "react";
import { Task } from "@/lib/types";

interface TaskStatsProps {
  tasks: Task[];
}

export default function TaskStats({ tasks }: TaskStatsProps) {
  const pendingTasks = tasks.filter(task => !task.completed).length;
  const completedTasks = tasks.filter(task => task.completed).length;

  return (
    <div className="task-stats">
      <h2 className="text-lg font-semibold mb-4">Task Statistics</h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-primary font-semibold">Pending</div>
          <div className="text-2xl font-bold">{pendingTasks}</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-secondary font-semibold">Completed</div>
          <div className="text-2xl font-bold">{completedTasks}</div>
        </div>
      </div>
    </div>
  );
}
