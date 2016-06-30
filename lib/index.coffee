
# store calculated holidays in this
# store by year, then month, then day of the month
holidays = {}

# store holiday generators
generators = []

# store the holiday into `holidays` for the specified year
storeHoliday = (holiday, year) ->
  # purposely do *not* create object for year because we'd be repeating that
  # too often. do it elsewhere!
  # holidays[year] ?= {}
  holidays[year][holiday.date.month] ?= {}
  holidays[year][holiday.date.month][holiday.date.day] = holiday.info
  return

# calculate holidays for the specified year and store them in the cache
calculateHolidays = (year) ->

  # if we've already calculated the holidays for that year
  if holidays[year]? then return

  # create object to hold holidays for the specified year
  holidays[year] = {}

  # use generators to produce holidays for the specified year
  for generate in generators
    result = generate year
    if Array.isArray result
      storeHoliday holiday, year for holiday in result

    else storeHoliday result, year


module.exports = ops =

  calculateHolidays: calculateHolidays

  isHoliday: (arg1, arg2) ->
    holiday = ops.getHoliday arg1, arg2

    return holiday?

  getHoliday: (arg1, arg2) ->

    if arg1 instanceof Date
      date = arg1
      options = arg2

    else if arg2 instanceof Date
      date = arg2
      options = arg1

    else
      options = arg1
      date    = arg1.date

    unless date? then return null

    # get year and month for calculations and getting the holiday
    year = date.getFullYear()
    month = date.getMonth()

    # ensure we've calculated the holidays for that year and month
    ops.calculateHolidays year #, month could focus on a month...

    # get holiday by year, month, and day in the month
    holiday = holidays[year]?[month]?[date.getDate()]

    # if there's no holiday then return null now
    unless holiday? then return null

    # when there is a holiday compare extra values
    # loop over all properties in options, except `name`
    if options?
      for key,value of options when key isnt 'name' and key isnt 'date'
        # if it doesn't match then don't return the holiday
        if holiday[key] isnt value then return null

    return holiday

  purge: (years...) ->
    # if years are specified then delete only those years
    if years?
      # if they specified an array instead of args then unwrap array
      if Array.isArray years[0] then years = years[0]
      delete holidays[year] for year in years

    else # delete all of them
      holidays = {}

    return

  add: (generator) ->
    if typeof generator is 'function'

      # ensure it isn't already in the array
      for fn in generators
        if fn is generator then return generator

    else # create the generator from the data
      info = generator.info
      date = generator.date
      generator = (year) ->
        return {
          info:info
          date:
            month: date.month
            day  : date.day
        }

    generators.push generator

    # return the function to use in remove() in case we created it
    return generator

  # TODO: allow specifying a year, month, and day to remove the generator
  #       which generates the matching date
  remove: (generator) ->
    for fn,index in generators
      if fn is generator
        generators.splice index, 1
        return true

    # didn't find it, so, return false
    return false
