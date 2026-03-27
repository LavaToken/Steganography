export interface User {
  id: string;
  email: string;
  username?: string | null;
  avatar?: string | null;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface Prompt {
  id: string;
  type: 'encode' | 'decode';
  inputImage: string;
  message: string | null;
  outputImage: string | null;
  hasPassword: boolean;
  createdAt: string;
}

export interface PromptsResponse {
  prompts: Prompt[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface EncodeResponse {
  promptId: string | null;
  outputImage: string; // base64 data URL
  outputFilename: string;
  saved?: boolean;
}

export interface DecodeResponse {
  promptId: string | null;
  message: string;
  analysis: string | null;
  saved?: boolean;
}

export interface ApiError {
  error: string;
}
