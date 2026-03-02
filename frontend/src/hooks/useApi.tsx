import { createContext, useContext, useState, type ReactNode } from 'react';

interface ApiContextType {
  token: string | null;
  setToken: (token: string | null) => void;
  apiUrl: string;
}

const ApiContext = createContext<ApiContextType | undefined>(undefined);

export function ApiProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => 
    localStorage.getItem('synapse_token')
  );

  const handleSetToken = (newToken: string | null) => {
    if (newToken) {
      localStorage.setItem('synapse_token', newToken);
    } else {
      localStorage.removeItem('synapse_token');
    }
    setToken(newToken);
  };

  return (
    <ApiContext.Provider value={{ token, setToken: handleSetToken, apiUrl: '/api/v1' }}>
      {children}
    </ApiContext.Provider>
  );
}

export function useApi() {
  const context = useContext(ApiContext);
  if (!context) {
    throw new Error('useApi must be used within ApiProvider');
  }
  return context;
}