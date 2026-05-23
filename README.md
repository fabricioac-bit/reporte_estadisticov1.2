# Sistema de Estadística Hospitalaria

Este repositorio contiene el código fuente de la aplicación web monolítica diseñada para la gestión, procesamiento y visualización de indicadores clave de rendimiento (KPI) y reportes estadísticos de productividad del personal en el entorno hospitalario.

## Arquitectura y Tecnologías

El sistema está construido bajo un enfoque monolítico utilizando el framework Next.js, garantizando modularidad y separación de responsabilidades en el manejo de datos e interfaz de usuario.

* **Frontend:** React.js, Next.js (App Router), Tailwind CSS (Estilos) y Recharts (Visualización de datos estadísticos).
* **Backend:** Node.js (Integrado mediante las API Routes de Next.js bajo arquitectura de tres capas).
* **Capa de Acceso a Datos:** Conexión nativa a Microsoft SQL Server utilizando la librería `mssql` con soporte para Connection Pooling.
* **Seguridad:** Autenticación basada en sesiones, hashing de credenciales mediante `bcryptjs` y protección de rutas a través de Middleware de Next.js.

## Estructura del Proyecto

El directorio `src/` organiza el flujo de la información de la siguiente manera:

* `src/components/`: Componentes de interfaz de usuario reutilizables, divididos en lógica de formularios, gráficos estadísticos y elementos de diseño estructural.
* `src/services/`: Capa intermedia que aloja la lógica de negocio, validaciones y reglas operativas del hospital.
* `src/repositories/`: Capa encargada de la persistencia de datos y la ejecución de consultas SQL específicas.
* `src/lib/`: Módulos de infraestructura básica, incluyendo la configuración y el cliente de conexión a la base de datos (`db.ts`).
* `src/types/`: Definiciones de tipado estático (TypeScript) para los modelos del dominio de la aplicación.