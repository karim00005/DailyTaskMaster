import { createContext, ReactNode, useContext, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Settings } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type SettingsContextType = {
  settings: Settings | null;
  isLoading: boolean;
  darkMode: boolean;
  rtlMode: boolean;
  language: string;
  toggleDarkMode: () => void;
  toggleRtlMode: () => void;
  setLanguage: (lang: string) => void;
  updateSettingsMutation: any;
};

export const SettingsContext = createContext<SettingsContextType | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const {
    data: settings,
    isLoading,
  } = useQuery<Settings | undefined, Error>({
    queryKey: ["/api/settings"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (settingsData: Partial<Settings>) => {
      const res = await apiRequest("POST", "/api/settings", settingsData);
      return await res.json();
    },
    onSuccess: (updatedSettings: Settings) => {
      queryClient.setQueryData(["/api/settings"], updatedSettings);
      applySettings(updatedSettings);
      toast({
        title: "تم تحديث الإعدادات",
        description: "تم حفظ إعدادات النظام بنجاح",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "فشل في تحديث الإعدادات",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Default values in case settings are not loaded
  const darkMode = settings?.darkMode ?? false; 
  const rtlMode = settings?.rtlMode ?? true;  // Default to RTL for Arabic
  const language = settings?.defaultLanguage ?? "ar";  // Default to Arabic

  // Apply settings to document
  const applySettings = (currentSettings: Settings | null) => {
    if (!currentSettings) return;
    
    // Apply dark mode
    if (currentSettings.darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    
    // Apply RTL mode
    if (currentSettings.rtlMode) {
      document.documentElement.dir = "rtl";
      document.body.classList.add("rtl");
      
      // Add CSS variable for RTL
      document.documentElement.style.setProperty('--app-direction', 'rtl');
      
      // Force all elements to use RTL text alignment
      const styleElement = document.getElementById('rtl-style') || document.createElement('style');
      styleElement.id = 'rtl-style';
      styleElement.textContent = `
        body * {
          text-align: right !important;
        }
        .flex {
          flex-direction: row-reverse !important;
        }
      `;
      if (!document.getElementById('rtl-style')) {
        document.head.appendChild(styleElement);
      }
    } else {
      document.documentElement.dir = "ltr";
      document.body.classList.remove("rtl");
      document.documentElement.style.setProperty('--app-direction', 'ltr');
      
      // Remove RTL style if it exists
      const styleElement = document.getElementById('rtl-style');
      if (styleElement) {
        styleElement.remove();
      }
    }
    
    // Apply language
    document.documentElement.lang = currentSettings.defaultLanguage || "ar";
  };
  
  const toggleDarkMode = () => {
    if (!settings) return;
    updateSettingsMutation.mutate({ ...settings, darkMode: !settings.darkMode });
  };
  
  const toggleRtlMode = () => {
    if (!settings) return;
    updateSettingsMutation.mutate({ ...settings, rtlMode: !settings.rtlMode });
  };
  
  const setLanguage = (lang: string) => {
    if (!settings) return;
    updateSettingsMutation.mutate({ ...settings, defaultLanguage: lang });
  };
  
  // Apply settings on initial load
  useEffect(() => {
    if (settings) {
      applySettings(settings);
    }
  }, [settings]);
  
  return (
    <SettingsContext.Provider
      value={{
        settings: settings ?? null,
        isLoading,
        darkMode,
        rtlMode,
        language,
        toggleDarkMode,
        toggleRtlMode,
        setLanguage,
        updateSettingsMutation,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}