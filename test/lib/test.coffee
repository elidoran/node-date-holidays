assert   = require 'assert'
Holidays = require '../../lib'

generateIndependenceDay = require '../helpers/IndependenceDay'

describe 'test holidays', ->

  describe 'with fixed holiday', ->

    fixedInfo =
      name : 'Fixed Date'
      fixed: true

    holidaySpecifier =
      info: fixedInfo
      date:
        month: 1
        day  : 2

    holidays = Holidays()

    # used in first and last 'should'
    generatorFn = holidays.add holidaySpecifier

    it 'should create generator for fixed date', ->

      assert generatorFn, 'should return a generator'
      assert 'function' is typeof generatorFn, 'returned generator should be a function'


    it 'should return the holiday for any year', ->

      for year in [2000, 2001, 2002, 2003]
        date = new Date year, 1, 2
        holiday = holidays.getHoliday date
        assert.equal holiday, fixedInfo, "holiday info should match for year[#{year}]"


    it 'should return the holiday with extra info specified', ->

      date = new Date 2000, 1, 2

      holiday = holidays.getHoliday date, fixed:true
      assert.equal holiday, fixedInfo, 'should work with options as second arg'

      holiday = holidays.getHoliday {fixed:true}, date
      assert.equal holiday, fixedInfo, 'should work with options as first arg'

      holiday = holidays.getHoliday {date:date, fixed:true}
      assert.equal holiday, fixedInfo, 'should work with only options arg'


    it 'shouldn\'t return holiday with mismatched extra info value', ->

      date = new Date 2000, 1, 2

      holiday = holidays.getHoliday date, fixed:false
      assert.equal holiday, null, 'should work with options as second arg'

      holiday = holidays.getHoliday {fixed:false}, date
      assert.equal holiday, null, 'should work with options as first arg'

      holiday = holidays.getHoliday {date:date, fixed:false}
      assert.equal holiday, null, 'should work with only options arg'


    it 'shouldn\'t return holiday without extra info match', ->

      date = new Date 2000, 1, 2

      holiday = holidays.getHoliday date, nonexistent:true
      assert.equal holiday, null, 'should work with options as second arg'

      holiday = holidays.getHoliday {nonexistent:true}, date
      assert.equal holiday, null, 'should work with options as first arg'

      holiday = holidays.getHoliday {date:date, nonexistent:true}
      assert.equal holiday, null, 'should work with only options arg'


    it 'should return true for the holiday for any year', ->

      for year in [2000, 2001, 2002, 2003]
        date = new Date year, 1, 2
        holiday = holidays.isHoliday date
        assert.equal holiday, true, "isHoliday() should be true for year[#{year}]"


    it 'should return true for the holiday with extra info specified', ->

      date = new Date 2000, 1, 2

      holiday = holidays.isHoliday date, fixed:true
      assert.equal holiday, true, 'should work with options as second arg'

      holiday = holidays.isHoliday {fixed:true}, date
      assert.equal holiday, true, 'should work with options as first arg'

      holiday = holidays.isHoliday {date:date, fixed:true}
      assert.equal holiday, true, 'should work with only options arg'


    it 'should return false for holiday with mismatched extra info value', ->

      date = new Date 2000, 1, 2

      holiday = holidays.isHoliday date, fixed:false
      assert.equal holiday, false, 'should work with options as second arg'

      holiday = holidays.isHoliday {fixed:false}, date
      assert.equal holiday, false, 'should work with options as first arg'

      holiday = holidays.isHoliday {date:date, fixed:false}
      assert.equal holiday, false, 'should work with only options arg'


    it 'should return false for holiday without extra info match', ->

      date = new Date 2000, 1, 2

      holiday = holidays.isHoliday date, nonexistent:true
      assert.equal holiday, false, 'should work with options as second arg'

      holiday = holidays.isHoliday {nonexistent:true}, date
      assert.equal holiday, false, 'should work with options as first arg'

      holiday = holidays.isHoliday {date:date, nonexistent:true}
      assert.equal holiday, false, 'should work with only options arg'

    it 'should remove generator', ->

      result = holidays.remove generatorFn

      assert result, 'should find and remove generatorFn, then return true'


    it 'should purge specified year', ->

      # add more years in there
      for year in [2004, 2005, 2006, 2007, 2008, 2009, 2010]
        holidays._calculateHolidays year

      # count how many years we have stored ...
      yearCount = 0
      yearCount++ for own key, value of holidays.holidays when value?

      # purge one of the years
      holidays.purgeYear 2005

      yearRecount = 0
      yearRecount++ for own key, value of holidays.holidays when value?

      assert.equal yearRecount, (yearCount - 1)

    it 'purgeYear() should not add a property when purging a year which isn\'t already there', ->

      assert !holidays.holidays[1234], 'should not have year 1234'

      # telling it to purge shouldn't have an effect.
      holidays.purgeYear 1234

      assert !holidays.holidays[1234], 'still should not have year 1234'

    it 'should purge each year in arguments', ->

      # count how many years we have stored ...
      yearCount = 0
      yearCount++ for own key, value of holidays.holidays when value?

      # purge some years as args
      holidays.purgeYears 2002, 2006, 2008

      yearRecount = 0
      yearRecount++ for own key, value of holidays.holidays when value?

      assert.equal yearRecount, (yearCount - 3)

    it 'purgeYears() should not add a property when purging a year which isn\'t already there', ->

      assert !holidays.holidays[1234], 'should not have year 1234'
      assert !holidays.holidays[2345], 'should not have year 2345'

      # telling it to purge shouldn't have an effect.
      holidays.purgeYears 1234, 2345

      assert !holidays.holidays[1234], 'still should not have year 1234'
      assert !holidays.holidays[2345], 'still should not have year 2345'

    it 'should purge each year in specified array', ->

      # count how many years we have stored ...
      yearCount = 0
      yearCount++ for own key, value of holidays.holidays when value?

      # purge some years as args
      holidays.purgeYears [2003, 2007, 2009]

      yearRecount = 0
      yearRecount++ for own key, value of holidays.holidays when value?

      assert.equal yearRecount, (yearCount - 3)


    it 'should purge each year within range', ->

      # count how many years we have stored ...
      yearCount = 0
      yearCount++ for own key, value of holidays.holidays when value?

      # purge some years as args
      holidays.purgeYearRange 2001, 2009

      yearRecount = 0
      yearRecount++ for own key, value of holidays.holidays when value?

      assert.equal yearRecount, 2 # 2000 and 2010 remain.


    it 'should eliminate years with undefined values', ->

      # count how many years we have stored ...
      definedYearsCount = 0
      nullYearsCount = 0
      for own key, value of holidays.holidays
        if value? then definedYearsCount++ else nullYearsCount++

      assert nullYearsCount > 0, 'should have keys with null values'

      # eliminate those with null values
      holidays.compact()

      count = 0
      count++ for own key of holidays.holidays
      assert count is definedYearsCount, 'should only have the years with values left'


    it 'should purge all stored years', ->

      # count how many years we have stored ...
      yearCount = 0
      yearCount++ for own key, value of holidays.holidays when value?

      assert yearCount > 0, 'should have some years left'

      # purge some years as args
      holidays.purge()

      yearRecount = 0
      yearRecount++ for own key, value of holidays.holidays when value?

      assert.equal yearRecount, 0



  describe 'with variable holiday', ->

    # matches info in ../helpers/IndependenceDay.js
    info =
      name  : 'Independence Day'
      public: true
      bank  : true

    observedInfo =
      name  : 'Independence Day (Observed)'
      public: true
      bank  : true
      observed: true

    holidays = Holidays()

    # used in first and last 'should'
    returnedGeneratorFn = holidays.add generateIndependenceDay

    it 'should return the provided generator', ->

      assert returnedGeneratorFn is generateIndependenceDay, 'should return the same generator'


    it 'should return the holiday for any year', ->

      for year in [2000, 2001, 2002, 2003]
        date = new Date year, 6, 4
        holiday = holidays.getHoliday date
        assert.deepEqual holiday, info, "holiday info should match for year[#{year}]"


    it 'should return the holiday with extra info specified', ->

      date = new Date 2000, 6, 4

      holiday = holidays.getHoliday date, public:true
      assert.deepEqual holiday, info, 'should work with options as second arg'

      holiday = holidays.getHoliday {public:true}, date
      assert.deepEqual holiday, info, 'should work with options as first arg'

      holiday = holidays.getHoliday {date:date, public:true}
      assert.deepEqual holiday, info, 'should work with only options arg'


    it 'shouldn\'t return holiday with mismatched extra info value', ->

      date = new Date 2000, 6, 4

      holiday = holidays.getHoliday date, public:false
      assert.equal holiday, null, 'should work with options as second arg'

      holiday = holidays.getHoliday {public:false}, date
      assert.equal holiday, null, 'should work with options as first arg'

      holiday = holidays.getHoliday {date:date, public:false}
      assert.equal holiday, null, 'should work with only options arg'


    it 'shouldn\'t return holiday without extra info match', ->

      date = new Date 2000, 6, 4

      holiday = holidays.getHoliday date, nonexistent:true
      assert.equal holiday, null, 'should work with options as second arg'

      holiday = holidays.getHoliday {nonexistent:true}, date
      assert.equal holiday, null, 'should work with options as first arg'

      holiday = holidays.getHoliday {date:date, nonexistent:true}
      assert.equal holiday, null, 'should work with only options arg'


    it 'should return true for the holiday for any year', ->

      for year in [2000, 2001, 2002, 2003]
        date = new Date year, 6, 4
        holiday = holidays.isHoliday date
        assert.equal holiday, true, "isHoliday() should be true for year[#{year}]"


    it 'should return true for the holiday with extra info specified', ->

      date = new Date 2000, 6, 4

      holiday = holidays.isHoliday date, public:true
      assert.equal holiday, true, 'should work with options as second arg'

      holiday = holidays.isHoliday {public:true}, date
      assert.equal holiday, true, 'should work with options as first arg'

      holiday = holidays.isHoliday {date:date, public:true}
      assert.equal holiday, true, 'should work with only options arg'


    it 'should return false for holiday with mismatched extra info value', ->

      date = new Date 2000, 6, 4

      holiday = holidays.isHoliday date, public:false
      assert.equal holiday, false, 'should work with options as second arg'

      holiday = holidays.isHoliday {public:false}, date
      assert.equal holiday, false, 'should work with options as first arg'

      holiday = holidays.isHoliday {date:date, public:false}
      assert.equal holiday, false, 'should work with only options arg'


    it 'should return false for holiday without extra info match', ->

      date = new Date 2000, 6, 4

      holiday = holidays.isHoliday date, nonexistent:true
      assert.equal holiday, false, 'should work with options as second arg'

      holiday = holidays.isHoliday {nonexistent:true}, date
      assert.equal holiday, false, 'should work with options as first arg'

      holiday = holidays.isHoliday {date:date, nonexistent:true}
      assert.equal holiday, false, 'should work with only options arg'

    it 'should have "observed" holiday', ->

      # July 4th 2015 is a Saturday, so it's observed on the 3rd.
      mainDate     = new Date 2015, 6, 4
      observedDate = new Date 2015, 6, 3

      mainInfo =
        name  : 'Independence Day'
        public: true
        bank  : false # cuz it's not on a weekday...

      holiday = holidays.getHoliday mainDate

      assert holiday, 'must return main holiday'
      assert.deepEqual holiday, mainInfo

      holiday = holidays.getHoliday observedDate

      assert holiday, 'must return observed holiday'
      assert.deepEqual holiday, observedInfo


    it 'should add a generator only once', ->

      # add a second generator so there are two...
      fn = holidays.add (year) ->
        info:
          name: 'Filler'
        date:
          month: 1
          day  : 23
      fn.displayName = 'fillerGen'

      assert.equal holidays.generators.length, 2, 'should have two generators'

      holidays.add generateIndependenceDay
      holidays.add generateIndependenceDay
      result = holidays.add generateIndependenceDay

      assert.equal result, generateIndependenceDay, 'should return the same generator'
      assert.equal holidays.generators.length, 2, 'should still have only two generators'


    it 'should not return a holiday when no Date arg is specified', ->

      holiday = holidays.getHoliday()

      assert.equal holiday, null


    it 'should fail to remove a generator it doesn\'t know', ->

      unknownGenerator = (year) -> # noop

      result = holidays.remove unknownGenerator

      assert.equal result, false, 'should not remove an unknown generator'

    # NOTE: do last... it removes the generator...
    it 'should remove generator', ->

      result = holidays.remove generateIndependenceDay

      assert.equal result, true, 'should find and remove generateIndependenceDay, then return true'
      assert.equal holidays.generators.length, 1, 'should only have one Filler generator'

    it 'should no longer have the generator to remove', ->

      result = holidays.remove generateIndependenceDay

      assert.equal result, false
