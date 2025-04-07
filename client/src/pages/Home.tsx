import React, { useState } from "react";
import { CheckCircle, Moon, Sun } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Task } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/date-utils";
import TaskStats from "@/components/TaskStats";
import DateSelector from "@/components/DateSelector";
import TaskList from "@/components/TaskList";
import TaskModal from "@/components/TaskModal";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";
import { useTheme } from "@/hooks/use-theme";

export default function Home() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const { theme, setTheme } = useTheme();
  
  const formattedDate = formatDate(selectedDate);
  
  const { data: tasks = [] } = useQuery({
    queryKey: ["/api/tasks", formattedDate],
    queryFn: async () => {
      const response = await fetch(`/api/tasks?date=${formattedDate}`, {
        credentials: "include"
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch tasks");
      }
      
      return response.json();
    }
  });

  const handleAddNewTask = () => {
    setSelectedTask(null);
    setIsTaskModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  };

  const handleDeleteTask = (task: Task) => {
    setSelectedTask(task);
    setIsDeleteModalOpen(true);
  };

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-foreground">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary flex items-center">
            <CheckCircle className="h-6 w-6 mr-2" />
            Daily Task Tracker
          </h1>
          
          <Button 
            variant="outline" 
            size="icon" 
            className="rounded-full bg-gray-100 hover:bg-gray-200"
            onClick={toggleTheme}
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="lg:grid lg:grid-cols-3 lg:gap-8 space-y-8 lg:space-y-0">
          {/* Task Controls */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 space-y-6">
              {/* Date Selector */}
              <DateSelector
                selectedDate={selectedDate}
                onDateChange={handleDateChange}
              />

              {/* Task Statistics */}
              <TaskStats tasks={tasks} />

              {/* Add Task Button */}
              <div className="mt-4">
                <Button 
                  className="w-full" 
                  onClick={handleAddNewTask}
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="24" 
                    height="24" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    className="mr-2"
                  >
                    <path d="M12 5v14M5 12h14"/>
                  </svg>
                  Add New Task
                </Button>
              </div>
            </div>
          </div>
          
          {/* Task List Container */}
          <div className="lg:col-span-2">
            <TaskList
              selectedDate={selectedDate}
              onEditTask={handleEditTask}
              onDeleteTask={handleDeleteTask}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-400 text-sm">Daily Task Tracker &copy; {new Date().getFullYear()}</p>
        </div>
      </footer>

      {/* Task Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        selectedTask={selectedTask}
        selectedDate={selectedDate}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        task={selectedTask}
      />
    </div>
  );
}
