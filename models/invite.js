const mongoose = require("mongoose");

// new
const inviteSchema = mongoose.Schema({
  //  if email exists => res.status(404).json({message: 'Invitation was already sent'})
  email: { type: String, required: true, unique: true },
  inviteJWT: String,
});

module.exports = mongoose.model("Invitaion", inviteSchema);
