exports.mainKeyboard = {
    reply_markup: {
      keyboard: [
        [{ text: '🏦wallet' }, {text: '❓info' }],
      ]
    }
  };
  
exports.startKeyboard = {
    reply_markup: JSON.stringify({
      inline_keyboard: [
        [{ text: '🆕 Create wallet', callback_data: 'create' }],
        [{ text: '➡️ Import wallet', callback_data: 'import' }],
      ]
    })
  };

  exports.walletKeyboard = {
    reply_markup: JSON.stringify({
        inline_keyboard: [
          [{ text: '💰Balance', callback_data: 'Balance' }, {text: '🔤Address', callback_data: 'Address'}],
          [{ text: '➡️Send', callback_data: 'Send' }]
        ]
      })
  }

  exports.transactionKeyboard = {
    reply_markup: JSON.stringify({
      inline_keyboard: [
        [{ text: '✅ OK', callback_data: 'OK' },{ text: '❌ Cancel', callback_data: 'Cancel' }],
      ]
    })
  };