const express =require('express');
const cors = require('cors');
var app = express();


const UsuariosRutas = require('./src/routes/usuarios.routes');
const ProductosRutas = require('./src/routes/productos.routes');
const CategoriasRutas = require('./src/routes/categorias.routes');
const FacturasRutas = require('./src/routes/facturas.routes');

app.use(express.urlencoded({extended: false}));
app.use(express.json());

app.use(cors());


app.use('/api', UsuariosRutas, ProductosRutas, CategoriasRutas, FacturasRutas);

module.exports = app;