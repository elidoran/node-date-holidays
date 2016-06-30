# @date/holidays
[![Build Status](https://travis-ci.org/elidoran/node-date-holidays.svg?branch=master)](https://travis-ci.org/elidoran/node-date-holidays)
[![Dependency Status](https://gemnasium.com/elidoran/node-date-holidays.png)](https://gemnasium.com/elidoran/node-date-holidays)
[![npm version](https://badge.fury.io/js/%40date%2Fholidays.svg)](http://badge.fury.io/js/%40date%2Fholidays)

Store and compare holiday dates.

## Install

```sh
npm install @date/holidays --save
```

## Usage: Add Simple Holiday

Some holidays are always on the same date so are easy to calculate.

```javascript
var Holidays = require('@date/holidays')
var holidays = Holidays()
// all in one: var holidays = require('@date/holidays')()

// at this point `holidays` is empty so all calls to isHoliday() return false.

// Alternate method for fixed dates which don't need a calculating function,
// just add the object the a generating function would return:
holidays.add({
  info: {
    name: 'Valentine\'s Day'
    public: true
  },
  date: { // provide both the month and day
    month: 1  // NOTE: I prefer using months as 1-12, but, Date uses 0-11
    day  : 14
  }
})
```

### Usage: Add Complicated Holiday

Some holidays require calculating when they occur, and, whether they have an "observed" date as well.

Do all the work in the generator function.

```javascript

// NOTE: This holiday is available in `@date/holidays-us`, but, I'm creating
// them here to show how to add your own holiday dates to a `holidays` instance.

// Independence Day is always on July 4th
// It has an "observed" holiday on the nearest weekday if it's on the weekend
holidays.add(function (year) { // the generator function
  // the main holiday is always the same date: July 4th
  var mainDate = new Date(year, 6, 4) // July is '6' for Date's Months 0-11

  var holiday = {
    info: {
      name: 'Independence Day',
      public: true
      // `bank` is only true if it is Mon-Fri, otherwise, the "observed" day is
      // the bank holiday. it's calculated below in the generator
    },
    date: {
      month: mainDate.getMonth()
      day  : mainDate.getDate()
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
          name: 'Independence Day (Observed)'
          public: true
          bank: true // if it's observed then it's a bank holiday
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
})
```

### Usage: Helpers

Use `@date/generator` and `@date/business` to help create the functions which calculate the dates.

```javascript
// add some holidays using @date/generator:
var gen = require('@date/generator')
var biz = require('@date/business')()

// NOTE: these holidays are available in `@date/holidays-us`, but, I'm gen'ing
// them here to show how to add your own holiday dates to a `holidays` instance.

// President's Day is the third Monday in February

// create a reusable `info` object
var info = {
  name: 'President\'s Day',  // display name
  bank: true,                // bank holiday (federal)
  public: true               // a 'public' holiday in USA
}

holidays.add(function (year) { // the `generator` function
  // generate the date using the `gen` helper
  var date = gen.third().monday().in().february().of(year)

  return {
    info: info,
    date: { // get date info from our generated `date` instance
      month: date.getMonth(),
      day  : date.getDate()
    }
  }
})

// New Year's Day is always January 1st, and, when it's on a weekend then
// it's observed on the nearby Friday or Monday

// this is how to use the generator instead of

mainInfo = {
  name  : 'New Year\'s Day',  // display name
  bank  : true,               // bank holiday (federal)
  public: true               // a 'public' holiday in USA
}

observedInfo = {
  name    : 'New Year\'s Day (Observed)', // display name
  bank    : true,                         // bank holiday (federal)
  public  : true,                         // a 'public' holiday in USA
  observed: true
}

holidays.add(function (year) { // the `generator` function
  // generate the date using the `gen` helper
  var date = gen.third().monday().in().february().of(year)

  var holiday = {
    info: info,
    date: { // get date info from our generated `date` instance
      month: date.getMonth()
      day  : date.getDate()
    }
  }

  switch (date.getDay()) {
    case 0: // move from Sunday to Monday
      biz.nextBusinessDay(date)
      break
    case 6: // move from Saturday to Friday
      biz.previousBusinessDay(date)
      break
    default: // default is for weekdays
      // case 1: // Monday
      // case 2: // Tuesday
      // case 3: // Wednesday
      // case 4: // Thursday
      // case 5: // Friday
    return holiday // return only the one holiday
  }

  return [ // return both holidays
    holiday,
    {
      info: observedInfo,
      date: {
        month: date.getMonth(),
        day  : date.getDate()
      }
    }
  ]

})
```

## API

### API: add()

Adds a holiday to the `holidays` instance.

Specify a function which accepts a single argument, the year, and returns an object containing the `info` and the `date` of the holiday.

The `info` is used in two places:

1. as the return value of `getHoliday()`
2. for comparison of extra properties given to `isHoliday()`

```javascript
holidays.add(function (year) {
  // do some work to figure out when the holiday is (or holidays)

  // for one holiday return an object containing `info` and `date` like:
  return {
    info: { // all values in `info` are optional, here are some examples:
      name: 'Holiday Name' // name the holiday
      public: true         // mark it as a public holiday
      bank  : true         // mark it as a bank holiday
    },
    date: {
      month: 0, // the month 0-11 because Date uses 0-11
      day  : 1  // day of the month, think date.getDate()
    }
  }

  // for two or more holidays return an array containing objects
  // like the one above
  return [
    // { ... },
    // { ... }
  ]
})
```


### API: remove()

Remove a holiday generator.

```javascript
fn = someGeneratorFunction()

holidays.add(fn)

holidays.remove(fn)
```

### API: isHoliday()

Returns false unless it is aware of a holiday on the specified date.

Extra criteria can be specified and the holiday's `info` will be tested for those values. All specified values must exist in the `info` for it to return true.

For example, to check if a holiday is a bank holiday do:

```javascript
var date = getSomeDate()

// version 1, provide the date and then the extra comparison properties
holidays.isHoliday(date, { bank: true })

// version 2, provide the date as a property in with the
// extra comparison properties
holidays.isHoliday({ date: date, bank: true })

// version 3, provide the date as the second argument instead
// this is currying friendly
holidays.isHoliday({ bank: true }, date)
```

### API: getHoliday()

Retrieve the holiday's `info` set into the `holidays` instance.

```javascript
// add a holiday, I'll use New Year's, but, I won't add handling of the
// "observed" New Year's
var specifiedInfo = {
  name: 'New Year\'s Day',
  public: true
}

holidays.add({
  info: specifiedInfo,
  date: {
    month: 0,
    day  : 1
  }
})

var date = new Date(2016, 0, 1) // New Year's Day, a Friday

var returnedInfo = holidays.getHoliday(date)

// the `returnedInfo` object equals the `specifiedInfo` provided to add()

// extra comparison options can be specified just like to isHoliday()

// this gets the same info as above because the holiday has `public = true`
returnedInfo = holidays.getHoliday(date, { public: true })

// this gets `false` as a result instead because the holiday
// doesn't have `bank = true` in its info
returnedInfo = holidays.getHoliday(date, { bank: true })
```

### API: purge()

The `holidays` instance caches calculated holidays by year. Clear the cache entirely by calling `purge()` or specify an array of years to delete specific years.

```javascript
// delete them all
holidays.purge()

// delete one specific year
holidays.purge(2016)

// delete multiple years
holidays.purge(2001, 2002, 2003)

// delete multiple years with an array
holidays.purge([2001, 2002, 2003])
```

## MIT License
