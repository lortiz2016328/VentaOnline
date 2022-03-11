const express = require('express');
const usuariosController = require('../Controllers/usuarios.controller');
const md_autenticacion = require('../middlewares/autenticacion');

var api = express.Router();

api.get('/usuarios', usuariosController.obtenerUsuario);
api.post('/usuarios/agregarClientes', usuariosController.agregarClientes);
api.post('/usuarios/agregarAdministrador',md_autenticacion.Auth, usuariosController.agregarAdministrador);
api.post('/login', usuariosController.Login);
api.put('/usuarios/editarUsuarios/:idUsuario?', md_autenticacion.Auth, usuariosController.editarUsuarios);
api.delete('/usuarios/eliminarUsuarios/:idUsuario?', md_autenticacion.Auth, usuariosController.eliminarUsuario);
api.get('/usuarios/buscarPorNombre/:idBuscar', usuariosController.buscarUsuarioPorNombre);
api.get('/usuarios/buscarPorApellido/:idBuscar', usuariosController.buscarUsuarioPorApellido);
api.get('/usuarios/buscarPorRol/:idBuscar', usuariosController.buscarUsuarioPorRol);
api.get('/usuarios/buscarPorId/:idUsuario', usuariosController.buscarUsuarioPorId);
api.put('/usuarios/agregarAlCarrito', md_autenticacion.Auth, usuariosController.agregarAlCarrito);
api.post('/carrito/facturaDelCarrito', md_autenticacion.Auth, usuariosController.facturaDeCarrito);
api.put('/carrito/eliminarDelCarrito', md_autenticacion.Auth, usuariosController.eliminarDelCarrito)

module.exports = api;