assert   = require 'assert'
holidays = require('../../lib')()

# test add()
#  call add(fn) and ensure it's in generators array, how?
#  call getHoliday() with date and ensure the generator produces it
#  call isHoliday() and ensure it returns true when it exists, false with bad comparisons
#  call remove() and ensure it's gone

describe 'test holidays', ->

  describe 'with fixed holiday', ->

    info =
      name : 'Fixed Date'
      fixed: true

    generatorFn = null

    it 'should create generator for fixed date', ->

      generatorFn = holidays.add
        info: info
        date:
          month: 1
          day  : 2


    it 'should return the holiday for any year', ->

      for year in [2000, 2001, 2002, 2003]
        date = new Date year, 1, 2
        holiday = holidays.getHoliday date
        assert.equal holiday, info, "holiday info should match for year[#{year}]"


    it 'should return the holiday with extra info specified', ->

      date = new Date 2000, 1, 2

      holiday = holidays.getHoliday date, fixed:true
      assert.equal holiday, info, 'should work with options as second arg'

      holiday = holidays.getHoliday {fixed:true}, date
      assert.equal holiday, info, 'should work with options as first arg'

      holiday = holidays.getHoliday {date:date, fixed:true}
      assert.equal holiday, info, 'should work with only options arg'


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

      assert.equal result, true

  # TODO: test a non-fixed date with a real generator function

  # TODO: test another one which provides multiple holidays

  # TODO: test another one which conditionally provides an "observed" holiday
