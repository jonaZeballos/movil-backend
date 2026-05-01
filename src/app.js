const express = require('express');
const swaggerUi = require('swagger-ui-express');
const routes = require('./routes');
const { notFoundMiddleware, errorMiddleware } = require('./middlewares');
const { openApiSpec } = require('./docs/openapi');

const app = express();

app.use((req, res, next) => {
	res.header('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
	res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
	res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

	if (req.method === 'OPTIONS') {
		return res.sendStatus(204);
	}

	return next();
});
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
