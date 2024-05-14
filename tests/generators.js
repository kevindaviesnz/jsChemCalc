// Multiply by 2 Generator function
function* MultiplyBy2() {
    const number = yield [];
    yield number * 2;
  }
  
  // initialising generator function
  const multiplyBy2 = MultiplyBy2();
  
  // First the question is returned from generator function
  // We can show the returned or yielded value using the
  // next() method and then using the value property
  console.log(multiplyBy2.next().value); // the question is shown
  
  // passing 4 as a value to the generator function
  // as an argument to the next() method
  // after that, the passed value is multiplied by 2
  // and then the next yield value is
  // returned from the generator function
  console.log(multiplyBy2.next(5).value);
