import validator from 'validator'
import { get } from './utils/env.js'

function getTrustProxies(key) {
  if (!process.env[key]) {
    return []
  }
  return process.env[key]
    .split(',')
    .map((p) => validator.trim(p))
    .filter((p) => validator.isIPRange(p) || validator.isIP(p))
}

function getUrl(key) {
  const url = get(key, '')
  if (validator.isURL(url)) {
    return validator.trim(url)
  }
  return ''
}

const config = {
  host: get('HOST', 'localhost'),
  port: get('PORT', 3000),
  db: get('MONGO_URL', 'mongodb://localhost:27017/odyssey-test'),
  secret: get('SECRET_KEY', ''),
  dockerNetwork: get('DOCKER_NETWORK', 'linux-odyssey-players'),
  isProduction: process.env.NODE_ENV === 'production',
  hostPwd: get('HOST_PWD', ''),
  containerExpiry: get('EXPIRY', 1000 * 60 * 60),
  sessionMaxAge: get('SESSION_MAX_AGE', 1000 * 60 * 60 * 24 * 7),
  google: {
    clientID: get('GOOGLE_CLIENT_ID', ''),
    clientSecret: get('GOOGLE_CLIENT_SECRET', ''),
  },
  github: {
    clientID: get('GITHUB_CLIENT_ID', ''),
    clientSecret: get('GITHUB_CLIENT_SECRET', ''),
  },
  trustedProxies: getTrustProxies('TRUSTED_PROXIES'),
  surveyUrl: getUrl('SURVEY_URL', ''),
  bugReportUrl: getUrl('BUG_REPORT_URL', ''),
  dockerImage: get('DOCKER_IMAGE', 'lancatlin/linux-odyssey'),

  mountQuest: get('MOUNT_QUEST', ''),
}

config.baseUrl = get('BASE_URL', `http://${config.host}:${config.port}`)

export default config
