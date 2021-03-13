const mongoose = require("mongoose");

const {
  Card,
  CodeCard,
  PictureCard,
  TheoryCard,
} = require("../models/card.js");
// const checkFileType = require("../utils/checkFileType.js");
// const { searchSmth } = require("../utils/AtlasSearch.js");

// new Date(+new Date() + 3600 * 24 * 1000);

// only after reviewed set LEARNED to true;
exports.getTodayCards = () => (req, res) => {
  const currentTime = +new Date();
  const query = Card.find({
    nextRepeatStart: { $lte: currentTime },
    learned: false,
    ownerId: req.userId,
  })
    // change to nextRepeatStart
    .sort({ createdAt: -1 });

  query
    .exec()
    .then(async (cards) => {
      let cardsToUpdateIds = [];
      for (let card in cards) {
        // // if forgot to learn or incorect answer -> set interval = 0
        if (cards[card].nextRepeatEnd < currentTime) {
          cardsToUpdateIds.push(cards[card]._id);
        }
      }

      if (cardsToUpdateIds.length) {
        let updateResult = await Card.updateMany(
          { _id: { $in: cardsToUpdateIds } },
          {
            $set: {
              currentInterval: 0,
              nextRepeatStart: currentTime,
              nextRepeatEnd: currentTime + 3600 * 24 * 1000,
            },
          }
        );
        // if number of updated cards is more than 0 => find that updated cards and update local cards set
        if (updateResult.nModified) {
          let updatedCards = await Card.find({
            _id: { $in: cardsToUpdateIds },
          });

          for (let card in cards) {
            for (let updatedCard of updatedCards) {
              if (cards[card]._id === updatedCard._id) {
                cards[card] = updatedCard;
              }
            }
          }
        }
      }
      res.status(200).json({
        success: true,
        cards,
      });
    })
    .catch((err) => res.status(500).send(err.message)); //(console.log(error)
};

exports.getSingleCard = () => async (req, res) => {
  try {
    let card = await Card.findOne({ _id: req.params.id });

    if (!card) {
      return res.status(401).send(`No card with id ${req.body.id} exists`);
    }
    res.status(200).json({
      success: true,
      card,
    });
  } catch (err) {
    console.log(err.message);
  }
};

// put (without args) only param :id
// get user answer and check if it correct -> and return result
exports.cardWasViewed = () => async (req, res) => {
  const currentTime = +new Date();
  // currentTime + currentInterval, currentTime + currentInterval + 1day,
  const { id } = req.params;
  const { answer } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id))
    return res.status(404).send(`No card with id: ${id}`);

  const card = await Card.findById(id);

  // TODO add !!!!(async)!!!! npm fuzzy-mathcing (distance > 0.9) => and then return correct answer
  let isAnswerCorrect = true;
  if (card.answer !== answer) {
    isAnswerCorrect = false;
    // TODO add fuzzy check
    card.currentInterval = 0;
    card.nextRepeatStart = currentTime;
    card.nextRepeatEnd = currentTime + 3600 * 24 * 1000;
  } else if (card.currentInterval === 64) {
    card.learned = true;
  } else {
    if (card.currentInterval === 0) {
      card.currentInterval = 1;
    } else {
      card.currentInterval *= 2;
    }
    card.nextRepeatStart = currentTime + card.currentInterval;
    card.nextRepeatEnd = currentTime + card.currentInterval + 3600 * 24 * 1000;
  }

  const updatedCard = await Card.findByIdAndUpdate(id, card, {
    new: true,
  });
  res.status(200).json({ updatedCard, isAnswerCorrect });
};

// factory function
const createCardFactory = (req, res) => {
  try {
    const { theme, topic, ownerName, urlSrc, _type } = req.body;
    // console.log(req._type);
    switch (_type) {
      case "code": {
        return new CodeCard({
          ownerId: req.userId,
          ownerName,
          topic,
          theme,
          urlSrc,
          code: req.body.code,
        });
      }
      case "picture": {
        return new PictureCard({
          ownerId: req.userId,
          ownerName,
          topic,
          theme,
          urlSrc,
          filename: req.file.filename,
          fileId: req.file.id,
          // createdAt: new Date().toISOString(),
        });
      }
      case "theory": {
        return new TheoryCard({
          ownerId: req.userId,
          ownerName,
          topic,
          theme,
          urlSrc,
          question: req.body.question,
          answer: req.body.answer,
        });
      }
      default:
        return res.status(400).send("No type of new Card provided");
    }
  } catch (error) {
    return res
      .status(400)
      .send(`Invalid card data provided!\nExactly: ${error.message}`);
  }
};

