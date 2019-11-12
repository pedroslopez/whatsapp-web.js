async function HandleImageMessage(page) {

  await page.evaluate(() => {
    
    // looking for the chat that sent the last message
    chats = document.querySelectorAll('.X7YrQ');
    lastChat = Array.from(chats).find(chat =>
      chat.getAttribute('style').includes('translateY(0px);')
    );
    lastChat.id = 'lastChat';
  });

  // need click to add the chat window to the DOM
  await page.click('#lastChat');

  
  await page.evaluate(() => {
    lastChat.id = '';
    // scroll page to add the last image to the DOM
    document.querySelector('._1_keJ').scroll(0, 30000);
  });
  // wait for image stop loading
  await page.waitForFunction(() => {
    
    return !document.querySelector('._3Z-uK'); // the class that gives the loading effect
  }); 
  
  // await page.waitFor(2000)
  return page.evaluate(async () => {
    
    //imgs = document.querySelectorAll('._18vxA');
    
    // select last image
    lastImage = document.querySelector('._1ays2 > div:last-child img');

  
    // fetch last image and convert it to base64
    response = await fetch(lastImage.src)
    blob = await response.blob()
    return new Promise(resolve => {
      reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result.replace(/^data:.+;base64,/, ''));
      };
      reader.readAsDataURL(blob);
    });
  });
}

async function GetMedia(msg, page) {
  
  if (msg.type === 'image') {
    return HandleImageMessage(page);
  }
  return msg.body;
}

module.exports = GetMedia;



