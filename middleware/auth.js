const jwt = require("jsonwebtoken");

const auth = async (req, res, next) => {
  try {
    if (!req.headers.authorization) {
      throw new Error("No Auth headers provided!");
    }
    // if not 'Bearer $token' => token will be undef
    const token = req.headers.authorization.split(" ")[1];

    if (token && token.length) {
      const isCustomAuth = token.length < 500;
      let decodeData;
      if (isCustomAuth) {
        decodeData = jwt.verify(token, process.env.SECRET);
        req.userId = decodeData.id;
      } else {
        decodeData = jwt.decode(token);
        // чувствительная к регистру строка или URI, которая является уникальным идентификатором стороны,
        // о которой содержится информация в данном токене (subject).
        // Значения с этим ключом должны быть уникальны в контексте стороны, генерирующей JWT.
        req.userId = decodeData.sub;
      }
    } else {
      throw new Error("No token in headers provided!");
    }
    next();
  } catch (err) {
    console.log(err.message);
  }
};

module.exports = auth;
