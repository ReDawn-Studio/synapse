/**
 * API 错误分类处理
 * 根据 HTTP 状态码提供不同的错误处理策略
 */

export type ApiErrorCode = 
  | 'UNAUTHORIZED'      // 401
  | 'FORBIDDEN'         // 403
  | 'NOT_FOUND'         // 404
  | 'BAD_REQUEST'       // 400
  | 'CONFLICT'          // 409
  | 'RATE_LIMIT'        // 429
  | 'SERVER_ERROR'      // 500
  | 'NETWORK_ERROR'     // Network
  | 'TIMEOUT'           // Timeout
  | 'UNKNOWN';          // Other

export interface ApiError {
  code: ApiErrorCode;
  message: string;
  status?: number;
  retryable?: boolean;
}

/**
 * 错误消息映射
 */
const ERROR_MESSAGES: Record<ApiErrorCode, string> = {
  UNAUTHORIZED: '登录已过期，请重新登录',
  FORBIDDEN: '权限不足，无法执行此操作',
  NOT_FOUND: '请求的资源不存在',
  BAD_REQUEST: '请求参数错误',
  CONFLICT: '操作冲突，请刷新后重试',
  RATE_LIMIT: '请求过于频繁，请稍后再试',
  SERVER_ERROR: '服务器错误，请稍后重试',
  NETWORK_ERROR: '网络连接失败，请检查网络',
  TIMEOUT: '请求超时，请重试',
  UNKNOWN: '发生未知错误',
};

/**
 * 将 HTTP 响应转换为 ApiError
 */
export function createApiError(status: number, customMessage?: string): ApiError {
  let code: ApiErrorCode = 'UNKNOWN';
  let retryable = false;

  switch (status) {
    case 401:
      code = 'UNAUTHORIZED';
      retryable = false;
      break;
    case 403:
      code = 'FORBIDDEN';
      retryable = false;
      break;
    case 404:
      code = 'NOT_FOUND';
      retryable = false;
      break;
    case 400:
      code = 'BAD_REQUEST';
      retryable = false;
      break;
    case 409:
      code = 'CONFLICT';
      retryable = true;
      break;
    case 429:
      code = 'RATE_LIMIT';
      retryable = true;
      break;
    case 500:
    case 502:
    case 503:
      code = 'SERVER_ERROR';
      retryable = true;
      break;
    default:
      code = 'UNKNOWN';
      retryable = status >= 500;
  }

  return {
    code,
    message: customMessage || ERROR_MESSAGES[code],
    status,
    retryable,
  };
}

/**
 * 处理 fetch 错误
 */
export function handleFetchError(error: unknown): ApiError {
  if (error instanceof TypeError) {
    if (error.message.includes('timeout')) {
      return {
        code: 'TIMEOUT',
        message: ERROR_MESSAGES.TIMEOUT,
        retryable: true,
      };
    }
    return {
      code: 'NETWORK_ERROR',
      message: ERROR_MESSAGES.NETWORK_ERROR,
      retryable: true,
    };
  }

  return {
    code: 'UNKNOWN',
    message: ERROR_MESSAGES.UNKNOWN,
    retryable: false,
  };
}

/**
 * 安全的 fetch 封装 - 自动处理错误分类
 */
export async function safeFetch(
  url: string,
  options?: RequestInit,
  timeoutMs: number = 10000
): Promise<{ data?: any; error?: ApiError }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorMessage;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message;
      } catch {
        errorMessage = undefined;
      }
      
      return {
        error: createApiError(response.status, errorMessage),
      };
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    clearTimeout(timeoutId);
    return {
      error: handleFetchError(error),
    };
  }
}

/**
 * 带重试的 fetch - 适用于可重试的错误
 */
export async function fetchWithRetry(
  url: string,
  options?: RequestInit,
  maxRetries: number = 3,
  timeoutMs: number = 10000
): Promise<{ data?: any; error?: ApiError }> {
  let lastError: ApiError | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const result = await safeFetch(url, options, timeoutMs);

    if (!result.error || !result.error.retryable) {
      return result;
    }

    lastError = result.error;

    // 指数退避：1s, 2s, 4s
    if (attempt < maxRetries) {
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  return { error: lastError };
}
