const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
mongoose.Promise = Promise;
mongoose.connection.on('error', (err) => {
  console.log(`MongoDB connection error: ${err}`);
  process.exit(-1);
});

if (process.env.DEBUG === 'true') {
  mongoose.set('debug', true);
}
/**
* Connect to mongo db
*
* @returns {object} Mongoose connection
* @public
*/
exports.connect = () => {
  mongoose.Promise = global.Promise;
  //mongoose.connect(`mongodb://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_HOST}:${process.env.MONGODB_PORT}/${process.env.MONGODB_NAME}`,
   mongoose.connect(`mongodb://localhost:27017/admin`,

    {
      keepAlive: 1,
      useNewUrlParser: true,
      autoIndex: false,
      useFindAndModify: false,
      useCreateIndex: true
    });
  return mongoose.connection
};