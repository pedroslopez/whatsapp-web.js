/**
 * ==== wwebjs-shell ====
 * Used for quickly testing library features
 * 
 * Running `npm run shell` will start WhatsApp Web with headless=false
 * and then drop you into Node REPL with `client` in its context. 
 */

const repl = require('repl');

const { ClientManager, LocalAuth } = require('./index');

// Start: Multiple Clients
const initiateClient = async (clientManager, key) => {
    const client = await clientManager.createClient({
        authStrategy: new LocalAuth({
            clientId: key,
        }),
    });

    client.on('qr', () => {
        console.log('Please scan the QR code on the browser.');
    });

    client.on('authenticated', (session) => {
        console.log(JSON.stringify(session));
    });
    
    client.on('ready', () => {
        const shell = repl.start('wwebjs> ');
        shell.context.client = client;
        shell.on('exit', async () => {
            await client.destroy();
        });
    });

    client.initialize().catch(error => {
        console.error('WhatsApp Client Initialization Error: ', JSON.stringify(error));
    });

    return client;
};

// Function to convert bytes to megabytes (MB)
function bytesToMB(bytes) {
    return (bytes / (1024 * 1024)).toFixed(2);  // Converts bytes to MB and keeps 2 decimal places
}
  
// Function to calculate CPU usage in percentage
function calculateCPUPercentage(cpuUsage) {
    return ((cpuUsage.user + cpuUsage.system) / 1000).toFixed(2); // Convert microseconds to milliseconds and calculate percentage
}

function logUsage(process) {
    // Log memory and CPU usage at regular intervals
    setInterval(() => {
        // Memory usage
        const memory = process.memoryUsage();
        const rss = bytesToMB(memory.rss);  // Resident Set Size (Total memory used)
        const heapTotal = bytesToMB(memory.heapTotal);  // Total heap memory
        const heapUsed = bytesToMB(memory.heapUsed);  // Heap memory used
        const external = bytesToMB(memory.external);  // Memory used by C++ objects
    
        // CPU usage
        const cpu = process.cpuUsage();
        const cpuPercentage = calculateCPUPercentage(cpu);  // Sum of user + system CPU time in percentage
    
        // Output to console
        console.log(`
            Memory Usage (in MB):
            RSS: ${rss} MB
            Heap Total: ${heapTotal} MB
            Heap Used: ${heapUsed} MB
            External: ${external} MB
        
            CPU Usage (in Percentage):
            ${cpuPercentage} % (User + System)

            =====================================
        `);
    }, 1000);  // Logs every 1 second
}

const run = async () => {
    const clientManager = new ClientManager({
        puppeteer: {
            dumpio: true,
            headless: false,
        },
        authStrategy: new LocalAuth()
    });
    
    await clientManager.initialize();
    
    console.log(clientManager.browser.process().pid);
    // logUsage(clientManager.browser.process());

    const client1 = await initiateClient(clientManager, 'client1');
    const client2 = await initiateClient(clientManager, 'client2');

    const shell = repl.start('wwebjs> ');
    shell.context.client1 = client1;
    shell.context.client2 = client2;
    shell.context.clientManager = clientManager;
    shell.on('exit', async () => {
        await client1.destroy();
        await client2.destroy();
    });
};

run();
