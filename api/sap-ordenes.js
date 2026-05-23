import { createSapClient, setCors, odata } from './_sap.js';

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método no permitido' });

  try {
    const sap = createSapClient();
    const { desde, hasta, tipo, equipo, planta } = req.query;

    const filters = [];
    if (desde) filters.push(`MaintOrdBasicStartDate ge datetime'${desde}T00:00:00'`);
    if (hasta) filters.push(`MaintOrdBasicStartDate le datetime'${hasta}T23:59:59'`);
    if (tipo) filters.push(`MaintenanceOrderType eq '${tipo}'`);
    if (equipo) filters.push(`Equipment eq '${equipo}'`);
    if (planta) filters.push(`MaintPlant eq '${planta}'`);

    const r = await odata(sap, 'API_MAINTENANCEORDER_SRV', 'MaintenanceOrder', {
      ...(filters.length ? { $filter: filters.join(' and ') } : {}),
      $orderby: 'MaintOrdBasicStartDate desc',
      $top: 1000,
      $select:
        'MaintenanceOrder,OrderDescription,MaintenanceOrderType,Equipment,FunctionalLocation,Priority,MaintOrdBasicStartDate,MaintOrdBasicEndDate,OrderStartDate,OrderEndDate,MaintenanceActivityType,SystemCondition,MaintPlant',
    });

    res.status(200).json(r.data.d?.results ?? []);
  } catch (err) {
    console.error('[sap-ordenes]', err.response?.status, err.message);
    res.status(500).json({ error: err.message, status: err.response?.status });
  }
}
