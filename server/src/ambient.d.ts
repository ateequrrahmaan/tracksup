// Minimal ambient declarations for modules without installed type packages
declare module 'express';
declare module 'cors';
declare module 'morgan';
declare module 'express-rate-limit';
declare module 'vite';

// Provide very small shims for express Request/Response when @types/express isn't present
declare global {
  namespace NodeJS {}
}

export {};
