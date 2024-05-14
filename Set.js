// Revised 14 May 2024
const _ = require('lodash')
const Typecheck = require("./Typecheck")

const Set = () => {
  return {
    unique: (array) => _.uniq(array),
    intersection: (array1, array2) => _.intersection(array1, array2),
    difference: (array1, array2) => _.difference(array1, array2),


    removeFromArray: (array1, array2) => {
        Typecheck(
          {name:"array1", value:array1, type:"array"},
          {name:"array2", value:array2, type:"array"}
        )
        const removeSet = new global.Set(array2)
        return array1.filter((value) => !removeSet.has(value))
      },
    insertIntoArray: (array1, array2, insertion_point) => {
      return [...array1.slice(0, insertion_point), ...array2, ...array1.slice(insertion_point)]
    },
    arraysDifferAt: (array1, array2) => {
      let index = 0
      while (index < array1.length && index < array2.length) {
        if (array1[index] !== array2[index]) {
          return index
        }
        index++
      }
      return -1
    }
  }
}

module.exports = Set


const array1 = [1, 2, 3, 4, 5];
const array2 = [1, 2, 10, 4, 5];
const result = Set().arraysDifferAt(array1, array2);
console.log(result)

const array21 = [1, 2, 3, 4, 5];
const array22 = [10, 11, 12];
const insertion_point = 2;
const result2 = Set().insertIntoArray(array21, array22, insertion_point);
console.log(result2)

const array31 = [1, 2, 3, 4, 5];
const array32 = [4, 5, 6, 7, 8];
const result3 = Set().removeFromArray(array31, array32);

const array41 = [1, 2, 3, 4, 5];
const array42 = [4, 5, 6, 7, 8];
const result4 = Set().difference(array41, array42);
console.log(result4) 

const array51 = [1, 2, 3, 4, 5];
const array52 = [4, 5, 6, 7, 8];
const result5 = Set().intersection(array51, array52);
console.log(result5)

const array61 = [1, 2, 2, 3, 4, 4, 5];
const result6 = Set().unique(array61);
console.log(result6)







