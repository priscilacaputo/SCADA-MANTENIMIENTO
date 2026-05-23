import { createSapClient, setCors, odata } from './_sap.js';

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método no permitido' });

  try {
    const sap = createSapClient();
    const { search, funcLoc } = req.query;

    const filter = [
      search ? `substringof('${search}',EquipmentName)` : null,
      funcLoc ? `TechObjIsLocatedAtFuncLoc eq '${funcLoc}'` : null,
    ]
      .filter(Boolean)
      .join(' and ');

    const r = await odata(sap, 'API_EQUIPMENT', 'A_Equipment', {
      $select:
        'Equipment,EquipmentName,TechObjIsLocatedAtFuncLoc,ManufacturerName,ConstructionYear,EquipmentCategory,MaintPlant,SuperordinateEquipment',
      $top: 500,
      ...(filter ? { $filter: filter } : {}),
    });

    res.status(200).json(r.data.d?.results ?? []);
  } catch (err) {
    console.error('[sap-equipos]', err.response?.status, err.message);
    res.status(500).json({ error: err.message, status: err.response?.status });
  }
}
