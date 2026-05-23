import { createSapClient, setCors } from './_sap.js';

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método no permitido' });

  try {
    const sap = createSapClient();
    const { keyword = '' } = req.query;

    const r = await sap.get('/sap/opu/odata/IWFND/CATALOGSERVICE;v=2/ServiceCollection', {
      params: {
        $format: 'json',
        $top: 200,
        $select: 'TechnicalServiceName,ServiceDescription,ServiceVersion',
        ...(keyword
          ? { $filter: `substringof('${keyword}',TechnicalServiceName)` }
          : {}),
      },
    });

    res.status(200).json(r.data.d?.results ?? []);
  } catch (err) {
    console.error('[sap-discover]', err.response?.status, err.message);
    res.status(500).json({ error: err.message, status: err.response?.status });
  }
}
