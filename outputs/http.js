const axios = require('axios');
const logfmt = require('logfmt');
const moment = require("moment-timezone");
const logger = require('../logger');

class HttpApi {
    constructor(url) {
        this.url = url;
    }

    async push(logs) {
        const res = await axios.post(`${this.url}/push`, logs);
        logger.debug(res.status);
        if(res.status === 200) {
            logger.debug(`Write ${logs.length} to the http successfully`);
        }
    }
}

module.exports = HttpApi;