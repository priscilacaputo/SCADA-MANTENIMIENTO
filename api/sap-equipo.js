import { createSapClient, setCors, odata } from './_sap.js';

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método no permitido' });

  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Falta parámetro id' });

  try {
    const sap = createSapClient();

    const [equipoRes, ordenesRes, avisosRes] = await Promise.all([
      odata(sap, 'API_EQUIPMENT', `A_Equipment('${id}')`),
      odata(sap, 'API_MAINTENANCEORDER_SRV', 'MaintenanceOrder', {
        $filter: `Equipment eq '${id}'`,
        $orderby: 'MaintOrdBasicStartDate desc',
        $top: 100,
        $select:
          'MaintenanceOrder,OrderDescription,MaintenanceOrderType,Priority,MaintOrdBasicStartDate,MaintOrdBasicEndDate,OrderStartDate,OrderEndDate,MaintenanceActivityType,SystemCondition',
      }),
      odata(sap, 'API_MAINTNOTIFICATION', 'MaintenanceNotification', {
        $filter: `Equipment eq '${id}'`,
        $orderby: 'MalfunctionStartDate desc',
        $top: 100,
        $select:
          'MaintenanceNotification,NotificationText,NotificationType,Priority,MalfunctionStartDate,MalfunctionEndDate,BreakdownDuration,IsBreakdown',
      }),
    ]);

    res.status(200).json({
      equipo: equipoRes.data.d,
      ordenes: ordenesRes.data.d?.results ?? [],
      avisos: avisosRes.data.d?.results ?? [],
    });
  } catch (err) {
    console.error('[sap-equipo]', err.response?.status, err.message);
    res.status(500).json({ error: err.message, status: err.response?.status });
  }
}
