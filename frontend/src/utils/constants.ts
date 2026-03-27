export const MAX_FILE_SIZE_MB = 10;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

export const ROUTES = {
  HOME: '/',
  SIGNIN: '/signin',
  SIGNUP: '/signup',
  HISTORY: '/history',
} as const;
