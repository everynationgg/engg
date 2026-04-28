import React, { createContext, useContext, useState, ReactNode } from "react";

export type ActivePanel = "none" | "allies" | "settings";

interface UIContextType {
  activePanel: ActivePanel;
  setActivePanel: (panel: ActivePanel) => void;
  closeAll: () => void;
  togglePanel: (panel: ActivePanel) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: ReactNode }) {
  const [activePanel, setActivePanel] = useState<ActivePanel>("none");

  const closeAll = React.useCallback(() => setActivePanel("none"), []);
  const togglePanel = React.useCallback((panel: ActivePanel) => {
    setActivePanel(prev => prev === panel ? "none" : panel);
  }, []);

  return (
    <UIContext.Provider 
      value={{ 
        activePanel,
        setActivePanel,
        closeAll,
        togglePanel
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
