'use strict'

class Holidays {

  constructor() {
    this._fns = {} // store array of functions in hierarchy by month then day.
  }

  // get array of functions stored for the month and day.
  _getFns(day, month) {

    let o = this._fns[month]

    if (o) {
      o = o[day]
    }

    return o || []
  }

  isHoliday(date, filter) {
    return this.getHoliday(date, filter).length > 0
  }

  // NOTE: always returns an array; empty if no acceptable matches.
  getHoliday(date, filter) {

    // get these once for _getFns() and the getInfo() calls.
    const year = date.getFullYear()
    const month = date.getMonth()
    const day = date.getDate()

    // combine multiple holiday info results.
    const infos = []

    // get filter's key/value pairs to test info's.
    const filterEntries = filter ? Object.entries(filter) : []

    for (const getInfo of this._getFns(day, month)) {

      let info = getInfo(date, day, month, year)

      if (info) {
        // test filters to see if this one is acceptable.
        for (const pair of filterEntries) {
          const [key, value] = pair
          if (info[key] !== value) {
            info = null // nullified means it's not acceptable.
            break
          }
        }

        if (info) { // re-check in case we nullified in loop.
          infos.push(info)
        }
      }
    }

    return infos
  }

  // load an array of arrays; sub-arrays contain args for load().
  loadMany(array) {
    array.forEach(subarray => { this.load(subarray[0], subarray[1]) })
  }

  // load a holiday package
  load(name, options) {
    const holiday = require(name)
    // combine holiday functions and default info with specified info.
    return this.add(Object.assign({}, holiday, options))
  }

  add(options) {
    // 1. simple holiday on a set day each year.
    //    example: Valentine's Day - always February 14th.
    // 2. non-simple holiday with no observed alternate.
    //    example: Memorial Day (last Monday of May)
    // 3. non-simple set-day holiday with observed alternate.
    //    example: Independence Day - always July 4th. Observed on 3rd or 5th.
    // 4. non-simple holiday with wide range.
    //    example: Easter
    // 5. non-simple holiday with range spanning months.
    //    example: New Year's (may be observed on Friday of previous month)

    if ('object' !== typeof options) {
      throw new TypeError('options object required')
    }

    if (
      // month + day,  or,  month + firstDay + lastDay
      !('number' === typeof options.month && (options.day || (options.firstDay && options.lastDay)))
      // dateRange with length of 2-3
      && !(options.dateRange && options.dateRange.length > 0)
    ) {
      throw new TypeError('date info required')
    }

    let fn = null  // the function to store
    let range = null // the date ranges to use `fn`.

    // if we have a tester function then we decorate that.
    if ('function' === typeof options.is) {

      const { is } = options
      const mainInfo = this.asFn(options.mainInfo || {})
      const mainInfoWhenObserved = this.asFn(options.mainInfoWhenObserved || mainInfo)
      const observedInfo = this.asFn(options.observedInfo || mainInfo)

      const decoratedIs = function(date, theDay, theMonth, year) {
        const result = is(date, theDay, theMonth, year)

        switch (result) {
          case 0: return null // *not* a match

          case 1: return mainInfo()  // is the main holiday

          case 2: return observedInfo() // is an observed day

          case 3: return mainInfoWhenObserved() // main day on weekend

          default:
            return new Error('invalid return value [' + result + '] from holiday.is() ' + (is.displayName || ''))
        }
      }

      if (options.cache === true) {
        const cachingDecoratedIs = function(date, theDay, theMonth, year) {

          const cache = cachingDecoratedIs.cache // short alias
          let y = cache[year]
          let m = null
          let result = null

          if (y) {
            m = y[theMonth]

            if (m && m[theDay]) {
              // extract from `result` property.
              // NOTE: stored in sub-property so we can store null for
              //       days which are not the holiday (which is a result).
              result = m[theDay].result
            }
          }

          if (!result) {
            result = decoratedIs(date, theDay, theMonth, year)

            // always cache the result, even when null.
            if (!y) y = cache[year] = {}         // eslint-disable-line curly
            if (!m) m = y[theMonth] = {}         // eslint-disable-line curly
            // NOTE: stored in sub-property so we can store null for
            //       days which are not the holiday (which is a result).
            m[theDay] = { result }
          }

          return result
        }

        // make the cache available so it can be cleared.
        cachingDecoratedIs.cache = {}

        fn = cachingDecoratedIs
      }

      else { // non-caching so just use `decoratedIs`.
        fn = decoratedIs
      }

      // should have dateRange, or specific simple date or simple date range.
      range = options.dateRange
        || ('number' === typeof options.month && options.day && [[options.month, options.day]])
        || [[options.month, options.firstDay, options.lastDay]]
    }

    // else, we build our own tester function based on the simple date.
    else if ('number' === typeof options.month && options.day) {
      const info = this.asFn(options.mainInfo || {})

      const simpleIs = function() {
        // NOTE: to get here it must be the matching `month` and `day`.
        return info()
      }

      // store our simple test function in the simple date range.
      fn = simpleIs
      range = [
        [ options.month, options.day]
      ]
    }

    else {
      throw new Error('require either `options.is` function or `options.month` and `options.day` simple date info')
    }

    // returns the remover function to undo what we're about to do (add it).
    // provide Array's push() as the op to add it to each day's array.
    const remover = this._store(fn, range, Array.prototype.push)

    return remover
  }

