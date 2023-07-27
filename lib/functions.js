const fs = require('fs')
const path = require('path')
const cfonts = require('cfonts')
const axios = require('axios')

const title = cfonts.render(('Mochi Bot'), {
    font: 'block',
    color: 'candy',
    align: 'center',
    gradient: ["red","yellow"],
    lineHeight: 3
}).string;

const subtitle = cfonts.render(('ALL RIGHTS RESERVED @ALEXITO ENTERTAINMENT'), {
    font: 'console',
    color: 'white',
    align: 'center',
    gradient: false,
    lineHeight: 2
}).string;

const banner = title + subtitle

const spinnerFrames = [
  "🕐",
  "🕑",
  "🕒",
  "🕓",
  "🕔",
  "🕕",
  "🕖",
  "🕗",
  "🕘",
  "🕙",
  "🕚",
  "🕛"
];

let globalSpinner;
const getGlobalSpinner = () => {
  if(!globalSpinner) {
    let currentFrame = 0;
    let interval;
    globalSpinner = {
      start: (text) => {
        process.stdout.write(text + ' ' + spinnerFrames[currentFrame]);
        interval = setInterval(() => {
          process.stdout.clearLine();
          process.stdout.cursorTo(0);
          currentFrame = (currentFrame + 1) % spinnerFrames.length;
          process.stdout.write(text + ' ' + spinnerFrames[currentFrame]);
        }, 120);
      },
      succeed: (text) => {
        clearInterval(interval);
        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        console.log(text);
      }
    }
  }
  return globalSpinner;
}

function splitMessage(text, limit) {
  const chunks = [];
  while (text.length > 0) {
    if (text.length <= limit) {
      chunks.push(text);
      break;
    }
    const currentChunk = text.slice(0, limit);
    chunks.push(currentChunk);
    text = text.slice(limit);
  }
  return chunks;
}


module.exports = {
    splitMessage,
    banner,
    getGlobalSpinner
}
