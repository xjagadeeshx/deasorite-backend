const express    = require('express');
const config     = require('config');
const bodyParser = require('body-parser');
const compress   = require('compression');
const cors       = require('cors');
const helmet     = require('helmet');
const routes     = require('../router');
const i18n       = require('i18n-nodejs');
const fs         = require('fs')

const app        = express();
// error log 
require('./winston');

// const corsOptions = {
//   origin: 'http://localhost:3000',
//   optionsSuccessStatus: 200 
// }

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true}));

// gzip compression
app.use(compress());

// secure apps by setting various HTTP headers
app.use(helmet());

// enable CORS - Cross Origin Resource Sharing
app.use(cors());

// mount api v1 routes with multi language features
app.use(`/api/${config.get('site.version')}`, cors() , (req, res, next) => {
  console.log('in api v1')
  next();
  }, routes);

module.exports = app;