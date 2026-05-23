import { createSapClient, setCors, odata } from './_sap.js';

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método no permitido' });

  try {
    const sap = createSapClient();
    const { desde, hasta, equipo } = req.query;

    const filters = ['IsBreakdown eq true'];
    if (desde) filters.push(`MalfunctionStartDate ge datetime'${desde}T00:00:00'`);
    if (hasta) filters.push(`MalfunctionStartDate le datetime'${hasta}T23:59:59'`);
    if (equipo) filters.push(`Equipment eq '${equipo}'`);

    const r = await odata(sap, 'API_MAINTNOTIFICATION', 'MaintenanceNotification', {
      $filter: filters.join(' and '),
      $orderby: 'MalfunctionStartDate desc',
      $top: 1000,
      $select:
        'MaintenanceNotification,NotificationText,Equipment,FunctionalLocation,Priority,MalfunctionStartDate,MalfunctionEndDate,BreakdownDuration,NotificationType',
    });

    const avisos = r.data.d?.results ?? [];

    const frecuencia = {};
    for (const a of avisos) {
      const eq = a.Equipment || 'Sin equipo';
      if (!frecuencia[eq]) frecuencia[eq] = { equipo: eq, cantidad: 0, duracionTotal: 0 };
      frecuencia[eq].cantidad++;
      frecuencia[eq].duracionTotal += parseFloat(a.BreakdownDuration || 0);
    }

    const ranking = Object.values(frecuencia)
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 20);

    res.status(200).json({ avisos, ranking });
  } catch (err) {
    console.error('[sap-fallas]', err.response?.status, err.message);
    res.status(500).json({ error: err.message, status: err.response?.status });
  }
}
