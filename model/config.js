const mongoose = require("mongoose");
const connect = mongoose.connect("mongodb://localhost:27017/express");

connect.then(() => {
  console.log("DataBase Connected Succesfully");
});

const logInSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
  created: {
    type: Date,
    default: Date.now(),
  },
  block: {
    type: Boolean,
    default: false,
  },
});

const collection = new mongoose.model("users", logInSchema);
module.exports = collection;
