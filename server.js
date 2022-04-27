const express = require('express')
const morgan = require('morgan')
const app = express()
const fs = require('fs')
const args = require('minimist')(process.argv.slice(2))
args['port']
const port = args.port || process.env.PORT || 5000

if (args.help || args.h) {
    console.log(`
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
    process.exit(0)
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