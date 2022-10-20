
const mongoose = require('mongoose');
require('mongoose-type-url')

let schema = new mongoose.Schema({
    user_id: { type: String, default: 0, unique: true, index: true },
    email: {
        type: String,
        required: [true, 'Your email cannot be blank.'],
        lowercase: true,
        unique: true,
        index: true
    },
    //mobile: { type: String, default: null, unique: true },
    password: {
        type: String,
        required: [true, 'Your password cannot be blank.'],
        index: true
    },
    username: { type: String, required: true },
    is_active: { type: String, default: true },
    role: { type: Number, required: true },   // 1 --> Vendor 2 --> Management User 3 --> Buyer 
    login_time: { type: Date },
    logout_time: { type: Date }
}, {
    timestamps: { createdAt: 'created_date', updatedAt: 'modified_date_time' }
});
let users = mongoose.model('users', schema);
users.createIndexes();
exports.users = users;


let tokenSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'admin-users', index: true },
    token: { type: String, index: true },
    is_deleted: { type: Boolean, default: false }
},
    {
        timestamps: { createdAt: 'created_date', updatedAt: 'modified_date_time' }
    });
let tokens = mongoose.model('authorization-token', tokenSchema);
tokens.createIndexes();
exports.tokens = tokens;


const hashSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'admin-users', index: true },
    email: { type: String, required: true, index: true },
    hash: { type: String, required: true, index: true },
    type_for: { type: String, required: true, index: true },
    is_active: { type: Boolean, default: false, index: true }
}, {
    timestamps: { createdAt: 'created_date', updatedAt: 'modified_date_time' }
});

let hashes = mongoose.model('authorization-hash', hashSchema)
hashes.createIndexes()
exports.hashes = hashes;





