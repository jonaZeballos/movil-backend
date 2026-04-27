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
    },
  },
  apis: [],
};

const openApiSpec = swaggerJSDoc(options);

module.exports = {
  openApiSpec,
};
