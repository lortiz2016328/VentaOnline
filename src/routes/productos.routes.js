const express = require('express');
const productosController = require('../controllers/productos.controller');
const md_autenticacion = require('../middlewares/autenticacion');

var api = express.Router();

api.get('/productos', productosController.obtenerProducto);
api.get('/productos/obtenerPorNombre/:nombreProducto', productosController.obtenerProductoPorNombre);
api.get('/productos/obtenerPorCategoria', md_autenticacion.Auth, productosController.obtenerProductoPorCategoria);
api.post('/productos/agregarProducto', md_autenticacion.Auth, productosController.agregarProducto);
api.put('/productos/editarProducto/:idProducto', md_autenticacion.Auth, productosController.editarProducto);
api.put('/productos/cantidadEnStock/:idProducto', md_autenticacion.Auth, productosController.cantidadEnStock)

module.exports = api;