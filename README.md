# @date/holidays
[![Build Status](https://travis-ci.org/elidoran/node-date-holidays.svg?branch=master)](https://travis-ci.org/elidoran/node-date-holidays)
[![npm version](https://badge.fury.io/js/%40date%2Fholidays.svg)](http://badge.fury.io/js/%40date%2Fholidays)
[![Coverage Status](https://coveralls.io/repos/github/elidoran/node-date-holidays/badge.svg?branch=master)](https://coveralls.io/github/elidoran/node-date-holidays?branch=master)

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
      // the bank holiday. it's calculated below
    },
    date: {
      month: mainDate.getMonth(),
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

// create the `info` object once:
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
  var date = new Date(year, 0, 1)

  var holiday = {
    info: info,
    date: { // get date info from our generated `date` instance
      month: date.getMonth()
      day  : date.getDate()
    }
  }

  switch (date.getDay()) {
    case 0: // move from Sunday to Monday (or next business day)
      biz.nextBusinessDay(date)
      break
    case 6: // move from Saturday to Friday (or previous business day)
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

There are two ways to add a holiday, one for a simple fixed date holiday and one for a holiday which requires calculating its date.

For a simple fixed date you can specify an object with the `info` and `date` properties and the `add()` function will create the generator function. It will return that function so it can be stored and used with the `remove()` function to remove it.

For a calculated date, specify a function which accepts a single argument, the year, and returns an object containing the `info` and the `date` of the holiday, or, an array of those objects for multiple holidays.

It's acceptable to calculate many holidays in one generator function and return them all in an array. See the [@date/holidays-us](https://github.com/elidoran/node-date-holidays-us/blob/853e88ba8cbf978643b55109070b4a856e85a5e0/lib/index.coffee#L133) for an example.

The `info` is used in two places:

1. as the return value of `getHoliday()`
2. for comparison of extra properties given to `isHoliday()` and `getHoliday()` as "filters"


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

Specify a previously added generator function and it will be removed.

Note, any holidays already generated by the generator will still be in the cache. You must purge them if they are no longer wanted.

Note, when adding a fixed date using an object, instead of a function, the function created is returned from `add()` as the key to use for `remove()`.

```javascript
fn = someGeneratorFunction()

holidays.add(fn)

holidays.remove(fn)

// this will return the generated function for the `date` provided
fn = holidays.add({
  info: { /* some info */ },
  date: { month: 3, day: 9 }
})

// so you can remove it:
holidays.remove(fn)
```

### API: isHoliday()

Returns false unless it is aware of a holiday on the specified date.

Note, all holiday generators will be called to create holidays for the year of the specified `Date` argument.

Extra criteria can be specified and the holiday's `info` will be tested for those values. All specified values must exist in the `info` for it to return true.

For example, to check if a holiday is a bank holiday do:

```javascript
var date = getSomeDate()

// These calls return true only if the `date` is a holiday with
// bank=true in its info.

// version 1, provide the date and then the extra comparison properties.
holidays.isHoliday(date, { bank: true })

// version 2, provide the date as a property in with the
// extra comparison properties.
holidays.isHoliday({ date: date, bank: true })

// version 3, provide the date as the second argument instead.
// this is currying friendly.
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

### API: purge functions

The `holidays` instance caches calculated holidays by year. The purge functions help remove cached holiday info.

When using the *purge* functions it nulls the value and leaves the year property in the cache. Over time this will build up keys without a value. (As opposed to using `delete` on the keys which is undesirable.)

One exception is the `purge()` function. It creates a brand new cache object with no properties.

The purge functions:

1. `purge()` - replaces cache with a new empty one
2. `purgeYear()` - accepts one argument, a number, and nullifies that year's holidays
3. `purgeYears()` - accepts multiple arguments, either a number or an array of numbers, and nullifies each year's holidays
4. `purgeYearRange()` - accepts two arguments, both numbers, as the from/to range (inclusive) to purge

```javascript
// delete them all.
// Note: creates a new cache object.
holidays.purge()

// delete one specific year.
// Note, the `2016` property remains with a null value.
holidays.purgeYear(2016)

// delete multiple years (specified as arguments).
// Note, the three years remain as properties with a null value.
holidays.purgeYears(2005, 2012, 2013)

// delete multiple years specified with an array.
// Note, the three years remain as properties with a null value.
holidays.purgeYears([2001, 2004, 2008])

// delete all years within inclusive range.
// deletes years 2009 through 2018, including both 2009 and 2018.
// Note, each year's property remains with a null value.
holidays.purgeYearRange(1999, 2018)
```

### API: compact()

The `holidays` instance caches calculated holidays by year. When using the *purge* functions it nulls the value and leaves the year property in the cache. Over time this will build up keys without a value.

Calling `compact()` will replace the current cache with a new one containing only those years with defined values; eliminating those with null values.

```javascript
// will cause holidays in 2001 to be generated and cached.
holidays.isHoliday(2001)

// purge that year and its value will be null.
holidays.purgeYear(2001)

// do the above many times and there will be lots of keys in the cache with null values.

// eliminate all those keys without values:
holidays.compact()
```


## [MIT License](LICENSE)
