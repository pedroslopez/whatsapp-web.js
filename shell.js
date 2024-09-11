/**
 * ==== wwebjs-shell ====
 * Used for quickly testing library features
 * 
 * Running `npm run shell` will start WhatsApp Web with headless=false
 * and then drop you into Node REPL with `client` in its context. 
 */

const repl = require('repl');

const { Client, LocalAuth } = require('./index');

const client = new Client({
    puppeteer: { headless: false }, 
    authStrategy: new LocalAuth({clientId: 'client-one'})
});
async function correcoesPuppeteer() {
    const pages = await client.pupBrowser?.pages();
    if (!pages) return;

    let page = pages[0];
    if (!page) return;
    //Isso aqui evita que um alert de 'tem certeza que deseja recarregar' fique travando o client
    page.once('dialog', (dialog) => {
        console.log('dialog', dialog);
        if (dialog.type() === 'beforeunload') {
            dialog.dismiss();
            // Remover o evento de beforeunload para evitar diálogos subsequentes
            page.evaluate(() => {
                window.onbeforeunload = null;
            });
        }
    });
    //Isso aqui evita que o client fique travado quando a página dá erro
    page.on('response', async (response) => {
        if (response.status() == 429 && response.url() == 'https://web.whatsapp.com/') {
            console.warn(`[${this}] Detected ${response.status()} ${response.statusText()}: ${response.url()}. ${response.text()} Vou fazer reload em 5s`, {
                clientId: this.clientId,
                user: this.user
            });
            await this.abortReadyTimeout();
            await new Promise(resolve => setTimeout(resolve, 5000));
            console.warn(`[${this}] Fazendo reload da página`, { clientId: this.clientId, user: this.user });
            await page.reload();
            return;
        }
    });

    page.on('error', (error) => {
        console.warn(`[${this}] Erro no puppeteer: ${error}`, { clientId: this.clientId, user: this.user });
    });

    client.once('ready', () => {
        setTimeout(async () => {
            await page
                .evaluate(() => {
                    document.querySelectorAll('span[data-icon="x"]').forEach((span) => {
                        const button = span.closest('button');
                        if (button) {
                            button.click();
                        }
                    });
                })
                .catch((error) => {
                    console.warn(`[${this}] Erro ao executar script para fechar popups: ${error}`, { clientId: this.clientId, user: this.user });
                });
        }, 20000);
    });
}
console.log('Initializing...');

client.initialize();

client.on('qr', () => {
    console.log('Please scan the QR code on the browser.');
});

client.on('authenticated', async () => {
    await correcoesPuppeteer();
    console.log('Authenticated');
});
client.on('message_create', (message) => {
    console.log(message.body);
});
client.on('erro', (error) => {
    console.error(JSON.stringify(error));
});
client.on('ready', () => {
    const shell = repl.start('wwebjs> ');
    shell.context.client = client;
    shell.on('exit', async () => {
        await client.destroy();
    });
});
