const mongoose = require('mongoose');

const Schema = mongoose.Schema;

var User = new Schema({
    chat: {
        type: String,
        required: true,
    },
    wallet: {
        address:{
            type:String,
            default: ''
        },
        public: {
            type:String,
            default: ''
        },
        private:{
            type: String,
            default:''
        }
    }
})

module.exports = mongoose.model('User', User);