const dotenv     = require('dotenv');
dotenv.config();
class Controller {

    errorMsgFormat(error, type = 'users', code = 400) {
        return {
            "code": code,
            "errors": true,
            "data": {
                "type": type,
                "attributes": error
            }
        };
    }

    errorFormat(error) {
        let errors = {};
        if (error.details) {
            error.details.forEach((detail) => {
                errors[detail.path] = detail.message;

            });
        } else {
            errors = error;
        }
        return this.errorMsgFormat({ message: errors }, 'users', 400);
    }

    successFormat(res, id = null, type = 'users', code = 200) {
        return {
            "code": code,
            "errors": false,
            "data": {
                "id": id,
                "type": type,
                "attributes": res
            }
        };
    }

    requestDataFormat(data) {
        return {
            "lang": "en",
            "data": {
                "attributes": data
            }
        };
    }

}

module.exports = Controller;