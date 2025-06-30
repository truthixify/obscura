const express = require('express')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const Account = require('./models/Account')
const dotenv = require('dotenv')

dotenv.config()

const app = express()
const port = process.env.PORT || 3000

app.use(bodyParser.json())

// Connect to MongoDB
const mongoURI = process.env.MONGO_URI
mongoose
    .connect(mongoURI, {
        dbName: 'obscura',
        bufferCommands: false
    })
    .then(() => console.log('✅ MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err))

// POST endpoint to add new account
app.post('/account', async (req, res) => {
    try {
        const { blockNumber, owner, address } = req.body
        if (typeof blockNumber !== 'number' || !owner || !address) {
            return res.status(400).json({ error: 'Invalid input data' })
        }
        const newAccount = new Account({ blockNumber, owner, address })
        await newAccount.save()
        res.status(201).json(newAccount)
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

// GET endpoint to fetch a single data document by ID
app.get('/account/:id', async (req, res) => {
    try {
        const data = await Account.findById(req.params.id)
        if (!data) {
            return res.status(404).json({ error: 'Account not found' })
        }
        res.json(data)
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

app.get('/account', async (req, res) => {
    try {
        const { address, owner } = req.query

        if (!address && !owner) {
            return res.status(400).json({ error: 'Provide address or owner to search' })
        }

        // Find one document matching either address or owner
        const query = {}
        if (address) query.address = address
        if (owner) query.owner = owner

        const account = await Account.findOne(query)

        if (!account) {
            return res.status(404).json({ error: 'Account not found' })
        }

        res.json(account)
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`)
})
