const moment = require('moment');
const { users, tokens, hashes,userNotification } = require('../db/user')
const config = require('config');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const controller = require('../core/controller');
const branca = require("branca")(config.get('encryption.realKey'));
const _ = require('lodash');
const helpers = require('../helpers/helper.functions');
const emailNotification = require('../helpers/email.notfication');
const winston = require('../app/winston');
const xlsx = require("node-xlsx");
const fs = require("fs");

class User extends controller {
    async login(req, res) {
        try {
            let data = req.body.data.attributes;
            console.log("data:",data)
            let checkEmail = await users.findOne({ email: data.email });
            if (_.isEmpty(checkEmail)) {
                return res.status(400).send(this.errorMsgFormat({ message: "Email or Password Incorrect" }))
            }
            //data.password = await helpers.decrypt(data.password, res);
            let passwordCompare = await bcrypt.compareSync(data.password, checkEmail.password);
            if (!passwordCompare) {
                return res.status(400).send(this.errorMsgFormat({ message: "Email or Password Incorrect" }))
            }
            if(!checkEmail.is_active){
                return res.status(400).send(this.errorMsgFormat({ message: "User is not active" }))
            }
            checkEmail.login_time = new Date();
            checkEmail.save()
            return res.status(200).send(this.successFormat({
                role: checkEmail.role,
                username:checkEmail.username,
                email:checkEmail.email,
                token: await this.createToken(checkEmail, res)
            }))
        }
        catch (err) {
            winston.error((`${'path :' + __filename + ' ' + ': url :' + req.originalUrl} : ${err}`));
            return res.status(400).send(this.errorMsgFormat(err.message));
        }
    }
    async createToken(user, res) {
        try {
            let jwtOptions = Object.assign({}, {
                issuer: config.get('secrete.issuer'),
                subject: 'Authentication',
                audience: config.get('secrete.domain'),
                expiresIn: config.get('secrete.expiry')
            });
            let tokenAccess = Object.assign({}, {
                user: user._id,
                role: user.role,
                supplierNo: user.supplier_no
            });
            let encryptToken = branca.encode(JSON.stringify(tokenAccess));
            let token = await jwt.sign({ encryptToken }, config.get('secrete.key'), jwtOptions);
            await tokens.updateMany({ user: user._id, is_deleted: false }, { is_deleted: true });
            await new tokens({
                user: user._id,
                token: token
            }).save()
            console.log("Token:", token);
            return token

        } catch (err) {
            return res.status(400).send(this.errorMsgFormat(err.message));
        }

    }

    async forgetPassword(req, res) {
        try {
            let data = req.body.data.attributes;
            let checkEmail = await users.findOne({ email: data.email });
            if (_.isEmpty(checkEmail)) {
                return res.status(400).send(this.errorMsgFormat({ message: "Email doesn't exits" }))
            }
            let encryptData = JSON.stringify({
                dateAndTime: moment().format('YYYY-MM-DD HH:mm:ss'),
                email: data.email
            });
            let encryptHash = helpers.encrypt(encryptData);
            await hashes.update({ email: checkEmail.email, is_active: false, type_for: "reset" }, { $set: { is_active: true } })
            await new hashes({ user: checkEmail._id, email: checkEmail.email, hash: encryptHash, type_for: "reset" }).save();
            let htmlPage = await emailNotification.resetPassword({
                message: 'We cannot simply send you your old password. A unique link to reset your password has been generated for you. To reset your password, click the following link and follow the instructions.',
                hash: encryptHash
            },`http://winzonecloud.in/reset/${data.hash}`,'You have requested to reset your password',"RESET PASSWORD")
            console.log('hash:', encryptHash);
            await emailNotification.sendEmailNotification(data.email, htmlPage,"Reset Password")
            return res.status(200).json(this.successFormat({
                'message': 'A password reset link has been sent to your registered email address. Please check your email to reset your password.',
            }));
        } catch (err) {
            //winston.error((`${'path :' + __filename + ' ' + ': url :' + req.originalUrl} : ${err}`));
            return res.status(400).send(this.errorMsgFormat(err.message));
        }
    }

    async checkResetLink(req, res) {
        try {
            let userHash = JSON.parse(helpers.decrypt(req.params.hash, res));
            let checkHash = await hashes.findOne({ email: userHash.email, hash: req.params.hash });
            if (!_.isEmpty(checkHash)) {
                if (checkHash.is_active) {
                    return res.status(400).send(this.errorMsgFormat({
                        'message': 'The password reset link has already been used.'
                    }));
                } else {
                    if (userHash.email) {
                        let checkExpired = this.checkTimeExpired(userHash.dateAndTime);
                        if (checkExpired) {
                            let chekUser = await users.findOne({ email: userHash.email }).exec();
                            if (_.isEmpty(chekUser)) {
                                return res.status(400).send(this.errorMsgFormat({
                                    'message': "User cannot be found."
                                }));
                            }
                            checkHash.is_active = true;
                            checkHash.save()
                            return res.status(200).send(this.successFormat({
                                'message': 'The password reset link has been validated.'
                            }, chekUser._id));
                        }
                        return res.status(404).send(this.errorMsgFormat({
                            'message': 'The password reset link has expired. Please login to continue.'
                        }));

                    }
                    return res.status(404).send(this.errorMsgFormat({
                        'message': 'User cannot be found.'
                    }));
                }
            }
            return res.status(400).send(this.errorMsgFormat({
                'message': 'The password reset link has expired.'
            }));

        } catch (err) {
            winston.error((`${'path :' + __filename + ' ' + ': url :' + req.originalUrl} : ${err}`));
            return res.status(400).send(this.errorMsgFormat(err.message));
        }
    }

