/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
const readline = require('readline')

const RETURN_SYMBOL = '\u21B5'

// ANSI color map
const ANSI_COLORS = {
  black: 30,
  red: 31,
  green: 32,
  yellow: 33,
  blue: 34,
  magenta: 35,
  cyan: 36,
  white: 37,
}

function colorize(content, color) {
  const colorCode = ANSI_COLORS[color]
  if (!colorCode) return content
  return `\x1b[${colorCode}m${content}\x1b[0m`
}

process.stdin.setRawMode(true)

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
})

function waitForEnter() {
  return new Promise((resolve) => {
    rl.once('line', resolve)
  })
}

function isCodeColor(text, isCode) {
  if (text === '`') {
    return !isCode
  }
  return isCode
}

function printLine(content, delay, color) {
  const printContent = `${colorize(content, color)}${RETURN_SYMBOL}`
  let isCode = false
  return new Promise((resolve) => {
    let i = 0
    const timer = setInterval(() => {
      isCode = isCodeColor(printContent[i], isCode)
      if (isCode) {
        process.stdout.write(colorize(printContent[i], 'green'))
      } else {
        process.stdout.write(printContent[i])
      }
      i += 1
      if (i >= printContent.length) {
        clearInterval(timer)
        process.stdout.write('\n')
        resolve()
      }
    }, delay)

    waitForEnter().then(() => {
      clearInterval(timer)
      if (i >= printContent.length) return
      process.stdout.write(printContent.slice(i))
      process.stdout.write('\n')
      resolve()
    })
  })
}

async function printResponses(responses, delay = 100) {
  console.log()
  console.log(colorize('==============================', 'green'))
  for (const response of responses) {
    const { type, content, speaker, color } = response
    if (type === 'narrative') {
      for (const line of content) {
        await printLine(line, delay, color || 'cyan')
      }
    }
    if (type === 'dialogue') {
      console.log(colorize(`${speaker}:`, 'green'))
      for (const line of content) {
        await printLine(`  ${line}`, delay, color || 'cyan')
      }
    }
    console.log(colorize('------------------------------', 'green'))
    console.log()
  }
}

async function printHints(hints, delay = 100) {
  for (const hint of hints) {
    await printLine(hint, delay, 'yellow')
  }
}

module.exports = {
  printResponses,
  printHints,
  colorize,
}
