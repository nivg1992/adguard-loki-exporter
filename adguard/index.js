const axois = require('axios');
const fs = require('fs');
const logger = require('../logger');

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
            while(currentLastLogDate !== lastLogDate) {
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
                olderThan = res.data.oldest;
            }

            if(logs.length > 0) {
                if(await callback(logs)) {
                    fs.writeFileSync(this.pointerFilePath, logs[0].time);
                }
            }
        } catch(e) {
            logger.error(e);
        }
    }
}

module.exports = AdguardApi;