const Usuarios = require('../models/usuarios.model');
const Productos = require('../models/productos.model');
const Facturas = require('../models/facturas.model');
const bcrypt = require('bcrypt-nodejs');
const jwt = require('../services/jwt');
const fs = require('fs');
const Pdfmake = require('pdfmake');
const path = require('path')

function agregarClientes(req, res) {
    var parametros = req.body;
    var usuarioModel = new Usuarios();

    if (parametros.nombre && parametros.usuario && parametros.password) {
        usuarioModel.nombre = parametros.nombre;
        usuarioModel.usuario = parametros.usuario;
        usuarioModel.rol = 'Cliente';
        usuarioModel.totalCarrito = 0;
        if (parametros.rol == 'Cliente') return res.status(500).send({ mensaje: "No eres admin, no puedes elejir el rol" });
        Usuarios.find({ usuario: parametros.usuario }, (err, usuariosEncontrados) => {
            if (usuariosEncontrados == 0) {

                bcrypt.hash(parametros.password, null, null, (err, passwordEncriptada) => {
                    usuarioModel.password = passwordEncriptada;

                    usuarioModel.save((err, usuarioGuardado) => {
                        if (err) return res.status(500).send({ message: "Error en la peticion" });
                        if (!usuarioGuardado) return res.status(404).send({ message: "Error en la busqueda" });

                        return res.status(200).send({ usuario: usuarioGuardado });
                    })
                });
            } else {
                return res.status(500).send({ mensaje: "Error, el usario ya fue usado" });
            }

        })
    } else {
        return res.status(500).send({ mensaje: "Rellene todos los campos" });
    }

}

function agregarAdministrador(req, res) {
    var parametros = req.body;
    var usuarioModel = new Usuarios();

    if (req.user.rol == 'Cliente') {
        return res.status(500).send({ mensaje: "No eres admin, no puedes agregar" });
    } else {
        if (parametros.nombre && parametros.apellido && parametros.usuario && parametros.password) {
            usuarioModel.nombre = parametros.nombre;
            usuarioModel.apellido = parametros.apellido;
            usuarioModel.usuario = parametros.usuario;
            usuarioModel.rol = 'Admin';

            Usuarios.find({ usuario: parametros.usuario }, (err, usuarioObtenido) => {
                if (usuarioObtenido == 0) {

                    bcrypt.hash(parametros.password, null, null, (err, passwordEncriptada) => {
                        usuarioModel.password = passwordEncriptada;

                        usuarioModel.save((err, usuarioGuardado) => {
                            if (err) return res.status(500).send({ message: "Error en la peticion" });
                            if (!usuarioGuardado) return res.status(404).send({ message: "Error en la busqueda" });

                            return res.status(200).send({ usuario: usuarioGuardado });
                        });
                    });
                } else {
                    return res.status(500).send({ mensaje: "Error, el usario ya fue usado" });
                }

            })
        }
    }
}

function Login(req, res) {
    var parametros = req.body;

    Usuarios.findOne({ usuario: parametros.usuario }, (err, usuarioEcontrado) => {
        if (err) return res.status(500).send({ message: "Error en la peticion" });
        if (usuarioEcontrado) {
            bcrypt.compare(parametros.password, usuarioEcontrado.password, (err, verificacionPassword) => {
                if (verificacionPassword) {

                    if (parametros.obtenerToken === 'true') {
                        Facturas.find({ idUsuario: usuarioEcontrado._id }, (err, facturaEncontrada) => {
                            if (err) return res.status(500).send({ mensaje: "Error en la peticion" });
                            if (!facturaEncontrada) return res.status(500).send({ mensaje: "El usuario no ha realizado ninguna compra" })

                            return res.status(200).send({ token: jwt.crearToken(usuarioEcontrado), 'Compras:': facturaEncontrada }
                            )
                        })

                    } else {
                        usuarioEcontrado.password = undefined;
                        return res.status(200).send({ usuario: usuarioEcontrado });
                    }
                } else {
                    return res.status(500).send({ message: "La contrasena no coincide" });
                }
            })
        } else {
            return res.status(500).send({ mensaje: "Error en la peticion" });
        }
    });
}

