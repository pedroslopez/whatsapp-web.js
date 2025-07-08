'use strict';

const path = require('path');
const fs = require('fs');
const BaseAuthStrategy = require('./BaseAuthStrategy');

/**
 * Local directory-based authentication
 * @param {object} options - options
 * @param {string} options.clientId - Client id to distinguish instances if you are using multiple, otherwise keep null if you are using only one instance
 * @param {string} options.dataPath - Change the default path for saving session files, default is: "./.wwebjs_auth/" 
 * @param {number} options.rmMaxRetries - Sets the maximum number of retries for removing the session directory
*/
class LocalAuth extends BaseAuthStrategy {
    constructor({ clientId, dataPath, rmMaxRetries }={}) {
        super();

        const idRegex = /^[-_\w]+$/i;
        if(clientId && !idRegex.test(clientId)) {
            throw new Error('Invalid clientId. Only alphanumeric characters, underscores and hyphens are allowed.');
        }

        this.dataPath = path.resolve(dataPath || './.wwebjs_auth/');
        this.clientId = clientId;
        this.rmMaxRetries = rmMaxRetries ?? 4;
    }

    async beforeBrowserInitialized() {
        const puppeteerOpts = this.client.options.puppeteer;
        const sessionDirName = this.clientId ? `session-${this.clientId}` : 'session';
        const dirPath = path.join(this.dataPath, sessionDirName);

        if(puppeteerOpts.userDataDir && puppeteerOpts.userDataDir !== dirPath) {
            throw new Error('LocalAuth is not compatible with a user-supplied userDataDir.');
        }

        fs.mkdirSync(dirPath, { recursive: true });
        
        this.client.options.puppeteer = {
            ...puppeteerOpts,
            userDataDir: dirPath
        };

        this.userDataDir = dirPath;
    }

    async logout() {
        if (this.userDataDir) {
            // Función auxiliar para esperar
            const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
            
            // Intentar cerrar completamente el navegador antes de eliminar archivos
            try {
                if (this.client && this.client.pupBrowser && this.client.pupBrowser.isConnected()) {
                    await this.client.pupBrowser.close();
                    // Dar tiempo para que todos los procesos se cierren
                    await wait(2000);
                }
            } catch (err) {
                console.warn('Warning: Failed to close browser properly before logout:', err.message);
            }
            
            // Intentar eliminar el directorio con reintentos mejorados para Windows
            const maxRetries = this.rmMaxRetries || 4;
            let lastError = null;
            
            for (let attempt = 1; attempt <= maxRetries; attempt++) {
                try {
                    await fs.promises.rm(this.userDataDir, { 
                        recursive: true, 
                        force: true, 
                        maxRetries: 2 // Reintentos internos de fs.rm
                    });
                    
                    // Si llegamos aquí, la eliminación fue exitosa
                    console.log(`Session directory removed successfully on attempt ${attempt}`);
                    return;
                    
                } catch (error) {
                    lastError = error;
                    
                    // Verificar si es un error específico de Windows (EBUSY, ENOTEMPTY, EPERM)
                    const isWindowsLockError = error.code === 'EBUSY' || 
                                             error.code === 'ENOTEMPTY' || 
                                             error.code === 'EPERM';
                    
                    if (isWindowsLockError && attempt < maxRetries) {
                        const delay = Math.min(1000 * attempt, 5000); // Delay progresivo, máximo 5 segundos
                        console.warn(`Attempt ${attempt}/${maxRetries}: Files are locked, retrying in ${delay}ms...`);
                        await wait(delay);
                        continue;
                    }
                    
                    // Si no es un error de Windows o ya agotamos los reintentos, salir del loop
                    break;
                }
            }
            
            // Si llegamos aquí, todos los intentos fallaron
            if (lastError) {
                // Verificar si es un error de archivos bloqueados en Windows
                if (lastError.code === 'EBUSY' || lastError.code === 'ENOTEMPTY' || lastError.code === 'EPERM') {
                    console.warn(`Warning: Could not remove session directory after ${maxRetries} attempts due to locked files. This is common on Windows and the files will be cleaned up on next session start.`);
                    console.warn(`Directory: ${this.userDataDir}`);
                    console.warn(`Error: ${lastError.message}`);
                    
                    // No lanzar el error, solo advertir
                    return;
                } else {
                    // Para otros tipos de errores, sí lanzar la excepción
                    console.error('Failed to remove session directory:', lastError.message);
                    throw new Error(`Failed to remove session directory: ${lastError.message}`);
                }
            }
        }
    }

}

module.exports = LocalAuth;
