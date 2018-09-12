const express = require('express');
const router = express.Router();
const { signup, signin, findUser } = require('../handlers/auth');

router.post('/signup', signup);
router.post('/signin', signin);
router.post('/finduser', findUser);

module.exports = router;
