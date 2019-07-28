'use strict'

module.exports = {
  mainInfo: { // for July 4th on a business day
    name: 'Valentine\'s Day',
    public: true,
  },

  month: 1, // February is '1' for Date's Months 0-11

  day: 14,

  gen: function generateValentinesDay(year) {

    const mainDate = new Date(year, 1, 14) // February is '1' for Date's Months 0-11

    return mainDate
  },
}
