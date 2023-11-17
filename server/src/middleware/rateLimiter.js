import rateLimit from 'express-rate-limit'
import config from '../config.js'

function createRateLimiter(options) {
  if (config.testing.enabled) {
    return (req, res, next) => next()
  }
  return rateLimit(options)
}

export const globalRateLimit = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
})

export const authenticateRateLimit = createRateLimiter({
  windowMs: 2 * 60 * 1000,
  max: 5,
})

export const sessionRateLimit = createRateLimiter({
  windowMs: 10 * 1000,
  max: 1,
  keyGenerator: (req) => {
    return req.user ? req.user._id : req.ip
  },
})
