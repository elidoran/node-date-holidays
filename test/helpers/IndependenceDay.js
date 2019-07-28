'use strict'

module.exports = {
  mainInfo: { // for July 4th on a business day
    name: 'Independence Day',
    public: true,
    bank: true, // when the main day occurs on a business day then bank=true.
  },

  observedInfo: { // for July 3rd/5th observing holiday on a business day.
    name: 'Independence Day (observed)',
    public: true,
    bank: true, // the observed day is always a business day so bank=true.
  },

  mainInfoWhenObserved: { // for July 4th on a weekend day.
    name: 'Independence Day',
    public: true,
    bank: false, // when observed on another day, that day is bank=false.
  },

  dateRange: [
    [ 6, 3, 5 ] // 6 = July; 3-5 is range of dates which can be Independence Day.
  ],

  // only called for July 3rd, 4th, and 5th.
  // so, we only care about returning if it's:
  //   1. the main holiday (4th) on a business day
  //   2. the main holiday (4th) on a non-business day
  //   3. the observed holiday (always a business day)
  is: function isIndependenceDay(date, day, month) {

    const weekday = date.getDay()

    // return:
    //  0 - not a match
    //  1 - is the main holiday on a business day
    //  2 - is the observed holiday on a business day
    //  3 - is the main holiday on a weekend day
    switch(day) {
      case 3: return (weekday === 5) ? 2 : 0  // Friday July 3rd is "observed"
      case 4: return (1 <= weekday && weekday <= 5) ? 1 : 3
      case 5: return (weekday === 1) ? 2 : 0  // Monday July 5th is "observed"
      default: return 0
    }
  },

  gen: function generateIndependenceDay(year) {

    const mainDate = new Date(year, 6, 4) // July is '6' for Date's Months 0-11

    switch(mainDate.getDay()) {
      case 0: // it's a Sunday, so, observe on Monday
        mainDate.observed = new Date(year, 6, 5)
        break

      case 6: // it's a Saturday, so, observe on Friday
        mainDate.observed = new Date(year, 6, 3)
        break
    }

    return mainDate
  },
}
