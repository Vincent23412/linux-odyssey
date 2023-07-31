/* eslint-disable import/prefer-default-export */
export function get(key, defaultValue) {
  const value = process.env[key]
  if (value != null) {
    return value
  }
  return defaultValue
}