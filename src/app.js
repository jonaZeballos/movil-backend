const express = require('express');
const holaRoutes = require('./routes/hola.routes');

const app = express();

app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    mensaje: 'API de Express funcionando correctamente',
  });
});

app.use('/api', holaRoutes);

module.exports = app;
