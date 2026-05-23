import { createSapClient, setCors, odata } from './_sap.js';

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método no permitido' });

  try {
    const sap = createSapClient();
    const { desde, hasta, equipo } = req.query;

    const avisosFilters = ['IsBreakdown eq true'];
    if (desde) avisosFilters.push(`MalfunctionStartDate ge datetime'${desde}T00:00:00'`);
    if (hasta) avisosFilters.push(`MalfunctionStartDate le datetime'${hasta}T23:59:59'`);
    if (equipo) avisosFilters.push(`Equipment eq '${equipo}'`);

    const ordenesFilters = [];
    if (equipo) ordenesFilters.push(`Equipment eq '${equipo}'`);
    if (desde) ordenesFilters.push(`OrderStartDate ge datetime'${desde}T00:00:00'`);
    if (hasta) ordenesFilters.push(`OrderEndDate le datetime'${hasta}T23:59:59'`);

    const [avisosRes, ordenesRes] = await Promise.all([
      odata(sap, 'API_MAINTNOTIFICATION', 'MaintenanceNotification', {
        $filter: avisosFilters.join(' and '),
        $top: 2000,
        $select: 'Equipment,MalfunctionStartDate,MalfunctionEndDate,BreakdownDuration',
      }),
      odata(sap, 'API_MAINTENANCEORDER_SRV', 'MaintenanceOrder', {
        ...(ordenesFilters.length ? { $filter: ordenesFilters.join(' and ') } : {}),
        $top: 2000,
        $select: 'Equipment,OrderStartDate,OrderEndDate,MaintOrdBasicStartDate',
      }),
    ]);

    const avisos = avisosRes.data.d?.results ?? [];
    const ordenes = ordenesRes.data.d?.results ?? [];

    const totalFallas = avisos.length;
    const totalOrdenes = ordenes.length;
    const duracionTotalHoras = avisos.reduce(
      (sum, a) => sum + parseFloat(a.BreakdownDuration || 0),
      0
    );

    const diasPeriodo =
      desde && hasta
        ? (new Date(hasta) - new Date(desde)) / (1000 * 60 * 60 * 24)
        : 30;
    const horasPeriodo = diasPeriodo * 24;

    const mttr = totalFallas > 0 ? duracionTotalHoras / totalFallas : 0;
    const mtbf =
      totalFallas > 0 ? (horasPeriodo - duracionTotalHoras) / totalFallas : horasPeriodo;
    const disponibilidad =
      horasPeriodo > 0
        ? (((horasPeriodo - duracionTotalHoras) / horasPeriodo) * 100).toFixed(1)
        : 100;

    res.status(200).json({
      totalFallas,
      totalOrdenes,
      mtbf: mtbf.toFixed(1),
      mttr: mttr.toFixed(1),
      disponibilidad,
      duracionTotalHoras: duracionTotalHoras.toFixed(1),
    });
  } catch (err) {
    console.error('[sap-kpis]', err.response?.status, err.message);
    res.status(500).json({ error: err.message, status: err.response?.status });
  }
}
