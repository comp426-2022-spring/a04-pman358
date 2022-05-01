const express = require('express')
const morgan = require('morgan')
const app = express()
const fs = require('fs')
const db = require('./database.js')
const args = require('minimist')(process.argv.slice(2))
args['port']
const port = args.port || process.env.PORT || 5000

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const help = (`
    server.js [options]
    --port, -p	Set the port number for the server to listen on. Must be an integer
                between 1 and 65535.
    --debug, -d If set to true, creates endlpoints /app/log/access/ which returns
                a JSON access log from the database and /app/error which throws 
                an error with the message "Error test successful." Defaults to 
                false.
    --log		If set to false, no log files are written. Defaults to true.
                Logs are always written to database.
    --help, -h	Return this message and exit.
`)

if(args.help || args.h) {
  console.log(help)
  process.exit(0)
}

if (args.log == 'false') {
  console.log("Not working")
} else {
  const accessLog = fs.createWriteStream('access.log', { flags: 'a' })
  app.use(morgan('combined', { stream: accessLog }))
}

app.use((req, res, next) => {
  let logdata = {
      remoteaddr: req.ip,
      remoteuser: req.user,
      time: Date.now(),
      method: req.method,
      url: req.url,
      protocol: req.protocol,
      httpversion: req.httpVersion,
      status: res.statusCode,
      referrer: req.headers['referer'],
      useragent: req.headers['user-agent']
  };
  const stmt = db.prepare('INSERT INTO accesslog (remoteaddr, remoteuser, time, method, url, protocol, httpversion, status, referrer, useragent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
  const info = stmt.run(logdata.remoteaddr, logdata.remoteuser, logdata.time, logdata.method, logdata.url, logdata.protocol, logdata.httpversion, logdata.status, logdata.referrer, logdata.useragent)
})

if (args.debug || args.d) {
  app.get('/app/log/access/', (req, res) => {
      const stmt = db.prepare("SELECT * FROM accesslog").all();
    res.status(200).json(stmt);
  })

  app.get('/app/error/', (req, res) => {
      throw new Error('Error, test works.')
  })
}

const server = app.listen(port, () => {
    console.log(`App is running on port ${port}`)
})

app.get('/app/', (req, res) => {
    res.status(200).end('OK') 
})

app.get('/app/flip/', (req, res) => {
    flip = coinFlip()
    res.status(200).json({"flip":flip})
})

app.get('/app/flips/:number', (req, res) => {
    flips = coinFlips(req.params.number)
    res.status(200).json({"raw":flips, "summary":countFlips(flips)})
})

app.get('/app/flip/call/heads', (req, res) => {
    flip = flipACoin("heads")
    res.status(200).json(flip)
})

app.get('/app/flip/call/tails', (req, res) => {
    flip = flipACoin("tails")
    res.status(200).json(flip)
})

function coinFlip() {
    return (Math.floor(Math.random() * 2) == 0) ? 'heads' : 'tails';
}

function coinFlips(flips) {
    let flippedCoins = [];
    if(flips < 1 || typeof flips == 'undefined'){
      flips = 1
    }
    for(let i=0; i<flips; i++) {
      flippedCoins.push(coinFlip())
    }
    return flippedCoins
}

function countFlips(array) {
    let head = 0;
    let tail = 0;
    for(let i=0; i < array.length; i++) {
      if(array[i] == 'heads') {
        head++;
      }
      else {tail++;}
    }
    return {heads: head, tails: tail}
}

function flipACoin(call) {
    let result = coinFlip()
    let guess = ' '
    if(result == call) {
      guess = 'win' 
    }
    else {
      guess = 'lose' 
    }
    return {call: call, flip: result, result: guess}
}

app.use(function(req, res) {
    res.status(404).send("404 NOT FOUND")
    res.type("text/plain")
})