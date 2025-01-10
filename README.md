# eShop Backend

This repository contains the backend code for an eShop application.

## Project Overview

The eShop backend is a Node.js application that provides the server-side functionality for an online shop. It uses Express.js as the web application framework and MongoDB as the database.

## Repository Structure

The repository includes the following key files and directories:

- `app.js`: The main application file that sets up the Express server, middleware, and routes.
- `package.json`: Defines the project dependencies and scripts.
- `package-lock.json`: Locks the versions of the dependencies.
- `.gitignore`: Specifies which files and directories should be ignored by Git.
- `.aider/CONVENTIONS.md`: Contains engineering conventions for the project.
- `routes/`: Directory containing route handlers for different API endpoints.
- `controllers/`: Directory containing controller logic (assumed based on project structure).
- `models/`: Directory containing Mongoose models (assumed based on project structure).
- `helpers/`: Directory containing helper functions, including JWT authentication and error handling.
- `common-middleware/`: Directory containing common middleware functions.
- `backgroundService.js`: File containing background service logic for updating product sale status.
- `socketHandlers.js`: File containing Socket.IO event handlers for real-time communication.

## Background Services

The application includes a background service that periodically updates the sale status of products. This service runs every hour in the production environment.

## Real-time Communication

The application uses Socket.IO for real-time communication, primarily for handling vendor support queries. It includes features such as:

- Joining and leaving chat rooms
- Sending and receiving messages
- Typing indicators
- Marking messages as read
- Tracking online users

## API Routes

The application exposes the following API routes:

- `/api/v1/products`: Product-related operations
- `/api/v1/categories`: Category-related operations
- `/api/v1/orders`: Order-related operations
- `/api/v1/users`: User-related operations
- `/api/v1/videos`: Video-related operations
- `/api/v1/admin`: Admin authentication
- `/api/v1/videocomments`: Video comment operations
- `/api/v1/bookmarks`: Bookmark operations
- `/api/v1/address`: Address-related operations
- `/api/v1/card`: Card-related operations
- `/api/v1/questions`: Question-related operations
- `/api/v1/recentlyViewed`: Recently viewed items operations
- `/api/v1/canceledOrder`: Canceled order operations
- `/api/v1/purchase`: Purchase-related operations
- `/api/v1/vendor`: Vendor-related operations
- `/api/v1/client`: Client-related operations
- `/api/v1/returnBank`: Return bank operations
- `/api/v1/vendor-support-query`: Vendor support query operations

Note: Replace `/api/v1` with the actual value of `process.env.API_URL` in your environment.

## Setup and Installation

1. Ensure you have Node.js version 14.0.0 or higher installed.
2. Clone this repository.
3. Run `npm install` to install the dependencies.

## Scripts

- `npm start`: Starts the application.
- `npm run dev`: Starts the application in development mode using nodemon.
- `npm test`: Currently not configured (exits with an error).

## Main Dependencies

- Express.js: Web application framework
- Mongoose: MongoDB object modeling tool
- JWT: JSON Web Token implementation
- Bcrypt: Password hashing function
- Multer: Middleware for handling multipart/form-data
- Socket.io: Real-time bidirectional event-based communication

## Conventions

As specified in the `.aider/CONVENTIONS.md` file, the main coding convention for this project is:

- Write simple code.

## Additional Features

- AWS S3 integration for file storage
- Email functionality using Nodemailer
- Cron jobs using node-cron
- Image processing with Sharp
- HTML sanitization

## License

This project is licensed under the ISC License.

For more detailed information about the project's API endpoints, database schema, and usage instructions, please refer to the source code and comments within the files.
