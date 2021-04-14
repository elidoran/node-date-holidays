'use strict'

const assert = require('assert')

const Holidays = require('../index.js')

const independenceDay = require('./helpers/IndependenceDay')

// verifies both getHoliday() and isHoliday().
// determines a success/failure expectation based on `info` existing/null.
function verify(holidays, year, month, day, info, filter, dontIsHoliday) {
  const date = new Date(year, month, day)
  const holiday = holidays.getHoliday(date, filter)
  const is = (dontIsHoliday !== true) ? holidays.isHoliday(date, filter) : null

  if (info) {
    assert.equal(holiday.length, 1, 'should have a single holiday info')
    assert.deepEqual(holiday[0], info, `holiday info should match for year[${year}]`)
    if (dontIsHoliday !== true) {
      assert.equal(is, true, `isHoliday() should be true for year[${year}]`)
    }
  }

  else {
    assert.equal(holiday.length, 0, 'should not return holiday info')
    if (dontIsHoliday !== true) {
      assert.equal(is, false, `isHoliday() should be false for year[${year}]`)
    }
  }
}


describe('test holidays', () => {

  describe('errors', () => {

    describe('add()', () => {
      it('should error without options object', () => {
        assert.throws(() => { Holidays().add() }, { message: 'options object required' })
      })

      it('should not error if month === 0', () => {
        const removerFn = Holidays().add({ day: 1, month: 0 })

        assert(removerFn, 'should return a remover')
        assert('function' === typeof removerFn, 'returned remover should be a function')
      })

      it('should error without date info', () => {
        assert.throws(() => { Holidays().add({}) }, { message: 'date info required' })
      })

      it('should error without either an is() function or simple date info (month+day)', () => {
        // a `dateRange` holiday requires an is() function.
        assert.throws(() => { Holidays().add({ dateRange: [[1, 2]]}) },
          { message: 'require either `options.is` function or `options.month` and `options.day` simple date info' })
      })

      it('should error when dateRange isnt length 2 or 3', () => {
        // a `dateRange` holiday requires an is() function.
        assert.throws(() => { Holidays().add({ is: () => {}, dateRange: [[]] }) },
          { message: 'date range array length must be 2 or 3: 0' })
      })
    })

    describe('getHoliday()', () => {
      it('should return error when is() returns invalid value', () => {
        const holidays = Holidays()

        holidays.add({
          name: 'faulty',
          month: 1,
          day: 2,
          is: () => { return 'invalid value' },
        })

        const result = holidays.getHoliday(new Date(2000, 1, 2))

        assert(Array.isArray(result), 'should always return an arrray')
        assert.equal(result.length, 1, 'should have a single result')
        assert.equal(result[0].message, 'invalid return value [invalid value] from holiday.is() ',
          'should hold Error from invalid value')
      })

      it('should return error with function\'s displayName in the message', () => {
        const holidays = Holidays()

        const is = function() { return 'invalid value' }
        is.displayName = 'display name'

        holidays.add({
          name: 'faulty',
          month: 1,
          day: 2,
          is,
        })

        const result = holidays.getHoliday(new Date(2000, 1, 2))

        assert(Array.isArray(result), 'should always return an arrray')
        assert.equal(result.length, 1, 'should have a single result')
        assert.equal(result[0].message, 'invalid return value [invalid value] from holiday.is() display name',
          'should hold Error from invalid value')
      })

    })

  })

  describe('with fixed holiday', () => {

    const fixedInfo = {
      name: 'Fixed Date',
      fixed: true,
      extra: true,
    }

    const holidaySpecifier = {
      mainInfo: fixedInfo,
      month: 1,
      day: 2,
    }

    const holidays = Holidays()

    const removerFn = holidays.add(holidaySpecifier)

    it('should create remover for fixed date', () => {
      assert(removerFn, 'should return a remover')
      assert('function' === typeof removerFn, 'returned remover should be a function')
    })

    it('should return info/true for any year', () => {
      for (const year of [2000, 2001, 2002, 2003]) {
        verify(holidays, year, 1, 2, fixedInfo, null)
      }
    })

    it('should return info/true when extra info is specified', () => {
      verify(holidays, 2000, 1, 2, fixedInfo, { fixed: true })
    })

    it('should return empty array or false for wrong month', () => {
      verify(holidays, 2000, 3, 2, null, null)
    })

    it('should return empty array or false for wrong day', () => {
      verify(holidays, 2000, 1, 5, null, null)
    })

    it('should return empty result or false when mismatched extra info is specified', () => {
      verify(holidays, 2000, 1, 2, null, { fixed: false })
    })

    it('should return empty array or false when extra info doesnt exist', () => {
      verify(holidays, 2000, 1, 2, null, { nonexistent: true })
    })

    it('should remove with remover', () => {
      let result = removerFn()
      assert(result, 'should find and remove holiday then return array containing the "is()"')
      verify(holidays, 2000, 1, 2, null, null)
      result = removerFn()
      assert(result, 'should return an empty array when run more than once')
    })

  })

  describe('with observable holiday', () => {

    const mainInfo = {
      name: 'Main Day',
      main: true,
      hasObserved: false,
    }

    const mainInfoWhenObserved = {
      name: 'Main Day',
      main: true,
      hasObserved: true,
    }

    const observedInfo = {
      name: 'Observed Day',
      main: false,
      observed: true,
    }

    const holidaySpecifier = { // observable holiday
      mainInfo,
      mainInfoWhenObserved,
      observedInfo,
      // dateRange: [
      //   [ 1, 2, 4 ]
      // ],
      month: 1,
      firstDay: 2,
      lastDay: 4,
      is: (date, day, month, year) => {

        // if it's not in the correct month then it's not a match.
        // the `0` means "no match".
        if (month !== 1) return 0

        // get the day of the week to see if it's a weekend to
        // determine if there's an observed day.
        const weekday = date.getDay()

        // return:
        //  0 - not a match
        //  1 - is the main holiday on a business day
        //  2 - is the observed holiday on a business day
        //  3 - is the main holiday on a weekend day
        switch(day) {
          // the day is one day before the holiday.
          // so, if the day of the week is Friday, then it's "observed",
          // because the main holiday date would be Saturday.
          case 2: return (weekday === 5) ? 2 : 0  // Friday is "observed"

          // this is the actual date of the holiday.
          // so, it's always a holiday.
          // and, if it's *not* a weekday then it's the "main with observed".
          case 3: return (1 <= weekday && weekday <= 5) ? 1 : 3

          // the day is one day after the holiday.
          // so, if the day of the week is Monday, then it's "observed",
          // because the main holiday date would be Sunday.
          case 4: return (weekday === 1) ? 2 : 0  // Monday is "observed"

          // all other dates are non-matches.
          default: return 0
        }
      },
    }

    const holidays = Holidays()

    const removerFn = holidays.add(holidaySpecifier)

    it('should create remover for observable holiday', () => {
      assert(removerFn, 'should return a remover')
      assert('function' === typeof removerFn, 'returned remover should be a function')
    })

    // test main holiday date on a weekday so there's no observed date.
    ;((year, month, day) => {
      it('should return main info or true for 2000/02/03', () => {
        verify(holidays, year, month, day, mainInfo, null)
      })

      it('should return main info or true when single extra info is specified', () => {
        verify(holidays, year, month, day, mainInfo, { main: true })
      })

      it('should return main info or true when multiple extra info is specified', () => {
        verify(holidays, year, month, day, mainInfo, { main: true, hasObserved: false })
      })

      it('should return empty array or false when mismatched extra info is specified', () => {
        verify(holidays, year, month, day, null, { main: false })
      })

      it('should return empty array or false when extra info match doesnt exist', () => {
        verify(holidays, year, month, day, null, { nonexistent: true })
      })
    })(2000, 1, 3)


    // test main holiday date on a weekend (so there'll be an observed date)
    ;((year, month, day) => {
      it('should return main info or true for 2001/02/03', () => {
        verify(holidays, year, month, day, mainInfoWhenObserved, null)
      })

      it('should return main info or true when single extra info is specified', () => {
        verify(holidays, year, month, day, mainInfoWhenObserved, { main: true })
      })

      it('should return main info or true when multiple extra info is specified', () => {
        verify(holidays, year, month, day, mainInfoWhenObserved, { main: true, hasObserved: true })
      })

      it('should return empty array or false when mismatched extra info is specified', () => {
        verify(holidays, year, month, day, null, { main: false })
      })

      it('should return empty array or false when extra info match doesnt exist', () => {
        verify(holidays, year, month, day, null, { nonexistent: true })
      })
    })(2001, 1, 3)


    // test observed holiday date before main date.
    ;((year, month, day) => {
      it('should return observed info or true for 2001/02/02', () => {
        verify(holidays, year, month, day, observedInfo, null)
      })

      it('should return observed info or true when single extra info is specified', () => {
        verify(holidays, year, month, day, observedInfo, { main: false })
      })

      it('should return observed info or true when multiple extra info is specified', () => {
        verify(holidays, year, month, day, observedInfo, { main: false, observed: true })
      })

      it('should return empty array or false when mismatched extra info is specified', () => {
        verify(holidays, year, month, day, null, { observed: false })
      })

      it('should return empty array or false when extra info doesnt exist', () => {
        verify(holidays, year, month, day, null, { nonexistent: true })
      })
    })(2001, 1, 2)


    // test observed holiday date after main date.
    ;((year, month, day) => {
      it('should return observed info or true for 2002/02/04', () => {
        verify(holidays, year, month, day, observedInfo, null)
      })

      it('should return observed info or true when single extra info is specified', () => {
        verify(holidays, year, month, day, observedInfo, { main: false })
      })

      it('should return observed info or true when multiple extra info is specified', () => {
        verify(holidays, year, month, day, observedInfo, { main: false, observed: true })
      })

      it('should return empty array or false when mismatched extra info is specified', () => {
        verify(holidays, year, month, day, null, { observed: false })
      })

      it('should return empty array or false when extra info doesnt exist', () => {
        verify(holidays, year, month, day, null, { nonexistent: true })
      })
    })(2002, 1, 4)


    it('should remove with remover', () => {
      const result = removerFn()
      assert(result, 'should find and remove holiday, then return true')
      verify(holidays, 2001, 1, 3, null, null)
    })

  })

  describe('with caching is()', () => {

    const holidays = Holidays()

    let called = false

    const mainInfo = { name: 'Caching' }
    holidays.add({
      cache: true,
      mainInfo,
      month: 1,
      day: 2,
      is: () => {
        // return "main date" type the first time.
        // return "no match" type the second time.
        // NOTE: it won't reach here the second time due to caching.
        // NOTE: it will reach here the third time due to purge().
        const result = called ? 0 : 1
        called = true
        return result
      }
    })

    // add a second holiday without caching.
    holidays.add({
      month: 3,
      day: 4,
    })


    it('should return info as usual the first time', () => {
      verify(holidays, 2000, 1, 2, mainInfo, null, true)
    })

    it('should return same info the second time due to cache despite is() would return 0', () => {
      verify(holidays, 2000, 1, 2, mainInfo, null, true)
    })

    it('should *not* return info the third time due to purge() and is() returns 0', () => {
      holidays.purge()
      verify(holidays, 2000, 1, 2, null, null, true)
    })

  })

  describe('test load()', () => {

    const holidays = Holidays()

    // path for require() inside index.js.
    holidays.load('./test/helpers/IndependenceDay.js', { cache: true })

    const july4th = require('./helpers/IndependenceDay.js')

    it('should return info as usual', () => {
      verify(holidays, 2000, 6, 3, null, null, true)
      verify(holidays, 2000, 6, 4, july4th.mainInfo, null, true)
      verify(holidays, 2000, 6, 5, null, null, true)
    })

  })

  describe('test loadMany()', () => {

    const holidays = Holidays()

    // path for require() inside index.js.
    holidays.loadMany([
      [ './test/helpers/IndependenceDay.js', { cache: true } ],
      [ './test/helpers/ValentinesDay.js']
    ])

    const july4th = require('./helpers/IndependenceDay.js')
    const valday = require('./helpers/ValentinesDay.js')

    it('should return info as usual', () => {
      verify(holidays, 2000, 6, 3, null, null, true)
      verify(holidays, 2000, 6, 4, july4th.mainInfo, null, true)
      verify(holidays, 2000, 6, 5, null, null, true)

      verify(holidays, 2000, 1, 14, valday.mainInfo, null, true)
    })

  })

  describe('test two holidays on same day', () => {

    const holidaySpecifier1 = {
      mainInfo: { name: 'Holiday 1' },
      month: 1,
      day: 2,
      is: (date, day, month, year) => {
        return (month === 1 && day === 2) ? 1 : 0
      }
    }

    const holidaySpecifier2 = {
      mainInfo: { name: 'Holiday 2' },
      month: 1,
      day: 2,
      is: (date, day, month, year) => {
        return (month === 1 && day === 2) ? 1 : 0
      }
    }

    const holidays = Holidays()
    let remover1, remover2

    it('should add both holidays', () => {
      remover1 = holidays.add(holidaySpecifier1)
      remover2 = holidays.add(holidaySpecifier2)

      assert(remover1, 'should create first remover')
      assert(remover2, 'should create second remover')

      assert(holidays._fns[1], 'should store is() in month')
      assert(holidays._fns[1][2], 'should store is() in month+day')
      assert.equal(holidays._fns[1][2].length, 2, 'should have both is() in array')
    })

    it('should have two is() functions on correct day', () => {
      const fns = holidays._getFns(2, 1)
      assert(fns, 'should return array of functions')
      assert.equal(fns.length, 2, 'should return 2, one for each holiday')
    })

    it('should have zero is() functions on wrong day', () => {
      const fns = holidays._getFns(4, 3)
      assert(fns, 'should return array')
      assert.equal(fns.length, 0, 'should empty array')
    })

    // this represents a holiday which may be on the same day but isn't.
    // even tho I'm setting it only on the same day...
    it('add extra holiday on same day which never matches', () => {
      holidays.add({
        mainInfo: { name: 'Unmatching Holiday' },
        is: () => { return 0 },
        month: 1,
        day: 2,
      })
    })

    it('should return both holiday infos in array', () => {
      const date = new Date(2000, 1, 2)
      const holiday = holidays.getHoliday(date)
      const is = holidays.isHoliday(date)
      assert.equal(holiday.length, 2, 'should have both holiday infos')
      assert.deepEqual(holiday[0], holidaySpecifier1.mainInfo, `holiday info should match first holiday`)
      assert.deepEqual(holiday[1], holidaySpecifier2.mainInfo, `holiday info should match second holiday`)
      assert.equal(is, true, `isHoliday() should be true`)
    })

    it('should return none on non-holiday day', () => {
      verify(holidays, 2000, 1, 1, null, null)
    })

    it('should have second holiday after running first holiday\'s remover', () => {
      // remove one holiday and then retest.
      remover1()
      verify(holidays, 2000, 1, 2, holidaySpecifier2.mainInfo, null)
    })
  })

})
