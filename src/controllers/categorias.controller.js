const Categorias = require('../models/categorias.model');
const Productos = require('../models/productos.model');

function obtenerCategoria(req, res) {
    Categorias.find((err, categoriaObtenida) => {
        if (err) return res.send({ mensaje: "Error:" + err });

        return res.send({ categorias: categoriaObtenida })
    });
}

function obtenerCategoriaPorId(req, res) {
    var idCatego = req.params.idCategoria;

    Categorias.findById(idCatego, (err, categoriaEncontrada) => {
        if (err) return res.status(500).send({ mensaje: "Error en la peticion" });
        if (!categoriaEncontrada) return res.status(500).send({ mensaje: "Error en la busqueda" });

        return res.status(200).send({ categoria: categoriaEncontrada });
    })
}

function obtenerCategoriaPorNombre(req, res) {
    var nombreCatego = req.params.nombreCategoria;

    Productos.find({ nombre: { $regex: nombreCatego, $options: 'i' } }, (err, categoriaEncontrada) => {
        if (err) return res.status(500).send({ mensaje: "Error en la peticion" });
        if (!categoriaEncontrada) return res.status(500).send({ mensaje: "Error al encontrar la categoria" });

        return res.status(200).send({ producto: categoriaEncontrada });
    })
}


function agregarCategoria(req, res) {
    var parametros = req.body;
    var categoriaModel = new Categorias();

    if (req.user.rol == 'Cliente') {
        return res.status(500).send({ mensaje: "No eres admin, no puedes agregar" });
    } else {


        if (parametros.nombre) {

            Categorias.find({ nombreCategoria: parametros.nombre }).exec((err, categoriasEncontradas) => {
                for (let i = 0; i < categoriasEncontradas.length; i++) {
                    if (categoriasEncontradas[i].nombreCategoria === parametros.nombre) return res.status(500).send({ mensaje: "Error al agregar" });

                }
                
                categoriaModel.nombreCategoria = parametros.nombre;
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
                            Categorias.findByIdAndDelete(idCat, { new: true }, (categoriaEliminada) => {
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
    obtenerCategoriaPorId,
    obtenerCategoriaPorNombre,
    agregarCategoria,
    editarCategoria,
    eliminarCategoria
}