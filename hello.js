const fs = require('fs');
const { Client, Location } = require('./index');
const MessageMedia = require('./src/structures/MessageMedia');

const SESSION_FILE_PATH = './session.json';
let sessionCfg;
if (fs.existsSync(SESSION_FILE_PATH)) {
    sessionCfg = require(SESSION_FILE_PATH);
}
let Parser = require('rss-parser');
let parser = new Parser();

var myArray = new Array();


myArray['-'] = '--------\n--------\n--------\n-ooooooo\n--------\n--------\n--------\n';

myArray['a'] = '----ooo---' + '\n' +  '---oo-oo--' + '\n' +  '--oo---oo-' + '\n' +  '-oo-----oo' + '\n' +  '-ooooooooo' + '\n' +  '-oo-----oo' + '\n' +  '-oo-----oo' + '\n' +  '';

myArray['b'] = '-oooooooo-' + '\n' +  '-oo-----oo' + '\n' +  '-oo-----oo' + '\n' +  '-oo-----oo' + '\n' +  '-oooooooo-' + '\n' +  '-oo-----oo' + '\n' +  '-oo-----oo' + '\n' +  '-oooooooo-' + '\n' +  '';

myArray['c'] = '--oooooo-' + '\n' +  '-oo----oo' + '\n' +  '-oo------' + '\n' +  '-oo------' + '\n' +  '-oo------' + '\n' +  '-oo----oo' + '\n' +  '--oooooo-' + '\n' +  '';

myArray['d'] = '-oooooooo-' + '\n' +  '-oo-----oo' + '\n' +  '-oo-----oo' + '\n' +  '-oo-----oo' + '\n' +  '-oo-----oo' + '\n' +  '-oo-----oo' + '\n' +  '-oooooooo-' + '\n' +  '';

myArray['e'] = '-oooooooo' + '\n' +  '-oo------' + '\n' +  '-oo------' + '\n' +  '-oooooo--' + '\n' +  '-oo------' + '\n' +  '-oo------' + '\n' +  '-oooooooo' + '\n' +  '';

myArray['f'] = '-oooooooo' + '\n' +  '-oo------' + '\n' +  '-oo------' + '\n' +  '-oooooo--' + '\n' +  '-oo------' + '\n' +  '-oo------' + '\n' +  '-oo------' + '\n' +  '';

myArray['g'] = '--oooooo--' + '\n' +  '-oo----oo-' + '\n' +  '-oo-------' + '\n' +  '-oo---oooo' + '\n' +  '-oo----oo-' + '\n' +  '-oo----oo-' + '\n' +  '--oooooo--' + '\n' +  '';

myArray['h'] = '-oo-----oo' + '\n' +  '-oo-----oo' + '\n' +  '-oo-----oo' + '\n' +  '-ooooooooo' + '\n' +  '-oo-----oo' + '\n' +  '-oo-----oo' + '\n' +  '-oo-----oo' + '\n' +  '';

myArray['i'] = '-oooo' + '\n' +  '--oo-' + '\n' +  '--oo-' + '\n' +  '--oo-' + '\n' +  '--oo-' + '\n' +  '--oo-' + '\n' +  '-oooo' + '\n' +  '';

myArray['j'] = '-------oo' + '\n' +  '-------oo' + '\n' +  '-------oo' + '\n' +  '-------oo' + '\n' +  '-oo----oo' + '\n' +  '-oo----oo' + '\n' +  '--oooooo-' + '\n' +  '';

myArray['k'] = '-oo----oo' + '\n' +  '-oo---oo-' + '\n' +  '-oo--oo--' + '\n' +  '-ooooo---' + '\n' +  '-oo--oo--' + '\n' +  '-oo---oo-' + '\n' +  '-oo----oo' + '\n' +  '';

myArray['l'] = '-oo------' + '\n' +  '-oo------' + '\n' +  '-oo------' + '\n' +  '-oo------' + '\n' +  '-oo------' + '\n' +  '-oo------' + '\n' +  '-oooooooo' + '\n' +  '';

myArray['m'] = '-oo-----oo' + '\n' +  '-ooo---ooo' + '\n' +  '-oooo-oooo' + '\n' +  '-oo-ooo-oo' + '\n' +  '-oo-----oo' + '\n' +  '-oo-----oo' + '\n' +  '-oo-----oo' + '\n' +  '';

