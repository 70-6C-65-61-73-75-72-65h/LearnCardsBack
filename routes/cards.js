const express = require("express");

const {
  createCard, // uploadSingleFile
  getTodayCards, //
  getSingleCard,
  cardWasViewed,
  deleteCard, // deleteFile
  updateCard, // changin lyrics or etc
  getCardPicture, // = to render image
  //   getCardsByTag,
} = require("../controllers/cards.js");

const router = express.Router();
const auth = require("../middleware/auth.js");

const CardRouter = (upload, gfs) => {
  // collection
  router.post("/", upload.single("picture"), auth, createCard()); //+
  router.get("/", auth, getTodayCards()); // +
  router.get("/:id", auth, getSingleCard()); // +
  router.patch("/checked/:id", auth, cardWasViewed()); // +
  router.patch("/update/:id", upload.single("picture"), auth, updateCard()); // +
  router.delete("/delete/:id", auth, deleteCard(gfs)); // +
  router.get("/file/:filename", getCardPicture(gfs)); // +

  return router;
};

module.exports = CardRouter;
