const Bot = require('node-telegram-bot-api');
const fs = require('fs');
const TronWeb = require('tronweb');
const fullNode = 'https://api.shasta.trongrid.io';
const solidityNode = 'https://api.shasta.trongrid.io';
const eventServer = 'https://api.shasta.trongrid.io';
const tron = new TronWeb(fullNode,solidityNode,eventServer);
const token = '1136802133:AAHLEF-FM7T2X1qxGI2hYOCl5sH55tojZhc';
const mongoose = require('mongoose');
const bot = new Bot(token, {polling: true});

const keyboard = require('./keyboards');

const cipher = require('./crypto');

//Models
const User = require('./models/users');

//Connect mongo
const url = 'mongodb://localhost:27017/Tron';
const settings = {
  useNewUrlParser: true,
  useUnifiedTopology: true
};
const connect = mongoose.connect(url,settings);


connect.then((db)=>{
  console.log('connected correctly!');
},(err)=>{
  console.log(err);
})

isNumber= (n)=> {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

startFunc = (chatId)=>{
  User.find({chat:chatId}).then((user)=>{
    if(user[0] != undefined){
      bot.sendMessage(chatId,'❌You already have an account!',keyboard.mainKeyboard)
    } else{
      User.create({chat: chatId}).then((user)=>{
        bot.sendMessage(chatId,'🖐Welcome to our bot! Choose an action:', keyboard.startKeyboard);
      }).catch((err)=>{
        bot.sendMessage(chatId,'An error!')
      })
    }
  }).catch((err)=>{
    bot.sendMessage(chatId,'An error!')
  })
}

walletPressed = (chatId)=>{
  User.find({chat: chatId}).then((user)=>{
    let address = user[0].wallet.address
    let text = `Your address - ${address}\nRecieve address - ${address}\n\nDescription:\nTron is a blockchain-based decentralized platform that aims to build a free, global digital content entertainment system with distributed storage technology, and allows easy and cost-effective sharing of digital content.`
    bot.sendMessage(chatId,text,keyboard.walletKeyboard);
  }).catch((err)=>{
    bot.sendMessage(chatId,'An error!')
  })
  // bot.sendMessage(chatId,'')
}

var botMsg = [];
var transactions = []

bot.onText(/\/start/, function (msg, match) {
  startFunc(msg.chat.id)
});

// bot.onText(/\/test/,(msg,match)=>{
//   tron.trx.getTransaction("5a51c3a477d4b471915146b17cd92e964636104b642a29a95e0a018c8b141a65").then((res)=>{
//     console.log(res);
//   })
// })

bot.on('callback_query', (msg) => {
    let chatId = msg.from.id;
    let data = msg.data;
    switch (data) {
      case 'create':
        User.find({chat: chatId}).then((user)=>{
          if(user[0].wallet.address != ''){
            bot.sendMessage(chatId,'❌You`ve already created a wallet!');
          } else {
              bot.sendMessage(chatId,'Type me a secret word:')
              let chat = String(chatId);
              botMsg[chat] = 'Type me a secret word:';
          }
        })
      break;
      case 'Balance':
        botMsg[chatId] = '';
          User.find({chat: chatId}).then((user)=>{
            let msgId;
            let address = user[0].wallet.address;
            bot.sendMessage(chatId,'⌛Loading data...').then(msg=>{
              msgId = msg.message_id;
              tron.trx.getBalance(address).then((res)=>{
                let trx = res / 1000000;
                bot.deleteMessage(chatId,msgId);
                bot.sendMessage(chatId,`${trx} trx`);
              }).catch(err=>{
                bot.sendMessage(chatId,'An error!')
              })
            })
            
          })
      break;
      case 'Send':
        botMsg[chatId] = '';
        User.find({chat : chatId}).then((user)=>{
          bot.sendMessage(chatId,'⌛Loading data...').then(msg=>{
            msgId = msg.message_id;
            tron.trx.getBalance(user[0].wallet.address).then((res)=>{
              let trx = res / 1000000;
              bot.deleteMessage(chatId,msgId);
              bot.sendMessage(chatId,`Type an amount of tron for sending:\n\nYour available balance - <b>${trx} trx</b> `,{ parse_mode: "HTML" })
              let chat = String(chatId);
              botMsg[chat] = 'amount of tron';
            }).catch(err=>{
              bot.sendMessage(chatId,'An error!')
            })
          })
        })
      break;
      case 'Cancel':
        if(transactions[chatId].amount!= undefined){
          transactions[chatId] = {};
          bot.sendMessage(chatId, 'Canceled');
        }
      break;
      case 'OK':
        if(transactions[chatId].amount!= undefined){
         
          bot.sendMessage(chatId,'Type your secret word:').then(()=>{
            botMsg[chatId] = 'transaction';
          })
        }
      break;
      case 'Address':
        User.find({chat: chatId}).then((user)=>{
          bot.sendMessage(chatId,user[0].wallet.address).then(()=>{
            botMsg[chatId] = '';
          });
        })
      break;
      default:
        break;
    }
 });

 bot.on('message',(msg)=>{
   var chatId = msg.chat.id;
   if(botMsg[chatId] == 'Type me a secret word:'){
      let secret = msg.text;
      tron.createAccount().then((account)=>{
        User.find({chat: chatId}).then((user)=>{
          let encKey = cipher.encrypt(account.privateKey, secret);
          user[0].wallet.address = account.address.base58;
          user[0].wallet.public = account.publicKey;
          user[0].wallet.private = encKey;
          user[0].save().then((user)=>{
            bot.sendMessage(chatId,`🔑 Your address - ${account.address.base58}\n\n🔐 Your private key - ${account.privateKey}\n\n ⚠️ Keep it in secret!`, keyboard.mainKeyboard).then(()=>{
              botMsg[chatId] = '';
            })
          }).catch(err=>{
            bot.sendMessage(chatId,'An error!');
          })
        })
      })
   }
   if(msg.text == '🏦wallet'){
     walletPressed(msg.chat.id);
   }
   if(botMsg[chatId] == 'amount of tron'){
    if(isNumber(msg.text)){
      let chat = String(chatId);
      transactions[chat] = {amount: msg.text, to: ''};
      bot.sendMessage(chatId,'Type an address of recipient:').then(()=>{
        botMsg[chat] = 'address';
      })
    } else {
      bot.sendMessage(chatId,'❌Type a number:')
    }
   }
   if(botMsg[chatId] == 'address'){
     if(tron.isAddress(msg.text)){
       transactions[chatId].to = msg.text;
       bot.sendMessage(chatId,`You want to send ${transactions[chatId].amount} trx to ${transactions[chatId].to}`,keyboard.transactionKeyboard).then(()=>{
         botMsg[chatId] = '';
       });

     } else {
       bot.sendMessage(chatId,'❌Invalid address')
     }
   }
   if(botMsg[chatId] == 'transaction'){
     var msgId;
     bot.sendMessage(chatId,'⌛Pending...').then((msg)=>{
      msgId = msg.message_id;
     })
     
    if(transactions[chatId].amount!= undefined){
      User.find({chat: chatId}).then((user)=>{
        let privateKey = cipher.decrypt(user[0].wallet.private,msg.text);
        let amount = transactions[chatId].amount * 1000000;
        tron.trx.sendTransaction(transactions[chatId].to,amount,privateKey).then((res)=>{
          if(res.result == true){
            bot.deleteMessage(chatId,msgId);
            bot.sendMessage(chatId,`✅ Success! Transaction has been broadcasted!\n\nHash - https://shasta.tronscan.org/#/transaction/${res.transaction.txID}`).then(()=>{
              transactions[chatId] = {};
            });
          } else{
            bot.sendMessage('Something wrong...Try later').then(()=>{
              transactions[chatId] = {};
            })
          }
        }).catch(err=>{
          console.log(err)
          bot.sendMessage(chatId,'❌Invalid secret word').then(()=>{
          })
        });
      })
      
    } else {
      botMsg[chatId] = '';
    }
   }
 })