myArray['n'] = '-oo----oo' + '\n' +  '-ooo---oo' + '\n' +  '-oooo--oo' + '\n' +  '-oo-oo-oo' + '\n' +  '-oo--oooo' + '\n' +  '-oo---ooo' + '\n' +  '-oo----oo' + '\n' +  '';

myArray['o'] = '--ooooooo-' + '\n' +  '-oo-----oo' + '\n' +  '-oo-----oo' + '\n' +  '-oo-----oo' + '\n' +  '-oo-----oo' + '\n' +  '-oo-----oo' + '\n' +  '--ooooooo-' + '\n' +  '';

myArray['p'] = '-oooooooo-' + '\n' +  '-oo-----oo' + '\n' +  '-oo-----oo' + '\n' +  '-oooooooo-' + '\n' +  '-oo-------' + '\n' +  '-oo-------' + '\n' +  '-oo-------' + '\n' +  '';

myArray['q'] = '--ooooooo-' + '\n' +  '-oo-----oo' + '\n' +  '-oo-----oo' + '\n' +  '-oo-----oo' + '\n' +  '-oo--oo-oo' + '\n' +  '-oo----oo-' + '\n' +  '--ooooo-oo' + '\n' +  '';

myArray['r'] = '-oooooooo-' + '\n' +  '-oo-----oo' + '\n' +  '-oo-----oo' + '\n' +  '-oooooooo-' + '\n' +  '-oo---oo--' + '\n' +  '-oo----oo-' + '\n' +  '-oo-----oo' + '\n' +  '';

myArray['s'] = '--oooooo-' + '\n' +  '-oo----oo' + '\n' +  '-oo------' + '\n' +  '--oooooo-' + '\n' +  '-------oo' + '\n' +  '-oo----oo' + '\n' +  '--oooooo-' + '\n' +  '';

myArray['t'] = '-oooooooo' + '\n' +  '----oo---' + '\n' +  '----oo---' + '\n' +  '----oo---' + '\n' +  '----oo---' + '\n' +  '----oo---' + '\n' +  '----oo---' + '\n' +  '';

myArray['u'] = '-oo-----oo' + '\n' +  '-oo-----oo' + '\n' +  '-oo-----oo' + '\n' +  '-oo-----oo' + '\n' +  '-oo-----oo' + '\n' +  '-oo-----oo' + '\n' +  '--ooooooo-' + '\n' +  '';

myArray['v'] = '-oo-----oo' + '\n' +  '-oo-----oo' + '\n' +  '-oo-----oo' + '\n' +  '-oo-----oo' + '\n' +  '--oo---oo-' + '\n' +  '---oo-oo--' + '\n' +  '----ooo---' + '\n' +  '';

myArray['w'] = '-oo------oo' + '\n' +  '-oo--oo--oo' + '\n' +  '-oo--oo--oo' + '\n' +  '-oo--oo--oo' + '\n' +  '-oo--oo--oo' + '\n' +  '-oo--oo--oo' + '\n' +  '--ooo--ooo-' + '\n' +  '';

myArray['x'] = '-oo-----oo' + '\n' +  '--oo---oo-' + '\n' +  '---oo-oo--' + '\n' +  '----ooo---' + '\n' +  '---oo-oo--' + '\n' +  '--oo---oo-' + '\n' +  '-oo-----oo' + '\n' +  '';

myArray['y'] = '-oo----oo' + '\n' +  '--oo--oo-' + '\n' +  '---oooo--' + '\n' +  '----oo---' + '\n' +  '----oo---' + '\n' +  '----oo---' + '\n' +  '----oo---' + '\n' +  '';

