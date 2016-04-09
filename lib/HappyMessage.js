// COMPILE
//
// shape({
//   sourcePath: string,
//   compiledPath: string,
//   loaderContext: object,
// });

// COMPILE_DONE
//
// shape({
//   sourcePath: string,
//   compiledPath: string,
//   success: bool,
// });

// COMPILER_REQUEST
//
// shape({
//   data: shape({
//     id: string.isRequired,
//     type: oneOf([ 'resolve' ]).isRequired,
//
//     payload: oneOfType([
//       // resolve
//       shape({
//         context: string,
//         resource: string,
//       }),
//     ]).isRequired,
//   }),
// });

// COMPILER_RESPONSE
//
// shape({
//   data: shape({
//     id: string.isRequired,
//
//     payload: shape({
//       error: string,
//       result: object,
//     })
//   })
// });
