# 📋 Documentación: Submódulo Atenciones en Emergencia

## 🏗️ Estructura de Capas

```
Frontend (page.tsx)
    ↓ [Envía parámetros query]
API Route (route.ts)
    ↓ [Valida y delega]
Service (emergencia-atenciones.service.ts)
    ↓ [Lógica de negocio]
Repository (emergencia-atenciones.repository.ts)
    ↓ [Queries SQL]
MSSQL Database
```

---

## 📊 Flujo de Datos

### 1. **Frontend → API (page.tsx)**
El componente envía parámetros en query string:
```typescript
// Ejemplo: Vista global
/api/produccion-medica/emergencia/atenciones?
  fechaInicio=2026-06-01&
  fechaFin=2026-06-14&
  servicio=Todos

// Ejemplo: Vista detallada con filtros
/api/produccion-medica/emergencia/atenciones?
  fechaInicio=2026-06-01&
  fechaFin=2026-06-14&
  servicio=5&
  prioridad=P1&
  turno=Mañana
```

### 2. **Route → Service**
```typescript
// route.ts extrae parámetros y llama al servicio:
const params: ParamsFiltroAtenciones = {
  fechaInicio,
  fechaFin,
  servicio,
  prioridad,    // Opcional
  turno         // Opcional
};

const service = new EmergenciaAtencionesService();
const resultado = await service.obtenerAtencionesEmergencia(params);
```

### 3. **Service decide el caso de uso**
```typescript
// Si NO hay prioridad → Vista Global
if (servicio !== 'Todos' && servicio !== '' && prioridad) {
  // CASO: Filtro por servicio + prioridad + turno
  // Retorna datos de médicos detallado
  return this.obtenerVistaMedicos(...);
}

// Si hay prioridad → Vista Detallada
return this.obtenerVistaGlobal(...);
```

### 4. **Repository ejecuta queries SQL**

#### **Caso Global**
```sql
SELECT 
  S.IdServicio, S.Nombre,
  COUNT(...) AS TotalPacientes,
  COUNT(CASE WHEN IdTipoGravedad = 4 ...) AS p1,  -- Prioridad 1
  COUNT(CASE WHEN IdTipoGravedad = 3 ...) AS p2,  -- Prioridad 2
  COUNT(CASE WHEN IdTipoGravedad = 2 ...) AS p3,  -- Prioridad 3
  COUNT(CASE WHEN IdTipoGravedad = 1 ...) AS p4   -- Prioridad 4
FROM Servicios S
LEFT JOIN Atenciones A ON ...
LEFT JOIN AtencionesEmergencia AE ON ...
WHERE S.IdTipoServicio = 2
GROUP BY S.IdServicio, S.Nombre
```

#### **Caso Detallado (Médicos)**
```sql
WITH RptMedicos AS (
  SELECT 
    -- Identificación médico
    M.IdMedico,
    CONCAT(E.ApellidoPaterno, ' ', E.ApellidoMaterno, ', ', E.Nombres) AS Medico,
    -- Clasificación turno
    CASE 
      WHEN A.HoraIngreso >= '07:00' AND A.HoraIngreso < '13:00' THEN 'Mañana'
      WHEN A.HoraIngreso >= '13:00' AND A.HoraIngreso < '19:00' THEN 'Tarde'
      ELSE 'Noche'
    END AS TurnoFiltroCheck
  FROM ...
)
SELECT 
  IdMedico, Medico, Turno,
  COUNT(CASE WHEN IdTipoGravedad = @idTipoGravedad ...) AS AtendidosReal,
  COUNT(CASE WHEN IdTipoAlta = 3 ...) AS FugasReal,
  COUNT(CASE WHEN idEstadoAtencion = 0 ...) AS TotalAnulados
GROUP BY IdMedico, Medico, Turno
```

---

## 📦 Estructura de Respuesta JSON

