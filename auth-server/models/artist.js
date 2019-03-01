const mongoose = require('mongoose');
const User = require('./user');

const artistSchema = new mongoose.Schema({
  name: {
    type: String,
    required: 'Name cannot be blank'
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }
}, {
  timestamps: true
});

const Artist = mongoose.model('Artist', artistSchema);

module.exports = Artist;
