//app.js
const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const session = require('express-session');
const User = require('./models/user');
const fetch = require('node-fetch');
const bcrypt = require('bcrypt');
const axios = require('axios');

const app = express();
const port = 3000;
const History = require('./models/history');
const Card = require('./models/card');

app.use(session({
    secret: 'key',
    resave: false,
    saveUninitialized: true
}));

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.redirect('/login');
});
app.get('/convertion', (req, res) => {
    // Provide default data for rendering the "convertion" template
    const defaultData = {
        from: 'USD',    // Default currency to convert from
        to: 'EUR',      // Default currency to convert to
        amount: 100     // Default amount
    };

    // Render the "convertion" template and pass the default data
    res.render('convertion', { conversionResult: null, ...defaultData });
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/register', (req, res) => {
    res.render('register');
});

app.get('/main', (req, res) => {
    res.render('main');
});

app.get('/admin', isAdmin, (req, res) => {
    res.render('admin');
});

app.get('/admincards', isAdmin, (req, res) => {
    res.render('admincards'); // Render the admincards.ejs file
});

// Assuming you have express app set up



app.get('/random-user', async (req, res) => {
    try {
        const randomUserApiUrl = 'https://randomuser.me/api/';
        const response = await fetch(randomUserApiUrl);
        const userData = await response.json();
        res.render('random-user', { userData });
        logRequest(req.session.username, '/random-user', null, 'Success');
    } catch (error) {
        console.error('Error fetching random user data:', error);
        res.status(500).send('Internal Server Error');
        logRequest(req.session.username, '/random-user', null, 'Failure', error.message);
    }
});

app.get('/history', async (req, res) => {
    try {
        const history = await History.find().sort({ timestamp: -1 }).limit(10); // Example: Fetch last 10 history records
        res.render('history', { history });
    } catch (error) {
        console.error('Error fetching history:', error);
        res.status(500).send('Internal Server Error');
    }
});


async function isAdmin(req, res, next) {
    const username = req.session.username;
    if (!username) {
        return res.status(403).send('Access denied. Not logged in.');
    }

    try {
        const user = await User.findOne({ username, isAdmin: true });
        if (!user) {
            return res.status(403).send('Access denied. Not an admin.');
        }
        next();
    } catch (error) {
        console.error('Error finding user:', error);
        return res.status(500).send('Internal Server Error');
    }
}


// function isAdmin(req, res, next) {
//     const username = req.session.username;
//     if (!username) {
//         return res.status(403).send('Access denied. not logged');
//     }

//     if (username === 'kamila') {
//         next();
//     } else {
//         return res.status(403).send('Access denied. not admin');
//     }
// }

function logRequest(user, endpoint, requestData, outcome, error) {
    const historyData = {
        user: user || 'Anonymous',
        endpoint,
        requestData,
        outcome,
        error,
        timestamp: new Date()
    };
    History.create(historyData)
        .then(() => console.log('Request logged:', historyData))
        .catch(error => console.error('Error logging request:', error));
}

function generateUserID() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}