### Vista Global:
```json
{
  "kpis": {
    "totalMes": 450,
    "noAtendidos": 12,
    "eliminados": 5,
    "turnoMayorDemanda": "Mañana",
    "altaEnServicio": 450,
    "sinAlta": 12
  },
  "grafico": [
    {
      "servicio": "Emergencia General",
      "idServicio": 5,
      "p1": 45,    // Prioridad 1 (Rojo)
      "p2": 120,   // Prioridad 2 (Naranja)
      "p3": 200,   // Prioridad 3 (Amarillo)
      "p4": 85,    // Prioridad 4 (Verde)
      "pacientes": 450
    }
  ],
  "turnos": [
    { "turno": "Mañana", "pacientes": 200 },
    { "turno": "Tarde", "pacientes": 150 },
    { "turno": "Noche", "pacientes": 100 }
  ],
  "tabla": [
    {
      "id": 5,
      "servicio": "Emergencia General",
      "pacientes": 450,
      "fugas": 12,
      "anulados": 5,
      "turnoCritico": "Mañana"
    }
  ],
  "resumenDemanda": "Reporte de Gestión: Monitoreando 450 admisiones..."
}
```

### Vista Detallada (Médicos):
```json
{
  "kpis": { ... },
  "tabla": [
    {
      "IdTipoServicio": 2,
      "TipoServicio": "Emergencia",
      "IdServicio": 5,
      "Servicio": "Emergencia General",
      "IdMedico": 101,
      "Medico": "Pérez García, Juan",
      "Turno": "MAÑANA (07-13)",
      "AtendidosReal": 12,
      "FugasReal": 1,
      "TotalAnulados": 0
    }
  ]
}
```

---

## 🔄 Mapeo de Prioridades

**Entrada (Frontend):** `P1`, `P2`, `P3`, `P4`
**Base de Datos:** `IdTipoGravedad` = 4, 3, 2, 1

| Prioridad | IdTipoGravedad | Color | Significado |
|-----------|---|---|---|
| P1 | 4 | 🔴 Rojo | Urgencia extrema |
| P2 | 3 | 🟠 Naranja | Urgencia alta |
| P3 | 2 | 🟡 Amarillo | Urgencia media |
| P4 | 1 | 🟢 Verde | Urgencia baja |

---

## 🔌 Archivos de Implementación

### **1. Types** (`src/types/emergencia-atenciones.ts`)
Define interfaces para:
- `AtencionEmergenciaKPIs`
- `DatosGrafico`
- `DatosTurno`
- `FilaTablaServicio`
- `FilaTableMedicos`
- `RespuestaAtencionesEmergencia`
- `ParamsFiltroAtenciones`

### **2. Repository** (`src/repositories/emergencia-atenciones.repository.ts`)
Métodos:
- `obtenerAtencionesGlobal()` - Query consolidada
- `obtenerMedicosPorServicioYPrioridad()` - Query detallada

### **3. Service** (`src/services/emergencia-atenciones.service.ts`)
Métodos públicos:
- `obtenerAtencionesEmergencia()` - Orquesta los casos de uso

Métodos privados:
- `obtenerVistaGlobal()` - Procesa datos globales
- `obtenerVistaMedicos()` - Procesa datos de médicos

### **4. Route** (`src/app/api/produccion-medica/emergencia/atenciones/route.ts`)
- `GET()` - Valida parámetros y delega al servicio

---

## ✅ Compatibilidad

El componente `page.tsx` es **100% compatible** porque:
1. ✅ Sigue enviando los mismos parámetros query
2. ✅ Espera la misma estructura de respuesta JSON
3. ✅ Los métodos de procesamiento de datos funcionan igual

No requiere cambios en el frontend.

---

## 🚀 Próximos Pasos

1. ✅ Prueba en dev: `npm run dev`
2. ✅ Navega a `/dashboard/produccion-medica/emergencia/atenciones`
3. ✅ Prueba filtros globales
4. ✅ Prueba filtros detallados (servicio + prioridad + turno)
5. ✅ Verifica gráficos, KPIs y tabla
