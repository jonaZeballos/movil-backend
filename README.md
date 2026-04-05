# Proyecto Express.js

## Estructura de carpetas

```text
movil-express/
|-- node_modules/
|-- src/
|   |-- controllers/
|   |   `-- hola.controller.js
|   |-- routes/
|   |   `-- hola.routes.js
|   |-- app.js
|   `-- server.js
|-- .gitignore
|-- package-lock.json
|-- package.json
`-- README.md
```

## Comandos

- `npm run dev`: inicia el servidor con nodemon
- `npm start`: inicia el servidor con node

## Rutas

- `GET /`: verifica que la API este funcionando
- `GET /api/hola`: responde con un mensaje hola
