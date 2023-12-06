const axois = require('axios');
const fs = require('fs');
const logger = require('../logger');
const MAX_PAGES = 100;

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
                olderThan = res.data.oldest;
                pageCount++;
            }

            if(logs.length > 0) {
                if(await callback(logs)) {
                    fs.writeFileSync(this.pointerFilePath, logs[0].time);
                }
            }
        } catch(error) {
            if (error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                logger.error(error.response.data);
                logger.error(error.response.status);
                logger.error(error.response.headers);
              } else if (error.request) {
                // The request was made but no response was received
                // `error.request` is an instance of XMLHttpRequest in the browser 
                // and an instance of http.ClientRequest in node.js
                logger.error(error.request);
              } else {
                // Something happened in setting up the request that triggered an Error
                logger.error('Error', error.message);
              }
        }
    }
}

module.exports = AdguardApi;
