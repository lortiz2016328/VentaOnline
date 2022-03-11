const Usuarios = require('../models/usuarios.model');
const Productos = require('../models/productos.model');
const Facturas = require('../models/Factura.model');
const bcrypt = require('bcrypt-nodejs');
const jwt = require('../services/jwt');
const PdfkitConstruct = require('pdfkit-construct');
const fs = require('fs');


function obtenerUsuario(req, res) {

    if (req.user.rol == 'Cliente') {
        return res.status(500).send({ mensaje: "No eres Admin, no puedes ver el listado" })
    } else {
        Usuarios.find((err, usuariosEncontrados) => {
            if (err) return res.send({ mensaje: "Error :" + err })
            if (!usuariosEncontrados) return res.status(500).send({ mensaje: "Error al listar, no hay usuarios" });

            return res.send({ usuarios: usuariosEncontrados })
        })
    }
}

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
                        Factura.find({ idUsuario: usuarioEcontrado._id }, (err, facturaEncontrada) => {
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

            if (usuarioObtenido.rol == 'Cliente') {
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

    if (req.user.rol == 'Cliente') {
        Usuarios.findByIdAndDelete({ _id: req.user.sub }, { new: true }, (err, usuarioEliminado) => {
            if (err) return res.status(500).send({ mensaje: "Error en la peticion" });
            if (!usuarioEliminado) return res.status(404).send({ message: "Error en la busqueda" });

            return res.status(200).send({ usuario: usuarioEliminado });
        })
    } else if (req.user.rol == 'ADMIN') {
        if (idUser == req.user.sub) {
            Usuarios.findByIdAndDelete(idUser, { new: true }, (err, usuarioEliminado) => {
                if (err) return res.status(500).send({ mensaje: "Error en la peticion" });
                if (!usuarioEliminado) return res.status(404).send({ mensaje: "Error en la busqueda" });

                return res.status(200).send({ usuarios: usuarioEliminado });
            })
        } else {
            return res.status(500).send({ mensaje: "No eres admin, no puedes eliminar" })
        }
    } else {
        return res.status(500).send({ mensaje: "Error en la peticion" })
    }


}

function buscarUsuarioPorNombre(req, res) {
    var idBus = req.params.idBuscar;

    Usuarios.find({ usuario: { $regex: idBus, $options: 'i' } }, (err, usuarioEncontrado) => {
        if (err) return res.status(500).send({ mensaje: "Error en la peticion" });
        if (!usuarioEncontrado) return res.status(404).send({ mensaje: "Error en la busqueda" });

        return res.status(200).send({ usuarios: usuarioEncontrado });
    })
}

function buscarUsuarioPorApellido(req, res) {
    var idBus = req.params.idBuscar;

    Usuarios.find({ apellido: { $regex: idBus, $options: 'i' } }, (err, usuarioEncontrado) => {
        if (err) return res.status(500).send({ mensaje: "Error en la peticion" });
        if (!usuarioEncontrado) return res.status(404).send({ mensaje: "Error en la busqueda" });

        return res.status(200).send({ usuarios: usuarioEncontrado });
    })

}

function buscarUsuarioPorRol(req, res) {
    var idBus = req.params.idBuscar;

    Usuarios.find({ rol: { $regex: idBus, $options: 'i' } }, (err, usuarioEncontrado) => {
        if (err) return res.status(500).send({ mensaje: "Error en la peticion" });
        if (!usuarioEncontrado) return res.status(404).send({ mensaje: "Error en la busqueda" });

        return res.status(200).send({ usuarios: usuarioEncontrado });
    })
}


function buscarUsuarioPorId(req, res) {
    var idUser = req.params.idUsuario;

    Usuarios.findById(idUser, (err, usuarioEncontrado) => {

        if (err) return res.status(500).send({ mensaje: "Error en la peticion" });
        if (!usuarioEncontrado) return res.status(500).send({ mensaje: "Error en la busqueda" });

        return res.status(200).send({ usuarios: usuarioEncontrado });
    })
}

function agregarAlCarrito(req, res) {
    const usuarioLogeado = req.user.sub;
    const parametros = req.body;

    if (req.user.rol == 'Admin') {
        return res.status(500).send({ mensaje: "No eres admin, no puedes agregar a un carrito" });
    } else {
        Productos.findOne({ nombre: parametros.nombreProducto }, (err, productoEncontrado) => {
            if (err) return res.status(500).send({ mensaje: "Error en la peticion" });
            if (!productoEncontrado) return res.status(404).send({ mensaje: "Error en la busqueda" });

            if (parametros.cantidad > productoEncontrado.cantidad) {
                return res.status(500).send({ mensaje: "Producto no existe en stock" })
            } else {
                Usuarios.findOne({ _id: req.user.sub, carrito: { $elemMatch: { nombreProducto: parametros.nombreProducto } } }, (err, carritoEncontrado) => {
                    if (err) return res.status(500).send({ mensaje: "Error en la peticion"});


                    let cantidadLocal = 0;
                    let subTotalLocal = 0;
                    let compararStock = 0;
                    if (carritoEncontrado) {
                        for (let i = 0; i < carritoEncontrado.carrito.length; i++) {
                            if (carritoEncontrado.carrito[i].nombreProducto == parametros.nombreProducto) {
                                cantidadLocal = carritoEncontrado.carrito[i].cantidadComprada;
                                subTotalLocal = Number(cantidadLocal) + Number(parametros.cantidad);
                                if (subTotalLocal > productoEncontrado.cantidad) {
                                    return res.status(500).send({ mensaje: 'No contamos con stock suficiente' })
                                } else {
                                    Usuarios.findOneAndUpdate({ carrito: { $elemMatch: { _id: carritoEncontrado.carrito[i]._id } } },
                                        { $inc: { "carrito.$.cantidadComprada": parametros.cantidad }, "carrito.$.subTotal": subTotalLocal * productoEncontrado.precio },
                                        { new: true }, (err, cantidadAgregada) => {
                                            if (err) return res.status(500).send({ mensaje: "Error en la peticion" });
                                            if (!cantidadAgregada) return res.status(500)
                                                .send({ mensaje: "Ocurrio un error al querer guardar la cantidad" });

                                            let totalCantidad = 0
                                            let totalCarritoLocal = 0;

                                            for (let i = 0; i < cantidadAgregada.carrito.length; i++) {
                                                // totalCarritoLocal = totalCarritoLocal + usuarioActualizado.carrito[i].precioUnitario;
                                                totalCarritoLocal += cantidadAgregada.carrito[i].subTotal

                                            }

                                            Usuarios.findByIdAndUpdate(usuarioLogeado, { totalCarrito: totalCarritoLocal }, { new: true },
                                                (err, totalActualizado) => {
                                                    if (err) return res.status(500).send({ mensaje: "Error en la peticion de Total Carrito" });
                                                    if (!totalActualizado) return res.status(500).send({ mensaje: 'Error al modificar el total del carrito' });

                                                    return res.status(200).send({ sdf: totalActualizado })
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
                                if (err) return res.status(500).send({ mensaje: "Error en la peticion de Usuario" });
                                if (!usuarioActualizado) return res.status(500).send({ mensaje: 'Error al agregar el producto al carrito' });

                                let totalCantidad = 0
                                let totalCarritoLocal = 0;

                                for (let i = 0; i < usuarioActualizado.carrito.length; i++) {
                                    // totalCarritoLocal = totalCarritoLocal + usuarioActualizado.carrito[i].precioUnitario;
                                    totalCarritoLocal += usuarioActualizado.carrito[i].subTotal

                                }

                                Usuarios.findByIdAndUpdate(usuarioLogeado, { totalCarrito: totalCarritoLocal }, { new: true },
                                    (err, totalActualizado) => {
                                        if (err) return res.status(500).send({ mensaje: "Error en la peticion de Total Carrito" });
                                        if (!totalActualizado) return res.status(500).send({ mensaje: 'Error al modificar el total del carrito' });

                                        return res.status(200).send({ usuario: totalActualizado })
                                    })
                            })
                    }

                })

            }
        })
    }

}

function facturaDeCarrito(req, res){
    var parametros = req.body;
    var logueado = req.user.nombre;

     const facturaModel = new Factura();

     if(req.user.rol == 'ADMIN'){
         return res.status(500).send({mensaje: 'Eres un administrador, no puedes tener carrito y tampoco facturas'})
     }else{
        Usuarios.findById(req.user.sub, (err, usuarioEncontrado)=>{

            if(usuarioEncontrado.carrito == ''){
                return res.status(500).send({mensaje: 'El carrito esta vacio, no se puede generar una factura'})
            }else{
                facturaModel.listaProductos = usuarioEncontrado.carrito;
                facturaModel.idUsuario = req.user.sub;
                facturaModel.totalFactura = usuarioEncontrado.totalCarrito;
                if(parametros.nit){
                    facturaModel.nit = parametros.nit
                }else{
                    facturaModel.nit = 'Consumidor final'
                }
                
    
                facturaModel.save((err, facturaGuaardada) => {
                    if (err) return res.status(500).send({mensaje : "Error en la peticion"});
                    if(!facturaGuaardada) return res.status(500).send({mensaje : "Ocurrio un error al intentar guardar la factura"})
                    obtenerPDF(facturaGuaardada, logueado);
                    
                
                    for (let i = 0; i < usuarioEncontrado.carrito.length; i++) {
                        Producto.findOneAndUpdate({nombre: usuarioEncontrado.carrito[i].nombreProducto} , 
                            {  $inc : { cantidad: usuarioEncontrado.carrito[i].cantidadComprada * -1, 
                            vendido: usuarioEncontrado.carrito[i].cantidadComprada }}, (err, datosProducto) =>{
                        if (err) return res.status(500).send({mensaje: 'Error en la peticion'});
                        if(!datosProducto) return res.status(500).send({mensaje: 'Ocurrio un error al modificar el stock'})
    
                    })
                    }
                    Usuarios.findByIdAndUpdate(req.user.sub, { $set: { carrito: [] }, totalCarrito: 0 }, { new: true }, 
                        (err, carritoVacio)=>{
                            return res.status(200).send({ factura: facturaGuaardada })
                        })
                })
                
            }
        }) 
     }
}

function eliminarDelCarrito(req, res) {
    var parametros = req.body;
    
    let totalCarritoLocal = 0;

    if(req.user.rol == 'ADMIN'){
        return res.status(500).send({mensaje: 'Eres un administrador, no puedes realizar esta accio'})
    }else{
        Producto.findOne({nombre: parametros.nombreProducto}, (err, productoEncontrado) => {
            if (err) return res.status(500).send({mensaje: 'Error en la peticion'})
            if(!productoEncontrado) return res.status(500).send({mensaje: 'Este producto no existe, verifica el nombre'});
    
            Usuarios.updateOne({_id: req.user.sub},{ $pull: { carrito: {nombreProducto:parametros.nombreProducto} } }, (err, carritoEliminado)=>{
                if(err) return res.status(500).send({mensaje: 'Error en la peticion'});
                if(!carritoEliminado) return res.status(500).send({mensaje: 'Este producto no esta en tu carrito, verfica bien el nombre'});
                Usuarios.findOne({_id: req.user.sub}, (err, usuarioEncontrado) =>{
                    if(err) return res.status(500).send({ mensaje: "Error en la peticion de Total Carrito"});
                    if(!usuarioEncontrado) return res.status(500).send({ mensaje: 'Error al modificar el total del carrito'});
        
                    for (let i = 0; i < usuarioEncontrado.carrito.length; i++){
                        totalCarritoLocal += usuarioEncontrado.carrito[i].subTotal  
                    }
        
                    Usuarios.findByIdAndUpdate({_id: req.user.sub},  { totalCarrito: totalCarritoLocal }, {new: true},
                        (err, totalActualizado)=> {
                            if(err) return res.status(500).send({ mensaje: "Error en la peticion de Total Carrito"});
                            if(!totalActualizado) return res.status(500).send({ mensaje: 'Error al modificar el total del carrito'});
            
                            return res.status(200).send({ usuario: totalActualizado })
                        });
                });
                
            });
        });
    }
}

function obtenerPDF(facturaGuaardada, logueado)  {
    var hoy = new Date();
    var fecha = hoy.getDate() + '-' + ( hoy.getMonth() + 1 ) + '-' + hoy.getFullYear();	
    var hora = hoy.getHours() + '_' + hoy.getMinutes() + '_' + hoy.getSeconds();
    const doc = new PdfkitConstruct({
        bufferPages: true,
    });

    doc.setDocumentHeader({}, () => {


        doc.lineJoin('miter')
            .rect(0, 0, doc.page.width, doc.header.options.heightNumber).fill("#ededed");

        doc.fill("#115dc8")
            .fontSize(20)
            .text("Factura de: \n" + logueado + '\n', doc.header.x+40, doc.header.y);
    });
    
        doc.text('Factura compra: '+'\n nit: '+ facturaGuaardada.nit+'\n Descripcion productos: '+facturaGuaardada.listaProductos + '\n Total: ' + facturaGuaardada.totalFactura, doc.header.x+80, doc.header.y+80)
    
        doc.setDocumentFooter({}, () => {

            doc.lineJoin('miter')
                .rect(0, doc.footer.y, doc.page.width, doc.footer.options.heightNumber).fill("#ededed");

            doc.fill("#000000")
                .fontSize(8)
                .text("Fecha: " + fecha + ' ' + hora, doc.footer.x, doc.footer.y-45);
        });


    doc.render();
    doc.pipe(fs.createWriteStream('pdfs/'+ logueado+ '-factura-' + fecha+ '-'+ hora + '.pdf'));
    doc.end();
}

function UsuarioInicial(){
    Usuarios.find({rol: 'Admin', usuario: 'Admin'}, (err, usuarioEcontrado) => {
        if(usuarioEcontrado.length ==0){
            bcrypt.hash('123456', null, null, (err, passwordEncriptada) => {
                Usuarios.create({
                    nombreEmpresa: null,
                    usuario: 'Admin',
                    password: passwordEncriptada,
                    rol: 'Admin'
                })
            })
        }
    })
}

function UsuarioInicial(){
    Usuarios.find({rol: 'Admin', usuario: 'Admin'}, (err, usuarioEcontrado) => {
        if(usuarioEcontrado.length ==0){
            bcrypt.hash('123456', null, null, (err, passwordEncriptada) => {
                Usuarios.create({
                    nombre: 'Admin',
                    apellido: 'Admin',
                    usuario: 'Admin',
                    password: passwordEncriptada,
                    rol: 'Admin'
                })
            })
        }
    })
}

module.exports = {
    obtenerUsuario,
    agregarClientes,
    agregarAdministrador,
    Login,
    editarUsuarios,
    eliminarUsuario,
    buscarUsuarioPorNombre,
    buscarUsuarioPorApellido,
    buscarUsuarioPorRol,
    buscarUsuarioPorId,
    agregarAlCarrito,
    facturaDeCarrito,
    eliminarDelCarrito,
    UsuarioInicial
}