exports.createCard = () => async (req, res) => {
  // check for existing cards
  try {
    let card = await Card.findOne({ theme: req.body.theme });

    if (card) {
      return res.status(200).json({
        success: false,
        message: "Card with such theme already exists",
      });
    }
    // appropriate to req.body.type from front select which type of card create
    // TODO change to factory function

    let newCard = createCardFactory(req, res);
    if (newCard.save === void 0) {
      // it means we get res object and not card object
      return newCard;
    }

    let newCardSaved = await newCard.save();
    return res.status(201).json({
      success: true,
      card: newCardSaved,
    });
  } catch (error) {
    return res.status(500).send(error.message);
  }
};

exports.getCardPicture = (gfs) => (req, res) => {
  gfs.find({ filename: req.params.filename }).toArray((err, files) => {
    if (!files[0] || files.length === 0) {
      return res.status(200).json({
        success: false,
        message: "No files available",
      });
    }

    if (
      files[0].contentType === "image/jpeg" ||
      files[0].contentType === "image/gif" ||
      files[0].contentType === "image/jpg" ||
      files[0].contentType === "image/png" ||
      files[0].contentType === "image/svg"
    ) {
      return gfs.openDownloadStreamByName(req.params.filename).pipe(res);
    } else {
      return res
        .status(400)
        .send(`Not an image file: (${files[0].contentType})`);
    }
  });
};

const updateCardFactory = (req, res, cardId) => {
  try {
    // _type will be setled from existing card (we get it after creation with other fields) TODO check if it has exactly '_type' attribute , not '__t'
    const { theme, topic, urlSrc, _type } = req.body;
    switch (_type) {
      case "code": {
        return {
          topic,
          theme,
          urlSrc,
          code: req.body.code,
          _id: cardId,
          _type,
        };
      }
      case "picture": {
        return {
          topic,
          theme,
          urlSrc,
          filename: req.file ? req.file.filename : void 0,
          fileId: req.file ? req.file.id : void 0,
          _id: cardId,
          _type,
          // createdAt: new Date().toISOString(),
        };
      }
      case "theory": {
        return {
          topic,
          theme,
          urlSrc,
          question: req.body.question,
          answer: req.body.answer,
          _id: cardId,
          _type,
        };
      }
      default:
        // if no type of card proivided we should be
        return res
          .status(400)
          .send(`Not an image file: (${files[0].contentType})`);
    }
  } catch (error) {
    return res
      .status(400)
      .send(`Invalid card data provided!\nExactly: ${error.message}`);
  }
};

const typesModelsRelation = {
  code: CodeCard,
  picture: PictureCard,
  theory: TheoryCard,
};

const fundByIdAndUpdateFactory = async (modelMapping, id, updatedFields) => {
  for (let type in modelMapping) {
    if (type === updatedFields._type) {
      return await modelMapping[type].findByIdAndUpdate(id, updatedFields, {
        new: true,
      });
    }
  }
  // no error possible ( case we check types before)
};

exports.updateCard = () => async (req, res) => {
  // check for existing cards
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(404).send(`No card with id: ${id}`);

    // console.log(req.body);
    let updatedCardFields = updateCardFactory(req, res, id);
    // console.log(updatedCardFields);

    let updatedCard = await fundByIdAndUpdateFactory(
      typesModelsRelation,
      id,
      updatedCardFields
    );

    // console.log(updatedCard);
    res.json(updatedCard);
  } catch (error) {
    return res.status(500).send(error.message);
  }
};

exports.deleteCard = (gfs) => async (req, res) => {
  const card = await Card.findOne({ _id: req.params.id });
  // notsuch card
  if (!card) return res.status(404).send("No Card with such id");
  // ~req.headers["content-type"].indexOf("multipart/form-data")
  if (card._type === "picture") {
    try {
      let result = await new Promise((resolve, reject) => {
        gfs.delete(new mongoose.Types.ObjectId(card.fileId), (err, data) => {
          if (err) {
            reject(new Error(err));
          }
          resolve(data);
        });
      });
    } catch (err) {
      console.log(err);
      return res.status(404).send("No file for card with such fileId");
    }
  }
  try {
    let resCardDeletion = await Card.deleteOne({ _id: req.params.id });
    return res.status(200).json({
      success: true,
      message: `Card with ID ${req.params.id} is deleted`,
      _id: req.params.id,
    });
  } catch (error) {
    // if we find file and do not card of this file -> there is a cruel error
    // or if we find card and cant delete it ( it scary too )
    if (error) return res.status(500).send(error.message);
  }
};
