const Bot = require('./lib/Bot')
let bot = new Bot()
 const bip39 = require('bip39');
const SOFA = require('sofa-js')
const Fiat = require('./lib/Fiat')
const express = require('express')
const app = express()
const IdService = require('./lib/IdService')
const fetch = require('./lib/ServiceClient');
const Wallet = require('./lib/Wallet');
// const Web = require('./web.js')(bot)
const bodyParser = require('body-parser')
const request = require('request');


// parse application/x-www-form-urlencoded
// app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

// app.use(bodyParser.json({ verify: verifyRequestSignature }));

app.get('/', function (req, res) {
  res.send(req.query)
})
var jsonParser = bodyParser.json();
app.get('/fb', function (req, res) {
  res.send(req.query["hub.challenge"])
});

app.post('/fb', jsonParser,function (req, res) {
  data = req.body;
  // console.log(data.body)
  // console.log(req)
  // // Make sure this is a page subscription
  if (data.object === 'page') {

    // Iterate over each entry - there may be multiple if batched
    data.entry.forEach(function(entry) {
      var pageID = entry.id;
      var timeOfEvent = entry.time;

      // Iterate over each messaging event
      entry.messaging.forEach(function(event) {
        if (event.message) {
          receivedMessage(event);
        } else {
          console.log("Webhook received unknown event: ", event);
        }
      });
    });
    res.send("200");
    // Assume all went well.
    //
    // You must send back a 200, within 20 seconds, to let us know
    // you've successfully received the callback. Otherwise, the request
    // will time out and we will keep trying to resend.
  }
});

function receivedMessage(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfMessage = event.timestamp;
  var message = event.message;

  console.log("Received message for user %d and page %d at %d with message:", 
    senderID, recipientID, timeOfMessage);
  console.log(JSON.stringify(message));

  var messageId = message.mid;

  var messageText = message.text;
  var messageAttachments = message.attachments;
  sendTextMessage(senderID, "chus")
}

function sendTextMessage(recipientId, messageText) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: messageText
    }
  };

  callSendAPI(messageData);
}
PAGE_ACCESS_TOKEN = "EAAPC4QdkoKsBAJ3AKL3ZBfJDdQMb6WxbXaKiE0GUbh5ZAgD1RN5orUAVhoKXG6l4eZCBAVx3k5phP8DLrAzSScZAexPL7QCZANRkv3LWKY069UelV7tXHnpLhsXVKmEp21PfZAdBAwgrJd8rCOKZBT4MS8oGOOhLL2h2vFyh5GMSHgJCxnLTwFo"
function callSendAPI(messageData) {
  request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: PAGE_ACCESS_TOKEN },
    method: 'POST',
    json: messageData

  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var recipientId = body.recipient_id;
      var messageId = body.message_id;

      console.log("Successfully sent generic message with id %s to recipient %s", 
        messageId, recipientId);
    } else {
      console.error("Unable to send message.");
      console.error(response);
      console.error(error);
    }
  });  
}
app.get('/fb_share', function (req, res) {
  s = '<head> <meta name="viewport" content="width=device-width, initial-scale=1"></head>\
  <div style="text-align: center;">\
<div style="width:100%; margin: 0 auto;">\
  After Clicking on below link, choose the friend(s) you want to ' + req.query.mode + '\
</div>\
<a style="width: 100%; margin: 0 auto; display: block;" href="fb-messenger://share/?link=http://m.me/flypay1" >  Open Messanger</a>\
</div>'
  res.send(s)
})





function getUrl(path, proto) {
  var endpoint;
  if (!proto) proto = 'https';
  if (process.env['STAGE'] == 'development') {
    endpoint = proto + '://token-id-service-development.herokuapp.com';
  } else {
    endpoint = proto + '://token-id-service.herokuapp.com';
  }
  return endpoint + path;
}

app.get('/create_user', function(req, res) {
    pass = bip39.generateMnemonic()
    let wallet = new Wallet(pass);
    this.identityKey = wallet.derive_path("m/0'/1/0");
    this.paymentKey = wallet.derive_path("m/44'/60'/0'/0/0");
    this.tokenIdAddress = this.identityKey.address;
    this.paymentAddress = this.paymentKey.address;
    chus = this.paymentAddress
  fetch({
      url: getUrl('/v1/user/'),
      method: 'POST',
      sign: this.paymentKey,
      json: true,
      body: {
        "about": "I'm a digital Dingus",
        "name": "Dingus McDingusface",
        "username": req.query.username,
        "payment_address": chus
      }
    }).then((user) => {
      console.log(user)
      user.pass = pass;
      res.send(user)
      // cached_users[token_id] = {timestamp: new Date().getTime() / 1000, user: user};
      // if (user.payment_address) {
      //   cached_users_pa[user.payment_address] = cached_users_pa[token_id];
      // }
      return user;
    }).catch((err) => {
      console.log("Error!")
      console.log(err.message)
      res.send({success: false})
      return null;
    });
})


app.get('/send_message', function (req, res) {
  console.log("paeams: " + req.query)
  console.log(req.query)
  IdService.getUser(req.query.username).then((user) => { console.log(user); bot.client.send(user.token_id, req.query.message) });
  // bot.client.send(userID, message)
  res.send('Hello World!')
})

app.listen(process.env.PORT || 8000, function () {
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
      sendMessage(session, `You are ${mode}ing $${amount} to your fb friend(s)!! Please click on below link https://becf29d2.ngrok.io/fb_share?amount=${amount}&from=${formatName(session.user)}&mode=${mode}`, [
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
