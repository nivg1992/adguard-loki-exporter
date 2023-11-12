const cron = require('node-cron');
const { program } = require('commander');
const geoip = require('geoip-lite');
const logger = require('./logger');
const AdguardApi = require('./adguard/index');
const LokiApi = require('./loki/index');


logger.info('--------  boot --------')

program
  .option('-aurl, --adguard-url <char>', 'Adguard URL', process.env.ADGUARD_URL)
  .option('-auser, --adguard-user <char>', 'Adguard user', process.env.ADGUARD_USER)
  .option('-apass, --adguard-password <char>', 'Adguard password', process.env.ADGUARD_PASSWORD)
  .option('-lurl --loki-url <char>', 'Loki', process.env.LOKI_URL)
  .option('-cron --cron-schedule <char>', 'Corn Job schedule', process.env.CRON_SCHEDULE || '* * * * *');

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

const adguardApi = new AdguardApi(options.adguardUrl, options.adguardUser, options.adguardPassword);
const lokiApi = new LokiApi(options.lokiUrl);

const syncLogs = () => {
    adguardApi.getLogs(async (logs) => {
        const logsFlatten = logs.map((log) => {
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
        })
        
        await lokiApi.push(logsFlatten);
        return true;
    });
}

syncLogs();

cron.schedule(options.cronSchedule, () => {
    syncLogs();
});
