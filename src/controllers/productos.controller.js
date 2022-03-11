const Productos = require('../models/productos.model');
const Categorias = require('../models/categorias.model');

function obtenerProducto(req, res) {
    Productos.find((err, productosEncontrados) => {
        if (err) return res.send({ mensaje: "Error: " + err });

        Productos.find((err, productosObtenidos) => {
            if (err) return res.send({ mensaje: "Error: " + err });

            return res.send({
                'Más vendido': productosEncontrados,
                'Lista de productos': productosObtenidos
            })
        })
    }).sort({
        vendido: -1,
    }).limit(5)
}

function obtenerProductoPorId(req, res) {
    var idProduct = req.params.idProductos;

    Productos.findById(idProduct, (err, productoEncontrado) => {
        if (err) return res.status(500).send({ mensaje: "Error rn la peticion" });
        if (!productoEncontrado) return res.status(500).send({ mensaje: "Error en la busqueda" });

        return res.status(200).send({ producto: productoEncontrado });
    })
}

function obtenerProductoPorNombre(req, res) {
    var parametros = req.body;
    if (parametros.nombre) {
        Productos.find({ nombre: { $regex: parametros.nombre, $options: 'i' } }, (err, productoObtenido) => {
            if (err) return res.status(500).send({ mensaje: "Error en la peticion" });
            if (!productoObtenido) return res.status(404).send({ mensaje: "Error, no se encontraron productos" });

            return res.status(200).send({ producto: productoObtenido });
        })
    } else {
        return res.status(500).send({ mensaje: "Rellenar todos los campos" })
    }

}

function obtenerProductoPorCategoria(req, res) {
    var parametros = req.body;

    Categorias.findOne({ nombreCategoria: parametros.nombre }, (err, categoriaEncontrado) => {
        if (err) return res.status(500).send({ mensaje: "Error en la peticion" });
        if (!categoriaEncontrado) return res.status(500).send({ mensaje: "Error en la busqueda" });

        Productos.find({ idCategoria: categoriaEncontrada._id }, (err, productoEncontrado) => {
            if (err) return res.status(500).send({ mensaje: "Error en la peticion" });
            if (!productoEncontrado) return res.status(500).send({ mensaje: "Error al encontrar el producto" });

            return res.status(200).send({ producto: productoEncontrado });
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

function eliminarProducto(req, res) {
    var idProduct = req.params.idProducto;

    if (req.user.rol == 'Cliente') {
        return res.status(500).send({ mensaje: "No eres admin, no puedes eliminar" });
    } else {
        Productos.findByIdAndDelete(idProduct, (err, productoEliminado) => {
            if (err) return res.status(500).send({ mensaje: "Error en la peticion" });
            if (!productoEliminado) return res.status(404).send({ mensaje: "Error al eliminar" });

            return res.status(200).send({ producto: productoEliminado });
        })
    }
}

function stock(req, res) {
    const productoId = req.params.idProducto;
    const parametros = req.body;


    if (req.user.rol == 'Cliente') {
        return res.status(500).send({ mensaje: "No eres admin, no puedes revisar el stock" });
    } else {
        let comparar = 0;
        Productos.findById(productoId, (err, productoEncontrado) => {
            if (err) return res.status(500).send({ mensaje: "Error en la peticion" });
            if (!productoEncontrado) return res.status(500).send({ mensaje: "Error al editar" });

            if (parametros.cantidad < 0) {
                comparar = Number(parametros.cantidad) + Number(productoEncontrado.cantidad)
                if (comparar < 0) return res.status(500).send({ mensaje: "Error al editar" })

                Productos.findByIdAndUpdate(productoId, { $inc: { cantidad: parametros.cantidad } }, { new: true },
                    (err, productoActualizado) => {
                        if (err) return res.status(500).send({ mensaje: "Error en la peticion" });
                        if (!productoActualizado) return res.status(500).send({ mensaje: "Error al editar" });

                        return res.status(200).send({ producto: productoActualizado });
                    });
            } else {
                Productos.findByIdAndUpdate(productoId, { $inc: { cantidad: parametros.cantidad } }, { new: true },
                    (err, productoActualizado) => {
                        if (err) return res.status(500).send({ mensaje: "Error en la peticion" });
                        if (!productoActualizado) return res.status(500).send({ mensaje: "Error al editar" });

                        return res.status(200).send({ producto: productoActualizado });
                    })
            }
        });

    }
}


module.exports = {
    obtenerProducto,
    obtenerProductoPorId,
    obtenerProductoPorNombre,
    obtenerProductoPorCategoria,
    agregarProducto,
    editarProducto,
    eliminarProducto,
    stock
}