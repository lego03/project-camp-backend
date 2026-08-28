const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => {
      if (typeof next === "function") {
        next(err)
      } else {
        console.error("next is not a function, error was:", err)
      }
    });
  };
};

export { asyncHandler };