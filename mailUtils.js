require('dotenv').config({ path: './gmail.env' });
const nm = require('nodemailer');
const dateUtils = require('./dateUtils');

const green = 'color:#00db3a;';
const red = 'color:#ff0000;';

module.exports = {
  mailTransport: nm.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS
    }
  }),

  mailOpts: function(templ) {
    return {
      from: 'syncr',
      to: process.env.GMAIL_ALERT_ADDR,
      subject: 'Syncr Nightly Log',
      html: templ
    };
  },

  formatStat: function(success) {
    let style = success ? green : red;
    let msg = success ? 'SUCCESS' : 'FAILURE';
    let span = `<span style="${style}">${msg}</span>`;
    return span;
  },

  mailTpl: function(success, msg, disk) {
    return `
<h3>Syncr Nightly Log</h3>
<p>Syncr completed a nightly job. Details available below:</p>
<div>
  <h4>Status: ${this.formatStat(success)}</h4>
  <p>Rsync Log:</p>
  <blockquote>
    <pre><code>${msg}</code></pre>
  </blockquote>
  <p>Disk Space Available:</p>
  <blockquote>
    <table style="border: 1px solid black;">
      <tr style="border: 1px solid black;">
        <td>Root</td>
        <td>${disk.rootDiskAvailable}</td>
      </td>
      <tr style="border: 1px solid black;">
        <td>Backup Disk</td>
        <td>${disk.backupDiskAvailable}</td>
      </tr>
    </table>
  </blockquote>
</div>
<hr />
<footer><small>${dateUtils.currDate()} ${dateUtils.currTime()}</small></footer>
    `;
  },

  sendMail: function(mainMsg, templ, logger) {
    this.mailTransport.sendMail(this.mailOpts(templ), (error, info) => {
      if (error) {
        logger.error('error sending email, task may have still succeeded');
        logger.debug(error, mainMsg);
      } else {
        logger.debug(`email sent successfully: ${info.response}`);
      }
    });
  }
};
