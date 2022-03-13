const Categorias = require('../models/categorias.model');
const Productos = require('../models/productos.model');

function obtenerCategoria(req, res) {
    Categorias.find((err, categoriaObtenida) => {
        if (err) return res.send({ mensaje: "Error:" + err });

        return res.send({ categorias: categoriaObtenida })
    })
}

function agregarCategoria(req, res) {
    var parametros = req.body;
    var categoriaModel = new Categorias();

    if (req.user.rol == 'Cliente') {
        return res.status(500).send({ mensaje: "No eres admin, no puedes agregar" });
    } else {

        if (parametros.nombreCatego) {

            Categorias.find({ nombreCategoria: parametros.nombreCatego }).exec((err, categoriaEncontrada) => {
                for (let i = 0; i < categoriaEncontrada.length; i++) {
                    if (categoriaEncontrada[i].nombreCategoria === parametros.nombreCatego) return res.status(500).send({ mensaje: "Error al agregar" });

                }

                categoriaModel.nombreCategoria = parametros.nombreCatego;
                categoriaModel.save((err, categoriaGuardada) => {
                    if (err) return res.status(500).send({ mensaje: "Error en la peticion" });
                    if (!categoriaGuardada) return res.status(500).send({ mensaje: "Error al agregar" });

                    return res.status(200).send({ categoria: categoriaGuardada });
                })
            })
        }
    }
}


function editarCategoria(req, res) {
    var idCatego = req.params.idCategoria;
    var parametros = req.body;

    if (req.user.rol == 'Cliente') {
        return res.status(500).send({ mensaje: "No eres admin, no puedes editar" });
    } else {
        Categorias.findByIdAndUpdate(idCatego, parametros, { new: true }, (err, categoriaActualizada) => {
            if (err) return res.status(500).send({ mensaje: "Error en la peticion" });
            if (!categoriaActualizada) return res.status(404).send({ mensaje: "Error al Editar" });

            return res.status(200).send({ categoria: categoriaActualizada });
        });
    }
}

function eliminarCategoria(req, res) {
    var idCatego = req.params.idCategoria;

    if (req.user.rol == 'Cliente') {
        return res.status(500).send({ mensaje: "No eres admin, no puedes eliminar" });
    } else {
        Categorias.findOne({ _id: idCatego }, (err, categoriaProducto) => {
            if (err) return res.status(500).send({ mensaje: "Error en la peticion" });
            if (!categoriaProducto) return res.status(500).send({ mensaje: "Error en la busqueda" })

            Categorias.findOne({ nombreCategoria: 'Default' }, (err, categoriaEncontrada) => {
                if (err) return res.status(500).send({ mensaje: "Error en la peticion" });
                if (!categoriaEncontrada) {
                    const modelCategoria = new Categorias();
                    modelCategoria.nombreCategoria = 'Default';

                    modelCategoria.save((err, categoriaGuardada) => {
                        if (err) return res.status(500).send({ mensaje: "Error en la peticion" })
                        if (!categoriaGuardada) return res.status(500).send({ mensaje: "Error al agregar" })

                        Productos.updateMany({ idCategoria: idCatego }, { idCategoria: categoriaGuardada._id }, (err, categoriaActualizada) => {
                            if (err) return res.status(500).send({ mensaje: "Error al actualizar" })
                            Categorias.findByIdAndDelete(idCatego, { new: true }, (categoriaEliminada) => {
                                if (err) return res.status(500).send({ mensaje: "Error al eliminar" })
                                if (categoriaEliminada) return res.status(500).send({ mensaje: "Error al eliminar" })

                                return res.status(200).send({
                                    editado: categoriaActualizada,
                                    eliminado: categoriaEliminada
                                })
                            })
                        })
                    })
                } else {
                    Productos.updateMany({ idCategoria: idCatego }, { idCategoria: categoriaEncontrada._id }, (err, productosActualizados) => {
                        if (err) return res.status(500).send({ mensaje: "Error al actualizar" })
                        Categorias.findByIdAndDelete(idCatego, (err, categoriaEliminada) => {
                            if (err) return res.status(500).send({ mensaje: "Error al eliminar" })
                            return res.status(200).send({
                                editado: productosActualizados,
                                eliminado: categoriaEliminada
                            })
                        })
                    })
                }
            })
        })
    }
}


module.exports = {
    obtenerCategoria,
    agregarCategoria,
    editarCategoria,
    eliminarCategoria
}