const express = require('express');
const swaggerUi = require('swagger-ui-express');
const routes = require('./routes');
const { notFoundMiddleware, errorMiddleware } = require('./middlewares');
const { openApiSpec } = require('./docs/openapi');

const app = express();

app.use(express.json());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiSpec, {
	swaggerOptions: {
		persistAuthorization: true,
	},
}));
app.get('/api-docs.json', (req, res) => {
	res.json(openApiSpec);
});
app.use(routes);
app.use(notFoundMiddleware);
app.use(errorMiddleware);

module.exports = app;
