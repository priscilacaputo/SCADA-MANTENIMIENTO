import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ── Cliente SAP ──────────────────────────────────────────────────────────────

const sapAgent = new https.Agent({ rejectUnauthorized: false });

const sapClient = axios.create({
  baseURL: process.env.SAP_BASE_URL,
  httpsAgent: sapAgent,
  auth: {
    username: process.env.SAP_USER,
    password: process.env.SAP_PASSWORD,
  },
  headers: {
    Accept: 'application/json',
    'sap-client': process.env.SAP_CLIENT || '500',
    'sap-language': process.env.SAP_LANGUAGE || 'ES',
  },
  timeout: 30000,
});

const odata = (service, entity, params = {}) =>
  sapClient.get(`/sap/opu/odata/sap/${service}/${entity}`, {
    params: { $format: 'json', ...params },
  });

// ── Cache simple en memoria (5 minutos) ──────────────────────────────────────

const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

function cached(key, fn) {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.ts < CACHE_TTL) return Promise.resolve(entry.data);
  return fn().then((data) => {
    cache.set(key, { data, ts: Date.now() });
    return data;
  });
}

// ── Descubrimiento de servicios OData ────────────────────────────────────────

app.get('/api/sap-discover', async (req, res) => {
  try {
    const { keyword = '' } = req.query;
    const r = await sapClient.get('/sap/opu/odata/IWFND/CATALOGSERVICE;v=2/ServiceCollection', {
      params: {
        $format: 'json',
        $top: 200,
        $select: 'TechnicalServiceName,ServiceDescription,ServiceVersion',
        ...(keyword ? { $filter: `substringof('${keyword}',TechnicalServiceName)` } : {}),
      },
    });
    res.json(r.data.d?.results ?? []);
  } catch (err) {
    console.error('[sap-discover]', err.response?.status, err.message);
    res.status(500).json({ error: err.message, status: err.response?.status });
  }
});

// ── Equipos ──────────────────────────────────────────────────────────────────

