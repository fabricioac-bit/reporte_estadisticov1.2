import { NextResponse } from 'next/server';
import sql, { config } from 'mssql'; // 👈 Importamos 'config' para el tipado

// CONFIGURACIÓN DE TU CONEXIÓN A SQL SERVER con tipo estricto
const configSQLServer: config = {
  user: process.env.DB_USER || 'rafael',
  password: process.env.DB_PASSWORD || '123456',
  server: process.env.DB_SERVER || '192.168.80.11', 
  database: process.env.DB_NAME || 'SIGH',
  port: 1433, 
  options: {
    encrypt: false, 
    trustServerCertificate: true, 
    // Usamos 'as any' aquí si TypeScript se pone pesado con TLS en versiones viejas
    cryptoCredentialsDetails: {
      minVersion: 'TLSv1' 
    } as any
  },
};

export async function GET(request: Request) {
  try {
    // 👈 Aseguramos el tipo ConnectionPool para que pool.request() no falle nunca
    let pool: sql.ConnectionPool = await sql.connect(configSQLServer);

    // Verificar si pide todos los servicios (triaje) o solo tipo 2 (frecuencia)
    const url = new URL(request.url);
    const all = url.searchParams.get('all') === 'true';

    // Consulta para traer los servicios del selector
    let query = `
      SELECT IdServicio, Nombre 
      FROM Servicios
    `;
    
    // Si NO pide todos, filtra por IdTipoServicio = 2 (para frecuencia de atenciones)
    if (!all) {
      query += `WHERE IdTipoServicio = 2 `;
    }
    
    query += `ORDER BY Nombre ASC;`;

    // Ahora el editor sabrá perfectamente qué es .request()
    const resultado = await pool.request().query(query);

    // Mapeamos para que React reciba "id" y "nombre" en minúsculas
    const serviciosBD = resultado.recordset.map((row: any) => ({
      id: row.IdServicio,
      nombre: row.Nombre
    }));

    return NextResponse.json(serviciosBD);

  } catch (error) {
    console.error("❌ Error real en SQL Server (Servicios):", error);
    
    return NextResponse.json([
      { id: 'ERROR', nombre: "⚠️ ERROR DE CONEXIÓN CON SQL SERVER" }
    ]);
  }
}