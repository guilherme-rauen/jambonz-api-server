const config = require('config');
const opts = Object.assign({
  timestamp: () => {return `, "time": "${new Date().toISOString()}"`;}
}, config.get('logging'));
const logger = require('pino')(opts);
const express = require('express');
const app = express();
const cors = require('cors');
const passport = require('passport');
const authStrategy = require('./lib/auth')(logger);
const routes = require('./lib/routes');
const {retrieveCall, deleteCall, listCalls} = require('jambonz-realtimedb-helpers')(config.get('redis'), logger);
const PORT = process.env.HTTP_PORT || 3000;

passport.use(authStrategy);

app.locals = app.locals || {};
Object.assign(app.locals, {
  logger,
  retrieveCall,
  deleteCall,
  listCalls
});

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/v1', passport.authenticate('bearer', { session: false }));
app.use('/', routes);
app.use((err, req, res, next) => {
  logger.error(err, 'burped error');
  res.status(err.status || 500).json({msg: err.message});
});
logger.info(`listening for HTTP traffic on port ${PORT}`);
app.listen(PORT);

module.exports = app;
