const express = require('express');
const router = express.Router();
const user = require('../core/user')
const Controller = require('../core/controller');
const controller = new Controller;
const auth = require('../middleware/auth');
const { loginValidation, forgetPasswordValidation, resetPasswordValidation } = require('../validation/user.validations');
const winston = require('../app/winston');

router.post('/login', async (req, res) => {
    try {
        let { error } = await loginValidation(req.body.data.attributes)
        if (error) {
            return res.status(400).send(controller.errorFormat(error.message));
        }
        user.login(req, res)
    }
    catch (err) {
        winston.error((`${'path :' + __filename + ' ' + ': url :' + req.originalUrl} : ${err}`));
        return res.status(500).send(controller.errorMsgFormat(err.message));
    }
});

router.post('/forget-password', async (req, res) => {
    try {
        let { error } = await forgetPasswordValidation(req.body.data.attributes)
        if (error) {
            return res.status(400).send(controller.errorFormat(error.message));
        }
        user.forgetPassword(req, res);
    }
    catch (err) {
        winston.error((`${'path :' + __filename + ' ' + ': url :' + req.originalUrl} : ${err}`));
        return res.status(500).send(controller.errorMsgFormat(err.message));
    }
});

router.get('/reset-password/:hash', (req, res) => {
    try {
        user.checkResetLink(req, res);
    } catch (err) {
        winston.error((`${'path :' + __filename + ' ' + ': url :' + req.originalUrl} : ${err}`));
        return res.status(500).send(controller.errorMsgFormat({
            'message': err.message
        }, 'users', 500));
    }
});


router.patch('/reset-password', async (req, res) => {
    try {
        //await helpers.passwordDecryption(req.body.data.attributes, res);
        let { error } = resetPasswordValidation(req.body.data.attributes);
        if (error) {
            return res.status(400).send(controller.errorFormat(error, 'users', 400));
        } else {
            user.resetPassword(req, res);
        }
    } catch (err) {
        winston.error((`${'path :' + __filename + ' ' + ': url :' + req.originalUrl} : ${err}`));
        return res.status(500).send(controller.errorMsgFormat({
            'message': err.message
        }, 'users', 500));
    }
});


router.post('/logout', auth, async (req, res) => {
    try {
        user.logout(req, res)
    }
    catch (err) {
        winston.error((`${'path :' + __filename + ' ' + ': url :' + req.originalUrl} : ${err}`));
        return res.status(500).send(controller.errorMsgFormat(err.message));
    }
});



module.exports = router;