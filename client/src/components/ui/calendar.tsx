import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ButtonProps, buttonVariants } from "@/components/ui/button";
import { getCalendarDays, formatMonthYear } from "@/lib/date-utils";

export interface CalendarProps {
  month: Date;
  onMonthChange?: (date: Date) => void;
  selectedDate?: Date;
  onDateSelect?: (date: Date) => void;
}

export function Calendar({
  month,
  onMonthChange,
  selectedDate,
  onDateSelect,
}: CalendarProps) {
  const days = getCalendarDays(month);
  
  const handlePrevMonth = () => {
    const newMonth = new Date(month);
    newMonth.setMonth(month.getMonth() - 1);
    onMonthChange?.(newMonth);
  };
  
  const handleNextMonth = () => {
    const newMonth = new Date(month);
    newMonth.setMonth(month.getMonth() + 1);
    onMonthChange?.(newMonth);
  };
  
  const handleDateClick = (date: Date) => {
    onDateSelect?.(date);
  };

  return (
    <div className="calendar-container space-y-4">
      <div className="flex justify-between items-center">
        <button
          onClick={handlePrevMonth}
          className="p-2 rounded hover:bg-gray-100"
          type="button"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <h3 className="text-md font-medium">{formatMonthYear(month)}</h3>
        <button
          onClick={handleNextMonth}
          className="p-2 rounded hover:bg-gray-100"
          type="button"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      
      <div className="grid grid-cols-7 gap-1 text-center text-sm">
        <div className="font-medium">Su</div>
        <div className="font-medium">Mo</div>
        <div className="font-medium">Tu</div>
        <div className="font-medium">We</div>
        <div className="font-medium">Th</div>
        <div className="font-medium">Fr</div>
        <div className="font-medium">Sa</div>
        
        {days.map((day, index) => {
          const isSelected = selectedDate && 
                            day.date.getDate() === selectedDate.getDate() && 
                            day.date.getMonth() === selectedDate.getMonth() && 
                            day.date.getFullYear() === selectedDate.getFullYear();
          
          return (
            <div
              key={index}
              className={cn(
                "calendar-day rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-100",
                isSelected && "bg-primary text-white hover:bg-primary/90"
              )}
              onClick={() => handleDateClick(day.date)}
            >
              <span>{day.date.getDate()}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
