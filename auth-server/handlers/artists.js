const db = require('../models');

exports.createArtist = async function(req, res, next) {
  try {
    let artist = await db.Artist.create({
      name: req.body.name
    });
    let foundUser = await db.User.findById(req.params.id);
    let foundArtist = await db.Artist.findById(artist._id);
    foundUser.artists.push(foundArtist);
    await foundUser.save();
    return res.status(200).json(foundArtist);
  } catch(err) {
    return next(err);
  }
};

exports.getArtist = async function(req, res, next) {
  try{
    let foundArtist = await db.Artist.findById(req.params.artist_id);
    res.status(200).json(foundArtist);
  } catch(err) {
    return next(err);
  }
};

exports.deleteArtist = async function(req, res, next) {
  try {
    let foundUser = await db.User.findById(req.params.id);
    foundUser.artists = foundUser.artists.filter(artist => {
      return artist._id != req.params.artist_id;
    });
    await foundUser.save();
    let foundArtist = await db.Artist.findByIdAndDelete(req.params.artist_id);
    return res.status(200).json(foundArtist);
  } catch(err) {
    return next(err);
  }
};
