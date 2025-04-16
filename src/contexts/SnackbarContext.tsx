import React, { createContext, useState, useContext, ReactNode } from 'react';

type SnackbarContextType = {
  showSnackbar: (message: string, action?: { label: string; onPress: () => void }) => void;
  hideSnackbar: () => void;
  visible: boolean;
  message: string;
  action?: { label: string; onPress: () => void };
};

const SnackbarContext = createContext<SnackbarContextType | undefined>(undefined);

type SnackbarProviderProps = {
  children: ReactNode;
};

export const SnackbarProvider = ({ children }: SnackbarProviderProps) => {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [action, setAction] = useState<{ label: string; onPress: () => void } | undefined>(undefined);
  
  const showSnackbar = (
    message: string, 
    action?: { label: string; onPress: () => void }
  ) => {
    setMessage(message);
    setAction(action);
    setVisible(true);
  };
  
  const hideSnackbar = () => {
    setVisible(false);
  };
  
  return (
    <SnackbarContext.Provider 
      value={{ 
        showSnackbar, 
        hideSnackbar, 
        visible, 
        message, 
        action 
      }}
    >
      {children}
    </SnackbarContext.Provider>
  );
};

export const useSnackbar = () => {
  const context = useContext(SnackbarContext);
  if (context === undefined) {
    throw new Error('useSnackbar must be used within a SnackbarProvider');
  }
  return context;
};