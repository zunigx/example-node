// Proyecto: fast-api-dev (Node.js + Express)
// Alumno: Emmanuel Zuñiga Suarez
// Repo: github.com/zunigx/example-node

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Counter, Trend } from 'k6/metrics';

// ── Métricas personalizadas ──────────────────────────────────────
const failedRequests  = new Counter('solicitudes_fallidas');
const tiempoHealth    = new Trend('tiempo_health',  true);
const tiempoItems     = new Trend('tiempo_items',   true);
const tiempoDetalle   = new Trend('tiempo_detalle', true);

// ── Opciones de carga ────────────────────────────────────────────
export const options = {
  stages: [
    { duration: '20s', target: 3  },  // Arranque suave
    { duration: '40s', target: 10 },  // Incremento gradual
    { duration: '1m',  target: 15 },  // Carga pico
    { duration: '20s', target: 0  },  // Bajada
  ],
  thresholds: {
    'http_req_duration':    ['p(90)<1500', 'max<3000'],
    'http_req_failed':      ['rate<0.05'],
    'tiempo_health':        ['avg<300'],
    'tiempo_items':         ['p(95)<1200'],
    'tiempo_detalle':       ['p(95)<800'],
    'solicitudes_fallidas': ['count<10'],
  },
};

// ── URL base ─────────────────────────────────────────────────────
const BASE = __ENV.BASE_URL || 'http://localhost:3000';

// ── Helper: parsea body de forma segura ──────────────────────────
function parseBody(r) {
  try { return JSON.parse(r.body); }
  catch (_) { return null; }
}

// ── Escenario principal ──────────────────────────────────────────
export default function () {

  // ── Prueba 1: Estado del servidor (/health) ──────────────────
  group('Prueba 1 - Health Check', function () {
    const r = http.get(`${BASE}/health`, { tags: { endpoint: 'health' } });
    tiempoHealth.add(r.timings.duration);

    const paso = check(r, {
      '[health] responde con 200':          (r) => r.status === 200,
      '[health] body contiene status OK':   (r) => parseBody(r)?.status === 'OK',
      '[health] tiempo de respuesta <300ms':(r) => r.timings.duration < 300,
    });

    if (!paso) failedRequests.add(1);
    sleep(0.5);
  });

  // ── Prueba 2: Listado de productos (/items) ──────────────────
  group('Prueba 2 - Listado de Items', function () {
    const r = http.get(`${BASE}/items`, { tags: { endpoint: 'items-list' } });
    tiempoItems.add(r.timings.duration);

    const datos = parseBody(r);
    const paso = check(r, {
      '[items] status 200':               (r) => r.status === 200,
      '[items] respuesta es un arreglo':  ()  => Array.isArray(datos),
      '[items] contiene al menos 1 item': ()  => Array.isArray(datos) && datos.length >= 1,
      '[items] primer item tiene nombre': ()  => datos?.[0]?.name !== undefined,
    });

    if (!paso) failedRequests.add(1);
    sleep(1);
  });

  // ── Prueba 3: Detalle de un item (/items/1) ──────────────────
  group('Prueba 3 - Detalle de Item', function () {
    const r = http.get(`${BASE}/items/1`, { tags: { endpoint: 'items-detail' } });
    tiempoDetalle.add(r.timings.duration);

    const datos = parseBody(r);
    const paso = check(r, {
      '[items/1] status 200':       (r) => r.status === 200,
      '[items/1] tiene campo name': ()  => datos?.name !== undefined,
      '[items/1] tiene campo id':   ()  => datos?.id !== undefined,
      '[items/1] respuesta <800ms': (r) => r.timings.duration < 800,
    });

    if (!paso) failedRequests.add(1);
    sleep(1);
  });
}