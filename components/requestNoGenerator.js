const requestNoFormat = require('dateformat');

const generateReqNo = (request) => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff =
    now -
    start +
    (start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000;
  const oneDay = 1000 * 60 * 60 * 24;
  const day = Math.floor(diff / oneDay);

  return `${request}${day}${requestNoFormat(new Date(), 'yyHHMMss')}`;
};

module.exports = generateReqNo;