function editarUsuarios(req, res) {
    var idUser = req.params.idUsuario;
    var parametros = req.body;

    if (req.user.rol == 'Cliente') {
        if (parametros.rol) {
            return res.status(500).send({ mensaje: "Error, no puedes elejir el rol" })
        } else {
            Usuarios.findByIdAndUpdate({ _id: req.user.sub }, parametros, { new: true }, (err, usuarioActualizado) => {
                if (err) return res.status(500).send({ mensaje: "Error en la peticion" });
                if (!usuarioActualizado) return res.status(404).send({ mensaje: "Error en la busqueda" });

                return res.status(200).send({ usuario: usuarioActualizado });
            })
        }
    } else {
        Usuarios.findById(idUser, (err, usuarioObtenido) => {
            if (err) return res.status(500).send({ mensaje: "Error en la peticion" });
            if (!usuarioObtenido) return res.status(500).send({ mensaje: "Error en la busqueda" });

            if (usuarioObtenido.rol == 'Admin') {
                Usuarios.findByIdAndUpdate({ _id: idUser }, parametros, { new: true }, (err, usuarioActualizado) => {
                    if (err) return res.status(500).send({ mensaje: "Error en la peticion" });
                    if (!usuarioActualizado) return res.status(404).send({ mensaje: "No eres admin, no puedes modificar" });

                    return res.status(200).send({ usuarios: usuarioActualizado });
                });
            } else {
                if (idUser == req.user.sub) {
                    if (!parametros.rol) {
                        Usuarios.findByIdAndUpdate({ _id: idUser }, parametros, { new: true }, (err, usuarioActualizado) => {
                            if (err) return res.status(500).send({ mensaje: "Error en la peticion" });
                            if (!usuarioActualizado) return res.status(500).send({ mensaje: "No eres admin, no puedes modificar" });

                            return res.status(200).send({ usuarios: usuarioActualizado });
                        });
                    } else {
                        return res.status(500).send({ mensaje: "No eres admin, no puedes modificar el rol" })
                    }
                } else {
                    return res.status(500).send({ mensaje: "No eres admin, no puedes modificar" });
                }
            }
        })

    }

}

function eliminarUsuario(req, res) {
    var idUser = req.params.idUsuario;

    if (req.user.rol == 'Admin') {
        Usuarios.findByIdAndDelete({ _id: req.user.sub }, { new: true }, (err, usuarioEliminado) => {
            if (err) return res.status(500).send({ mensaje: "Error en la peticion" });
            if (!usuarioEliminado) return res.status(500).send({ message: "Error en la busqueda" });

            return res.status(200).send({ usuario: usuarioEliminado });
        })
    } else if (req.user.rol == 'Cliente') {
        if (idUser == req.user.sub) {
            Usuarios.findByIdAndDelete(idUser, { new: true }, (err, usuarioEliminado) => {
                if (err) return res.status(500).send({ mensaje: "Error en la peticion" });
                if (!usuarioEliminado) return res.status(500).send({ mensaje: "Error en la busqueda" });

                return res.status(200).send({ usuarios: usuarioEliminado });
            })
        } else {
            return res.status(500).send({ mensaje: "No eres admin, no puedes eliminar" })
        }
    } else {
        return res.status(500).send({ mensaje: "Error en la peticion" })
    }

}


