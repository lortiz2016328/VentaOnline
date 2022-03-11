const mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ProductosSchema = Schema({
    nombre: String,
    cantidad: Number,
    vendido: Number,
    precio: Number,
    idCategoria: {type: Schema.Types.ObjectId, ref: 'Categorias'}
});

module.exports = mongoose.model('Productos', ProductosSchema)