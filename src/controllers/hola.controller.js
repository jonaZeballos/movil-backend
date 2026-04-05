const saludar = (req, res) => {
  res.json({
    mensaje: 'hola',
  });
};

module.exports = {
  saludar,
};
