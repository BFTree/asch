/**
 * Get time from Asch epoch.
 * @param {number|undefined} time Time in unix seconds
 * @returns {number}
 */

function beginEpochTime() {
  var d = new Date(Date.UTC(2016, 5, 27, 20, 0, 0, 0));

  return d;
}

//先获取 epochTime ，epochTime 记录从 2016-5-27T20:00:00 后到某一个特定时间经过了多少秒
function getEpochTime(time) {
  if (time === undefined) {
    time = (new Date()).getTime();
  }
  var d = beginEpochTime();
  var t = d.getTime();
  return Math.floor((time - t) / 1000);
}

module.exports = {

  interval: 10,

  delegates: 101,

  getTime: function (time) {
    return getEpochTime(time);
  },

  getRealTime: function (epochTime) {
    if (epochTime === undefined) {
      epochTime = this.getTime()
    }
    var d = beginEpochTime();
    var t = Math.floor(d.getTime() / 1000) * 1000;
    return t + epochTime * 1000;
  },

  getSlotNumber: function (epochTime) {
    if (epochTime === undefined) {
      epochTime = this.getTime()
    }
    return Math.floor(epochTime / this.interval);//每过10s出现一个新的slot
  },

  getSlotTime: function (slot) {
    return slot * this.interval;
  },

  getNextSlot: function () {
    var slot = this.getSlotNumber();

    return slot + 1;
  },

  getLastSlot: function (nextSlot) {
    return nextSlot + this.delegates;
  },

  roundTime: function (date) {
    Math.floor(date.getTime() / 1000) * 1000
  }
}
