const db = require('../models');
const jwt = require('jsonwebtoken');

exports.signin = async function(req, res, next) {
  try {
    let user = await db.User.findOne({
      username: req.body.username
    });
    let { id, username, number } = user
    let isMatch = await user.comparePassword(req.body.password);
    if(isMatch) {
      let token = jwt.sign({
        id,
        username
      },
        process.env.SECRET_KEY
      );
      return res.status(200).json({
        id,
        username,
        token,
        number
      })
    } else {
      return next({
        status: 400,
        message: 'Invalid Username/Password'
      });
    }
  } catch(err) {
    return next({
      status: 400,
      message: 'Invalid Username/Password'
    });
  }
};

exports.signup = async function(req, res, next) {
  try {
    let user = await db.User.create(req.body);
    let {id, username, number} = user;
    let token = jwt.sign({
      id,
      username
    },
      process.env.SECRET_KEY
    );
    return res.status(200).json({
      id,
      username,
      number,
      token
    });
  } catch(err) {
    //If validation fails
    if(err.code === 11000) {
      err.message = 'Sorry that username is taken';
    }
    return next({
      status: 400,
      message: err.message
    })
  }
};

exports.findUser = async function(req, res, next) {
  try {
    let user = await db.User.findOne({
      username: req.body.username
    });

    let { username } = user;

    return res.status(200).json({
      username
    });

  } catch(err) {
    return next({
      status: 400,
      message: 'Cannot find that user'
    })
  }
};
