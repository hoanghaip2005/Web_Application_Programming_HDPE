import { createContext, useContext, useMemo } from "react";
import { Toaster, toast as sonnerToast } from "sonner";
import { useTheme } from "../../context/ThemeContext";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const { theme } = useTheme();

  const value = useMemo(
    () => ({
      toast({ title, description = "", variant = "default", duration = 3200 }) {
        const options = {
          description: description || undefined,
          duration
        };

        if (variant === "destructive") {
          return sonnerToast.error(title, options);
        }

        if (variant === "loading") {
          return sonnerToast.loading(title, options);
        }

        return sonnerToast.success(title, options);
      },
      dismiss(toastId) {
        sonnerToast.dismiss(toastId);
      }
    }),
    []
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toaster
        closeButton
        richColors
        theme={theme === "dark" ? "dark" : "light"}
        position="top-right"
        expand
      />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }

  return context;
}
