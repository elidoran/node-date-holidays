### 0.3.2 - 2018/07/20

1. fixed custom additional year by generating all holidays for the custom year (instead of just creating an empty object for the year, because that prevented generating for that year)

### 0.3.1 - 2018/07/20

1. add dep @flatten/array and use it to flatten the array of holidays from generators
2. allow holiday info to specify the year in case the observed holiday is in a different year (like New Year's ending up in previous year)
3. add new test for custom year ability
4. clear cached holidays when a new generator is added

### 0.3.0 - 2018/07/19

1. switch to JavaScript (from CoffeeScript, for `lib/index.js`, tests are still CS)
1. add 2018 to LICENSE
2. remove gemnasium badge (GitLab bought them...)
3. update deps
4. update mocha args for newer version
5. drop node 0.10, add node 6-10 (evens)
6. min engine is now node 6
7. added testing with multiple node versions (6-10, evens)
8. added code coverage
9. added more tests for full code coverage
10. split `purge()` into multiple functions and added `purgeYearRange()`, with updated tests for full coverage
11. added `compact()` function to clear up cache
12. changed package.json's nave versions to only major number so it'll use newest one without me updating package.json over and over again for new minor versions
13. added documentation to README for new purge and compact functions.


### 0.2.0 - 2016/06/30

1. fixed export to be a builder function as described in the README

### 0.1.0 - 2016/06/30

1. initial working version with tests
