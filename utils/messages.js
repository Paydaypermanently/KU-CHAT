const moment = require("moment");

function formatMessage(username, text) {
  //message 객체를 만들어서 반환해주는 함수
  return {
    username,
    text,
    time: moment().format("h:mm a"),
  };
}

module.exports = formatMessage;
