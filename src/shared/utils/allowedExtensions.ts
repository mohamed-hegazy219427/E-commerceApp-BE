export const allowedExtensions = {
  Image: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
  Files: ['application/pdf'],
  Videos: ['video/mp4'],
}

export type AllowedExtensionKey = keyof typeof allowedExtensions;