myArray['z'] = '-oooooooo' + '\n' +  '------oo-' + '\n' +  '-----oo--' + '\n' +  '----oo---' + '\n' +  '---oo----' + '\n' +  '--oo-----' + '\n' +  '-oooooooo' + '\n' +  '';
let quote = 
[
"If you want to achieve greatness stop asking for permission." ,
"Things work out best for those who make the best of how things work out.",
"To live a creative life, we must lose our fear of being wrong.",
"If you are not willing to risk the usual you will have to settle for the ordinary." ,
"Trust because you are willing to accept the risk, not because it's safe or certain.",
"Take up one idea. Make that one idea your life--think of it, dream of it, live on that idea. Let the brain, muscles, nerves, every part of your body, be full of that idea, and just leave every other idea alone. This is the way to success.",
"All our dreams can come true if we have the courage to pursue them.",
"Good things come to people who wait, but better things come to those who go out and get them.",
"If you do what you always did, you will get what you always got." ,
"Success is walking from failure to failure with no loss of enthusiasm.",
"Just when the caterpillar thought the world was ending, he turned into a butterfly.",
"Successful entrepreneurs are givers and not takers of positive energy." ,
"Whenever you see a successful person you only see the public glories, never the private sacrifices to reach them.",
"Opportunities don't happen, you create them." ,
"Try not to become a person of success, but rather try to become a person of value." ,
"Great minds discuss ideas; average minds discuss events; small minds discuss people." ,
"I have not failed. I've just found 10,000 ways that won't work." ,
"If you don't value your time, neither will others. Stop giving away your time and talents--start charging for it." ,
"A successful man is one who can lay a firm foundation with the bricks others have thrown at him." ,
 "No one can make you feel inferior without your consent." ,
 "The whole secret of a successful life is to find out what is one's destiny to do, and then do it." ,
 "If you're going through hell keep going." ,
 "The ones who are crazy enough to think they can change the world, are the ones who do." ,
 "Don't raise your voice, improve your argument." ,
 "What seems to us as bitter trials are often blessings in disguise.",
 "The meaning of life is to find your gift. The purpose of life is to give it away." ,
 "The distance between insanity and genius is measured only by success.",
 "When you stop chasing the wrong things, you give the right things a chance to catch you." ,
 "I believe that the only courage anybody ever needs is the courage to follow your own dreams." ,
 "No masterpiece was ever created by a lazy artist." ,
 "Happiness is a butterfly, which when pursued, is always beyond your grasp, but which, if you will sit down quietly, may alight upon you.",
 "If you can't explain it simply, you don't understand it well enough." ,
 "Blessed are those who can give without remembering and take without forgetting." ,
 "Do one thing every day that scares you." ,
 "What's the point of being alive if you don't at least try to do something remarkable." ,
 "Life is not about finding yourself. Life is about creating yourself." ,
 "Nothing in the world is more common than unsuccessful people with talent." ,
 "Knowledge is being aware of what you can do. Wisdom is knowing when not to do it." ,
 "Your problem isn't the problem. Your reaction is the problem." ,
 "You can do anything, but not everything.",
 "Innovation distinguishes between a leader and a follower." ,
 "There are two types of people who will tell you that you cannot make a difference in this world: those who are afraid to try and those who are afraid you will succeed." ,
 "Thinking should become your capital asset, no matter whatever ups and downs you come across in your life." ,
 "I find that the harder I work, the more luck I seem to have." ,
 "The starting point of all achievement is desire." ,
 "Success is the sum of small efforts, repeated day-in and day-out." ,
 "If you want to achieve excellence, you can get there today. As of this second, quit doing less-than-excellent work." ,
 "All progress takes place outside the comfort zone." ,
 "You may only succeed if you desire succeeding; you may only fail if you do not mind failing." ,
 "Courage is resistance to fear, mastery of fear--not absence of fear." ,
 "Only put off until tomorrow what you are willing to die having left undone." ,
 "People often say that motivation doesn't last. Well, neither does bathing--that's why we recommend it daily." ,
 "We become what we think about most of the time, and that's the strangest secret." ,
 "The only place where success comes before work is in the dictionary." ,
 "Too many of us are not living our dreams because we are living our fears. " ,
 "I find that when you have a real interest in life and a curious life, that sleep is not the most important thing." ,
 "It's not what you look at that matters, it's what you see.",
 "The road to success and the road to failure are almost exactly the same." ,
 "The function of leadership is to produce more leaders, not more followers." ,
 "Success is liking yourself, liking what you do, and liking how you do it." ,
 "As we look ahead into the next century, leaders will be those who empower others." ,
 "A real entrepreneur is somebody who has no safety net underneath them." ,
 "The first step toward success is taken when you refuse to be a captive of the environment in which you first find yourself." ,
 "People who succeed have momentum. The more they succeed, the more they want to succeed, and the more they find a way to succeed. Similarly, when someone is failing, the tendency is to get on a downward spiral that can even become a self-fulfilling prophecy." ,
 "When I dare to be powerful, to use my strength in the service of my vision, then it becomes less and less important whether I am afraid." ,
 "Whenever you find yourself on the side of the majority, it is time to pause and reflect.",
 "The successful warrior is the average man, with laser-like focus." ,
 "There is no traffic jam along the extra mile." ,
 "Develop success from failures. Discouragement and failure are two of the surest stepping stones to success." ,
 "If you don't design your own life plan, chances are you'll fall into someone else's plan. And guess what they have planned for you? Not much." ,
 "If you genuinely want something, don't wait for it--teach yourself to be impatient." ,
 "Don't let the fear of losing be greater than the excitement of winning." ,
 "If you want to make a permanent change, stop focusing on the size of your problems and start focusing on the size of you!" ,
 "You can't connect the dots looking forward; you can only connect them looking backwards. So you have to trust that the dots will somehow connect in your future. You have to trust in something--your gut, destiny, life, karma, whatever. This approach has never let me down, and it has made all the difference in my life." ,
 "Two roads diverged in a wood and I  took the one less traveled by, and that made all the difference." ,
 "The number one reason people fail in life is because they listen to their friends, family, and neighbors." ,
 "The reason most people never reach their goals is that they don't define them, or ever seriously consider them as believable or achievable. Winners can tell you where they are going, what they plan to do along the way, and who will be sharing the adventure with them." ,
 "In my experience, there is only one motivation, and that is desire. No reasons or principle contain it or stand against it." ,
 "Success does not consist in never making mistakes but in never making the same one a second time." ,
 "I don't want to get to the end of my life and find that I lived just the length of it. I want to have lived the width of it as well." ,
 "You must expect great things of yourself before you can do them." ,
 "Motivation is what gets you started. Habit is what keeps you going." ,
 "People rarely succeed unless they have fun in what they are doing." ,
 "There is no chance, no destiny, no fate, that can hinder or control the firm resolve of a determined soul." ,
 "Our greatest fear should not be of failure but of succeeding at things in life that don't really matter." ,
 "You've got to get up every morning with determination if you're going to go to bed with satisfaction." ,
 "A goal is not always meant to be reached; it often serves simply as something to aim at." ,
 "Success is ... knowing your purpose in life, growing to reach your maximum potential, and sowing seeds that benefit others." ,
 "Be miserable. Or motivate yourself. Whatever has to be done, it's always your choice." ,
 "To accomplish great things, we must not only act, but also dream, not only plan, but also believe." ,
 "Most of the important things in the world have been accomplished by people who have kept on trying when there seemed to be no help at all." ,
 "You measure the size of the accomplishment by the obstacles you had to overcome to reach your goals." ,
 "Real difficulties can be overcome; it is only the imaginary ones that are unconquerable.",
 "It is better to fail in originality than to succeed in imitation." ,
 "What would you do if you weren't afraid." ,
 "Little minds are tamed and subdued by misfortune; but great minds rise above it.",
 "Failure is the condiment that gives success its flavor." ,
 "Don't let what you cannot do interfere with what you can do." ,
 "You may have to fight a battle more than once to win it." ,
 "A man can be as great as he wants to be. If you believe in yourself and have the courage, the determination, the dedication, the competitive drive and if you are willing to sacrifice the little things in life and pay the price for the things that are worthwhile, it can be done."]

