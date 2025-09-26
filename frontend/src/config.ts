// frontend/src/config.ts
const API_BASE_URL =
  (import.meta as any).env?.VITE_API_BASE_URL?.toString() || '/api';

const config = { API_BASE_URL };
export default config;
