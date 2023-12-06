const axois = require('axios');
const fs = require('fs');
const logger = require('../logger');
const MAX_PAGES = 1000;
const CHUNK_SIZE = 500;

function isValidDate(d) {
    return d instanceof Date && !isNaN(d);
}

class AdguardApi {
    constructor(url, user, pass, pointerFilePath = './pointer-adguard') {
        this.url = url;
        this.user = user;
        this.pass = pass;
        this.pointerFilePath = pointerFilePath;

        if(!fs.existsSync(pointerFilePath)) {
            fs.writeFileSync(this.pointerFilePath, "");
        }
    }

    async getLogs(callback) {
        try {
            let currentLastLogDate = "default";
            let lastLogDate = fs.readFileSync(this.pointerFilePath).toString().trim();
            let olderThan;
            const logs = [];
            let pageCount = 0;
            while(currentLastLogDate !== lastLogDate && pageCount !== MAX_PAGES) {
                logger.debug(`Page: ${pageCount}`);
                const res = await axois.get(`${this.url}/control/querylog?${olderThan ? `older_than=${olderThan}` : ""}`, {auth: { username:this.user, password: this.pass}});
                for(const log of res.data.data) {
                    currentLastLogDate = log.time
                    if(currentLastLogDate !== lastLogDate) {
                        logs.push(log);
                    } else {
                        break;
                    }
                }
                if(lastLogDate === "") {
                    lastLogDate = currentLastLogDate
                }
                logger.debug(`olderThan: ${olderThan}`);
                logger.debug(`logs count: ${logs.length}`);
                
                if(res.data.oldest === "") {
                    break;
                }
                
                olderThan = res.data.oldest;
                pageCount++;
            }

            if(logs.length > 0) {
                logs.reverse();
                for (let i = 0; i < logs.length; i += CHUNK_SIZE) {
                    const chunk = logs.slice(i, i + CHUNK_SIZE);
                    if(await callback(chunk)) {
                        const last = chunk.slice(-1)[0];
                        logger.debug(last);
                        fs.writeFileSync(this.pointerFilePath, last.time);
                    } else {
                        throw new Error('callback failed');
                    }
                }
            }
        } catch(error) {
            if (error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                logger.error('Error Response');
                logger.error(error.response.data);
                logger.error(error.response.status);
                logger.error(error.response.headers);
              } else if (error.request) {
                // The request was made but no response was received
                // `error.request` is an instance of XMLHttpRequest in the browser 
                // and an instance of http.ClientRequest in node.js
                logger.error('Error request');
                logger.error(error.request);
              } else {
                // Something happened in setting up the request that triggered an Error
                logger.error('Error', error.message, error.stack);
              }
        }
    }
}

module.exports = AdguardApi;
