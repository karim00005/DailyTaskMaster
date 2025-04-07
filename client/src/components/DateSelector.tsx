import React, { useState } from "react";
import { Calendar } from "@/components/ui/calendar";

interface DateSelectorProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export default function DateSelector({ selectedDate, onDateChange }: DateSelectorProps) {
  const [currentMonth, setCurrentMonth] = useState<Date>(selectedDate);

  return (
    <div className="calendar-container">
      <h2 className="text-lg font-semibold mb-4">Select Date</h2>
      <Calendar
        month={currentMonth}
        onMonthChange={setCurrentMonth}
        selectedDate={selectedDate}
        onDateSelect={onDateChange}
      />
    </div>
  );
}
