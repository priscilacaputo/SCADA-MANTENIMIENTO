const BASE = '/api';

async function get(path, params = {}) {
  const url = new URL(BASE + path, window.location.origin);
  Object.entries(params).forEach(([k, v]) => v != null && url.searchParams.set(k, v));
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);
  return res.json();
}

export const api = {
  discover: (params) => get('/sap-discover', params),
  equipos: (params) => get('/sap-equipos', params),
  equipo: (id) => get('/sap-equipo', { id }),
  ordenes: (params) => get('/sap-ordenes', params),
  fallas: (params) => get('/sap-fallas', params),
  kpis: (params) => get('/sap-kpis', params),
  ubicaciones: () => get('/sap-ubicaciones'),
};
