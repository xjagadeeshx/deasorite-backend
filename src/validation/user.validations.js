const Joi = require('joi');

exports.loginValidation = (req) => {
    let schema = Joi.object().keys(Object.assign({
        email: Joi.number().required(),
        password: Joi.string().required()
    }));
    return schema.validate(req, { abortEarly: false })
}

exports.resetPasswordValidation = (req) => {
    let schema = Joi.object().keys(Object.assign({
        password: Joi.string().required(),
        password_confirmation: Joi.any().valid(Joi.ref('password')).required().error(errors => {
            errors.forEach(err => {
                switch (err.code) {
                    case "any.only":
                        err.message = 'The password you entered do not match.';
                        break;
                }
            })
            return errors
        })
    }));

    return schema.validate(req, { abortEarly: false })
}

exports.forgetPasswordValidation = (req) => {
    let schema = Joi.object().keys(Object.assign({
        email: Joi.string().required().email()
    }));

    return schema.validate(req, { abortEarly: false });
}


