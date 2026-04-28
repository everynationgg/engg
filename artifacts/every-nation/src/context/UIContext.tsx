import React, { createContext, useContext, useState, ReactNode } from "react";

interface UIContextType {
  isAlliesOpen: boolean;
  setAlliesOpen: (open: boolean) => void;
  toggleAllies: () => void;
  isSettingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: ReactNode }) {
  const [isAlliesOpen, setAlliesOpen] = useState(false);
  const [isSettingsOpen, setSettingsOpen] = useState(false);

  const toggleAllies = () => setAlliesOpen(prev => !prev);

  return (
    <UIContext.Provider 
      value={{ 
        isAlliesOpen, 
        setAlliesOpen, 
        toggleAllies,
        isSettingsOpen,
        setSettingsOpen
      }}
    >
      {children}
    </UIContext.Provider>
  );
}

export function useUI() {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error("useUI must be used within a UIProvider");
  }
  return context;
}