const alphaVantageApiKey = 'W2KWU488AIVMCQFQ';
app.all('/stock', async (req, res) => {
    if (req.method === 'GET') {
        // Render the stock template with default values
        res.render('stock', { symbol: 'AAPL', price: 150.25, changePercent: '+2.5%', error: null, conversionResult: null });
    } else if (req.method === 'POST') {
        // Retrieve the stock symbol from the request body
        const symbol = req.body.symbol;
        // Construct the API URL for AlphaVantage
        const apiUrl = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${alphaVantageApiKey}`;

        try {
            // Fetch data from the AlphaVantage API
            const response = await fetch(apiUrl);
            const data = await response.json();

            // Check if data for the symbol is found
            if (data["Global Quote"]) {
                // Extract relevant information from the API response
                const { "01. symbol": symbol, "05. price": price, "10. change percent": changePercent } = data["Global Quote"];
                // Render the stock template with retrieved data
                res.render('stock', { symbol, price, changePercent, error: null, conversionResult: null });
            } else {
                // If symbol is not found, send a 404 response
                res.status(404).render('stock', { symbol: null, price: null, changePercent: null, error: 'Stock symbol not found', conversionResult: null });
            }
        } catch (error) {
            // If there's an error fetching data, send a 500 response
            console.error('Error fetching stock data:', error);
            res.status(500).render('stock', { symbol: null, price: null, changePercent: null, error: 'Internal Server Error', conversionResult: null });
        }
    } else {
        // If request method is not GET or POST, send a 405 response
        res.status(405).send('Method Not Allowed');
    }
});


async function fetchConversionRate(from, to) {
    const API_KEY = 'e38b207477704e9d980b04dd8d1e2fb4'; // Replace 'YOUR_API_KEY' with your actual API key
    const apiUrl = `https://open.er-api.com/v6/latest/${from}`;

    const response = await axios.get(apiUrl, {
        params: {
            app_id: API_KEY,
            symbols: to
        }
    });

    const conversionRate = response.data.rates[to];
    if (!conversionRate) {
        throw new Error('Conversion rate not available');
    }
    
    return conversionRate;
}


// Function to convert currency using fetched conversion rates
async function convertCurrency(from, to, amount) {
    try {
        const rate = await fetchConversionRate(from, to);
        const convertedAmount = amount * rate;
        return convertedAmount;
    } catch (error) {
        throw new Error('Currency conversion failed: ' + error.message);
    }
}

// Update the /convert-currency route to handle form submission
app.post('/convert-currency', async (req, res) => {
    try {
        const { from, to, amount } = req.body;
        const convertedAmount = await convertCurrency(from, to, amount);
        const conversionResult = {
            from,
            to,
            amount,
            convertedAmount
        };
        // Render the "convertion" template with conversionResult and error variables
        res.render('convertion', { conversionResult, error: null });
    } catch (error) {
        // If an error occurs during conversion, render the template with error message
        res.render('convertion', { conversionResult: null, error: error.message });
    }
});


// Create a new card
app.post('/admin/cards', isAdmin, async (req, res) => {
    const { nameEn, nameOther, descriptionEn, descriptionOther, image1, image2, image3 } = req.body;
    try {
        const card = await card.create({
            name: { en: nameEn, other: nameOther },
            description: { en: descriptionEn, other: descriptionOther },
            images: [image1, image2, image3],
            createdAt: new Date(),
            updatedAt: new Date()
        });
        res.redirect('/admin/cards');
    } catch (error) {
        console.error('Error creating card:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Create a new card
app.post('/admin/create-card', isAdmin, async (req, res) => {
    // Extract card data from the request body
    const { nameEn, nameOther, descriptionEn, descriptionOther, image1, image2, image3 } = req.body;

    try {
        // Create a new card in the database
        const card = await Card.create({
            name: { en: nameEn, other: nameOther },
            description: { en: descriptionEn, other: descriptionOther },
            images: [image1, image2, image3], // Saving URLs directly
            createdAt: new Date(),
            updatedAt: new Date()
        });

        // Redirect the user to a confirmation page or any other appropriate page
        res.redirect('/admin/cards');
    } catch (error) {
        // Handle errors if card creation fails
        console.error('Error creating card:', error);
        res.status(500).send('Internal Server Error');
    }
});



// Get a specific card
app.get('/admin/cards/:id', isAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const card = await Card.findById(id);
        if (!card) {
            return res.status(404).send('Card not found');
        }
        res.json(card);
    } catch (error) {
        console.error('Error fetching card:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Update an existing card
app.put('/admin/cards/:id', isAdmin, async (req, res) => {
    const { id } = req.params;
    const { nameEn, nameOther, descriptionEn, descriptionOther } = req.body;
    try {
        const card = await Card.findByIdAndUpdate(id, {
            name: { en: nameEn, other: nameOther },
            description: { en: descriptionEn, other: descriptionOther },
            updatedAt: new Date()
        });
        if (!card) {
            return res.status(404).send('Card not found');
        }
        res.redirect('/admin/cards');
    } catch (error) {
        console.error('Error updating card:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Delete an existing card
app.delete('/admin/cards/:id', isAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const card = await Card.findByIdAndDelete(id);
        if (!card) {
            return res.status(404).send('Card not found');
        }
        res.redirect('/admin/cards');
    } catch (error) {
        console.error('Error deleting card:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/register', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Check if the username already exists
        const existingUser = await User.findOne({ username: username });
        if (existingUser) {
            res.render('success', { message: 'User already exists', link: '/register' });
        }
        else{
            
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
            username: username,
            password: hashedPassword,
            userID: generateUserID(),
            isAdmin: username === 'admin'
        });
        user.createdAt = new Date();
        user.updatedAt = new Date();
        await user.save();

        res.render('success', { message: 'Registration successful', link: '/login' });
        }
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).send('Internal Server Error');
    }
});



app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).send('Invalid username or password');
        }

        // Compare the hashed password stored in the database with the password entered by the user
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(404).send('Invalid username or password');
        }

        req.session.username = username;

        if (user.isAdmin) {
            res.redirect('/admin');
        } else {
            res.redirect('/main');
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).send('Internal Server Error');
    }
});



app.post('/admin/create-user', isAdmin, async (req, res) => {
    const { username, password } = req.body;
  
    try {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
          return res.status(400).send('Username already exists');
        }
        else{
            const hashedPassword = await bcrypt.hash(password, 10);

            // Create the user
            const user = await User.create({
              username: username,
              password: hashedPassword,
              userID: generateUserID(), 
              isAdmin: false 
            });
              user.createdAt = new Date();
              user.updatedAt = new Date();
              await user.save(); 
          
              return res.status(404).send('User created successfully');
              res.render('admin', { message: 'User created successfully' });
        }
    } catch (error) {
      console.error('User creation error:', error);
      res.status(500).send('Internal Server Error');
    }
  });
  
  
  app.post('/admin/edit-user', isAdmin, async (req, res) => {
    const { oldUsername, newUsername, newPassword } = req.body;
  
    try {
        // Find the user by old username
        const user = await User.findOne({ username: oldUsername });
    
        if (!user) {
          return res.status(404).send('User not found');
        }
    
        // Hash the new password if provided
        let hashedPassword = user.password; // Keep the old hashed password by default
        if (newPassword) {
          hashedPassword = await bcrypt.hash(newPassword, 10);
        }
    
        // Update the user information
        user.username = newUsername || user.username; // Keep the old username if new one is not provided
        user.password = hashedPassword;
    
        await user.save();
    
        // Respond with success
        res.status(200).send('User edited successfully');
    } catch (error) {
      console.error('User edit error:', error);
      res.status(500).send('Internal Server Error');
    }
  });
  
  
  
  app.post('/admin/delete-user', isAdmin, async (req, res) => {
    const { username } = req.body;
  
    console.log('delete', username)
  
    try {
      const user = await User.findOneAndDelete({ username });
      if (!user) {
        return res.status(404).send('User not found');
      }
      return res.status(404).send('User deleted successfully');
      return res.render('admin', { message: 'User deleted successfully' });
    } catch (error) {
      console.error('User deletion error:', error);
      return res.status(500).send('Internal Server Error');
    }
  });
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});