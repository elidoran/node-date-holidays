module.exports = function generateIndependenceDay(year) {

  var mainDate = new Date(year, 6, 4) // July is '6' for Date's Months 0-11

  var holiday = {
    info: {
      name: 'Independence Day',
      public: true,
      // `bank` is only true if it is Mon-Fri, otherwise, the "observed" day is
      // the bank holiday. it's calculated below
      bank: false
    },
    date: {
      month: 6, // 6 is for July (months are 0-11)
      day  : 4
    }
  }

  // get the day of the week so we can determine if we should make an
  // observed holiday
  var day = mainDate.getDay()

  // by default the holiday is on July 4th, no change
  var observed = 0

  // if day is Sunday then add 1 day for "observed" holiday on Monday
  if (day === 0) observed = 1

  // if day is Saturday then subtract 1 day for "observed" holiday on Friday
  else if (day === 6) observed = -1

  // else the main holiday is the only holiday, no "observed" holiday,
  // and it's a bank holiday
  else holiday.info.bank = true

  // set the observed info into the
  // change the date from the 4th using the value of `observed`
  if (observed !== 0) {
    // array of holidays
    return [
      holiday,
      {
        info: { // the `info` for the "observed" holiday
          name: 'Independence Day (Observed)',
          public: true,
          bank: true, // if it's observed then it's a bank holiday
          observed: true
        },
        date: {
          month: 6,
          day  : 4 + observed
        }
      }
    ]
  }

  else {
    // no array, just the one holiday
    return holiday
  }

}
