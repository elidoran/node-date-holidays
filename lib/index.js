// TODO:
//  add a load/require/whatever to grab a package providing a holiday generator.
//  specify the holiday info, or allow the default info from the package.
//  perhaps combine them? or, allow a third arg which will accept the info
//  from the package and return the info to use... so they can override
//  or combine or whatever... we give a new copy so they can't edit ours...

class Holidays {

  constructor() {
    // store calculated holidays in this
    // store by year, then month, then day of the month
    this.holidays = {}

    // store holiday generators
    this.generators = []
  }

  // store the holiday into `holidays` for the specified year
  _storeHoliday(holiday, year) {
    // NOTE: we expect the caller has already created this.holidays[year].
    //       otherwise, we'd be checking way too often here.

    // holds specified year's holiday info (may be empty)
    var yearObject = this.holidays[year]

    // get month's name for reuse
    var month = holiday.date.month

    // holds specified month's holiday info (may be null)
    // if the month object doesn't exist yet then create it.
    var monthObject = yearObject[month] || (yearObject[month] = {})

    // finally, store the holiday info by its day in the month
    monthObject[holiday.date.day] = holiday.info

  }

  // calculate holidays for the specified year and store them in the cache
  _calculateHolidays(year) {
    var holidays // holds generated holiday(s) (may be an array)

    // only calculate them if we haven't already...
    if (this.holidays[year] == null) {

      // create the year's object
      this.holidays[year] = {}

      // loop over generators and call them to create holidays
      for (var generate of this.generators) {

        // generate holiday(s) for year
        holidays = generate(year)

        // if the generator returned more than one then process all
        if (Array.isArray(holidays)) {
          for (var holiday of holidays) {
            this._storeHoliday(holiday, year)
          }
        }

        // otherwise, it's a single holiday, so store it
        else {
          this._storeHoliday(holidays, year)
        }
      }
    }
  }

  isHoliday(arg1, arg2) {
    // if we can get the holiday then it's a holiday...
    return null != this.getHoliday(arg1, arg2)
  }

  getHoliday(arg1, arg2) {
    var date, options // named args, we'll figure out arg1/arg2.
    var holiday       // holds "single point of return" result value.
    var year, month   // cache Date's numeric values for repeated use.

    // figure out the type of args provided to get `date` and `options`

    if (arg1 instanceof Date) {
      date = arg1
      options = arg2
    }

    else if (arg2 instanceof Date) {
      date = arg2
      options = arg1
    }

    // NOTE: no Date arg expects arg1 is an object with `date` property
    else if (arg1) {
      options = arg1
      date = arg1.date
    }

    // else no Date arg and no args...

    // only do this work if we have a Date.
    // NOTE: if we don't have a Date, then `holiday` is returned as `undefined`.
    if (date instanceof Date) {
      // get year and month for calculations and getting the holiday
      year  = date.getFullYear()
      month = date.getMonth()

      // ensure we've calculated the holidays for that year and month
      this._calculateHolidays(year)  //, month could focus on a month...

      // get holiday by year, month, and day in the month
      holiday = this.holidays[year] && this.holidays[year][month] && this.holidays[year][month][date.getDate()]

      // when there is a holiday and options then compare extra values.
      // loop over all properties in options, except `name` and `date`.
      if (holiday != null && options != null) {

        for (var key in options) {

          // ignore name/date properties, they're not filter options.
          // if it doesn't match then we're done checking, end loop.
          // NOTE: when mismatched, nullify `holiday` so it isn't returned
          if (key !== 'name' && key !== 'date' && (holiday[key] !== options[key])) {
            holiday = null
            break
          }
        }
      }
    }

    return holiday
  }

  // purge all cached holidays.
  purge() {
    this.holidays = {}
  }

  // purge all cached holidays for a single year.
  purgeYear(year) {
    if (this.holidays[year]) {
      this.holidays[year] = null
    }
  }

  // purge all specified years.
  // uses "rest" notation to gather arguments into an array.
  // any array arguments will be passed to a new purgeYears() call.
  purgeYears(...years) {

    for (year of years) {

      // pass an array to a new call.
      if (Array.isArray(year)) {
        this.purgeYears(year)
      }

      // only assign to null if the property is already there with a value.
      // NOTE: this avoids adding the property now with a null value.
      else if (this.holidays[year]) {
        this.holidays[year] = null
      }
    }
  }

  // specify a range of years to purge.
  // the range is "inclusive", both `first` and `last` are purged.
  // and all years in between.
  purgeYearRange(first, last) {
    // iterate over range and nullify those years already in the cache.
    // Note, it checks existence first to avoid adding a bunch of properties
    // with a null value.
    for (var year = first; year <= last; year++) {
      if (this.holidays[year]) {
        this.holidays[year] = null
      }
    }
  }

  // purgeMonth(year, month)
  // purgeDate()

  add(arg) {
    var generator

    if ('function' === typeof arg) {
      // ensure it isn't already in the array
      for (var existingGenerator of this.generators) {
        if (arg === existingGenerator) {
          return arg
        }
      }

      // loop didn't find it already in there, so, remember for below.
      generator = arg
    }

    // otherwise it'd better be an object with `info` and `date` props.
    // use those two props to build the generator function.
    else {
      generator = function(year) {
        return {
          info: arg.info,
          date: {
            month: arg.date.month,
            day: arg.date.day
          }
        }
      }
    }

    // add the generator function to our array of generators.
    // NOTE: this is either `arg` or our newly created function.
    this.generators[this.generators.length] = generator

    // return the function to use in remove() in case we created it.
    return generator
  }

  // TODO: allow specifying a year, month, and day to remove the generator
  //       which generates the matching date?
  remove(targetGenerator) {
    // NOTE:
    //   This didn't work 100% of the time...?
    //   var index = this.generators.findIndex(targetGenerator)
    //   it would return an index>-1 even tho the function wasn't in there.

    for (var i = 0; i < this.generators.length; i++) {
      if (targetGenerator === this.generators[i]) {
        this.generators.splice(i, 1)
        return true
      }
    }

    return false
  }

}

// export a builder function so dev's don't need to use `new`.
module.exports = function() {
  return new Holidays()
}

// export the class as well.
exports.Holidays = Holidays
