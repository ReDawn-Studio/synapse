import { createContext, useContext, useState, type ReactNode } from 'react';

export type ApiErrorType = 
  | 'AUTH_REQUIRED'    // 401
  | 'FORBIDDEN'        // 403
  | 'NOT_FOUND'        // 404
  | 'SERVER_ERROR'    // 500
  | 'NETWORK_ERROR'   // Network issues
  | 'UNKNOWN';        // Other errors

export interface ApiError {
  type: ApiErrorType;
  message: string;
  statusCode?: number;
}

export class ApiRequestError extends Error {
  type: ApiErrorType;
  statusCode?: number;

  constructor(type: ApiErrorType, message: string, statusCode?: number) {
    super(message);
    this.name = 'ApiRequestError';
    this.type = type;
    this.statusCode = statusCode;
  }
}

interface ApiContextType {
  token: string | null;
  setToken: (token: string | null) => void;
  apiUrl: string;
  request: <T>(endpoint: string, options?: RequestInit) => Promise<T>;
  handleError: (error: unknown) => ApiError;
}

const ApiContext = createContext<ApiContextType | undefined>(undefined);

export function ApiProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() => 
    localStorage.getItem('synapse_token')
  );

  const handleSetToken = (newToken: string | null) => {
    if (newToken) {
      localStorage.setItem('synapse_token', newToken);
    } else {
      localStorage.removeItem('synapse_token');
    }
    setTokenState(newToken);
  };

  const handleError = (error: unknown): ApiError => {
    if (error instanceof ApiRequestError) {
      return {
        type: error.type,
        message: error.message,
        statusCode: error.statusCode,
      };
    }

    if (error instanceof Error) {
      return {
        type: 'UNKNOWN',
        message: error.message,
      };
    }

    return {
      type: 'UNKNOWN',
      message: '发生未知错误',
    };
  };

  const request = async <T,>(endpoint: string, options?: RequestInit): Promise<T> => {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options?.headers,
      };

      const res = await fetch(`${apiUrl}${endpoint}`, {
        ...options,
        headers,
      });

      if (!res.ok) {
        let errorType: ApiErrorType = 'UNKNOWN';
        let message = `请求失败 (${res.status})`;

        switch (res.status) {
          case 401:
            errorType = 'AUTH_REQUIRED';
            message = '登录已过期，请重新登录';
            handleSetToken(null);
            break;
          case 403:
            errorType = 'FORBIDDEN';
            message = '权限不足';
            break;
          case 404:
            errorType = 'NOT_FOUND';
            message = '资源不存在';
            break;
          case 500:
          case 502:
          case 503:
            errorType = 'SERVER_ERROR';
            message = '服务器错误，请稍后重试';
            break;
        }

        throw new ApiRequestError(errorType, message, res.status);
      }

      const data = await res.json();
      return data as T;
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new ApiRequestError('NETWORK_ERROR', '网络连接失败，请检查网络设置');
      }
      throw error;
    }
  };

  const apiUrl = '/api/v1';

  return (
    <ApiContext.Provider value={{ 
      token, 
      setToken: handleSetToken, 
      apiUrl,
      request,
      handleError
    }}>
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
