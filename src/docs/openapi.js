const swaggerJSDoc = require('swagger-jsdoc');

const port = process.env.PORT || 3000;

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Movil Backend API',
      version: '1.0.0',
      description: 'Documentacion de endpoints para autenticacion y registro de usuarios.',
    },
    servers: [
      {
        url: `http://localhost:${port}`,
        description: 'Servidor local',
      },
    ],
    tags: [
      { name: 'Health', description: 'Verificacion del estado de la API' },
      { name: 'Usuarios', description: 'Registro y autenticacion de usuarios' },
      { name: 'Clientes', description: 'Registro y busqueda de clientes' },
      { name: 'Equipos', description: 'Registro y consulta de equipos' },
      { name: 'Ordenes', description: 'Gestion de ordenes de servicio' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT en formato: Bearer <token>',
        },
      },
      schemas: {
        MensajeSimple: {
          type: 'object',
          properties: {
            mensaje: { type: 'string' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
        RegistroUsuarioRequest: {
          type: 'object',
          required: ['nombres', 'apellidos', 'username', 'email', 'password', 'fechaCreacion', 'numero'],
          properties: {
            nombres: { type: 'string', example: 'Jonathan' },
            apellidos: { type: 'string', example: 'Perez' },
            username: { type: 'string', example: 'jonaperez' },
            email: { type: 'string', format: 'email', example: 'jonathan@mail.com' },
            password: { type: 'string', example: '123456' },
            fechaCreacion: { type: 'string', format: 'date', example: '2026-04-26' },
            numero: { type: 'string', example: '987654321' },
            rol: { type: 'string', example: 'admin' },
          },
        },
        RegistroClienteRequest: {
          allOf: [
            { $ref: '#/components/schemas/RegistroUsuarioRequest' },
            {
              type: 'object',
              required: ['razonSocial', 'numeroDocumento'],
              properties: {
                razonSocial: { type: 'string', example: 'Cliente Demo SAC' },
                numeroDocumento: { type: 'string', example: '12345678901' },
              },
            },
          ],
        },
        LoginRequest: {
          type: 'object',
          required: ['usuario', 'password'],
          properties: {
            usuario: { type: 'string', example: 'jonaperez' },
            password: { type: 'string', example: '123456' },
          },
        },
        UsuarioBase: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            nombres: { type: 'string' },
            apellidos: { type: 'string' },
            username: { type: 'string' },
            email: { type: 'string' },
            fechaCreacion: { type: 'string', format: 'date-time' },
            rol: { type: 'string', nullable: true },
            numero: { type: 'string' },
          },
        },
        UsuarioCliente: {
          allOf: [
            { $ref: '#/components/schemas/UsuarioBase' },
            {
              type: 'object',
              properties: {
                razonSocial: { type: 'string' },
                numeroDocumento: { type: 'string' },
              },
            },
          ],
        },
        LoginResponseData: {
          type: 'object',
          properties: {
            token: { type: 'string' },
            usuario: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                nombres: { type: 'string' },
                apellidos: { type: 'string' },
                username: { type: 'string' },
                email: { type: 'string' },
                fechaCreacion: { type: 'string', format: 'date-time' },
                tipoUsuario: { type: 'string', nullable: true },
                rol: { type: 'string', nullable: true },
              },
            },
          },
        },
      },
    },
    paths: {
      '/': {
        get: {
          tags: ['Health'],
          summary: 'Estado de la API',
          responses: {
            200: {
              description: 'API activa',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/MensajeSimple' },
                },
              },
            },
          },
        },
      },
      '/api/usuarios/registro': {
        post: {
          tags: ['Usuarios'],
          summary: 'Registrar usuario general',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/RegistroUsuarioRequest' },
              },
            },
          },
          responses: {
            201: {
              description: 'Usuario registrado',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      mensaje: { type: 'string' },
                      data: { $ref: '#/components/schemas/UsuarioBase' },
                    },
                  },
                },
              },
            },
            400: { description: 'Error de validacion', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
            409: { description: 'Usuario duplicado', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          },
        },
      },
      '/api/usuarios': {
        get: {
          tags: ['Usuarios'],
          summary: 'Listar usuarios del sistema (solo admin)',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'Usuarios obtenidos' },
            401: { description: 'No autenticado' },
            403: { description: 'Sin permisos' },
          },
        },
      },
      '/api/usuarios/registro-tecnico': {
        post: {
          tags: ['Usuarios'],
          summary: 'Registrar usuario tecnico (solo admin)',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/RegistroUsuarioRequest' },
              },
            },
          },
          responses: {
            201: {
              description: 'Tecnico registrado',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      mensaje: { type: 'string' },
                      data: { $ref: '#/components/schemas/UsuarioBase' },
                    },
                  },
                },
              },
            },
            401: { description: 'No autenticado', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
            403: { description: 'Sin permisos', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          },
        },
      },
      '/api/usuarios/registro-ventas': {
        post: {
          tags: ['Usuarios'],
          summary: 'Registrar usuario ventas (solo admin)',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/RegistroUsuarioRequest' },
              },
            },
          },
          responses: {
            201: { description: 'Usuario ventas registrado' },
            401: { description: 'No autenticado' },
            403: { description: 'Sin permisos' },
          },
        },
      },
      '/api/usuarios/registro-cliente': {
        post: {
          tags: ['Usuarios'],
          summary: 'Registrar cliente',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/RegistroClienteRequest' },
              },
            },
          },
          responses: {
            201: {
              description: 'Cliente registrado',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      mensaje: { type: 'string' },
                      data: { $ref: '#/components/schemas/UsuarioCliente' },
                    },
                  },
                },
              },
            },
            400: { description: 'Error de validacion', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
            409: { description: 'Usuario o documento duplicado', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          },
        },
      },
      '/api/usuarios/login': {
        post: {
          tags: ['Usuarios'],
          summary: 'Login de usuario',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LoginRequest' },
              },
            },
          },
          responses: {
            200: {
              description: 'Login exitoso',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      mensaje: { type: 'string' },
                      data: { $ref: '#/components/schemas/LoginResponseData' },
                    },
                  },
                },
              },
            },
            401: { description: 'Credenciales invalidas', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          },
        },
      },
      '/api/clientes': {
        get: {
          tags: ['Clientes'],
          summary: 'Listar o buscar clientes',
          security: [{ bearerAuth: [] }],
          parameters: [
            { in: 'query', name: 'buscar', schema: { type: 'string' } },
            { in: 'query', name: 'numeroDocumento', schema: { type: 'string' } },
          ],
          responses: {
            200: { description: 'Clientes obtenidos' },
            401: { description: 'No autenticado' },
          },
        },
        post: {
          tags: ['Clientes'],
          summary: 'Registrar cliente',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['razonSocial', 'numeroDocumento', 'numero'],
                  properties: {
                    razonSocial: { type: 'string', example: 'Juan Soliz' },
                    numeroDocumento: { type: 'string', example: '1234567' },
                    numero: { type: 'string', example: '70011223' },
                    email: { type: 'string', example: 'juan@mail.com' },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'Cliente registrado' },
            400: { description: 'Error de validacion' },
            409: { description: 'Cliente duplicado' },
          },
        },
      },
      '/api/equipos': {
        get: {
          tags: ['Equipos'],
          summary: 'Listar o buscar equipos',
          security: [{ bearerAuth: [] }],
          parameters: [
            { in: 'query', name: 'buscar', schema: { type: 'string' } },
          ],
          responses: {
            200: { description: 'Equipos obtenidos' },
            401: { description: 'No autenticado' },
          },
        },
        post: {
          tags: ['Equipos'],
          summary: 'Registrar equipo',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['clienteId', 'tipo', 'marca', 'modelo', 'nroSerie'],
                  properties: {
                    clienteId: { type: 'string' },
                    tipo: { type: 'string', example: 'Laptop' },
                    marca: { type: 'string', example: 'HP' },
                    modelo: { type: 'string', example: 'Pavilion 15' },
                    nroSerie: { type: 'string', example: 'HP-001' },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'Equipo registrado' },
            400: { description: 'Error de validacion' },
            404: { description: 'Cliente no encontrado' },
          },
        },
      },
      '/api/ordenes': {
        get: {
          tags: ['Ordenes'],
          summary: 'Listar ordenes',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'Ordenes obtenidas' },
          },
        },
        post: {
          tags: ['Ordenes'],
          summary: 'Crear orden de servicio',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['equipoId', 'diagnostico'],
                  properties: {
                    equipoId: { type: 'string' },
                    diagnostico: { type: 'string', example: 'No enciende' },
                    prioridad: { type: 'string', example: 'Normal' },
                    garantiaDias: { type: 'integer', example: 30 },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'Orden creada' },
          },
        },
      },
      '/api/ordenes/{id}': {
        patch: {
          tags: ['Ordenes'],
          summary: 'Actualizar estado u observaciones de orden',
          security: [{ bearerAuth: [] }],
          parameters: [
            { in: 'path', name: 'id', required: true, schema: { type: 'string' } },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    estado: { type: 'string', example: 'En diagnostico' },
                    observacion: { type: 'string', example: 'Se reviso fuente de poder.' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Orden actualizada' },
          },
        },
      },
    },
  },
  apis: [],
};

const openApiSpec = swaggerJSDoc(options);

module.exports = {
  openApiSpec,
};
