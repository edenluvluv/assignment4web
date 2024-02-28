# assignment4web

# Bank Web Application

# for admin
username:kamila

password:kamila

This is a web application that looks like a bank that can suggest you some cards to open and other useful tools to use such as converting currency rates and know about stock market changes.It also handles the middleware that dont allow users to reach pages withour authorization, that relates to admin page too.

## Installation

1. Download the zip file of project.
2. Install dependencies(install others if some issues may appear): 
> npm install
3. Set up environment variables(if provided keys dont work):
Rename .env.example file to .env.
Provide necessary API keys and other configurations in the .env file.

## Usage

Run the application
> node app.js

## Features

### User Authentication:

- Users can register with a unique username and password.
- Registered users can log in to the system.
- Admin users have additional privileges.

### Currency Conversion:

- Users can convert currency rates using the latest exchange rates.
- Conversion rates are fetched from an external API.

### Admin Panel:

- Admin users have access to an admin panel.
- Admins can manage users, including creating, editing, and deleting users.
- Admins can view the system's history and perform administrative tasks.

### Error Handling:

- The application handles various types of errors gracefully and provides appropriate error messages to users.

## Routes

- `/login`: User login page.
- `/register`: User registration page.
- `/main`: Main page accessible after login.
- `/admin`: Admin panel.
- `/logout`: Logout route.
- `/convertion`: Route for currency conversion.
- `/history`: Route to view system history.
- `/random-user`: Route to fetch random user data.
- `/stock`: Route to fetch stock data.
- `/register`: Route for user registration.
- `/admin/create-user`: Route to create a new user (admin only).
- `/admin/edit-user`: Route to edit a user (admin only).
- `/admin/delete-user`: Route to delete a user (admin only).

## Technologies Used

- **Node.js**: Backend JavaScript runtime.
- **Express.js**: Web application framework for Node.js.
- **MongoDB**: NoSQL database for storing user and system data.
- **bcrypt**: Library for hashing passwords.
- **EJS**: Templating engine for rendering views.
- **axios**: Promise-based HTTP client for making API requests.
- **dotenv**: Module for loading environment variables from a `.env` file.
- **session**: Middleware for managing sessions in Express.js.
- **fetch**: Web API for fetching data from external sources.
