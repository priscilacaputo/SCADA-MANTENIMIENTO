import axios from 'axios';
import https from 'https';

const agent = new https.Agent({ rejectUnauthorized: false });

export function createSapClient() {
  return axios.create({
    baseURL: process.env.SAP_BASE_URL,
    httpsAgent: agent,
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
}

export function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export function odata(client, service, entity, params = {}) {
  return client.get(`/sap/opu/odata/sap/${service}/${entity}`, {
    params: { $format: 'json', ...params },
  });
}
