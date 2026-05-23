const BASE = '/api';

async function get(path, params = {}) {
  const url = new URL(BASE + path, window.location.origin);
  Object.entries(params).forEach(([k, v]) => v != null && url.searchParams.set(k, v));
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);
  return res.json();
}

export const api = {
  equipos: (params) => get('/equipos', params),
  equipo: (id) => get(`/equipos/${id}`),
  ordenes: (params) => get('/ordenes', params),
  fallas: (params) => get('/fallas', params),
  kpis: (params) => get('/kpis', params),
  ubicaciones: () => get('/ubicaciones'),
};
