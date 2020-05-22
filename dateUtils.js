module.exports = {
  pad: function (n) {
    return n < 10 ? '0'+n : n;
  },

  currDate: function () {
    let date = new Date();
    let y = date.getFullYear();
    let m = this.pad(date.getMonth() + 1);
    let d = this.pad(date.getDate());
    return `${y}-${m}-${d}`;
  },

  currTime: function () {
    let date = new Date();
    let h = this.pad(date.getHours());
    let m = this.pad(date.getMinutes());
    let s = this.pad(date.getSeconds());
    return `${h}:${m}:${s}`;
  }
};
