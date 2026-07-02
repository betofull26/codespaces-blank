export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export const buildSuccessResponse = <T>(data: T, message = 'Operación exitosa'): ApiResponse<T> => ({
  success: true,
  data,
  message,
});

export const buildErrorResponse = (message: string, error?: string): ApiResponse<null> => ({
  success: false,
  message,
  error,
});
