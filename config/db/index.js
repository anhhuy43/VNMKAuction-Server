const mongoose = require('mongoose')

async function connect() {

  try {
    await mongoose.connect('mongodb+srv://anhhuy:knK9PpI3WLAEtvvj@vnmk.rn2rdvk.mongodb.net/VNMK?retryWrites=true&w=majority&appName=VNMK');
    console.log('Connect succesfully!!!')
  } catch (error) {
    console.log('Connect failure!!!')
  }

}

module.exports = { connect }