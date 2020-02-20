// If forked as child, send output message via ipc to parent, otherwise output to console
const logMessage = process.send ? process.send : console.log

process.on('unhandledRejection', (err) => {
  logMessage(`Unhandled rejection: ${err.message}`)
  process.exit(1)
})

const server = require('./lib')

server()
