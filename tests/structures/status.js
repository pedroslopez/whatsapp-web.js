const { expect } = require('chai');
// const MessageMedia = require('../src/structures/MessageMedia');
const helper = require('../helper');

describe('Status', function () {
    let client;

    before(async function () {
        this.timeout(35000);
        client = helper.createClient({ authenticated: true });
        await client.initialize();
    });

    after(async function () {
        await client.destroy();
    });

    it('should be able to post text status (stories)', async function () {
        this.timeout(35000);
        const status = await client.sendStatus('Hello World!');
        expect(typeof status).to.equal('object');
        expect(status.messageSendResult).to.equal('OK');
    });

    // TODO: Add tests for image status after fixing it 

    /**
     * Current error from WhatsApp Web:
     * Promise {<rejected>: TypeError: e.isUser is not a function
        at b.initialize (https://static.whatsapp.net/rsrc.php/v4i…}
        [[Prototype]]
        : 
        Promise
        [[PromiseState]]
        : 
        "rejected"
        [[PromiseResult]]
        : 
        TypeError: e.isUser is not a function at b.initialize (https://static.whatsapp.net/rsrc.php/v4iR5P4/yY/l/rt/qJYTA423gjV.js:2906:19398) at b.a [as constructor] (https://static.whatsapp.net/rsrc.php/v4/yA/r/tqJMkcDA30k.js:1024:1766) at new b (https://static.whatsapp.net/rsrc.php/v4/yA/r/tqJMkcDA30k.js:1022:3639) at Object.<anonymous> (https://static.whatsapp.net/rsrc.php/v4iR5P4/yY/l/rt/qJYTA423gjV.js:2257:3354) at Generator.next (<anonymous>) at h (https://static.whatsapp.net/rsrc.php/v4/ya/r/2UMh53bUtXe.js:275:125) at g (https://static.whatsapp.net/rsrc.php/v4/ya/r/2UMh53bUtXe.js:275:349) at https://static.whatsapp.net/rsrc.php/v4/ya/r/2UMh53bUtXe.js:275:408 at new Promise (<anonymous>) at Object.<anonymous> (https://static.whatsapp.net/rsrc.php/v4/ya/r/2UMh53bUtXe.js:275:277) at Object.e [as sendStatusMediaMsgAction] (https://static.whatsapp.net/rsrc.php/v4iR5P4/yY/l/rt/qJYTA423gjV.js:2257:3063) at <anonymous>:1:25
        message
        : 
        "e.isUser is not a function"
        stack
        : 
        "TypeError: e.isUser is not a function\n    at b.initialize (https://static.whatsapp.net/rsrc.php/v4iR5P4/yY/l/rt/qJYTA423gjV.js:2906:19398)\n    at b.a [as constructor] (https://static.whatsapp.net/rsrc.php/v4/yA/r/tqJMkcDA30k.js:1024:1766)\n    at new b (https://static.whatsapp.net/rsrc.php/v4/yA/r/tqJMkcDA30k.js:1022:3639)\n    at Object.<anonymous> (https://static.whatsapp.net/rsrc.php/v4iR5P4/yY/l/rt/qJYTA423gjV.js:2257:3354)\n    at Generator.next (<anonymous>)\n    at h (https://static.whatsapp.net/rsrc.php/v4/ya/r/2UMh53bUtXe.js:275:125)\n    at g (https://static.whatsapp.net/rsrc.php/v4/ya/r/2UMh53bUtXe.js:275:349)\n    at https://static.whatsapp.net/rsrc.php/v4/ya/r/2UMh53bUtXe.js:275:408\n    at new Promise (<anonymous>)\n    at Object.<anonymous> (https://static.whatsapp.net/rsrc.php/v4/ya/r/2UMh53bUtXe.js:275:277)\n    at Object.e [as sendStatusMediaMsgAction] (https://static.whatsapp.net/rsrc.php/v4iR5P4/yY/l/rt/qJYTA423gjV.js:2257:3063)\n    at <anonymous>:1:25"
        [[Prototype]]
        : 
        Error 
     */

    // it('should be able to post image status (stories)', async function () {
    //     this.timeout(35000);
    //     const media = new MessageMedia(
    //         'image/png',
    //         'iVBORw0KGgoAAAANSUhEUgAAAV4AAACWBAMAAABkyf1EAAAAG1BMVEXMzMyWlpacnJyqqqrFxcWxsbGjo6O3t7e+vr6He3KoAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAEcElEQVR4nO2aTW/bRhCGh18ij1zKknMkbbf2UXITIEeyMhIfRaF1exQLA/JRclslRykO+rs7s7s0VwytNmhJtsA8gHZEcox9PTs7uysQgGEYhmEYhmEYhmEYhmEYhmEYhmEYhmEYhmEYhmEYhmGYr2OWRK/ReIKI8Zt7Hb19wTcQ0uTkGh13bQupcw7gPOvdo12/5CzNtNR7xLUtNtT3CGBQ6g3InjY720pvofUec22LJPr8PhEp2OMPyI40PdwWUdronCu9yQpdPx53bQlfLKnfOVhlnDYRBXve4Ov+IZTeMgdedm0NR+xoXJeQvdJ3CvziykSukwil16W/Oe7aGjIjqc/9ib4jQlJy0uArtN4A0+cvXFvDkmUJ47sJ1Y1ATLDNVXZkNPIepQzxy1ki9fqiwbUj/I+64zxWNzyZnPuhvohJ9K70VvXBixpcu2SAHU+Xd9EKdEJDNpYP3AQr3bQSpPQ6Y6/4dl1z7ZDbArsszjA7L0g7ibB0CDcidUWVoErvIMKZh2Xs0LUzcLW6V5NfiUgNEbaYmAVL6bXl0nJRc+1S72ua/D/cTjGPlQj7eUqd7A096rYlRjdPYlhz7VIvxpVG3cemDKF+WAwLY/6XelOZKTXXzsC4xvDjjtSN6kHLhLke6PrwM8h1raf40qjrGO7H9aTEbduucjS04ZrYU/4iuS5Z2Hdt0rvCLFdmLEXcU30AGddST62o+sLcf5l6k7CP+ru4pLYqX/VFyxbm/utQbx/r22ZEbTb2f5I2kns1Y1OQR8ZyofX+TjJxj1Rz7QQVnf1QzR26Oth0ueJVYcRP6ZUPac/Rx/5M6ixO1dhSrT3Y1DpiYmx3tF4ZUdpz9LD/dSg9PXES0LB71BwcGjKROuV28lnvnv7HHJsezheBGH5+X2CfSfRbMKW+5aGs3JFjMrjGibJc0S7TJzqjHrh2hDybj9XRXNZa89Aro55XBdbW5wti2c/5WJ7jJ1RolVUn/HWpb0I58Tziup6Rx7Dm2hnbRP1GM9PW/NFmQ4PtVRVN63Wvxfmu5sowDMMwDMMwDMMwDMMwDMMwDMMwzL+CpT//F/6beoV8zb2Jmt4Qryx6lTUCsENQ75HOkhXAO3EPVgyQtKtUy3C/e+FJg17Zjnew1Xrdb9InbG4WqfUAftG+WhLwPVyfg536+MU7m4C1CMk4ZznpXZzDYI1PDL2nS1hpvc5cNd7E2sJg05Fe7/7d3Fln8Cvc3bwB616auxsKl4WPghjemHrDqyDWeu1UNW5s2btPnSQ75oOdunEwWazfwgVG0kqluYCM9OIjWOGnfA2b9G4Ha63XKpvQ8perTvTifJNhi6+WMWmi7smEZf6G8MmhlyGq+NqP8GV84TLuJr7UIQVx+bDEoEpRZIz42gs40OuN4Mv8hXzelV7KX1isH+ewTWckikyVv+CfHuqVF7I16gN0VKypX6wPsE+zFPzkinolU9UH8OMGvSpnZqKsv13p/RsMun6X5x/y2LeAr8O66lsBwzBMP/wJfyGq8pgBk6IAAAAASUVORK5CYII='
    //     );
    //     const status = await client.sendStatus('Hello world!', {
    //         sendVideoAsGif: false,
    //         caption: 'Hello world!',
    //         media,
    //     });
    //     expect(typeof status).to.equal('object');
    //     expect(status.messageSendResult).to.equal('OK');
    // });
});
