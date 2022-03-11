const express = require('express');
const productosController = require('../controllers/productos.controller');
const md_autenticacion = require('../middlewares/autenticacion');

var api = express.Router();

api.get('/productos', productosController.obtenerProducto);
api.get('/productos/obtenerPorId/:idProductos', productosController.obtenerProductoPorId);
api.get('/productos/obtenerPorNombre', productosController.obtenerProductoPorNombre);
api.get('/productos/obtenerPorCategoria', productosController.obtenerProductoPorCategoria);
api.post('/productos/agregarProducto', md_autenticacion.Auth, productosController.agregarProducto);
api.put('/productos/editarProducto/:idProducto', md_autenticacion.Auth, productosController.editarProducto);
api.delete('/productos/eliminarProducto/:idProducto', md_autenticacion.Auth, productosController.eliminarProducto);
api.put('/productos/stock/:idProducto', md_autenticacion.Auth, productosController.stock);

module.exports = api;