const jwt = require('jsonwebtoken');
const config = require('config');
const Controller = require('../core/controller');
const controller = new Controller;
const { tokens, users } = require('../db/user');
const branca = require("branca")(config.get('encryption.realKey'));
let verifyOptions = {
    issuer: config.get('secrete.issuer'),
    subject: 'Authentication',
    audience: config.get('secrete.domain'),
    expiresIn: config.get('secrete.expiry')
};

module.exports = async (req, res, next) => {
    try {
        const token = req.headers.authorization;
        const dataUser = await jwt.verify(token, config.get('secrete.key'), verifyOptions);
        const data = JSON.parse(branca.decode(dataUser.encryptToken));
        const isChecked = await tokens.findOne({
            user: data.user, token: token
        });
        console.log('ischecked', isChecked)
        if (!isChecked || isChecked.is_deleted) {
            throw new Error("Token is not found")
        } else {
            let isActive = await users.findOne({ _id: data.user, is_active: false })
            if (isActive) throw new Error("Token is not found");
            else if(data.role!=1) throw new Error("User only access this page");
            else {
                req.user = data;
                console.log("Hello")
                next();
            }
        }
    }
    catch (error) {
        console.log("Error:",error.message, error.stack)
        return res.status(401).json(controller.errorMsgFormat({
            message: "Authentication failed. Your request could not be authenticated."
        }, 'user', 401));
    }
};