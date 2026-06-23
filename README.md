# TIRO22

PWA mobile-first para registrar entrenamientos de tiro olimpico con pistola y carabina calibre .22 LR.

## Demo minima

- Pantalla inicial con acciones rapidas, sesiones recientes, resumen semanal y progreso.
- Creacion de sesion con modalidad, tipo y fecha.
- Captura de tanda de 5 disparos con botones 10 a 0 y fallo.
- Calculos de total, media, mejor y peor disparo.
- Historico basico y armas.
- PWA instalable con manifest, service worker, iconos y cache offline.
- Guardado local con cola de sincronizacion.

## Desarrollo

```bash
npm install
npm run dev
```

## Despliegue Dokploy

Usa el `docker-compose.yml` para desplegar la PWA estatica desde Git en Dokploy.
Dokploy puede encargarse del dominio y HTTPS desde su proxy. La demo guarda datos localmente y mantiene cola offline.

Variables principales:

```env
SUPABASE_URL=
SUPABASE_ANON_KEY=
DATABASE_URL=
JWT_SECRET=
APP_URL=
NODE_ENV=production
VITE_DATA_PROVIDER=local
VITE_API_URL=/api
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

## Base de datos

- PostgreSQL propio opcional: `server/prisma/schema.prisma` y migracion `server/prisma/migrations/0001_init/migration.sql`.
- Supabase: ejecutar `supabase-schema.sql` y configurar `VITE_DATA_PROVIDER=supabase`.

La primera version prioriza la demo funcional y mantiene la sincronizacion backend como adaptador sencillo.
