export interface HealthResponseDto {
  success: boolean;
  data: {
    status: 'ok';
    service: string;
    timestamp: string;
  };
  message: string;
}

export interface DatabaseStatusResponseDto {
  success: boolean;
  data: {
    connected: boolean;
    message: string;
    tables: Array<{
      name: string;
      exists: boolean;
    }>;
  };
  message: string;
}

export interface BootstrapResponseDto {
  success: boolean;
  data: null;
  message: string;
}
