const express = require('express');
const categoriasController = require('../controllers/categorias.controller');
const md_autenticacion =  require('../middlewares/autenticacion');

var api = express.Router();

api.get('/categorias', categoriasController.obtenerCategoria);
api.get('/categorias/obtenerPorId/:idCategoria', categoriasController.obtenerCategoriaPorId);
api.get('/categorias/obtenerPorNombre/:nombreCategoria', categoriasController.obtenerCategoriaPorNombre);
api.post('/categorias/agregarCategoria', md_autenticacion.Auth,categoriasController.agregarCategoria);
api.put('/categorias/editarCategoria/:idCategoria',md_autenticacion.Auth, categoriasController.editarCategoria);
api.delete('/categorias/eliminarCategoria/:idCategoria', md_autenticacion.Auth,categoriasController.eliminarCategoria);

module.exports = api;