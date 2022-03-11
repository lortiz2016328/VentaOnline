const mongoose = require('mongoose');
var Schema = mongoose.Schema;

var UsuariosSchema = Schema({ 
    nombre: String,
    apellido: String,
    password: String,
    rol: String,
    usuario: String,
    carrito: [{
        nombreProducto: String,
        cantidadComprada: Number,
        precioUnitario: Number,
        subTotal: Number
    }],
    totalCarrito: Number
});

module.exports = mongoose.model('Usuarios', UsuariosSchema);