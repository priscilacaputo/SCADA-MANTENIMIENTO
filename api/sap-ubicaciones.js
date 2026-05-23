import { createSapClient, setCors, odata } from './_sap.js';

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método no permitido' });

  try {
    const sap = createSapClient();
    const r = await odata(sap, 'API_FUNCTIONALLOCATION', 'A_FunctionalLocation', {
      $select: 'FunctionalLocation,FunctionalLocationName,SuperiorFunctionalLocation,MaintPlant',
      $top: 500,
    });
    res.status(200).json(r.data.d?.results ?? []);
  } catch (err) {
    console.error('[sap-ubicaciones]', err.response?.status, err.message);
    res.status(500).json({ error: err.message, status: err.response?.status });
  }
}
