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

## Regla para crecer

- crea archivos por feature con nombres como `user.controller.js`, `user.service.js` y `user.repository.js`
- no agregues carpetas nuevas hasta que exista una necesidad real
