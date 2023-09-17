import session from 'express-session'
import MongoStore from 'connect-mongo'

import config from '../config.js'

export default (db) => {
  console.log(db.constructor.name)
  return session({
    secret: config.jwtSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
    },
    store: MongoStore.create({
      mongoUrl: config.db,
      collectionName: 'loginSessions',
    }),
  })
}
