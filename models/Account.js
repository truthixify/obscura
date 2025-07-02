const mongoose = require('mongoose')

const AccountSchema = new mongoose.Schema(
    {
        owner: {
            type: String,
            required: true,
            unique: true,
        },
        address: {
            type: String,
            required: true,
            unique: true,
        }
    },
    { timestamps: true }
)

module.exports = mongoose.model('Account', AccountSchema)