let meme = new Array();
meme.push("memes/meme1.png");
meme.push("memes/meme2.png");
meme.push("memes/meme3.png");
meme.push("memes/meme4.png");
meme.push("memes/meme5.png");
meme.push("memes/meme6.png");
meme.push("memes/meme7.png");
meme.push("memes/meme8.png");
meme.push("memes/meme9.png");
meme.push("memes/meme10.png");
meme.push("memes/meme11.png");
meme.push("memes/meme12.png");
meme.push("memes/meme13.png");
meme.push("memes/meme14.png");
meme.push("memes/meme15.png");
meme.push("memes/meme16.png");
meme.push("memes/meme17.png");
meme.push("memes/meme18.png");
meme.push("memes/meme19.png");
meme.push("memes/meme20.png");

let memeCaption = new Array();
memeCaption.push('Programmers know the risks involved!');
memeCaption.push('LMAO');
memeCaption.push('C++ Cheater');
memeCaption.push('Quality "Assurance"');
memeCaption.push('I am the IT department');
memeCaption.push('Stacking if else statements be like');
memeCaption.push('Big brain game');
memeCaption.push('Damn those race conditions!');
memeCaption.push('Did any body done this?');
memeCaption.push('Someone please pick this Jira ticket');
memeCaption.push('Just family tech support things');
memeCaption.push('IT department');
memeCaption.push('I should have written this with the switch statement');
memeCaption.push('When the world tells you to stay indoors and work remotely');
memeCaption.push('Increment');
memeCaption.push('Catbugging');
memeCaption.push('True Happiness');
memeCaption.push('Why is my function not outputting anything');
memeCaption.push('Thats how you TRAIN');
memeCaption.push('Really need this super powerful computer!');

