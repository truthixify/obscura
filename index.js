const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const Account = require("./models/Account");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB
const mongoURI = process.env.MONGO_URI;
mongoose
  .connect(mongoURI, {
    dbName: "obscura",
    bufferCommands: false,
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// POST endpoint to add new account
app.post("/api/account", async (req, res) => {
  try {
    const { owner, address } = req.body;
    if (!owner || !address) {
      return res.status(400).json({ error: "Invalid input data" });
    }
    const newAccount = new Account({ owner, address });
    await newAccount.save();
    res.status(201).json(newAccount);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET endpoint to fetch a single data document by ID
app.get("/api/account/:id", async (req, res) => {
  try {
    const account = await Account.findById(req.params.id);
    if (!account) {
      return res.status(404).json({ error: "Account not found" });
    }
    res.json(account);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/account", async (req, res) => {
  try {
    const { address, owner } = req.query;

    if (!address && !owner) {
      return res
        .status(400)
        .json({ error: "Provide address or owner to search" });
    }

    // Find one document matching either address or owner
    const query = {};
    if (address) query.address = address;
    if (owner) query.owner = owner;

    const account = await Account.findOne(query);

    if (!account) {
      return res.status(404).json({ error: "Account not found" });
    }

    res.json(account);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/build-typed-data", async (req, res) => {
  try {
    const { userAddress, calls } = req.body;

    const response = await axios.post(
      "https://starknet.api.avnu.fi/paymaster/v1/build-typed-data",
      JSON.stringify({
        userAddress,
        gasTokenAddress: null,
        maxGasTokenAmount: null,
        accountClassHash: null,
        calls,
      }),
      {
        headers: { "api-key": process.env.PAYMASTER_API_KEY, "Content-Type": "application/json", },
      },
    );

    console.log("Typed Data:", response.data);
    res.json(response.data);
  } catch (error) {
    console.error(
      "Error building typed data:",
      error.response?.data || error.message,
    );
    res.status(500).json({ error: "Failed to execute transaction" });
  }
});

// POST /api/execute-sponsored
app.post("/api/execute-sponsored", async (req, res) => {
  try {
    const { userAddress, typedData, signature } = req.body;

    const response = await axios.post(
      "https://starknet.api.avnu.fi/paymaster/v1/execute",
      {
        userAddress,
        typedData,
        signature,
      },
      {
        headers: { "api-key": process.env.PAYMASTER_API_KEY, "Content-Type": "application/json", },
      },
    );

    console.log("Sponsored Transaction Hash:", response.data.transactionHash);
    res.json(response.data);
  } catch (error) {
    console.error(
      "Error executing sponsored transaction:",
      error.response?.data || error.message,
    );
    res.status(500).json({ error: "Failed to execute transaction" });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