function agregarAlCarrito(req, res) {
    const usuarioLogeado = req.user.sub;
    const parametros = req.body;

    if (req.user.rol == 'Admin') {
        return res.status(500).send({ mensaje: "Eres admin, no puedes agregar a una factura" });
    } else {
        Productos.findOne({ nombre: parametros.nombreProducto }, (err, productoEncontrado) => {
            if (err) return res.status(500).send({ mensaje: "Error en la peticion" });
            if (!productoEncontrado) return res.status(404).send({ mensaje: "Error en la busqueda" });

            if (parametros.cantidad > productoEncontrado.cantidad) {
                return res.status(500).send({ mensaje: "Producto no existe en stock" })
            } else {
                Usuarios.findOne({ _id: req.user.sub, carrito: { $elemMatch: { nombreProducto: parametros.nombreProducto } } }, (err, carritoEncontrado) => {
                    if (err) return res.status(500).send({ mensaje: "Error en la peticion" });


                    let cantidadLocal = 0;
                    let subTotalLocal = 0;
                    let compararStock = 0;
                    if (carritoEncontrado) {
                        for (let i = 0; i < carritoEncontrado.carrito.length; i++) {
                            if (carritoEncontrado.carrito[i].nombreProducto == parametros.nombreProducto) {
                                cantidadLocal = carritoEncontrado.carrito[i].cantidadComprada;
                                subTotalLocal = Number(cantidadLocal) + Number(parametros.cantidad);
                                if (subTotalLocal > productoEncontrado.cantidad) {
                                    return res.status(500).send({ mensaje: "No hay en stock" })
                                } else {
                                    Usuarios.findOneAndUpdate({ carrito: { $elemMatch: { _id: carritoEncontrado.carrito[i]._id } } },
                                        { $inc: { "carrito.$.cantidadComprada": parametros.cantidad }, "carrito.$.subTotal": subTotalLocal * productoEncontrado.precio },
                                        { new: true }, (err, cantidadAgregada) => {
                                            if (err) return res.status(500).send({ mensaje: "Error en la peticion" });
                                            if (!cantidadAgregada) return res.status(500)
                                                .send({ mensaje: "Error al guardar" });

                                            let totalCarritoLocal = 0;

                                            for (let i = 0; i < cantidadAgregada.carrito.length; i++) {
                                                totalCarritoLocal += cantidadAgregada.carrito[i].subTotal

                                            }

                                            Usuarios.findByIdAndUpdate(usuarioLogeado, { totalCarrito: totalCarritoLocal }, { new: true },
                                                (err, totalActualizado) => {
                                                    if (err) return res.status(500).send({ mensaje: "Error en la peticion" });
                                                    if (!totalActualizado) return res.status(500).send({ mensaje: "Error al guardar" });

                                                    return res.status(200).send({ carritoFinal: totalActualizado })
                                                })
                                        })
                                }
                            } else {

                            }
                        }
                    } else {
                        Usuarios.findByIdAndUpdate(usuarioLogeado, {
                            $push: {
                                carrito: {
                                    nombreProducto: parametros.nombreProducto,
                                    cantidadComprada: parametros.cantidad, precioUnitario: productoEncontrado.precio, subTotal: parametros.cantidad * productoEncontrado.precio
                                }
                            }
                        }, { new: true },
                            (err, usuarioActualizado) => {
                                if (err) return res.status(500).send({ mensaje: "Error en la peticion" });
                                if (!usuarioActualizado) return res.status(500).send({ mensaje: "Error al guardar" });

                                let totalCarritoLocal = 0;

                                for (let i = 0; i < usuarioActualizado.carrito.length; i++) {
                                    totalCarritoLocal += usuarioActualizado.carrito[i].subTotal

                                }

                                Usuarios.findByIdAndUpdate(usuarioLogeado, { totalCarrito: totalCarritoLocal }, { new: true },
                                    (err, totalActualizado) => {
                                        if (err) return res.status(500).send({ mensaje: "Error en la peticion" });
                                        if (!totalActualizado) return res.status(500).send({ mensaje: "Error al guardar" });

                                        return res.status(200).send({ usuario: totalActualizado })
                                    })
                            })
                    }

                })

            }
        })
    }

}

function facturaDeCarrito(req, res) {
    var parametros = req.body;
    var logueado = req.user.nombre;

    const facturaModel = new Facturas();

    if (req.user.rol == 'Admin') {
        return res.status(500).send({ mensaje: "Eres admin, no puedes agregar a una factura" })
    } else {
        Usuarios.findById(req.user.sub, (err, usuarioEncontrado) => {

            if (usuarioEncontrado.carrito == '') {
                return res.status(500).send({ mensaje: "No hay productos en el carrito" })
            } else {
                facturaModel.listaProductos = usuarioEncontrado.carrito;
                facturaModel.idUsuario = req.user.sub;
                facturaModel.totalFactura = usuarioEncontrado.totalCarrito;
                if (parametros.nit) {
                    facturaModel.nit = parametros.nit
                } else {
                    facturaModel.nit = 'CF'
                }


                facturaModel.save((err, facturaGuardada) => {
                    if (err) return res.status(500).send({ mensaje: "Error en la peticion" });
                    if (!facturaGuardada) return res.status(500).send({ mensaje: "Error al guardar" })
                    obtenerPDF(facturaGuardada, logueado);


                    for (let i = 0; i < usuarioEncontrado.carrito.length; i++) {
                        Productos.findOneAndUpdate({ nombre: usuarioEncontrado.carrito[i].nombreProducto },
                            {
                                $inc: {
                                    cantidad: usuarioEncontrado.carrito[i].cantidadComprada * -1,
                                    vendido: usuarioEncontrado.carrito[i].cantidadComprada
                                }
                            }, (err, datosProducto) => {
                                if (err) return res.status(500).send({ mensaje: "Error en la peticion" });
                                if (!datosProducto) return res.status(500).send({ mensaje: "Error al guardar" })

                            })
                    }
                    Usuarios.findByIdAndUpdate(req.user.sub, { $set: { carrito: [] }, totalCarrito: 0 }, { new: true },
                        (err, carritoVacio) => {
                            return res.status(200).send({ factura: facturaGuardada })
                        })
                })

            }
        })
    }
}

