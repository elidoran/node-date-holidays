# @date/holidays
[![Build Status](https://travis-ci.org/elidoran/node-date-holidays.svg?branch=master)](https://travis-ci.org/elidoran/node-date-holidays)
[![npm version](https://badge.fury.io/js/%40date%2Fholidays.svg)](http://badge.fury.io/js/%40date%2Fholidays)
[![Coverage Status](https://coveralls.io/repos/github/elidoran/node-date-holidays/badge.svg?branch=master)](https://coveralls.io/github/elidoran/node-date-holidays?branch=master)

Test if dates are holidays and manage info related to the holidays.

Note, version 0.4.0 changed the API due to a complete rewrite. Use the old API by installing the latest patch version of 0.3.


## Install

```sh
npm install --save @date/holidays
```

## Usage: Add Simple Holiday

Some holidays are always on the same date so are easy to specify.

```javascript
const Holidays = require('@date/holidays')
const holidays = Holidays()
// all in one: const holidays = require('@date/holidays')()

// at this point `holidays` is empty so all calls to isHoliday() return false.

// simplest method for fixed dates only requires the month and day.
const removerFn = holidays.add({
  mainInfo: { // optional, defaults to an empty object.
    name: 'Valentine\'s Day',
    public: true,
  },
  // provide both the month and day
  month: 1,  // NOTE: I prefer using months as 1-12, but, Date uses 0-11
  day  : 14,
})

// You can remove the holiday from the holidays instance by calling its remover.
// it will remove the function and its cache (if it's a caching holiday).
removerFn()
```

### Usage: Add Complicated Holiday

Some holidays require calculating when they occur, and, whether they have an "observed" date as well.

Specify the range of dates the holiday can occur on and an `is()` function to test whether a `Date` is a holiday.

```javascript
// this holiday is available as: @date/IndependenceDay
// Independence Day is always on July 4th
// It has an "observed" holiday on the nearest weekday if it's on the weekend
holidays.add({
  // first way to specify the holiday's date range.
  month: 6, // July is 6 because Date because 0-11
  firstDay: 3,
  lastDay: 5,

  // // second way allows specifying multiple date ranges (as for New Year's Day)
  // dateRange: [ // each element is an array with a range or individual date.
  //   // this means July 3rd through July 5th.
  //   [ 6, 3, 5 ]
  //
  //   // an individual day would be:
  //   // [ 11, 31 ] // for December 31st (not relevant for Independence Day)
  // ],

  mainInfo: { // optional holiday info; defaults to {}
    name: 'Independence Day',
    public: true, // it's a public holiday in USA
    bank: true, // it's a bank holiday in USA when it's on a weekday.
  },

  observedInfo: { // optional info for the observed days; defaults to `mainInfo`.
    name: 'Independence Day (observed)',
    public: true,
    bank: true, // the observed date is always a bank holiday.
  },

  mainInfoWhenObserved: { // optional info when main date is on a weekend; defaults to `mainInfo`.
    name: 'Independence Day',
    public: true,
    bank: false, // when it's on the weekend it's not a bank holiday (the observed is)
  },

  // `date` is the `Date` instance.
  // the other args are taken from the Date instance and used multiple times
  // so they are provided as a convenience so you don't have to call those
  // getters again.
  // `year` is the "full year" 4-digits.
  is: function isIndependenceDay(date, day, month, year) {

    // get the weekday so we can see if it's the main, observed, or neither.
    const weekday = date.getDay()

    // return:
    //  0 - not a match
    //  1 - is the main holiday on a business day
    //  2 - is the observed holiday on a business day
    //  3 - is the main holiday on a weekend day
    switch(day) {
      // 3 for July 3rd which is the observed holiday when it's a Friday
      case 3: return (weekday === 5) ? 2 : 0  // Friday July 3rd is "observed"

      // 4 for July 4th, always a holiday, but is either main, or "main when observed"
      case 4: return (1 <= weekday && weekday <= 5) ? 1 : 3

      // 5 for July 5th which is the observed holiday when it's a Monday
      case 5: return (weekday === 1) ? 2 : 0  // Monday July 5th is "observed"

      // otherwise, not a match for the holiday.
      default: return 0
    }
  },
})

// New Year's spans multiple months and multiple years because
// it can be observed on the day before which is December 31st.
// we support this with the `dateRange` property.
holidays.add({
  // all three "info" objects are optional.
  dateRange: [
    [ 12, 31 ],  // specific day: December 31st
    [ 0, 1, 2 ], // range of days: January 1st to 2nd
  ],
  is: (date, day, month, year) => {
    // Holidays ensures the date we receive is within the range we specified.
    // so, we need to look at the day of week to determine our result.
    const weekday = date.getDay()

    switch(day) {
      case 31: // only the observed holiday if it's a Friday
        return (weekday === 5) ? 2 : 0

      case 1: // always main holiday date, might be on weekend/weekday
        return (1 <= weekday && weekday <= 5) ? 1 : 3

      case 2: // only the observed holiday if it's a Monday
        return (weekday === 1) ? 2 : 0

      default: // otherwise, not a match
        return 0
    }
  },
})

// a date may not have a set number which requires more processing.
holidays.add({
  mainInfo: {
    name: 'Father\'s Day',
  },

  // it's the third Sunday in June.
  // so, month is 5 because Date uses 0-11,
  // and, the days it could be on are June 15th to 21st.
  dateRange: [
    [ 5, 15, 21 ]
  ],

  is: function isFathersDay(date, day, month, year) {
    // Holidays ensures it's within the date range we specified.
    // so, is it a Sunday?
    return (date.getDay() === 0) ? 1 : 0
  },
})
```

### Usage: Helpers

When working with dates [@date/generator](https://github.com/elidoran/node-date-generator) and [@date/business](https://github.com/elidoran/node-date-business) help.

The individual holidays I'm publishing will all have a `gen(year)` function which returns a `Date` instance for that holiday in the specified year. It may also have an `observed` property set on it with the `Date` that holiday is "observed" in that year. This is what was used in the previous version of `@date/holidays`. The `@date/generator` package is helpful for that.

The `@date/business` package is helpful for changing a date to the next or previous business day. It accepts a `Holidays` instance so it will skip over holiday dates.


## API

### API: isHoliday()

Returns false unless it is aware of a holiday on the specified date.

Extra criteria can be specified and the holiday's `info` will be tested for those values. All specified values must exist in the `info` for it to return true.

```javascript
const date = getSomeDate() // a `Date` object

// test the date without filters, returns true/false
holidays.isHoliday(date)

// test the date with a single filter, returns true/false
holidays.isHoliday(date, { some: 'thing' })

// now with two filters:
holidays.isHoliday(date, { some: 'thing', something: 'else' })
```

### API: getHoliday()

Get an array of holiday "info" for all holidays on a specific date.

If there are no holidays on the date then an empty array is returned.

The "info" is an optional object provided when calling `holidays.add()`.

See [API: add()](#api-addobject)

```javascript
infos = holidays.getHoliday(date)

if (infos.length > 0) {
  // then there was at least one holiday on that date.
}

// you can filter the results by supplying properties to check for in the "info".
infos = holidays.getHoliday(date, {
  some: 'prop',
  to: 'filter',
})
```


### API: load() and loadMany()

Load a published holiday package into a `Holidays` instance.

May override default options for the holiday by providing an object as the second argument. It may contain any properties used in [add()](#api_addobject). The default options and the specified options will be combined.

For convenience, `loadMany()` accepts an array of arrays. Each sub-array should have the package name as the first element and an optional options override object as the second element.

Look for published holidays in [@date](https://www.npmjs.com/org/date) organization.

```javascript
// one-line require and build:
const holidays = require('@date/holidays')()

// load a single holiday package without overriding any options.
holidays.load('the-package-name')

// load a single holiday with some option overrides:
holidays.load('some-package-name', {
  // specify any properties used in holidays.add()
})

// to do the above for many packages at once:
holidays.loadMany([ // NOTE: argument is an array of sub-arrays.
  // sub-arrays may have only the package name:
  [ 'package-name' ],

  // or, they may also have an options override object:
  [ 'some-name', { name: 'Changed Holiday Name', cache: true } ]
])
```


### API: add(Object)

Adds a holiday to the `holidays` instance.

Add accepts a single object argument containing the options for the holiday. The possible options are:


| property | purpose |
|---------+|+------------------------------|
|mainInfo | An optional object returned from `getHoliday()` and used when filtering results. May be a function which will then be called each time `getHoliday()` and `isHoliday()` is called and the holiday is a match on that date. This allows returning a fresh object each time. This is also the default "info" when either of the other 2 "info" properties is not specified. Defaults to an empty object. If "mainInfoWhenObserved" is specified as well then this one will only be used for a year when there is **not** an "observed date".
| observedInfo | Same as `mainInfo` except it's returned when the date is for the "observed date" of the holiday. Defaults to `mainInfo` if not specified.
| mainInfoWhenObserved | same as `mainInfo` except it's returned when the date is the "main date" of the holiday but is on a weekend so the holiday is "observed" on another date. Defaults to `mainInfo` if not specified.
| month | The month of the holiday. Uses 0-11 as JavaScript `Date` does.
| day | The day of the month of the holiday. Uses 1-31. Used for a "fixed date" holiday which is always on the same date.
| firstDay | The first day in a range of dates the holiday may be on. Used with `lastDay`. For holidays which may be on different dates and ones with possible "observed" dates (usually before or after the "main date").
| lastDay | The last day in a range of dates the holiday may be on. Used with `firstDay`.
| dateRange | Provide multiple date ranges for a holiday which has a range spanning more than one month or year. For example, New Year's may be observed on December 31st which is both the previous month and previous year. An array of sub-arrays with each sub-array containing 2 elements: the month and the day, or 3 elements: the month, firstDay, and lastDay.
| is | the test function which specifies whether a specific date is: 1. the "main date" without an "observed date" that year; 2. the "observed date"; 3. the "main date" with an "observed date" that year. Its arguments are `is(date, day, month, year)`. The later args are there for convenience because `Holidays` has already called the functions on the `date` to get those values for itself.
| cache | Defaults to `false`. When set to `true` results of calling the `is()` will be cached in an object by year/month/day. Call `holidays.purge()` to replace all holiday cache objects with new empty objects.

Read later sections about specific options. Below, let's look at them all together:

```javascript
// the simplest holiday on a fixed date of March 3rd without info.
// the `mainInfo` will default to an empty object.
// an `is()` function will be created for it.
holidays.add({
  month: 2,
  day: 3,
})

// now returns true for any year:
holidays.isHoliday(new Date(2000, 2, 3))

// result is always an array containing holiday infos for the Date.
// in this instance, it has one element which is the default empty object.
result = holidays.getHoliday(new Date(2000, 2, 3))

if (result.length > 0) {
  // then there was at least one holiday info returned...
}

// add some info to the date to use elsewhere, or,
// use the info to filter results.
holidays.add({
  mainInfo: {
    name: 'Some Holiday',
    some: 'property',
  },
  month: 2,
  day: 3,
})

// to filter, specify the properties you want the holiday to have.
// this will return `true` because the property exists in `mainInfo`.
holidays.isHoliday(new Date(2000, 2, 3), { some: 'property' })

// can specify more than one property and both must exist and match.
holidays.isHoliday(new Date(2000, 2, 3), {
  name: 'Some Holiday',
  some: 'property',
})

// these both will return false.
holidays.isHoliday(new Date(2000, 2, 3), { some: 'thing else' })
holidays.isHoliday(new Date(2000, 2, 3), { another: 'property' })


// for holidays which can be on different dates or have observed dates
// then an `is()` function is necessary.
holidays.add({
  // these holidays can have different "info" for:
  //  1. the main date
  //  2. the observed date
  //  3. the main date when it's on a weekend, meaning there's an observed date.
  // for example, setting a property like { bank: true } for a bank holiday.
  // it'll only be true on the main date if it's a weekday.
  // it'll always be true for the observed date.
  // they can all be used for filtering as described above.
  // the three properties for them are:
  mainInfo: {},
  observedInfo: {},
  mainInfoWhenObserved: {},

  // method #1 of specifying a date range:
  // this is an array of arrays.
  // each sub-array must have either 2 or 3 elements.
  // 2 elements means it's specific date with the month then day.
  // 3 elements means it's a range of days with the month, first day, and last day.
  dateRange: [
    // many holidays are one a set date and may have an observed date
    // a day before or a day after it. So, a range of 3 days.
    // can be in month 1 between the 2nd and 4th:
    [ 1, 2, 4 ],
  ],

  // method #2 of specifying a date range:
  // for date ranges with only a single range it can instead be specified like this:
  month: 1,
  firstDay: 2,
  lastDay: 4,

  // this is called to check a Date.
  is: (date, day, month, year) {
    // must return:
    //  0 - not a match
    //  1 - is the main holiday on a business day
    //  2 - is the observed holiday on a business day
    //  3 - is the main holiday on a weekend day

    // get the weekday so we can see if it's the main, observed, or neither.
    const weekday = date.getDay()

    // check each day in the date range you specified.
    // based on the weekday you can determine whether it's main/observed/main-when-observed.
    switch(day) {
      // 2 for February 2nd which is the observed holiday when it's a Friday
      case 2: return (weekday === 5) ? 2 : 0

      // 3 for February 3rd, always a holiday, but is either main, or "main when observed"
      case 3: return (1 <= weekday && weekday <= 5) ? 1 : 3

      // 4 for February 4th which is the observed holiday when it's a Monday
      case 4: return (weekday === 1) ? 2 : 0

      // otherwise, not a match for the holiday.
      default: return 0
    }
  },
})

// by default, no caching is done. The `is()` function will be called each time.
// some holiday dates are complicated to calculate (example: Easter).
// it may be helpful to cache the results to avoid calling `is()` repeatedly.
// to do that, simply specify the `cache` property set to `true`.
holidays.add({
  cache: true,
  // ... the usual stuff here.
})

// To clear the cache of all caching holidays in a Holidays instance,
// call `purge()`.
holidays.purge()
```


#### API: add() - info trio

The `info` is used in two places:

1. as the return value of `getHoliday()`
2. for comparison of extra properties given to `isHoliday()` and `getHoliday()` as "filters" (second argument).

All "info" objects are optional.

If `mainInfo` isn't provided then it defaults to an empty object.

Both `observedInfo` and `mainInfoWhenObserved` default to the value of `mainInfo` (which defaults to an empty object).

If the holiday is always on the same date then only `mainInfo` will be used (I refer to those as "simple fixed date" holidays).

If the holiday may be "observed" on another date, usually one day before or one day after the "main date", then that "observed date" will return the `observedInfo` object.

When there is an "observed date" in the year of the `Date` provided to `getHoliday()` or `isHoliday()` then the "main date" is on the weekend and it will return the `mainInfoWhenObserved` object.

For example, Valentine's Day is always February 14th and never has an observed date. So, only a `mainInfo` is useful.

For example, Independence Day's "main date" is always July 4th. It may be observed on July 3rd or July 5th. When July 4th is a weekday (Monday - Friday) then the `mainInfo` will be used for July 4th that year. If July 4th is on the weekend then `mainInfoWhenObserved` will be used for July 4th that year. When a year observes the holiday on the 3rd or 5th then the `observedInfo` will be used (otherwise, those days are not considered holidays).

How is this helpful? Consider the above example about Independence Day. It makes sense to have the `mainInfo` contain `bank: true` because it's a bank holiday. However, when the holiday is observed on the 3rd or 5th then the 4th is *not* a bank holiday. So, that's when `mainInfoWhenObserved` is helpful because it can contain `bank: false`. The `observedInfo` would contain `bank: true` because the "observed date" (in years where it occurs) is always a bank holiday.


#### API: add() -  methods to specify dates

Holidays have varied date configurations. So, `Holidays` allows specifying them in different ways.

1. simple fixed date

Always on the same date without an "observed date". For example, Valentine's Day. Specify one like this:

```js
holidays.add({
  // February 14th
  month: 1,
  day: 14,
})
```

2. fixed date with possible observed dates

The "main date" is always on the same date and it may have an "observed date" one day before, or after, the "main date". For example, Independence Day is always on July 4th but may be observed on July 3rd or July 4th. Specify one like this:

```js
// method 1: properties
// Independence Day: remember, 6 is July for JS Dates 0-11
holidays.add({
  month: 6,
  firstDay: 3,
  lastDay: 5,
})


// method 2: date range
holidays.add({
  dateRange: [
    // [ month, firstDay, lastDay ]
    // Independence Day:   (remember, 6 is July for JS Dates 0-11)
    [ 6, 3, 5 ],
  ],
})

// New Year's may span 2 months and 2 years when it's
// observed the day before, which is December 31st.
// here's how that would be specified:
holidays.add({
  dateRange: [
    // the possible observed date of December 31st:
    [ 11, 31 ],
    // the range covering the "main date" and possible observed Date:
    // January 1st to January 2nd:
    [ 0, 1, 2 ],
  ],
})
```

3. variable date

The holiday date must be calculated for each year. One example is Father's Day which is always on the third Sunday in June. Another example is Easter which has a complicated calculation algorithm.

```js
// Father's day spans a week of possible dates:
// method 1: properties
holidays.add({
  month: 5, // NOTE: 5 is June for JS Dates 0-11
  firstDay: 15, // earliest date it could be on.
  lastDay: 21,  // latest date it could be on.
})

// method 2: date range array
holidays.add({
  dateRange: [
    // 5 is June for JS Dates 0-11
    // 15 - earliest date it could be on.
    // 21 - latest date it could be on.
    [ 5, 15, 21 ],
  ],
})
```

#### API: add() - is()

The `is()` function returns a value in the range of zero to three for the specified date. The values mean:


| value | meaning |
|-----+|+-----------|
| 0 | not a match for the holiday.
| 1 | is the "main date" of the holiday in a year **without** an "observed date".
| 2 | is the "observed date" of the holiday for that year.
| 3 | is the "main date" of the holiday in a year **with** an "observed date".

The `is()` function is optional for "simple fixed dates". The date info may be specified (see section above) and an `is()` function will be created for it.

The arguments are `(date, day, month, year)`. The first argument is the `Date` object. The later arguments are for convenience so you don't have to call functions on the `Date` to get them (the `Holidays` already calls them for itself so it provides them to `is()`).

For example:

```js
// a simple fixed date doesn't need an is().
// it'll be auto-created.
holidays.add({
  month: 1,
  day: 2,
})

// a "fixed date" holiday with a possible "observed date":
holidays.add({
  month: 6,
  firstDay: 3,
  lastDay: 5,
  is: (date, day, month, year) => {
    // this will only be called for dates within the date range specified.
    // so, at this point, we already know the month is `6`,
    // and the day is within the range 3 to 5.
    // so, use the `day` and the "day of the week" to determine return result:
    const weekday = date.getDay()

    switch(day) { // based on the day of the month for the date:
      // 3 for July 3rd which is the observed holiday when it's a Friday
      case 3: return (weekday === 5) ? 2 : 0  // Friday July 3rd is "observed"

      // 4 for July 4th, always a holiday, but is either main, or "main when observed"
      case 4: return (1 <= weekday && weekday <= 5) ? 1 : 3

      // 5 for July 5th which is the observed holiday when it's a Monday
      case 5: return (weekday === 1) ? 2 : 0  // Monday July 5th is "observed"

      // otherwise, not a match for the holiday.
      default: return 0
    }
  },
})

// a variable date holiday:
holidays.add({ // Father's day is third Sunday in June
  dateRange: [
    [ 5, 15, 21 ],
  ],
  is: (date, day, month, year) => {
    // this will only be called for dates within the date range specified.
    // so, at this point, we already know the month is `5`,
    // and the day is within the range 15 to 21.
    // so, all we care about is whether it's Sunday.
    const weekday = date.getDay()
    return (weekday === 0) ? 1 : 0
  },
})
```


### API: remove a holiday

Removes a holiday from a `Holidays` instance.

The `Holidays.add()` function returns a "remover function" which, when called, will remove the added holiday.

```javascript
const someHolidaySpecification = getIt()

const removerFn = holidays.add(someHolidaySpecification)

removerFn()
```


### API: purge()

When `cache:true` is specified in a holiday's options it will cache its results to avoid calling its `is()` function repeatedly for the same date.

Each caching holiday creates its own cache object.

Calling `purge()` on the `Holidays` instance will replace all cache objects with new empty objects.

```javascript
// creates all new empty caches.
holidays.purge()
```


## [MIT License](LICENSE)
