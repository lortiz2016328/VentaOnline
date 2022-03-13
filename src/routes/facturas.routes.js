const express = require('express');
const md_autenticacion =  require('../middlewares/autenticacion');
const facturasController = require('../controllers/facturas.controller');

var api = express.Router();

api.get('/facturas', md_autenticacion.Auth, facturasController.listarFacturas);
api.get('/facturas/listarProducto', md_autenticacion.Auth, facturasController.listarProductos);
api.get('/productos/productosAgotados',md_autenticacion.Auth, facturasController.productosAgotados);
api.get('/productos/masVendido',facturasController.productoMasVendido);

module.exports = api;
