const Productos = require('../models/productos.model');
const Categorias = require('../models/categorias.model');

function obtenerProducto(req, res) {
        Productos.find((err, productosObtenidos) => {
            if (err) return res.send({ mensaje: "Error: " + err });

            return res.send({
                'Lista de productos': productosObtenidos
            })
        })
    .sort({
        vendido: -1,
    }).limit(5)
}

function obtenerProductoPorNombre(req, res) {

    var nomProd = req.params.nombreProducto;

    Productos.find({ nombre: { $regex: nomProd, $options: 'i' } }, (err, productoEncontrado) => {
        if (err) return res.status(500).send({ mensaje: "Error en la peticion" });
        if (!productoEncontrado) return res.status(404).send({ mensaje: "Error, no se encontraron productos" });

        return res.status(200).send({ producto: productoEncontrado });
    })
}

function obtenerProductoPorCategoria(req, res) {

    var idCategoria;
    var params = req.body
    if (req.user.rol == 'Admin') {
        return res.status(500).send({ mensaje: "Eres admin, no puedes ver los productos" })
    }
    if (!params.nombre) return res.status(500).send({ mensaje: "Agrege los parametros necesarios" })

    Categorias.findOne({ nombreCategoria: params.nombre }).exec((err, categoriaEncontrada) => {
        if (err) return res.status(500).send({ mensaje: "Error en la peticion" });
        if (!categoriaEncontrada) return res.status(500).send({ mensaje: "La categoria no existe" });
        idCategoria = categoriaEncontrada._id

        Productos.find({ categoriaProducto: idCategoria }).exec((err, ProductoEncontrado) => {
            if (err) return res.status(500).send({ mensaje: "Error en la peticion" })
            if (!ProductoEncontrado) return res.status(500).send({ mensaje: "No hay Productos" });
            if (ProductoEncontrado) return res.status(200).send({ ProductoEncontrado })
        })
    })
}

function agregarProducto(req, res) {
    var parametros = req.body;
    var productoModel = new Productos();

    if (req.user.rol == 'Cliente') {
        return res.status(500).send({ mensaje: "No eres admin, no puedes agregar" });
    } else {
        if (parametros.nombre && parametros.cantidad && parametros.precio) {

            Productos.find({ nombre: parametros.nombre }, (err, productoObtenido) => {
                for (let i = 0; i < productoObtenido.length; i++) {
                    if (productoObtenido[i].nombre === parametros.nombre) return res.status(500).send({ mensaje: "Error, producto existente" });

                }
                Categorias.findOne({ _id: parametros.idCategoria }, (err, categoriaEncontrada) => {
                    if (err) return res.status(500).send({ mensaje: "Error en la busqueda" });
                    if (!categoriaEncontrada) return res.status(500).send({ mensaje: "Error, la categoria no existe" })

                    productoModel.nombre = parametros.nombre;
                    productoModel.cantidad = parametros.cantidad;
                    productoModel.precio = parametros.precio;
                    productoModel.vendido = 0;
                    productoModel.idCategoria = parametros.idCategoria;

                    productoModel.save((err, productoGuardado) => {
                        if (err) return res.status(500).send({ mensaje: "Error en la peticion" });
                        if (!productoGuardado) return res.status(404).send({ mensaje: "Error al guardar" });

                        return res.status(200).send({ producto: productoGuardado });
                    })
                })

            });

        }
    }
}

function editarProducto(req, res) {
    var idProduct = req.params.idProducto;
    var parametros = req.body;

    if (req.user.rol == 'Cliente') {
        return res.status(500).send({ mensaje: "No eres admin, no puedes editar" });
    } else {
        Productos.findByIdAndUpdate(idProduct, parametros, { new: true }, (err, productoActualizado) => {
            if (err) return res.status(500).send({ mensaje: "Error en la peticion" });
            if (!productoActualizado) return res.status(500).send({ mensaje: "Error al editar" });

            return res.status(200).send({ producto: productoActualizado });
        });

    }
}

function cantidadEnStock(req, res) {
    const productoId = req.params.idProducto;
    const parametros = req.body;


    if (req.user.rol == 'Cliente') {
        return res.status(500).send({ mensaje: "No eres admin, no puedes revisar el stock" });
    } else {
        let comparar = 0;
        Productos.findById(productoId, (err, productoEncontrado) => {
            if (err) return res.status(500).send({ mensaje: "Error en la peticio1" });
            if (!productoEncontrado) return res.status(500).send({ mensaje: "Error al editar" });

            if (parametros.cantidad < 0) {
                comparar = Number(parametros.cantidad) + Number(productoEncontrado.cantidad)
                if (comparar < 0) return res.status(500).send({ mensaje: "Error al editar" })

                Productos.findByIdAndUpdate(productoId, { $inc: { cantidad: parametros.cantidad } }, { new: true },
                    (err, productoActualizado) => {
                        if (err) return res.status(500).send({ mensaje: "Error en la peticio2" });
                        if (!productoActualizado) return res.status(500).send({ mensaje: "Error al editar" });

                        return res.status(200).send({ producto: productoActualizado });
                    })
            } else {
                Productos.findByIdAndUpdate(productoId, { $inc: { cantidad: parametros.cantidad } }, { new: true },
                    (err, productoActualizado) => {
                        if (err) return res.status(500).send({ mensaje: "Error en la peticio3" });
                        if (!productoActualizado) return res.status(500).send({ mensaje: "Error al editar" });

                        return res.status(200).send({ producto: productoActualizado });
                    })
            }
        })

    }
}

module.exports = {
    obtenerProducto,
    obtenerProductoPorNombre,
    obtenerProductoPorCategoria,
    agregarProducto,
    editarProducto,
    cantidadEnStock
}