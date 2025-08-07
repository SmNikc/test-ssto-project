export interface Config {
  API_BASE_URL: string;
}

declare const config: Config;
export default config;

declare module 'react-dom/client';
