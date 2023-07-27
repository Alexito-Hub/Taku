const fs = require('fs');
const path = require('path');

const commands = {};

function loadCommands() {
  const cmdFolderPath = path.join(__dirname, 'cmd');
  const commandFiles = getAllCommandFiles(cmdFolderPath);
  for (const file of commandFiles) {
    const commandPath = path.join(cmdFolderPath, file);
    const command = require(commandPath);
    if (typeof command.name === 'string' && typeof command.execute === 'function') {
      commands[command.name] = command.execute;
    }
  }
}

function execute(client, from, commandString, sender, publicBot, owner, vidaMessage, allRight) {
  const [commandName, ...args] = commandString.trim().split(' ');
  // ...
}

function getAllCommandFiles(folderPath) {
  const files = fs.readdirSync(folderPath);
  let result = [];
  for (const file of files) {
    const filePath = path.join(folderPath, file);
    const stat = fs.statSync(filePath);
    if (stat.isFile() && file.endsWith('.js')) {
      result.push(file);
    } else if (stat.isDirectory()) {
      result = result.concat(getAllCommandFiles(filePath));
    }
  }
  return result;
}

function execute(client, from, sender, publicBot, owner, vidaMessage, allRight) {
  const [commandName, ...args] = commandString.trim().split(' ');
  const commandFunction = commands[commandName];
  if (commandFunction) {
    commandFunction(client, from, body,  sender, publicBot, owner, vidaMessage, allRight, ...args);
  } else {
    console.log(`Comando desconocido: ${commandName}`);
  }
}

loadCommands()

module.exports = {
    execute,
};

      
