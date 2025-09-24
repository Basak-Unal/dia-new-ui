export const config = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || '/api',
  STAGE_PATH: import.meta.env.VITE_STAGE_PATH || '/dev',
  CURRENT_USER_ID: 'johndoe'
};

export function buildApiUrl(path: string): string {
  const base = (config.API_BASE_URL ?? '').replace(/\/+$/, '');
  const stage = (config.STAGE_PATH ?? '').replace(/^\/+|\/+$/g, '');
  const clean = String(path ?? '').replace(/^\/+/, '');

  if (!base) return `/${stage ? `${stage}/` : ''}${clean}`; // relative base (e.g. /api)
  return stage ? `${base}/${stage}/${clean}` : `${base}/${clean}`;
}
