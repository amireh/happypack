// READY
//
// Emitted when a channel is open and ready to accept further messages.
//
//     shape({});

// CONFIGURE
//
// Emitted by each HappyThread to its channel with the current compiler's
// options so that the workers may use those options in their FakeCompiler /
// FakeLoaderContext.
//
//     shape({
//       data: shape({
//         compilerOptions: string
//       })
//     });

// CONFIGURE_DONE
//
// Emitted when a channel has successfully deserialized and configured its
// workers with the compiler options.
//
//     shape({});

// COMPILE
//
//     shape({
//       sourcePath: string,
//       compiledPath: string,
//       loaderContext: object,
//     });

// COMPILE_DONE
//
//     shape({
//       sourcePath: string,
//       compiledPath: string,
//       success: bool,
//     });

// COMPILER_REQUEST
//
//     shape({
//       data: shape({
//         id: string.isRequired,
//         type: oneOf([ 'resolve' ]).isRequired,
//
//         payload: oneOfType([
//           // resolve
//           shape({
//             context: string,
//             resource: string,
//           }),
//         ]).isRequired,
//       }),
//     });

// COMPILER_RESPONSE
//
//     shape({
//       data: shape({
//         id: string.isRequired,
//
//         payload: shape({
//           error: string,
//           result: object,
//         })
//       })
//     });
