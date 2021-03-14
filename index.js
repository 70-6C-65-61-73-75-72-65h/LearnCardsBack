const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const GridFsStorage = require("multer-gridfs-storage");
const multer = require("multer");
const crypto = require("crypto");
const metodOverride = require("method-override");
const dotenv = require("dotenv");
const path = require("path");

const userRouter = require("./routes/user");

dotenv.config();

const app = express();

app.use(cors({ origin: process.env.ALLOWED_CROSS_ORIGIN }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(metodOverride("_method"));

app.use("/user", userRouter);

const CONNECTION_URL = process.env.CONNECTION_MONGO_URL;
const PORT = process.env.PORT || 5000;

const storage = new GridFsStorage({
  url: CONNECTION_URL,
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buf) => {
        if (err) return reject(err);
        const filename = buf.toString("hex") + path.extname(file.originalname);
        const fileInfo = {
          filename,
          bucketName: process.env.BUCKET_NAME,
        };
        resolve(fileInfo);
      });
    });
  },
});

const upload = multer({
  storage,
  fileFilter: function (req, file, callback) {
    var ext = path.extname(file.originalname);
    if (
      ext !== ".png" &&
      ext !== ".jpg" &&
      ext !== ".gif" &&
      ext !== ".jpeg" &&
      ext !== ".svg"
    ) {
      return callback(new Error("Only images are allowed"));
    }
    callback(null, true);
  },
  limits: {
    fileSize: 1024 * 1024,
  },
});

const connectionParams = [
  CONNECTION_URL,
  {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useCreateIndex: true,
  },
];

mongoose
  .connect(...connectionParams)
  .then(() => {
    const connect = mongoose.createConnection(...connectionParams);

    let gfs;

    connect.once("open", () => {
      gfs = new mongoose.mongo.GridFSBucket(connect.db, {
        // chunkSizeBytes: 25588946,
        bucketName: process.env.BUCKET_NAME,
      });

      app.use("/cards", require("./routes/cards")(upload, gfs));

      app.listen(PORT, () => console.log(`Server Running on Port: ${PORT}`));
    });
  })
  .catch((error) => console.log(`${error} did not connect`));

mongoose.set("useFindAndModify", false);
