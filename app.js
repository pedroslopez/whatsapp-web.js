const {
    Client,
    Location,
    List,
    Buttons,
    LocalAuth,
    Chat,
    Message,
} = require("./index");

const qrcode = require("qrcode-terminal");
const accionar = require("./accionar");
const posdata = require("./postData");

const client = new Client({
    authStrategy: new LocalAuth(),
          puppeteer: { headless: true },  // activa el chromiun
    /*    puppeteer: {
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        headless: false 
       
            }    */

    });


        
        

const chat = new Chat({});
const message = new Message({});



client.on("loading_screen", (percent, message) => {
    console.log("LOADING SCREEN", percent, message);
});

client.on("qr", (qr) => {
    qrcode.generate(qr, { small: true });
});

client.on("authenticated", () => {
    console.log("AUTHENTICATED");
});

client.on("auth_failure", (msg) => {
    // Fired if session restore was unsuccessful
    console.error("AUTHENTICATION FAILURE", msg);
});

client.on("ready", () => {
    console.log("Client is ready!");
});

//Variables
var menu = `
    Indique la opción a realizar 
    ----------------------------------------------
    1R - Registro de Horometro/Odometro de fichas
    2R - En Desarrollo
    3R - En Desarrollo
    ----------------------------------------------`;
var ficha = `Favor de indicar la Ficha. Con Guiones ejemplo VL-M45`;
var counter = `Favor de indicar la Horometro/Odometro. `;
var dev = "Opción en Desarrollo";
var debesElegir = "Debe elegir una de las opciones";
const invokeKey = "!b";
var option1R = "1R";
var option2R = "2R";
var option3R = "3R";
var regficha;
var regOdometro;
var regDataConfirm = "Procesando los datos...";
var startConversation = "Hola";

var urlPowerautomate = "https://prod-93.westus.logic.azure.com:443/workflows/d9f08a8dc01d48fe994631b08ea80db6/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=r9iB23oBpcLglT1lo6lZCgHnl_OX2nqfHH6tyTr2Cu8";
 
var dataJson;
var htmlResponseCode;
var statusInsert = "Success";
// On create message

client.initialize();

client.on("message_create", async (msg) => {
    var mensaje = await msg;
    var numberFrom = mensaje.from
    numberFrom = numberFrom.replace(/\D/g, "");
    var chatId = await accionar.sanitizeNumber(mensaje);
    var chatIdInfo = await client.getChatById(chatId);
    var lastAnswerBot = await accionar.getLastMessageFromBot(chatIdInfo);
    var lastAnswerUser = await accionar.getLastMessageFromUser(chatIdInfo);

    console.log("respuesta usuario", lastAnswerUser.length);
    console.log("respuesta Bot", lastAnswerBot.length);
    // Fired on all message creations, including your own
    if (mensaje.fromMe) {
        // do stuff here
        if (lastAnswerBot.length === 0) 
        {            
             return client.sendMessage(msg.from, menu);
        }

        if (lastAnswerBot[0].body == menu) {
            return console.log("Esperando respuesta bot desde el bot 1");
        } 
    } else {
        accionar.timerDelay(3000);
        if (lastAnswerBot.length === 0 ) 
        {
             return client.sendMessage(msg.from, menu);
            
        }if (lastAnswerUser.length === 0) 
        {
            return console.log("Esperando respuesta del usuario menu desde usuario... 2");
        }if(lastAnswerUser[0].body == startConversation)
        {
            if(await chatIdInfo.clearMessages())
            {
                return  client.sendMessage(msg.from, menu);

            }
        }

        if (lastAnswerUser[0].body == option1R || lastAnswerUser[0].body == '1r')
             {

            return  client.sendMessage(msg.from, ficha);
            }
        if (lastAnswerBot[0].body == ficha) 
        {
            regficha = lastAnswerUser[0].body;
            regficha = regficha.toUpperCase();
            if(/[-]/.test(regficha) == false)
            {
                    regficha = regficha.substr(0,2) + '-' + regficha.substr(2, 5)
                    console.log(regficha)
            }

            return  client.sendMessage(msg.from, counter);
        }
        if (lastAnswerBot[0].body == counter) 
             {
                regOdometro = lastAnswerUser[0].body;
                regOdometro = regOdometro.replace(/[^0-9.]+/g, ''); //Allow number incluid floating number
                 client.sendMessage(msg.from, regDataConfirm);
    
              
                            
                        let data = {
                            name: mensaje._data.notifyName,
                            Ficha: regficha,
                            Numero: numberFrom,
                            Horometro: regOdometro
                            
                        };  
                
                            posdata.postData(urlPowerautomate, data).then((data) => {
                                console.log(data);
                                if(data.ok)
                                {
                                    client.sendMessage(msg.from,'Datos Enviados correctamente a la base de datos.');
                                } // JSON data parsed by `data.json()` call
                            });
                 return client.sendMessage(msg.from,`${mensaje._data.notifyName} Se envió la Ficha  ${regficha} y el Odometro/Horometro : ${regOdometro}`); 

              
           


                          
        }
    }
});


client.on("change_state", (state) => {
    console.log("CHANGE STATE", state);
});

client.on("disconnected", (reason) => {
    console.log("Client was logged out", reason);
});
