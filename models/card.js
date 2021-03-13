const mongoose = require("mongoose");
// extend = require("mongoose-schema-extend");

const options = { discriminatorKey: "_type" };

// new
// ownerId, ownerName, topic, theme, urlSrc
const cardSchema = new mongoose.Schema(
  {
    // _type: {
    //   type: String,
    //   required: true,
    // },
    createdAt: {
      default: Date.now(),
      type: Date,
    },

    nextRepeatStart: {
      // save as timestamp (not date string)
      // required: true,
      default: +Date.now(),
      type: Number,
    },
    nextRepeatEnd: {
      // save as timestamp (not date string)
      // required: true,
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
  // { discriminatorKey: "_type" }
  // { collection: "card"  }
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
  //   create code // picture // theory -> but find in Card.find({_type:correctType})  or all types and then sort by types
  CodeCard: codeCardSchema, //mongoose.model("CodeCard", codeCardSchema),
  PictureCard: pictureCardSchema, //mongoose.model("PictureCard", pictureCardSchema),
  TheoryCard: theoryCardSchema, //mongoose.model("TheoryCard", theoryCardSchema),
};

// card => topic, theme, urlSrc, createdAt, owner

// code -> code
// picture -> pictureName, pictureId // or filename fileId
// theory -> question, answer
