const Facturas = require('../models/facturas.model');
const Usuarios = require('../models/usuarios.model');
const Productos = require('../models/productos.model');

function listarFacturas(req, res) {
    var parametros = req.body;
    if (req.user.rol == 'Cliente') {
        return res.status(500).send({ mensaje: "No eres admin, no puedes realizar esta accion" });
    } else {
        if (parametros.idUsuario) {
            Facturas.find({ idUsuario: parametros.idUsuario }, (err, facturaEncontrada) => {
                if (err) return res.status(500).send({ mensaje: "Erroe en la peticion" });
                if (!facturaEncontrada) return res.status(500).send({ mensaje: "Error, no tienes facturas" });

                return res.status(200).send({ facturas: facturaEncontrada });
            });
        } else {
            Facturas.find((err, facturasEncontradas) => {
                if (err) return res.status(500).send({ mensaje: "Erroe en la peticion" });
                if (!facturasEncontradas) return res.status(500).send({ mensaje: "Error, no tienes facturas" });

                return res.status(200).send({ 'Lista de facturas': facturasEncontradas });
            })
        }
    }
}

function listarProductos(req, res) {
    var parametros = req.body;
    if (req.user.rol == 'Cliente') {
        return res.status(500).send({ mensaje: "No eres admin, no puedes realizar esta accion" });
    } else {
        if (parametros.id) {
            Facturas.findOne({ _id: parametros.id }, (err, facturaObtenida) => {
                if (err) return res.status(500).send({ mensaje: "Error en la peticion" });
                if (!facturaObtenida) return res.status(500).send({ mensaje: "Error en la busqueda" });

                return res.status(200).send({ facturas: facturaObtenida.listaProductos });
            });
        } else {
            return res.status(500).send({ mensaje: "Rellenar el campo de id" })
        }
    }
}

function productosAgotados(req, res) {
    if (req.user.sub == 'Cliente') {
        return res.status(500).send({ mensaje: "No eres admin, no puedes realizar esta accion" })
    } else {
        Productos.find({ cantidad: '0' }, (err, productoAgotados) => {
            if (err) return res.status(500).send({ mensaje: "Error en la peticion" });
            if (productoAgotados == '') return res.status(500).send({ mensaje: "Error en la busqueda" });

            return res.status(200).send({ 'Productos agotados': productoAgotados })
        })
    }
}

function productoMasVendido(req, res) {
    Productos.find((err, productoEncontrado) => {
        if (err) return res.send({ mensaje: "Error: " + err });

        return res.send({ 'Mas vendido': productoEncontrado })

    }).sort({
        vendido: -1,
    }).limit(5)
}


module.exports = {
    listarFacturas,
    listarProductos,
    productosAgotados,
    productoMasVendido
}