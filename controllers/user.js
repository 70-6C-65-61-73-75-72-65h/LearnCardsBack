const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const UserModel = require("../models/user");

exports.signin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const existingUser = await UserModel.findOne({ email });

    if (!existingUser)
      // return res.status(404).json({ message: "User does not exist" });
      return res.status(404).send("User does not exist");

    const isPswdCorrect = await bcrypt.compare(password, existingUser.password);
    if (!isPswdCorrect) return res.status(400).send("Invalid credentials");
    // return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { email: existingUser.email, id: existingUser._id },
      process.env.SECRET,
      { expiresIn: "2h" }
    );

    res.status(200).json({ result: existingUser, token });
  } catch (err) {
    res.status(500).send("SignIn Server Error");
  }
};

exports.signup = async (req, res) => {
  const { email, password, firstName, lastName } = req.body;

  try {
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) return res.status(400).send("User already exists");
    const hashedPswd = await bcrypt.hash(password, 12);
    const result = await UserModel.create({
      email,
      password: hashedPswd,
      name: `${firstName} ${lastName}`,
    });

    const token = jwt.sign(
      { email: result.email, id: result._id },
      process.env.SECRET,
      {
        expiresIn: "2h",
      }
    );
    res.status(201).json({ result, token });
  } catch (error) {
    console.log(error);
    res.status(500).send("SignUp Server Error");
  }
};
