import mssql from 'mssql';

const dbConfig: mssql.config = {
  user: process.env.DB_USER || '',
  password: process.env.DB_PASSWORD || '',
  server: process.env.DB_SERVER || '',
  port: parseInt(process.env.DB_PORT || '', 10),
  database: process.env.DB_NAME || '',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
  },
  pool: {
    max: 10,
    min: 2,
    idleTimeoutMillis: 30000,
  },
};

let pool: mssql.ConnectionPool | null = null;
let isConnecting = false;
let connectionPromise: Promise<mssql.ConnectionPool> | null = null;

export async function getPool(): Promise<mssql.ConnectionPool> {
  // Si el pool existe y está conectado, lo retornamos
  if (pool && pool.connected) {
    return pool;
  }

  // Si ya estamos intentando conectar, retornamos la promesa en curso
  if (isConnecting && connectionPromise) {
    return connectionPromise;
  }

  isConnecting = true;
  console.log('[DB] Iniciando conexión con SQL Server...');

  connectionPromise = (async () => {
    try {
      // Si existía un pool viejo desconectado, intentamos cerrarlo
      if (pool) {
        try {
          await pool.close();
        } catch (_) {}
      }

      const newPool = new mssql.ConnectionPool(dbConfig);
      
      // Registramos manejador de errores para caídas inesperadas de conexión
      newPool.on('error', (err) => {
        console.error('[DB] Error crítico en el Pool de SQL Server:', err.message);
        // Forzamos recreación del pool en la siguiente consulta
        pool = null;
        connectionPromise = null;
      });

      await newPool.connect();
      console.log('[DB] Conexión SQL Server establecida exitosamente.');
      pool = newPool;
      return newPool;
    } catch (err: any) {
      console.error('[DB] Error al conectar a SQL Server:', err.message);
      pool = null;
      connectionPromise = null;
      throw err;
    } finally {
      isConnecting = false;
    }
  })();

  return connectionPromise;
}

// Ejecutor resiliente de consultas
export async function executeQuery<T = any>(
  queryText: string,
  params?: Record<string, { type: any; value: any }>
): Promise<mssql.IResult<T>> {
  let attempts = 3;
  let delay = 2000; // 2 segundos entre reintentos

  while (attempts > 0) {
    try {
      const activePool = await getPool();
      const request = activePool.request();

      if (params) {
        Object.entries(params).forEach(([name, param]) => {
          request.input(name, param.type, param.value);
        });
      }

      return await request.query<T>(queryText);
    } catch (err: any) {
      attempts--;
      console.error(`[DB] Error en consulta SQL (Intentos restantes: ${attempts}):`, err.message);
      
      // Invalidamos el pool roto para forzar reconexión en el siguiente intento
      pool = null;
      connectionPromise = null;

      if (attempts === 0) {
        throw new Error(`Error de base de datos tras múltiples reintentos: ${err.message}`);
      }

      // Esperar antes de reintentar
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= 1.5; // Backoff exponencial
    }
  }
  throw new Error('Error inesperado de base de datos');
}