function eliminarDelCarrito(req, res) {
    var parametros = req.body;

    let totalCarritoLocal = 0;

    if (req.user.rol == 'Admin') {
        return res.status(500).send({ mensaje: "Eres admin, no puedes eliminar el carrito" })
    } else {
        Productos.findOne({ nombre: parametros.nombreProducto }, (err, productoEncontrado) => {
            if (err) return res.status(500).send({ mensaje: "Error en la peticion" })
            if (!productoEncontrado) return res.status(500).send({ mensaje: "Producto no existe" });

            Usuarios.updateOne({ _id: req.user.sub }, { $pull: { carrito: { nombreProducto: parametros.nombreProducto } } }, (err, carritoEliminado) => {
                if (err) return res.status(500).send({ mensaje: "Error en la peticion" });
                if (!carritoEliminado) return res.status(500).send({ mensaje: "Producto no existe dentro del carrito" });
                Usuarios.findOne({ _id: req.user.sub }, (err, usuarioEncontrado) => {
                    if (err) return res.status(500).send({ mensaje: "Error en la peticion" });
                    if (!usuarioEncontrado) return res.status(500).send({ mensaje: "Error al guardar" });

                    for (let i = 0; i < usuarioEncontrado.carrito.length; i++) {
                        totalCarritoLocal += usuarioEncontrado.carrito[i].subTotal
                    }

                    Usuarios.findByIdAndUpdate({ _id: req.user.sub }, { totalCarrito: totalCarritoLocal }, { new: true },
                        (err, totalActualizado) => {
                            if (err) return res.status(500).send({ mensaje: "Error en la peticion" });
                            if (!totalActualizado) return res.status(500).send({ mensaje: "Error al guardar" });

                            return res.status(200).send({ usuario: totalActualizado })
                        });
                });

            });
        });
    }
}

function UsuarioInicial() {
    Usuarios.find({ rol: 'Admin', usuario: 'ADMIN' }, (err, usuarioEcontrado) => {
        if (usuarioEcontrado.length == 0) {
            bcrypt.hash('123456', null, null, (err, passwordEncriptada) => {
                Usuarios.create({
                    usuario: 'ADMIN',
                    password: passwordEncriptada,
                    rol: 'Admin'
                })
            })
        }
    })
}
function obtenerPDF(facturaGuardada) {

    fs.mkdir('./src/pdfs', { recursive: true }, (err) => {
        if (err) throw err;
    });

    var fonts = {
        Roboto: {
            normal: './src/fonts/roboto/Roboto-Regular.ttf',
            bold: './src/fonts/roboto/Roboto-Medium.ttf',
            italics: './src/fonts/roboto/Roboto-Italic.ttf',
            bolditalics: './src/fonts/roboto/Roboto-MediumItalic.ttf'
        }
    };

    let pdfmake = new Pdfmake(fonts);

    let content = [{
        text: 'Factura',
        fontSize: 25,
        color: '#FFFFFF',
        bold: true,
        margin: [0, 0, 0, 50],
    }]

    content.push({
        margin: [0, 5, 0, 5],
        text: 'Nit: ' + facturaGuardada.nit,
        fontSize: 15,
        color: '#2b7816',
    })

    for (let i = 0; i < facturaGuardada.listaProductos.length; i++) {

        content.push({
            text: ' ',
            margin: [0, 5, 0, 5]
        })
        content.push({
            text: i + 1 + '.- Producto:' + facturaGuardada.listaProductos[i].nombreProducto,
            fontSize: 18
        })

        content.push({
            text: 'Cantidad : ' + facturaGuardada.listaProductos[i].cantidadComprada,
            fontSize: 18
        })

        content.push({
            text: 'Precio por unidad : ' + facturaGuardada.listaProductos[i].precioUnitario + '.00 Q',
            fontSize: 18
        })

        content.push({
            text: 'subTotal : ' + facturaGuardada.listaProductos[i].subTotal + '.00 Q',
            text: '------------------------------------------------------------------------',
            fontSize: 18,
            margin: [0, 10, 0, 0]
        })
    }

    content.push({
        margin: [0, 5, 0, 0],
        text: 'Total a Pagar: ' + facturaGuardada.totalFactura + '.00 Q',
        fontSize: 15,
        color: '#2b7816',
        bold: true
    })

    let documento = {
        pageSize: {
            width: 595.28,
            height: 841.89
        },
        background: function () {
            return {
                canvas: [
                    {
                        type: 'rect',
                        x: 0, y: 0, w: 595.28, h: 100,
                        color: '#69f542'
                    }
                ]
            };
        },
        content: content
    }
    let pdf = pdfmake.createPdfKitDocument(documento, {});

    Facturas.find({ idUsuario: facturaGuardada.idUsuario._id }, (err, nuevaFactura) => {
        pdf.pipe(fs.createWriteStream('./src/pdfs/Factura' + facturaGuardada.idUsuario.nombre + '.' + nuevaFactura.length + '.pdf'));
    })

    pdf.end();
}

module.exports = {
    agregarClientes,
    agregarAdministrador,
    Login,
    editarUsuarios,
    eliminarUsuario,
    agregarAlCarrito,
    facturaDeCarrito,
    eliminarDelCarrito,
    UsuarioInicial,
    obtenerPDF
}
