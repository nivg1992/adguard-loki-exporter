const axios = require('axios');
const logfmt = require('logfmt');
const moment = require("moment-timezone");
const logger = require('../logger');

class LokiApi {
    constructor(url, tz) {
        this.url = url;
        this.tz = tz;
    }

    async push(logs) {
        const res = await axios.post(`${this.url}/loki/api/v1/push`, {
            streams: [
                {
                    stream: {
                        process: "adguard"
                    },
                    values: logs.map((log) => {
                        const unixTimestampNanoseconds = moment.utc(log.time).tz(this.tz).valueOf() * 1e6;
                        return [unixTimestampNanoseconds.toString(), logfmt.stringify(log)]
                    })
                }
            ]
        });
        
        if(res.status === 204) {
            logger.debug(`Write ${logs.length} to the loki successfully`);
        }
    }
}

module.exports = LokiApi;