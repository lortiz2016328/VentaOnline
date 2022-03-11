const jwt_simple = require('jwt-simple');
const moment = require('moment');
const secret = 'clave_secreta';

exports.Auth = function(req, res, next) {
    if(!req.headers.authorization) {
        return res.status(404).send({mensaje: 'Error en la petición, no tiene el header autentificado'});
    }
    var token = req.headers.authorization.replace(/['"]+/g, '');

    try {
        var payload = jwt_simple.decode(token, secret);
        if(payload.exp <= moment){
            return res.status(404).send({mensaje: 'El token ya ha expirado'});
        }
    }catch(error) {
        return res.status(500).send({mensaje: 'El token no es valido'});
    }

    req.user = payload;
    next();
}