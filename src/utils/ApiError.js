// Define a new class called ApiError which extends the built-in Error class
class ApiError extends Error {
    constructor(
        // Constructor function which initializes objects of this class
        statusCode, // HTTP status code indicating the type of error
        message = "Something went wrong", // Default error message if not provided
        errors = [], // Array to hold specific error details
        stack = "" // Stack trace of the error, default is empty string
    ) {
        // Call the constructor of the Error class and pass the error message
        super(message);

        // Initialize properties specific to ApiError objects
        this.statusCode = statusCode; // Assign the provided status code
        this.data = null; // Placeholder for additional data, currently not used
        this.message = message; // Assign the provided error message
        this.success = false; // Indicates whether the operation was successful or not
        this.errors = errors; // Assign the provided array of errors

        // Check if a stack trace was provided
        if (stack) {
            this.stack = stack; // If provided, set the stack trace
        } else {
            // If not provided, capture the stack trace using Error.captureStackTrace
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

// Export the ApiError class to make it available for use in other modules
export { ApiError };
