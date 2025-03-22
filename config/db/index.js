const mongoose = require('mongoose')
require('dotenv').config()

async function connect() {

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connect succesfully!!!')
  } catch (error) {
    console.log('Connect failure!!!')
  }

}

module.exports = { connect }