const mongoose = require('mongoose')

const AccountSchema = new mongoose.Schema(
    {
        blockNumber: {
            type: Number,
            required: true,
        },
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
