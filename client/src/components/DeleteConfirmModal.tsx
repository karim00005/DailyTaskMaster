import React from "react";
import { AlertTriangle } from "lucide-react";
import { Task } from "@/lib/types";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
}

export default function DeleteConfirmModal({ isOpen, onClose, task }: DeleteConfirmModalProps) {
  const { toast } = useToast();

  const deleteTaskMutation = useMutation({
    mutationFn: async () => {
      if (!task) return;
      await apiRequest("DELETE", `/api/tasks/${task.id}`);
    },
    onSuccess: () => {
      toast({
        title: "Task deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Failed to delete task",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDelete = () => {
    deleteTaskMutation.mutate();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center justify-center">
            <AlertTriangle className="h-10 w-10 text-destructive mb-2" />
          </div>
          <AlertDialogTitle className="text-center">Delete Task</AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            Are you sure you want to delete this task?<br />
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={deleteTaskMutation.isPending}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
