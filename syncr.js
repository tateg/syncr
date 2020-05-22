// Syncr.js - A Node.js rsync tool with email alerts
// by Tate Galbraith

const logLevel = process.env.LOG_LEVEL || 'info';

const winston = require('winston');
require('winston-daily-rotate-file');

const logFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp(),
  winston.format.align(),
  winston.format.printf(
    info => `${info.timestamp} ${info.level} ${info.message}`,
  )
)
const logger = winston.createLogger({
  format: logFormat,
  level: logLevel,
  transports: [
    new winston.transports.Console({ level: logLevel }),
    new (winston.transports.DailyRotateFile)({
      filename: './logs/syncr-%DATE%.log',
      datePattern: 'YYYY-MM-DD_HH-mm-ss',
      maxSize: '50m',
      maxFiles: '7d'
    })
  ]
});

const Rsync = require('rsync');
const disk = require('diskusage');
const dataUtils = require('./dataUtils');
const mailUtils = require('./mailUtils');

const rsyncSource = '/mnt/nas/';
const rsyncDest = '/mnt/backup_disk';
const excludes = 'Video';

const rsync = new Rsync();

logger.info('checking current disk usage');

let rootDisk = disk.checkSync('/');
let backupDisk = disk.checkSync(rsyncDest);
let diskUsage = {
  rootDiskAvailable: dataUtils.formatBytes(rootDisk.available),
  backupDiskAvailable: dataUtils.formatBytes(backupDisk.available)
};

Object.keys(diskUsage).forEach((key) => {
  logger.info(`${key} -> ${diskUsage[key]}`);
});
logger.info(`Starting Rsync from "${rsyncSource}" to "${rsyncDest}" excluding: "${excludes}"`);
logger.debug(rsync.command());

rsync.flags('avzP');
rsync.set('delete');
rsync.set('exclude', excludes);
rsync.source(rsyncSource);
rsync.destination(rsyncDest);

let logData = [];

rsync.execute(
  (error, code, cmd) => {
    logger.info('rsync job finished, sending notification');
    let templ = mailUtils.mailTpl((code === 0), logData.join(), diskUsage);
    mailUtils.sendMail(logData.toString(), templ, logger);
  },
  (data) => {
    logger.debug('rsync buffered data rec');
    logger.debug(data.toString());
    logData.push(data.toString());
  },
  (err) => {
    logger.error('rsync buffered error rec');
    logger.debug(err.toString());
    logData.push(err.toString());
  }
);
