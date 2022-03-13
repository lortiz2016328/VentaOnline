const express = require('express');
const usuariosController = require('../Controllers/usuarios.controller');
const md_autenticacion = require('../middlewares/autenticacion');

var api = express.Router();

api.post('/usuarios/agregarClientes', usuariosController.agregarClientes);
api.post('/usuarios/agregarAdministrador',md_autenticacion.Auth, usuariosController.agregarAdministrador);
api.post('/login', usuariosController.Login);
api.put('/usuarios/editarUsuarios/:idUsuario?', md_autenticacion.Auth, usuariosController.editarUsuarios);
api.delete('/usuarios/eliminarUsuarios/:idUsuario?', md_autenticacion.Auth, usuariosController.eliminarUsuario);
api.put('/usuarios/agregarAlCarrito', md_autenticacion.Auth, usuariosController.agregarAlCarrito);
api.post('/carrito/facturaDelCarrito', md_autenticacion.Auth, usuariosController.facturaDeCarrito);
api.put('/carrito/eliminarDelCarrito', md_autenticacion.Auth, usuariosController.eliminarDelCarrito);

module.exports = api;