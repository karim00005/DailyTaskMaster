import { MoonIcon, SunIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/context/SettingsContext";

export function ThemeToggle() {
  const { darkMode, toggleDarkMode } = useSettings();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleDarkMode}
      title={darkMode ? "التبديل للوضع الفاتح" : "التبديل للوضع الداكن"}
    >
      {darkMode ? (
        <SunIcon className="h-5 w-5" />
      ) : (
        <MoonIcon className="h-5 w-5" />
      )}
      <span className="sr-only">
        {darkMode ? "التبديل للوضع الفاتح" : "التبديل للوضع الداكن"}
      </span>
    </Button>
  );
}

export function RtlToggle() {
  const { rtlMode, toggleRtlMode } = useSettings();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleRtlMode}
      title={rtlMode ? "LTR" : "RTL"}
    >
      <span className="text-sm font-bold">
        {rtlMode ? "LTR" : "RTL"}
      </span>
      <span className="sr-only">
        {rtlMode ? "تغيير اتجاه النص من اليمين إلى اليسار" : "تغيير اتجاه النص من اليسار إلى اليمين"}
      </span>
    </Button>
  );
}