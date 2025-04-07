import React, { useState } from "react";
import { Task } from "@/lib/types";
import TaskItem from "@/components/TaskItem";
import { formatDisplayDate } from "@/lib/date-utils";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";

interface TaskListProps {
  selectedDate: Date;
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
}

type FilterType = "all" | "pending" | "completed";

export default function TaskList({ selectedDate, onEditTask, onDeleteTask }: TaskListProps) {
  const [filter, setFilter] = useState<FilterType>("all");
  const formattedDate = formatDisplayDate(selectedDate);
  const dateParam = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
  
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["/api/tasks", dateParam],
    queryFn: async () => {
      const response = await fetch(`/api/tasks?date=${dateParam}`, {
        credentials: "include"
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch tasks");
      }
      
      return response.json();
    }
  });

  const getFilteredTasks = () => {
    switch (filter) {
      case "pending":
        return tasks.filter((task: Task) => !task.completed);
      case "completed":
        return tasks.filter((task: Task) => task.completed);
      default:
        return tasks;
    }
  };

  const filteredTasks = getFilteredTasks();

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Tasks for {formattedDate}</h2>
          <div className="inline-flex rounded-md shadow-sm">
            <button 
              className={`px-4 py-2 text-sm font-medium rounded-l-lg ${filter === "all" ? "bg-primary text-white" : "bg-white text-gray-700 hover:bg-gray-50"}`}
              onClick={() => setFilter("all")}
            >
              All
            </button>
            <button 
              className={`px-4 py-2 text-sm font-medium ${filter === "pending" ? "bg-primary text-white" : "bg-white text-gray-700 hover:bg-gray-50"}`}
              onClick={() => setFilter("pending")}
            >
              Pending
            </button>
            <button 
              className={`px-4 py-2 text-sm font-medium rounded-r-lg ${filter === "completed" ? "bg-primary text-white" : "bg-white text-gray-700 hover:bg-gray-50"}`}
              onClick={() => setFilter("completed")}
            >
              Completed
            </button>
          </div>
        </div>
      </div>

      <div className="divide-y divide-gray-200">
        {isLoading ? (
          <div className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="mt-2 text-gray-500">Loading tasks...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-gray-400">
              {tasks.length === 0 ? (
                <>
                  <svg className="h-12 w-12 mx-auto text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p className="mt-2">No tasks for today. Add a new task to get started.</p>
                </>
              ) : (
                <>
                  <svg className="h-12 w-12 mx-auto text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  <p className="mt-2">No {filter} tasks found.</p>
                </>
              )}
            </div>
          </div>
        ) : (
          filteredTasks.map((task: Task) => (
            <TaskItem 
              key={task.id} 
              task={task} 
              onEdit={onEditTask} 
              onDelete={onDeleteTask} 
            />
          ))
        )}
      </div>
    </div>
  );
}