    async checkTimeExpired(startDate) {
        let date = new Date(startDate);
        let getSeconds = date.getSeconds() + config.get('activation.expiryTime');
        let duration = moment.duration(moment().diff(startDate));
        if (getSeconds > duration.asSeconds()) {
            return true;
        }
        return false;
    }

    async resetPassword(req, res) {
        try {
            let data = req.body.data.attributes;
            if (req.body.data.id == null || undefined) {
                return res.status(400).send(this.successFormat({
                    'message': 'Id must define'
                }, 'users', 400));
            }
            const checkPassword = await users.findById({ _id: req.body.data.id });
            let comparePassword = await bcrypt.compare(data.password, checkPassword.password);
            if (comparePassword) {
                return res.status(400).send(this.successFormat({
                    'message': 'Please enter a password that you have not used before.'
                }, checkPassword._id, 'users', 400));

            }
            let salt = await bcrypt.genSalt(10);
            data.password = await bcrypt.hash(data.password, salt);
            let user = await users.findOneAndUpdate({ _id: req.body.data.id }, { password: data.password });
            if (_.isEmpty(user)) {
                return res.status(404).send(this.errorMsgFormat({ 'message': 'Invalid user.' }));
            }
            await tokens.updateMany({ user: user._id, is_deleted: false }, { is_deleted: true });
            return res.status(202).send(this.successFormat({
                'message': 'Your password has been reset successfully.'
            }, user._id, 'users', 202))
        }
        catch (err) {
            winston.error((`${'path :' + __filename + ' ' + ': url :' + req.originalUrl} : ${err}`));
            return res.status(400).send(this.errorMsgFormat(err.message));
        }
    }

    async logout(req, res) {

        try {
            await tokens.updateMany({ user: req.user.user, is_deleted: false }, { is_deleted: true });
            await users.findOneAndUpdate({ _id: req.user.user }, { logout_time: new Date() });
            return res.status(200).send(this.successFormat({
                'message': 'Your Logout Successfully'
            }, user._id, 'users', 200))
        } catch (err) {
            winston.error((`${'path :' + __filename + ' ' + ': url :' + req.originalUrl} : ${err}`));
            return res.status(400).send(this.errorMsgFormat(err.message));
        }

    }

    // Script for adding user from excel sheet
    // This will be removed after live

    // async script(req, res) {
    //     try {
    //         let makePassword = await bcrypt.genSalt(10);
    //         var obj = xlsx.parse(fs.readFileSync(__dirname + '/vendor.xlsx'))
    //         let data = obj[0].data;
    //         console.log("xlx:",data)
    //         let i = 1;
    //         while (i < data.length) {
    //             let payload = {
    //                 "user_id":i,
    //                 "username": data[i][1],
    //                 "email": data[i][2],
    //                 "password": await bcrypt.hash('Admin@123', makePassword),
    //                 "supplier_no": data[i][0],
    //                 "mobile": "",
    //                 "is_active": true,
    //                 "role": 1
    //             }
    //             await new users(payload).save()
    //             i++;
    //         }
    //         return res.status(200).send("Success");
    //     } catch (err) {
    //         winston.error((`${'path :' + __filename + ' ' + ': url :' + req.originalUrl} : ${err}`));
    //         return res.status(400).send(this.errorMsgFormat(err.message));
    //     }
    // }
    async getNotification(req,res){
        try{
            let data = await userNotification.find({user:req.user.user,is_active:true}).sort({_id:-1})
            return res.status(200).send(this.successFormat({
                'data': data,
                'count':data.length
            },null, 'users', 200))
        }catch (err) {
            winston.error((`${'path :' + __filename + ' ' + ': url :' + req.originalUrl} : ${err}`));
            return res.status(400).send(this.errorMsgFormat(err.message));
        }
    }

    async updateAllNotification(req,res){
        try{
            let data = await userNotification.updateMany({user:req.user.user},{is_active:false});
            return res.status(200).send(this.successFormat({
                'message': "Update Successfully"
            },null, 'users', 200));
        }catch (err) {
            winston.error((`${'path :' + __filename + ' ' + ': url :' + req.originalUrl} : ${err}`));
            return res.status(400).send(this.errorMsgFormat(err.message));
        }
    }
    async updateAdminNotification(req,res){
        try{
            let data = await userNotification.updateMany({requestBy:"ADMIN"},{is_active:false});
            return res.status(200).send(this.successFormat({
                'message': "Update Successfully"
            },null, 'users', 200));
        }catch (err) {
            winston.error((`${'path :' + __filename + ' ' + ': url :' + req.originalUrl} : ${err}`));
            return res.status(400).send(this.errorMsgFormat(err.message));
        }
    }
    async updateNotification(req,res){
        try{
            let data = await userNotification.findOneAndUpdate({_id:req.params.id},{is_active:false});
            return res.status(200).send(this.successFormat({
                'message': "Update Successfully"
            },null, 'users', 200));
        }catch (err) {
            winston.error((`${'path :' + __filename + ' ' + ': url :' + req.originalUrl} : ${err}`));
            return res.status(400).send(this.errorMsgFormat(err.message));
        }
    }
}

module.exports = new User;
