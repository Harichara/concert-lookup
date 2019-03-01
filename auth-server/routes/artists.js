const express = require('express');
const router = express.Router({mergeParams: true});
const db = require('../models');
const { createArtist, getArtist, deleteArtist } = require('../handlers/artists');

router.route('/').post(createArtist);

router.route('/:artist_id').get(getArtist).delete(deleteArtist);

module.exports = router;