app.get('/api/sap-equipos', async (req, res) => {
  try {
    const { search, funcLoc } = req.query;
    const filter = [
      search ? `substringof('${search}',EquipmentName)` : null,
      funcLoc ? `TechObjIsLocatedAtFuncLoc eq '${funcLoc}'` : null,
    ]
      .filter(Boolean)
      .join(' and ');

    const data = await cached(`equipos:${filter}`, () =>
      odata('API_EQUIPMENT', 'A_Equipment', {
        $select:
          'Equipment,EquipmentName,TechObjIsLocatedAtFuncLoc,ManufacturerName,ConstructionYear,EquipmentCategory,MaintPlant,SuperordinateEquipment',
        $top: 500,
        ...(filter ? { $filter: filter } : {}),
      }).then((r) => r.data.d?.results ?? [])
    );

    res.json(data);
  } catch (err) {
    console.error('[sap-equipos]', err.response?.status, err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Equipo detalle ────────────────────────────────────────────────────────────

app.get('/api/sap-equipo', async (req, res) => {
  try {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'Falta parámetro id' });

    const [equipo, ordenes, avisos] = await Promise.all([
      odata('API_EQUIPMENT', `A_Equipment('${id}')`).then((r) => r.data.d),
      odata('API_MAINTENANCEORDER_SRV', 'MaintenanceOrder', {
        $filter: `Equipment eq '${id}'`,
        $orderby: 'MaintOrdBasicStartDate desc',
        $top: 100,
        $select:
          'MaintenanceOrder,OrderDescription,MaintenanceOrderType,Priority,MaintOrdBasicStartDate,MaintOrdBasicEndDate,OrderStartDate,OrderEndDate,MaintenanceActivityType,SystemCondition',
      }).then((r) => r.data.d?.results ?? []),
      odata('API_MAINTNOTIFICATION', 'MaintenanceNotification', {
        $filter: `Equipment eq '${id}'`,
        $orderby: 'MalfunctionStartDate desc',
        $top: 100,
        $select:
          'MaintenanceNotification,NotificationText,NotificationType,Priority,MalfunctionStartDate,MalfunctionEndDate,BreakdownDuration,IsBreakdown',
      }).then((r) => r.data.d?.results ?? []),
    ]);

    res.json({ equipo, ordenes, avisos });
  } catch (err) {
    console.error('[sap-equipo]', err.response?.status, err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Órdenes ───────────────────────────────────────────────────────────────────

app.get('/api/sap-ordenes', async (req, res) => {
  try {
    const { desde, hasta, tipo, equipo, planta } = req.query;
    const filters = [];
    if (desde) filters.push(`MaintOrdBasicStartDate ge datetime'${desde}T00:00:00'`);
    if (hasta) filters.push(`MaintOrdBasicStartDate le datetime'${hasta}T23:59:59'`);
    if (tipo) filters.push(`MaintenanceOrderType eq '${tipo}'`);
    if (equipo) filters.push(`Equipment eq '${equipo}'`);
    if (planta) filters.push(`MaintPlant eq '${planta}'`);

    const data = await cached(`ordenes:${filters.join(',')}`, () =>
      odata('API_MAINTENANCEORDER_SRV', 'MaintenanceOrder', {
        ...(filters.length ? { $filter: filters.join(' and ') } : {}),
        $orderby: 'MaintOrdBasicStartDate desc',
        $top: 1000,
        $select:
          'MaintenanceOrder,OrderDescription,MaintenanceOrderType,Equipment,FunctionalLocation,Priority,MaintOrdBasicStartDate,MaintOrdBasicEndDate,OrderStartDate,OrderEndDate,MaintenanceActivityType,SystemCondition,MaintPlant',
      }).then((r) => r.data.d?.results ?? [])
    );

    res.json(data);
  } catch (err) {
    console.error('[sap-ordenes]', err.response?.status, err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Fallas ────────────────────────────────────────────────────────────────────

app.get('/api/sap-fallas', async (req, res) => {
  try {
    const { desde, hasta, equipo } = req.query;
    const filters = ['IsBreakdown eq true'];
    if (desde) filters.push(`MalfunctionStartDate ge datetime'${desde}T00:00:00'`);
    if (hasta) filters.push(`MalfunctionStartDate le datetime'${hasta}T23:59:59'`);
    if (equipo) filters.push(`Equipment eq '${equipo}'`);

    const avisos = await cached(`fallas:${filters.join(',')}`, () =>
      odata('API_MAINTNOTIFICATION', 'MaintenanceNotification', {
        $filter: filters.join(' and '),
        $orderby: 'MalfunctionStartDate desc',
        $top: 1000,
        $select:
          'MaintenanceNotification,NotificationText,Equipment,FunctionalLocation,Priority,MalfunctionStartDate,MalfunctionEndDate,BreakdownDuration,NotificationType',
      }).then((r) => r.data.d?.results ?? [])
    );

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

    res.json({ avisos, ranking });
  } catch (err) {
    console.error('[sap-fallas]', err.response?.status, err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── KPIs ──────────────────────────────────────────────────────────────────────

app.get('/api/sap-kpis', async (req, res) => {
  try {
    const { desde, hasta, equipo } = req.query;
    const avisosFilters = ['IsBreakdown eq true'];
    if (desde) avisosFilters.push(`MalfunctionStartDate ge datetime'${desde}T00:00:00'`);
    if (hasta) avisosFilters.push(`MalfunctionStartDate le datetime'${hasta}T23:59:59'`);
    if (equipo) avisosFilters.push(`Equipment eq '${equipo}'`);

    const ordenesFilters = [];
    if (equipo) ordenesFilters.push(`Equipment eq '${equipo}'`);
    if (desde) ordenesFilters.push(`OrderStartDate ge datetime'${desde}T00:00:00'`);
    if (hasta) ordenesFilters.push(`OrderEndDate le datetime'${hasta}T23:59:59'`);

    const [avisos, ordenes] = await Promise.all([
      odata('API_MAINTNOTIFICATION', 'MaintenanceNotification', {
        $filter: avisosFilters.join(' and '),
        $top: 2000,
        $select: 'Equipment,MalfunctionStartDate,MalfunctionEndDate,BreakdownDuration',
      }).then((r) => r.data.d?.results ?? []),
      odata('API_MAINTENANCEORDER_SRV', 'MaintenanceOrder', {
        ...(ordenesFilters.length ? { $filter: ordenesFilters.join(' and ') } : {}),
        $top: 2000,
        $select: 'Equipment,OrderStartDate,OrderEndDate,MaintOrdBasicStartDate',
      }).then((r) => r.data.d?.results ?? []),
    ]);

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

    res.json({
      totalFallas,
      totalOrdenes,
      mtbf: mtbf.toFixed(1),
      mttr: mttr.toFixed(1),
      disponibilidad,
      duracionTotalHoras: duracionTotalHoras.toFixed(1),
    });
  } catch (err) {
    console.error('[sap-kpis]', err.response?.status, err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Ubicaciones ───────────────────────────────────────────────────────────────

app.get('/api/sap-ubicaciones', async (req, res) => {
  try {
    const data = await cached('ubicaciones', () =>
      odata('API_FUNCTIONALLOCATION', 'A_FunctionalLocation', {
        $select: 'FunctionalLocation,FunctionalLocationName,SuperiorFunctionalLocation,MaintPlant',
        $top: 500,
      }).then((r) => r.data.d?.results ?? [])
    );
    res.json(data);
  } catch (err) {
    console.error('[sap-ubicaciones]', err.response?.status, err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Servir el build de React ──────────────────────────────────────────────────

app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (_, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`SAP Dashboard corriendo en http://localhost:${PORT}`);
  console.log(`Acceso en red: http://<IP-DE-ESTA-PC>:${PORT}`);
  console.log(`SAP: ${process.env.SAP_BASE_URL} | Cliente: ${process.env.SAP_CLIENT}`);
});
