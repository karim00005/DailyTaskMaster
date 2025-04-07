import React from "react";
import { Task } from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatTime } from "@/lib/date-utils";
import { useToast } from "@/hooks/use-toast";
import { Check, Edit, Trash2, Clock } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";

interface TaskItemProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

export default function TaskItem({ task, onEdit, onDelete }: TaskItemProps) {
  const { toast } = useToast();

  const toggleCompleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest(
        "PATCH",
        `/api/tasks/${task.id}`,
        { completed: !task.completed }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: task.completed ? "Task marked as pending" : "Task marked as completed",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update task status",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleToggleComplete = () => {
    toggleCompleteMutation.mutate();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className={cn(
      "task-card p-4 hover:bg-gray-50 transition-all duration-300",
      task.completed && "bg-gray-50"
    )}>
      <div className="flex items-start">
        <div className="flex-shrink-0 pt-1">
          <button 
            className={cn(
              "h-6 w-6 rounded-full border-2 border-primary flex items-center justify-center hover:bg-primary/10",
              task.completed && "bg-primary/10"
            )}
            onClick={handleToggleComplete}
            disabled={toggleCompleteMutation.isPending}
          >
            {task.completed && <Check className="text-primary text-sm" />}
          </button>
        </div>
        <div className="ml-3 flex-1">
          <div className="flex justify-between">
            <h3 className={cn(
              "text-md font-medium",
              task.completed && "line-through text-gray-500"
            )}>
              {task.title}
            </h3>
            <div className="flex space-x-2">
              <button 
                className="text-gray-400 hover:text-primary"
                onClick={() => onEdit(task)}
              >
                <Edit className="h-4 w-4" />
              </button>
              <button 
                className="text-gray-400 hover:text-destructive"
                onClick={() => onDelete(task)}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
          <p className={cn(
            "text-sm text-gray-500 mt-1",
            task.completed && "line-through text-gray-400"
          )}>
            {task.description}
          </p>
          <div className="mt-2 flex items-center justify-between">
            {task.time && (
              <div className={cn(
                "flex items-center text-sm text-gray-500",
                task.completed && "text-gray-400"
              )}>
                <Clock className="h-4 w-4 mr-1" />
                {formatTime(task.time)}
              </div>
            )}
            <span className={cn(
              "px-2 py-1 text-xs rounded-full",
              getPriorityColor(task.priority)
            )}>
              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
