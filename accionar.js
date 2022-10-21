const { Client, Location, List, Buttons, LocalAuth, Chat } = require("./index");
const client = new Client({
    authStrategy: new LocalAuth(),
});
const chat = new Chat({});

async function getLastMessageFromBot(chatId) {
    try {
      
        let privatechat = new Chat();
        const searchOptions = { limit: 2 };
        privatechat =  chatId
        const conversationMsgs =  await privatechat.fetchMessages(searchOptions);
        let converts =  await conversationMsgs;
        let asociar =  await converts.filter((convert) => convert.id.fromMe === true) 
        asociar.length === 0 ?  'isEmpty' : asociar[0]._data.body  
        //let asociarBody =  await ((asociar[0]._data.body) = [] ? asociar[0]._data.body : 'isEmpty');
        return asociar;
    } catch (e) {

      return console.error(e);
    }
}

async function getLastMessageFromUser(chatId) {
  try {
      
    let privatechat = new Chat();
    const searchOptions = { limit: 2 };
    privatechat =  chatId
    const conversationMsgs =  await privatechat.fetchMessages(searchOptions);
    let converts =  await conversationMsgs;
    let asociar =  await converts.filter((convert) => convert.id.fromMe === false) 
    asociar.length === 0 ?  'isEmpty' : asociar[0]._data.body  
    //let asociarBody =  await ((asociar[0]._data.body) = [] ? asociar[0]._data.body : 'isEmpty');
    return asociar;
} catch (e) {

  return console.error(e);
}
}



async function deliveryMessageStatus(msg) {
    let estadoMensaje = await msg.getInfo();
    while (estadoMensaje.deliveryRemaining != "0") {
        estadoMensaje = await msg.getInfo();
        console.log("Mensaje no entregado");
    }
    return true;
}
function isEmptyObject(obj) {
  return Object.keys(obj).length === 0;
}

async function sanitizeNumber(msg) {
  let chatId = msg.from;
  let sanitized_number = chatId.toString().replace(/[- )(]/g, ""); // remove unnecessary chars from the number
  let number = sanitized_number
 
  return number
}
function storegetChatId(chatid){
  return chatid

}
function timerDelay(ms){
  var start = new Date().getTime();
  var end = start;
  while(end < start + ms) {
    end = new Date().getTime();
 }
}



module.exports = {
    getLastMessageFromUser: getLastMessageFromUser,
    getLastMessageFromBot: getLastMessageFromBot,
    deliveryMessageStatus: deliveryMessageStatus,
    isEmptyObject : isEmptyObject, 
    sanitizeNumber: sanitizeNumber,
    timerDelay:timerDelay,
};
