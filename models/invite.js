const mongoose = require("mongoose");

const inviteSchema = mongoose.Schema({
  //  if email exists => res.status(404).send('Invitation was already sent')
  email: { type: String, required: true, unique: true },
  inviteJWT: String,
});

module.exports = mongoose.model("Invitaion", inviteSchema);
