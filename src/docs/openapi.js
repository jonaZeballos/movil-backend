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
      { name: 'Productos', description: 'Inventario y control de stock' },
      { name: 'Cotizaciones', description: 'Generacion de cotizaciones' },
      { name: 'Ventas', description: 'Registro de ventas y recibos' },
      { name: 'Reportes', description: 'Reportes de servicios, ventas e inventario' },
      { name: 'Notificaciones', description: 'Gestion de notificaciones del sistema' },
      { name: 'Negocio', description: 'Datos del negocio asociado al usuario' },
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
          required: ['nombres', 'apellidos', 'username', 'email', 'password', 'numero'],
          properties: {
            negocioNombre: { type: 'string', example: 'ServiTech Alex' },
            nombres: { type: 'string', example: 'Jonathan' },
            apellidos: { type: 'string', example: 'Perez' },
            username: { type: 'string', example: 'jonaperez' },
            email: { type: 'string', format: 'email', example: 'jonathan@mail.com' },
            password: { type: 'string', example: '123456' },
            fechaCreacion: { type: 'string', format: 'date', example: '2026-04-26' },
            numero: { type: 'string', example: '987654321' },
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
        Cliente: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'c0b1f7f9-0f4d-4d12-a5d1-0c57f5f790a1' },
            razonSocial: { type: 'string', example: 'Cliente Demo SRL' },
            nombre: { type: 'string', example: 'Cliente Demo SRL' },
            nombres: { type: 'string', nullable: true, example: 'Cliente' },
            apellidos: { type: 'string', nullable: true, example: 'Demo' },
            username: { type: 'string', nullable: true, example: 'cliente-demo' },
            numeroDocumento: { type: 'string', example: '12345678901' },
            email: { type: 'string', nullable: true, example: 'cliente@mail.com' },
            telefono: { type: 'string', nullable: true, example: '70011223' },
          },
        },
        OrdenServicio: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '8ba284ea-5f9d-4a89-8fb4-82b81f1a19b5' },
            codigo: { type: 'integer', example: 12 },
            code: { type: 'string', example: '#0012' },
            equipoId: { type: 'string' },
            tecnicoId: { type: 'string', nullable: true },
            clientName: { type: 'string', nullable: true, example: 'Cliente Demo SRL' },
            equipmentName: { type: 'string', nullable: true, example: 'Laptop HP Pavilion 15' },
            equipmentSerial: { type: 'string', nullable: true, example: 'HP-001' },
            diagnostico: { type: 'string', example: 'No enciende' },
            failure: { type: 'string', example: 'No enciende' },
            estado: { type: 'string', nullable: true, example: 'En diagnostico' },
            status: { type: 'string', nullable: true, example: 'En diagnostico' },
            prioridad: { type: 'string', nullable: true, example: 'Normal' },
            garantiaDias: { type: 'integer', example: 30 },
            fechaRecepcion: { type: 'string', format: 'date-time' },
            fechaEntrega: { type: 'string', format: 'date-time', nullable: true },
            observacionesTexto: { type: 'string', nullable: true, example: 'Equipo recibido con cargador.' },
            observaciones: {
              type: 'array',
              items: { type: 'string' },
              example: ['Equipo recibido con cargador.'],
            },
          },
        },
        ActualizarEstadoOrdenRequest: {
          type: 'object',
          required: ['estado'],
          properties: {
            estado: { type: 'string', example: 'En diagnostico' },
          },
        },
        ActualizarObservacionesOrdenRequest: {
          type: 'object',
          properties: {
            observaciones: {
              type: 'string',
              description: 'Reemplaza las observaciones actuales.',
              example: 'Cliente indica que el equipo falla al encender.',
            },
            observacion: {
              type: 'string',
              description: 'Agrega una observacion al final de las observaciones actuales.',
              example: 'Se recibio cargador original.',
            },
          },
        },
        Producto: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            nombre: { type: 'string', example: 'Fuente ATX 500W' },
            marca: { type: 'string', nullable: true, example: 'Cooler Master' },
            modelo: { type: 'string', nullable: true, example: 'MWE 500' },
            descripcion: { type: 'string', nullable: true, example: 'Repuesto para PC de escritorio' },
            precio: { type: 'number', example: 280 },
            stock: { type: 'integer', example: 5 },
            stockMinimo: { type: 'integer', example: 2 },
            stockBajo: { type: 'boolean', example: false },
          },
        },
        ProductoRequest: {
          type: 'object',
          required: ['nombre', 'precio', 'stock'],
          properties: {
            nombre: { type: 'string', example: 'Fuente ATX 500W' },
            marca: { type: 'string', example: 'Cooler Master' },
            modelo: { type: 'string', example: 'MWE 500' },
            descripcion: { type: 'string', example: 'Repuesto para PC de escritorio' },
            precio: { type: 'number', example: 280 },
            stock: { type: 'integer', example: 5 },
            stockMinimo: { type: 'integer', example: 2 },
          },
        },
        Cotizacion: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            numero: { type: 'string', example: 'COT-0001' },
            ordenId: { type: 'string' },
            descripcion: { type: 'string', example: 'Cambio de fuente y limpieza interna' },
            manoObra: { type: 'number', example: 120 },
            repuestos: { type: 'number', example: 280 },
            descuento: { type: 'number', example: 0 },
            total: { type: 'number', example: 400 },
            estado: { type: 'string', example: 'Pendiente' },
            whatsappUrl: { type: 'string', example: 'https://wa.me/?text=...' },
          },
        },
        CotizacionRequest: {
          type: 'object',
          required: ['ordenId', 'descripcion', 'manoObra', 'repuestos'],
          properties: {
            ordenId: { type: 'string' },
            descripcion: { type: 'string', example: 'Cambio de fuente y limpieza interna' },
            manoObra: { type: 'number', example: 120 },
            repuestos: { type: 'number', example: 280 },
            descuento: { type: 'number', example: 0 },
            observaciones: { type: 'string', example: 'Cotizacion valida por 7 dias' },
          },
        },
        Venta: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            numero: { type: 'integer', example: 1 },
            reciboCodigo: { type: 'string', example: 'REC-0001' },
            clienteId: { type: 'string', nullable: true },
            clienteNombre: { type: 'string', nullable: true, example: 'Juan Perez' },
            total: { type: 'number', example: 560 },
            detalles: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  productoId: { type: 'string' },
                  nombre: { type: 'string' },
                  cantidad: { type: 'integer' },
                  precioUnitario: { type: 'number' },
                  subtotal: { type: 'number' },
                },
              },
            },
          },
        },
        VentaRequest: {
          type: 'object',
          required: ['items'],
          properties: {
            clienteId: { type: 'string', example: 'id-cliente' },
            clienteNombre: { type: 'string', example: 'Juan Perez' },
            items: {
              type: 'array',
              items: {
                type: 'object',
                required: ['productoId', 'cantidad'],
                properties: {
                  productoId: { type: 'string' },
                  cantidad: { type: 'integer', example: 2 },
                  precioUnitario: { type: 'number', example: 280 },
                },
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
          summary: 'Registrar negocio y usuario admin propietario',
          description: 'Registro publico inicial: crea un negocio y registra al usuario como admin propietario de ese negocio.',
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
      '/api/negocio/me': {
        get: {
          tags: ['Negocio'],
          summary: 'Obtener negocio actual',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'Negocio obtenido' },
            400: { description: 'Usuario sin negocio asociado' },
            401: { description: 'No autenticado' },
          },
        },
        patch: {
          tags: ['Negocio'],
          summary: 'Actualizar negocio actual (solo admin)',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    nombre: { type: 'string', example: 'ServiTech Centro' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Negocio actualizado' },
            400: { description: 'Payload invalido' },
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
          summary: 'Registrar cliente del negocio autenticado',
          security: [{ bearerAuth: [] }],
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
            401: { description: 'No autenticado', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
            403: { description: 'Sin permisos', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
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
          summary: 'Listar o buscar clientes (HU05)',
          description: 'Busca clientes por nombres, apellidos, username, email, razon social o numero de documento. Si no se envia criterio, lista clientes.',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'query',
              name: 'buscar',
              schema: { type: 'string' },
              example: 'cliente',
              description: 'Texto para nombres, apellidos, username, email, razonSocial o numeroDocumento.',
            },
            {
              in: 'query',
              name: 'numeroDocumento',
              schema: { type: 'string' },
              example: '12345678901',
              description: 'Filtro exacto por numero de documento.',
            },
          ],
          responses: {
            200: {
              description: 'Clientes obtenidos',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      mensaje: { type: 'string', example: 'Clientes obtenidos correctamente' },
                      data: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Cliente' },
                      },
                    },
                  },
                },
              },
            },
            400: { description: 'Numero de documento invalido', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
            401: { description: 'No autenticado', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
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
      '/api/clientes/{id}/historial': {
        get: {
          tags: ['Clientes'],
          summary: 'Consultar historial de cliente (HU18)',
          security: [{ bearerAuth: [] }],
          parameters: [
            { in: 'path', name: 'id', required: true, schema: { type: 'string' } },
          ],
          responses: {
            200: { description: 'Historial con cliente, equipos, ordenes, cotizaciones y ventas' },
            404: { description: 'Cliente no encontrado' },
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
          summary: 'Actualizar orden parcialmente',
          description: 'Mantiene compatibilidad con Sprint 1. Para HU08 y HU09 se recomiendan las rutas especificas /estado y /observaciones.',
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
            200: {
              description: 'Orden actualizada',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      mensaje: { type: 'string', example: 'Orden actualizada correctamente' },
                      data: { $ref: '#/components/schemas/OrdenServicio' },
                    },
                  },
                },
              },
            },
            400: { description: 'Estado invalido o payload incompleto', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
            404: { description: 'Orden no encontrada', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          },
        },
      },
      '/api/ordenes/{id}/estado': {
        patch: {
          tags: ['Ordenes'],
          summary: 'Actualizar estado de orden (HU08)',
          description: 'Actualiza el estado de una orden existente. El estado debe existir previamente en el catalogo estado_orden_servicio.',
          security: [{ bearerAuth: [] }],
          parameters: [
            { in: 'path', name: 'id', required: true, schema: { type: 'string' } },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ActualizarEstadoOrdenRequest' },
              },
            },
          },
          responses: {
            200: {
              description: 'Estado de orden actualizado',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      mensaje: { type: 'string', example: 'Estado de orden actualizado correctamente' },
                      data: { $ref: '#/components/schemas/OrdenServicio' },
                    },
                  },
                },
              },
            },
            400: { description: 'Estado invalido', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
            404: { description: 'Orden no encontrada', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          },
        },
      },
      '/api/ordenes/{id}/observaciones': {
        patch: {
          tags: ['Ordenes'],
          summary: 'Agregar o modificar observaciones de orden (HU09)',
          description: 'Permite reemplazar observaciones con observaciones o agregar una nueva linea con observacion.',
          security: [{ bearerAuth: [] }],
          parameters: [
            { in: 'path', name: 'id', required: true, schema: { type: 'string' } },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ActualizarObservacionesOrdenRequest' },
                examples: {
                  reemplazar: {
                    summary: 'Modificar observaciones',
                    value: { observaciones: 'Cliente solicita revision completa.' },
                  },
                  agregar: {
                    summary: 'Agregar observacion',
                    value: { observacion: 'Se adjunta cargador original.' },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Observaciones actualizadas',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      mensaje: { type: 'string', example: 'Observaciones de orden actualizadas correctamente' },
                      data: { $ref: '#/components/schemas/OrdenServicio' },
                    },
                  },
                },
              },
            },
            400: { description: 'Payload incompleto', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
            404: { description: 'Orden no encontrada', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          },
        },
      },
      '/api/productos': {
        get: {
          tags: ['Productos'],
          summary: 'Listar o buscar productos de inventario',
          security: [{ bearerAuth: [] }],
          parameters: [
            { in: 'query', name: 'buscar', schema: { type: 'string' } },
          ],
          responses: {
            200: { description: 'Productos obtenidos' },
            401: { description: 'No autenticado' },
          },
        },
        post: {
          tags: ['Productos'],
          summary: 'Registrar producto en inventario (HU12)',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ProductoRequest' },
              },
            },
          },
          responses: {
            201: { description: 'Producto registrado' },
            400: { description: 'Error de validacion' },
          },
        },
      },
      '/api/productos/{id}': {
        get: {
          tags: ['Productos'],
          summary: 'Obtener producto',
          security: [{ bearerAuth: [] }],
          parameters: [
            { in: 'path', name: 'id', required: true, schema: { type: 'string' } },
          ],
          responses: {
            200: { description: 'Producto obtenido' },
            404: { description: 'Producto no encontrado' },
          },
        },
        patch: {
          tags: ['Productos'],
          summary: 'Actualizar producto o stock (HU13)',
          security: [{ bearerAuth: [] }],
          parameters: [
            { in: 'path', name: 'id', required: true, schema: { type: 'string' } },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ProductoRequest' },
              },
            },
          },
          responses: {
            200: { description: 'Producto actualizado' },
            404: { description: 'Producto no encontrado' },
          },
        },
      },
      '/api/cotizaciones': {
        get: {
          tags: ['Cotizaciones'],
          summary: 'Listar cotizaciones',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'Cotizaciones obtenidas' },
          },
        },
        post: {
          tags: ['Cotizaciones'],
          summary: 'Generar cotizacion (HU10) con link de WhatsApp (HU11)',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CotizacionRequest' },
              },
            },
          },
          responses: {
            201: { description: 'Cotizacion generada' },
            400: { description: 'Error de validacion' },
            404: { description: 'Orden no encontrada' },
          },
        },
      },
      '/api/cotizaciones/{id}': {
        get: {
          tags: ['Cotizaciones'],
          summary: 'Obtener cotizacion',
          security: [{ bearerAuth: [] }],
          parameters: [
            { in: 'path', name: 'id', required: true, schema: { type: 'string' } },
          ],
          responses: {
            200: { description: 'Cotizacion obtenida' },
            404: { description: 'Cotizacion no encontrada' },
          },
        },
      },
      '/api/cotizaciones/{id}/whatsapp': {
        get: {
          tags: ['Cotizaciones'],
          summary: 'Obtener link de WhatsApp para cotizacion (HU13)',
          security: [{ bearerAuth: [] }],
          parameters: [
            { in: 'path', name: 'id', required: true, schema: { type: 'string' } },
          ],
          responses: {
            200: { description: 'Mensaje y URL de WhatsApp obtenidos' },
            404: { description: 'Cotizacion no encontrada' },
          },
        },
      },
      '/api/ventas': {
        get: {
          tags: ['Ventas'],
          summary: 'Listar ventas',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'Ventas obtenidas' },
          },
        },
        post: {
          tags: ['Ventas'],
          summary: 'Registrar venta y generar recibo electronico (HU14/HU15)',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/VentaRequest' },
              },
            },
          },
          responses: {
            201: { description: 'Venta registrada' },
            400: { description: 'Stock insuficiente o payload invalido' },
            404: { description: 'Producto no encontrado' },
          },
        },
      },
      '/api/ventas/{id}': {
        get: {
          tags: ['Ventas'],
          summary: 'Obtener venta/recibo',
          security: [{ bearerAuth: [] }],
          parameters: [
            { in: 'path', name: 'id', required: true, schema: { type: 'string' } },
          ],
          responses: {
            200: { description: 'Venta obtenida' },
            404: { description: 'Venta no encontrada' },
          },
        },
      },
      '/api/ventas/{id}/recibo': {
        get: {
          tags: ['Ventas'],
          summary: 'Obtener recibo electronico estructurado (HU16)',
          security: [{ bearerAuth: [] }],
          parameters: [
            { in: 'path', name: 'id', required: true, schema: { type: 'string' } },
          ],
          responses: {
            200: { description: 'Recibo obtenido' },
            404: { description: 'Venta no encontrada' },
          },
        },
      },
      '/api/ventas/{id}/whatsapp': {
        get: {
          tags: ['Ventas'],
          summary: 'Obtener link de WhatsApp para recibo (HU17)',
          security: [{ bearerAuth: [] }],
          parameters: [
            { in: 'path', name: 'id', required: true, schema: { type: 'string' } },
          ],
          responses: {
            200: { description: 'Mensaje y URL de WhatsApp obtenidos' },
            404: { description: 'Venta no encontrada' },
          },
        },
      },
      '/api/reportes/resumen': {
        get: {
          tags: ['Reportes'],
          summary: 'Reporte resumen (HU19)',
          security: [{ bearerAuth: [] }],
          parameters: [
            { in: 'query', name: 'desde', schema: { type: 'string', format: 'date' } },
            { in: 'query', name: 'hasta', schema: { type: 'string', format: 'date' } },
          ],
          responses: {
            200: { description: 'Resumen obtenido' },
          },
        },
      },
      '/api/reportes/servicios': {
        get: {
          tags: ['Reportes'],
          summary: 'Reporte de servicios (HU19)',
          security: [{ bearerAuth: [] }],
          parameters: [
            { in: 'query', name: 'desde', schema: { type: 'string', format: 'date' } },
            { in: 'query', name: 'hasta', schema: { type: 'string', format: 'date' } },
          ],
          responses: {
            200: { description: 'Reporte de servicios obtenido' },
          },
        },
      },
      '/api/reportes/ventas': {
        get: {
          tags: ['Reportes'],
          summary: 'Reporte de ventas (HU19)',
          security: [{ bearerAuth: [] }],
          parameters: [
            { in: 'query', name: 'desde', schema: { type: 'string', format: 'date' } },
            { in: 'query', name: 'hasta', schema: { type: 'string', format: 'date' } },
          ],
          responses: {
            200: { description: 'Reporte de ventas obtenido' },
          },
        },
      },
      '/api/reportes/inventario': {
        get: {
          tags: ['Reportes'],
          summary: 'Reporte de inventario (HU19)',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'Reporte de inventario obtenido' },
          },
        },
      },
      '/api/notificaciones': {
        get: {
          tags: ['Notificaciones'],
          summary: 'Listar notificaciones del sistema (HU20)',
          security: [{ bearerAuth: [] }],
          parameters: [
            { in: 'query', name: 'leida', schema: { type: 'boolean' } },
            { in: 'query', name: 'tipo', schema: { type: 'string' } },
          ],
          responses: {
            200: { description: 'Notificaciones obtenidas' },
          },
        },
        post: {
          tags: ['Notificaciones'],
          summary: 'Crear notificacion manual (HU20)',
          security: [{ bearerAuth: [] }],
          responses: {
            201: { description: 'Notificacion creada' },
          },
        },
      },
      '/api/notificaciones/{id}/leida': {
        patch: {
          tags: ['Notificaciones'],
          summary: 'Marcar notificacion como leida (HU20)',
          security: [{ bearerAuth: [] }],
          parameters: [
            { in: 'path', name: 'id', required: true, schema: { type: 'string' } },
          ],
          responses: {
            200: { description: 'Notificacion marcada como leida' },
            404: { description: 'Notificacion no encontrada' },
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
