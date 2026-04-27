# Proyecto Express.js

## Estructura actual

```text
movil-express/
|-- src/
|   |-- controllers/
|   |-- middlewares/
|   |   |-- error.middleware.js
|   |   |-- index.js
|   |   `-- not-found.middleware.js
|   |-- repositories/
|   |-- routes/
|   |   `-- index.js
|   |-- services/
|   |-- utils/
|   |   `-- appError.js
|   |-- app.js
|   `-- server.js
|-- package.json
`-- README.md
```

## Uso de carpetas

- `controllers`: reciben la request y devuelven la response.
- `routes`: definen los endpoints.
- `services`: contienen la logica de negocio.
- `repositories`: concentran acceso a datos o integraciones.
- `middlewares`: manejo global de errores, auth o validaciones.
- `utils`: helpers, constantes y errores personalizados.

## Comandos

- `npm run dev`: inicia el servidor con nodemon
- `npm start`: inicia el servidor con node

## Ruta base

- `GET /`: responde que la API esta funcionando

## Documentacion OpenAPI (Swagger)

- UI Swagger: `GET /api-docs`
- JSON OpenAPI: `GET /api-docs.json`

### Uso rapido

1. Inicia el proyecto con `npm run dev`.
2. Abre `http://localhost:3000/api-docs`.
3. Prueba endpoints desde la UI.

### Endpoint protegido con Bearer

- Para `POST /api/usuarios/registro-tecnico`, primero haz login en `POST /api/usuarios/login`.
- Copia el token y usa el boton **Authorize** en Swagger con formato: `Bearer TU_TOKEN`.

## Deploy en Vercel

- El proyecto usa `api/index.js` como entrypoint serverless para Vercel.
- `vercel.json` redirige todas las rutas al backend Express.
- Swagger queda disponible en deploy en: `/api-docs`.

## Regla para crecer

- crea archivos por feature con nombres como `user.controller.js`, `user.service.js` y `user.repository.js`
- no agregues carpetas nuevas hasta que exista una necesidad real
asdasdasdasdasdasd