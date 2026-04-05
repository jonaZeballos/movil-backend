const express = require('express');
const { saludar } = require('../controllers/hola.controller');

const router = express.Router();

router.get('/hola', saludar);

module.exports = router;
