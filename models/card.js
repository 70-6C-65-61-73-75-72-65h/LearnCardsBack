const mongoose = require("mongoose");
const options = { discriminatorKey: "_type" };
const cardSchema = new mongoose.Schema(
  {
    createdAt: {
      default: Date.now(),
      type: Date,
    },

    nextRepeatStart: {
      default: +Date.now(),
      type: Number,
    },
    nextRepeatEnd: {
      default: +Date.now() + 3600 * 24 * 1000,
      type: Number,
    },
    currentInterval: {
      default: 0,
      type: Number,
    },
    learned: {
      default: false,
      type: Boolean,
    },

    ownerId: {
      required: true,
      type: String,
    },
    ownerName: {
      required: true,
      type: String,
      trim: true,
    },
    topic: {
      required: true,
      type: String,
    },
    theme: {
      required: true,
      type: String,
    },
    urlSrc: {
      required: true,
      type: String,
    },
  },
  options
);

const CardModel = mongoose.model("Card", cardSchema);

const codeCardSchema = CardModel.discriminator(
  "code",
  new mongoose.Schema(
    {
      code: {
        required: true,
        type: String,
      },
    },
    options
  )
);

const pictureCardSchema = CardModel.discriminator(
  "picture",
  new mongoose.Schema(
    {
      filename: {
        required: true,
        type: String,
      },
      fileId: {
        required: true,
        type: String,
      },
    },
    options
  )
);

const theoryCardSchema = CardModel.discriminator(
  "theory",
  new mongoose.Schema(
    {
      question: {
        required: true,
        type: String,
      },
      answer: {
        required: true,
        type: String,
      },
    },
    options
  )
);

module.exports = {
  Card: CardModel,
  CodeCard: codeCardSchema,
  PictureCard: pictureCardSchema,
  TheoryCard: theoryCardSchema,
};