  asFn(fnOrObject) { // used on info's to make them all functions.
    return ('function' === typeof fnOrObject) ? fnOrObject : () => { return fnOrObject }
  }

  // NOTE: used to both add and remove a holiday by specifying `op`.
  // store the function in each day in the inclusive range.
  // range is an array of arrays.
  // each element contains an array with 2 or 3 elements.
  // 2 elements means it's a specific month and day.
  // 3 elements means it's an inclusive range of days in a month.
  _store(fn, ranges, op) {

    const fns = this._fns

    for (const range of ranges) {
      if (range.length === 3) {
        const [month, firstDay, lastDay] = range
        let m = fns[month]
        if (!m) m = fns[month] = {}                // eslint-disable-line curly

        for (let i = firstDay; i <= lastDay; i++) {
          let d = m[i]
          if (!d) d = m[i] = []                    // eslint-disable-line curly
          op.call(d, fn)
        }
      }

      else if (range.length === 2) { // specific day.
        const [month, day] = range
        let m = fns[month]
        if (!m) m = fns[month] = {}                // eslint-disable-line curly

        let d = m[day]
        if (!d) d = m[day] = []                    // eslint-disable-line curly
        op.call(d, fn)
      }

      else {
        throw new Error('date range array length must be 2 or 3: ' + range.length)
      }
    }

    // bind to _store() with a function to remove it from each day's array.
    return this._store.bind(this, fn, ranges, removeFromArray)
  }

  // each cache gets replaced with an empty object.
  purge() {
    // functions are stored in an object hierarchy:
    //  1. year; 2. month; 3. day; 4. then an array of functions
    // NOTE:
    //   Object.values() returns each key's value, skipping over the keys.
    //   so, the first one we skip years and get the months.
    //   the second one skips days and gets their array of functions.
    for (const month of Object.values(this._fns)) {
      for (const day of Object.values(month)) {
        for (const fn of day) {
          if (fn.cache) {
            fn.cache = {}
          } // end if
        } // end of fn loop
      } // end of day loop
    } // end of month loop
  } // end of purge()

} // end of class Holidays

// used in _store() to create a remover function by
// binding this function as the `op` argument.
function removeFromArray(element) {
  const index = this.indexOf(element)

  return (index > -1) ? this.splice(index, 1) : []
}

// export a builder function so dev's don't need to use `new`.
module.exports = function() {
  return new Holidays()
}

// export the class as well.
exports.Holidays = Holidays
