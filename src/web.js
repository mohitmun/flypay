// const express = require('express')
// const app = express()
// const IdService = require('./lib/IdService')
// app.get('/', function (req, res) {
//   res.send('Hello World!')
// })

// app.get('/send_message', function (req, res) {
//   console.log("paeams: " + req.query)
//   console.log(req.query)
//   IdService.getUser(req.query.username).then((user) => { appbot.send(user.token_id, req.query.message) });
//   // bot.client.send(userID, message)
//   res.send('Hello World!')
// })

// app.listen(8000, function () {
//   console.log('Example app listening on port 8000!')
// })

// module.exports = function (bot) {
//   let appbot = bot;
//   console.log("bot:")
//   console.log(bot)
// }