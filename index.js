const cron = require('node-cron');
const { program } = require('commander');
const geoip = require('geoip-lite');
const logger = require('./logger');
const AdguardApi = require('./adguard/index');
const LokiApi = require('./outputs/loki');
const HttpApi = require('./outputs/http');
const express = require('express')
const app = express()

logger.info('--------  boot --------');
logger.info(`log level: ${process.env.LOG_LEVEL}`);

program
  .option('-aurl, --adguard-url <char>', 'Adguard URL (http://127.0.0.1:8080)', process.env.ADGUARD_URL)
  .option('-auser, --adguard-user <char>', 'Adguard user', process.env.ADGUARD_USER)
  .option('-apass, --adguard-password <char>', 'Adguard password', process.env.ADGUARD_PASSWORD)
  .option('-lurl --loki-url <char>', 'Loki url (http://127.0.0.1:3100)', process.env.LOKI_URL)
  .option('-hurl --http-url <char>', 'http url (http://127.0.0.1:12203)', process.env.HTTP_URL)
  .option('-tz --timezone <char>', 'Set timezone for message to loki', process.env.TIMEZONE)
  .option('-cron --cron-schedule <char>', 'Corn Job schedule', process.env.CRON_SCHEDULE || '* * * * *')
  .option('-port --api-port <char>', 'API Port', process.env.API_PORT || '8080')
  .option('-p --pointer-path <char>', 'The pointer path', process.env.POINTER_PATH);

program.parse();

const options = program.opts();

function flattenObject(ob) {
    var toReturn = {};

    for (var i in ob) {
        if (!ob.hasOwnProperty(i)) continue;

        if ((typeof ob[i]) == 'object' && ob[i] !== null) {
            var flatObject = flattenObject(ob[i]);
            for (var x in flatObject) {
                if (!flatObject.hasOwnProperty(x)) continue;

                toReturn[i + '.' + x] = flatObject[x];
            }
        } else {
            toReturn[i] = ob[i];
        }
    }
    return toReturn;
}

if(!options.adguardUrl) {
    logger.error(`adguard url doesn't set use -aurl or ADGUARD_URL env`)
    return;
}

if(!options.lokiUrl && !options.httpUrl) {
    logger.error(`loki/http url doesn't set use -lurl/-ourl or LOKI_URL/HTTP_URL env`)
    return;
}

if(options.lokiUrl && options.httpUrl) {
    logger.error(`is able to use only one output http-url or loki-url`)
    return;
}


const adguardApi = new AdguardApi(options.adguardUrl, options.adguardUser, options.adguardPassword, options.pointerPath);
const lokiApi = new LokiApi(options.lokiUrl, options.timezone);
const httpApi = new HttpApi(options.httpUrl);
let lock = false;

const LogsEnrich = async (logs) => {
    return logs.map((log) => {
        if(log.answer && log.answer.length > 0) {
            log.answer.filter((ans) => ans.type === 'A').map((ans,index) => {
                ans.geo = geoip.lookup(ans.value);

                if(index === 0) {
                    log.geo = ans.geo;
                }
            });

            log.answer = log.answer.map(ans => `${ans.type}&${ans.value}&${ans.geo ? ans.geo.country : ""}&${ans.ttl}`).join(',');            
        }

        if(log.original_answer && log.original_answer.length > 0) {
            log.original_answer.filter((ans) => ans.type === 'A').map((ans) => {
                ans.geo = geoip.lookup(ans.value);
            });

            log.original_answer = log.original_answer.map(ans => `${ans.type}&${ans.value}&${ans.geo ? ans.geo.country : ""}&${ans.ttl}`).join(',');
        }
        
        return {
            ...flattenObject(log),
        }
    });
}

const syncLogs = async () => {
    if(lock) {
        return;
    }
  
    lock = true;
    await adguardApi.getLogs(async (logs) => {
        const logsFlatten = await LogsEnrich(logs);
        await Promise.all([
            options.lokiUrl ? lokiApi.push(logsFlatten) : true,
            options.httpUrl ? httpApi.push(logsFlatten) : true,
        ])
           
        return true;
    });
    lock = false;
}

syncLogs();

cron.schedule(options.cronSchedule, () => {
    syncLogs();
});


app.get('/health', (req, res) => {
   res.status(200).send({'message':'OK'});
})

app.listen(options.apiPort, () => {
    logger.info(`listening on port ${options.apiPort}`)
})