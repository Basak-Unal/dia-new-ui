// src/contexts/AuthContext.tsx
// Shim to keep old imports working.
// Do NOT wrap your app with two providers.
// Wrap with <AppProvider> from './AppContext' only.

export { AppProvider, useApp as useAuth } from './AppContext';
export { useApp } from './AppContext';
export type { Session } from '../types';

// (Optional) If some places import { AuthProvider }:
export { AppProvider as AuthProvider } from './AppContext';
