const Bot = require('./lib/Bot')
let bot = new Bot()
const SOFA = require('sofa-js')
const Fiat = require('./lib/Fiat')
const express = require('express')
const app = express()
const IdService = require('./lib/IdService')
// const Web = require('./web.js')(bot)

app.get('/', function (req, res) {
  res.send('Hello World!')
})

app.get('/send_message', function (req, res) {
  console.log("paeams: " + req.query)
  console.log(req.query)
  IdService.getUser(req.query.username).then((user) => { console.log(user); bot.client.send(user.token_id, req.query.message) });
  // bot.client.send(userID, message)
  res.send('Hello World!')
})

app.listen(8000, function () {
  console.log('Example app listening on port 8000!')
})

// ROUTING

bot.onEvent = function(session, message) {
  switch (message.type) {
    case 'Init':
      welcome(session)
      break
    case 'Message':
      onMessage(session, message)
      break
    case 'Command':
      onCommand(session, message)
      break
    case 'Payment':
      onPayment(session, message)
      break
    case 'PaymentRequest':
      welcome(session)
      break
  }
}
function formatName(user) {
  if (!user) {
    return "<Unknown>";
  } else if (user.name) {
    return user.name;
  } else if (user.username) {
    return "@" + user.username;
  } else {
    return "<Unknown>";
  }
}

function onMessage(session, message) {
  // welcome(session)
  amount = parseFloat(message.content.body)
  messenger_link(session, amount)
}

function messenger_link(session, amount) {
  mode = session.get("mode")
  if (mode){
    if(isNaN(amount)){
      sendMessage(session, "Please enter valid amount");
    }else{
      // sendMessage(session, `Click on the link and send it to your friend!! m.me/flypay1?ref=${mode}_${amount}_${formatName(session.user)}`)
      sendMessage(session, `You are ${mode}ing $${amount} to your fb friend(s)!! Please click on below link https://bee89051.ngrok.io/fb_share?amount=${amount}&from=${formatName(session.user)}&mode=${mode}`, [
        // {type: 'button', label: 'Confirm', action: `Webview::https://bee89051.ngrok.io/fb_share?amount=${amount}&from=${formatName(session.user)}&mode=${mode}`}
        ])
      session.set("mode", undefined)
    }
  }else{
    welcome(session)
  }
}

function onCommand(session, command) {
  switch (command.content.value) {
    case 'send_fb':
      send_fb(session)
      break;
    case 'request_fb':
      request_fb(session)
      break;
    case 'USD5':
      messenger_link(session, 5)
      break;
    case 'USD10':
      messenger_link(session, 10)
      break;
    case 'USD15':
      messenger_link(session, 15)
      break;
    case 'ping':
      pong(session)
      break
    case 'count':
      count(session)
      break
    case 'donate':
      donate(session)
      break
    }
}

function onPayment(session, message) {
  if (message.fromAddress == session.config.paymentAddress) {
    // handle payments sent by the bot
    if (message.status == 'confirmed') {
      // perform special action once the payment has been confirmed
      // on the network
    } else if (message.status == 'error') {
      // oops, something went wrong with a payment we tried to send!
    }
  } else {
    // handle payments sent to the bot
    if (message.status == 'unconfirmed') {
      // payment has been sent to the ethereum network, but is not yet confirmed
      sendMessage(session, `Thanks for the payment! 🙏`);
    } else if (message.status == 'confirmed') {
      // handle when the payment is actually confirmed!
    } else if (message.status == 'error') {
      sendMessage(session, `There was an error with your payment!🚫`);
    }
  }
}

// STATES

function welcome(session) {
  sendMessage(session, `Hey ${formatName(session.user)}! FlyPay connects Token to other chatbots and acts as a bridge. So now you can request money to your facebook friends`, [
    {type: 'button', label: 'Request money to FB friend', value: 'request_fb'},
    {type: 'button', label: 'Send money to FB friend', value: 'send_fb'}
  ])
}

function pong(session) {
  sendMessage(session, `Pong`)
}

function send_fb(session) {
  sendMessage(session, `Please enter amount to send`, [
    {type: 'button', label: '$5', value: 'USD5'},
    {type: 'button', label: '$10', value: 'USD10'},
    {type: 'button', label: '$15', value: 'USD15'}
  ]);
  session.set('mode', "send")
}
function request_fb(session) {
  sendMessage(session, `Please enter amount to request`, [
    {type: 'button', label: '$5', value: 'USD5'},
    {type: 'button', label: '$10', value: 'USD10'},
    {type: 'button', label: '$15', value: 'USD15'}
  ]);
  session.set('mode', "request")
}

// example of how to store state on each user
function count(session) {
  let count = (session.get('count') || 0) + 1
  session.set('count', count)
  sendMessage(session, `${count}`)
}

function donate(session) {
  // request $1 USD at current exchange rates
  Fiat.fetch().then((toEth) => {
    session.requestEth(toEth.USD(1))
  })
}

// HELPERS

function sendMessage(session, message, controls) {
  session.reply(SOFA.Message({
    body: message,
    controls: controls,
    showKeyboard: false,
  }))
}