const client = new Client({ puppeteer: { headless: false }, session: sessionCfg });
client.initialize();
client.on('qr', (qr) => {
    console.log('QR RECEIVED', qr);
});

client.on('authenticated', (session) => {
    console.log('AUTHENTICATED', session);
    sessionCfg=session;
    fs.writeFile(SESSION_FILE_PATH, JSON.stringify(session), function (err) {
        if (err) {
            console.error(err);
        }
    });
});
client.on('auth_failure', msg => {
    console.error('AUTHENTICATION FAILURE', msg);
});
client.on('ready', () => {
    console.log('READY');
});
client.on('message', async msg => {
    console.log('MESSAGE RECEIVED', msg);
    if (msg.body == '!spam') {
        for(i =0;i < 20;i++)
        {
            client.sendMessage(msg.from,"Sorry for the Spam!");
        }
    }
    if (msg.body == '!hello') {
        msg.reply('Hello World!');
    } 

    if (msg.body == '!test') {
        const attachmentData = new MessageMedia('image/png',fs.readFileSync('memes/meme1.png','base64'),'meme.png');
        console.log(attachmentData);
        client.sendMessage(msg.from, attachmentData, { caption: 'Programmers know the risks involved!' });
    }
    if (msg.body == '!meme') {
        let num = Math.floor(Math.random() * meme.length);
        var memePath = meme[num];
        meme.splice(num,1);
        var memeCap = memeCaption[num]; 
        memeCaption.splice(num,1);
        const attachmentData = new MessageMedia('image/png',fs.readFileSync(memePath,'base64'),'meme.png');
        console.log(attachmentData);
        client.sendMessage(msg.from, attachmentData, { caption: memeCap });
    }
    if (msg.body == '!q') {
        let num = Math.floor(Math.random() * quote.length);
        var q = quote[num];
        quote.splice(num,1);
        msg.reply(q);
    }
    else if (msg.body == '!groupinfo') {
        let chat = await msg.getChat();
        if (chat.isGroup) {
            msg.reply(`
                *Group Details*
                Name: ${chat.name}
                Description: ${chat.description}
                Created At: ${chat.createdAt.toString()}
                Created By: ${chat.owner.user}
                Participant count: ${chat.participants.length}
            `);
        } else {
            msg.reply('This command can only be used in a group!');
        }
    } else if (msg.body == '!chats') {
        const chats = await client.getChats();
        client.sendMessage(msg.from, `The bot has ${chats.length} chats open.`);
    } else if (msg.body == '!info') {
        let info = client.info;
        client.sendMessage(msg.from, `
            *Connection info*
            User name: ${info.pushname}
            My number: ${info.me.user}
            Platform: ${info.platform}
            WhatsApp version: ${info.phone.wa_version}
        `);
    } else if (msg.body == '!mediainfo' && msg.hasMedia) {
        const attachmentData = await msg.downloadMedia();
        msg.reply(`
            *Media info*
            MimeType: ${attachmentData.mimetype}
            Filename: ${attachmentData.filename}
            Data (length): ${attachmentData.data.length}
        `);
    } else if (msg.body == '!quoteinfo' && msg.hasQuotedMsg) {
        const quotedMsg = await msg.getQuotedMessage();

        quotedMsg.reply(`
            ID: ${quotedMsg.id._serialized}
            Type: ${quotedMsg.type}
            Author: ${quotedMsg.author || quotedMsg.from}
            Timestamp: ${quotedMsg.timestamp}
            Has Media? ${quotedMsg.hasMedia}
        `);
    } else if (msg.body == '!resendmedia' && msg.hasQuotedMsg) {
        const quotedMsg = await msg.getQuotedMessage();
        if (quotedMsg.hasMedia) {
            const attachmentData = await quotedMsg.downloadMedia();
            client.sendMessage(msg.from, attachmentData, { caption: 'Here\'s your requested media.' });
        }
    } else if (msg.body == '!location') {
        msg.reply(new Location(37.422, -122.084, 'Googleplex\nGoogle Headquarters'));
    } else if (msg.location) {
        msg.reply(msg.location);
    } else if (msg.body.startsWith('!status ')) {
        const newStatus = msg.body.split(' ')[1];
        await client.setStatus(newStatus);
        msg.reply(`Status was updated to *${newStatus}*`);
    } else if (msg.body == '!mention') {
        const contact = await msg.getContact();
        const chat = await msg.getChat();
        chat.sendMessage(`Hi @${contact.number}!`, {
            mentions: [contact]
        });
    } else if (msg.body == '!delete' && msg.hasQuotedMsg) {
        const quotedMsg = await msg.getQuotedMessage();
        if (quotedMsg.fromMe) {
            quotedMsg.delete(true);
        } else {
            msg.reply('I can only delete my own messages');
        }
    } else if (msg.body === '!archive') {
        const chat = await msg.getChat();
        chat.archive();
    } else if (msg.body === '!typing') {
        const chat = await msg.getChat();
        // simulates typing in the chat
        chat.sendStateTyping();        
    } else if (msg.body === '!recording') {
        const chat = await msg.getChat();
        // simulates recording audio in the chat
        chat.sendStateRecording();        
    } else if (msg.body === '!clearstate') {
        const chat = await msg.getChat();
        // stops typing or recording in the chat
        chat.clearState();        
    } else if(msg.body.startsWith('!n '))
    {
        (async () => {
            const type = msg.body.split(' ')[1];
            const keyword = msg.body.split(' ')[2];
            //console.log(feed.title);
            if(type.toLowerCase() == 'reddit')
            {
                let feed = await parser.parseURL('https://www.reddit.com/.rss');
                feed.items.forEach(item => {
                    if(item.title.toLowerCase().includes(keyword.toLowerCase(),0))
                    {
                        msg.reply(item.title + ':' + item.link);
                    }
                });
            }
            else if(type.toLowerCase() == 'top')
            {
                let feedTop = await parser.parseURL('https://gulfnews.com/rss/?generatorName=mrss&uuid=5bd9758c-9198-40ac-8d81-1e38745d5485');
                feedTop.items.forEach(item => {
                    if(item.title.toLowerCase().includes(keyword.toLowerCase(),0))
                    {
                        msg.reply(item.title + ':' + item.link);
                    }
                });
            }
            else if(type.toLowerCase() == 'uae')
            {
                let feedUAE = await parser.parseURL('https://gulfnews.com/rss/?generatorName=mrss&categories=UAE,Education,Crime,Government,Health,Weather,Transport,Science,Environment');
                feedUAE.items.forEach(item => {
                    if(item.title.toLowerCase().includes(keyword.toLowerCase(),0))
                    {
                        msg.reply(item.title + ':' + item.link);
                    }
                });
            }
            else if(type.toLowerCase() == 'business')
            {
                let feedBusiness = await parser.parseURL('https://gulfnews.com/rss/?generatorName=mrss&categories=Business,Banking,Aviation,Property,Energy,Analysis,Tourism,Markets,Retail,Personal-Finance,Podcast');
                feedBusiness.items.forEach(item => {
                    if(item.title.toLowerCase().includes(keyword.toLowerCase(),0))
                    {
                        msg.reply(item.title + ':' + item.link);
                    }
                });
            }
            else if(type.toLowerCase() == 'sport')
            {
                let feedSport = await parser.parseURL('https://gulfnews.com/rss/?generatorName=mrss&categories=Sport,UAE-Sport,Horse-Racing,Cricket,IPL,ICC,Football,Motorsport,Tennis,Golf,Rugby');
                feedSport.items.forEach(item => {
                    if(item.title.toLowerCase().includes(keyword.toLowerCase(),0))
                    {
                        msg.reply(item.title + ':' + item.link);
                    }
                });
            }
            else if(type.toLowerCase() == 'video')
            {
                let feedVideo = await parser.parseURL('https://gulfnews.com/rss/?generatorName=mrss&categories=Videos,Best-Of-Bollywood,news-video');
                feedVideo.items.forEach(item => {
                    if(item.title.toLowerCase().includes(keyword.toLowerCase(),0))
                    {
                        msg.reply(item.title + ':' + item.link);
                    }
                });
            }
            else if(type.toLowerCase() == 'entertainment')
            {
                let feedEntertainment = await parser.parseURL('https://gulfnews.com/rss/?generatorName=mrss&categories=Entertainment,HollyWood,BollyWood,Pakistani-Cinema,Pinoy-Celebs,South-Indian,Arab-Celebs,Music,TV,Books,Theatre,Arts-Culture');
                feedEntertainment.items.forEach(item => {
                    if(item.title.toLowerCase().includes(keyword.toLowerCase(),0))
                    {
                        msg.reply(item.title + ':' + item.link);
                    }
                });
            }
            else if(type.toLowerCase() == 'opinion')
            {
                let feedOpinion = await parser.parseURL('https://gulfnews.com/rss/?generatorName=mrss&categories=Opinion,Editorials,Op-Eds');
                feedOpinion.items.forEach(item => {
                    if(item.title.toLowerCase().includes(keyword.toLowerCase(),0))
                    {
                        msg.reply(item.title + ':' + item.link);
                    }
                });
            }
            else if(type.toLowerCase() == 'world')
            {
                let feedWorld = await parser.parseURL('https://gulfnews.com/rss/?generatorName=mrss&categories=World,Europe,Asia,India,Pakistan,Philipines,Oceania,Americas,Africa');
                feedWorld.items.forEach(item => {
                    if(item.title.toLowerCase().includes(keyword.toLowerCase(),0))
                    {
                        msg.reply(item.title + ':' + item.link);
                    }
                });
            }
            else if(type.toLowerCase() == 'goingout')
            {
                let feedGoingOut = await parser.parseURL('https://gulfnews.com/rss/?generatorName=mrss&categories=Going-out,Bars-Clubs,Movie-Reviews,Movie-Trailers,Restaurants,Events,Society');
                feedGoingOut.items.forEach(item => {
                    if(item.title.toLowerCase().includes(keyword.toLowerCase(),0))
                    {
                        msg.reply(item.title + ':' + item.link);
                    }
                });
            }
            else if(type.toLowerCase() == 'travel')
            {
                let feedTravel = await parser.parseURL('https://gulfnews.com/rss/?generatorName=mrss&categories=Travel,Advice,Destinations,Hotels');
                feedTravel.items.forEach(item => {
                    if(item.title.toLowerCase().includes(keyword.toLowerCase(),0))
                    {
                        msg.reply(item.title + ':' + item.link);
                    }
                });
            }
            else if(type.toLowerCase() == 'tech')
            {
                let feedTech = await parser.parseURL('https://gulfnews.com/rss/?generatorName=mrss&categories=Technology,Consumer-Electronics,Gaming,Trends,Fin-Tech,Companies,Media');
                feedTech.items.forEach(item => {
                    if(item.title.toLowerCase().includes(keyword.toLowerCase(),0))
                    {
                        msg.reply(item.title + ':' + item.link);
                    }
                });
            }
            else if(type.toLowerCase() == 'how to')
            {
                let feedHowTo = await parser.parseURL('https://gulfnews.com/rss/?generatorName=mrss&categories=How-To,Employment,Housing,Passports-Visa,Your-Money,Legal');
                feedHowTo.items.forEach(item => {
                    if(item.title.toLowerCase().includes(keyword.toLowerCase(),0))
                    {
                        msg.reply(item.title + ':' + item.link);
                    }
                });
            }
          })();
    }
    else if(msg.body.startsWith('!s '))
    {
        var str = msg.body;
        str = str.substring(2);
        let i = 0;
        while(i < str.length)
        {
            client.sendMessage(msg.from,myArray[str[i].toLowerCase()]);
            i+=1;
        }
    }
});



client.on('group_join', (notification) => {
    console.log('join', notification);
    notification.reply('User joined.');
});

client.on('group_leave', (notification) => {
    console.log('leave', notification);
    notification.reply('User left.');
});

client.on('group_update', (notification) => {
    console.log('update', notification);
});

client.on('disconnected', (reason) => {
    console.log('Client was logged out', reason);
});

