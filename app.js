//app.js
const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const session = require('express-session');
const User = require('./models/user');
const fetch = require('node-fetch');

const app = express();
const port = 3000;
const History = require('./models/history');

app.use(session({
    secret: 'key',
    resave: false,
    saveUninitialized: true
}));

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.redirect('/login');
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/register', (req, res) => {
    res.render('register');
});

app.get('/admin', (req, res) => {
    res.render('admin');
});

app.get('/main', (req, res) => {
    res.render('main');
});

app.get('/admin', isAdmin, (req, res) => {
    res.render('admin');
});

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

function isAdmin(req, res, next) {
    const username = req.session.username;
    if (!username) {
        return res.status(403).send('Access denied. not logged');
    }

    if (username === 'kamila') {
        next();
    } else {
        return res.status(403).send('Access denied. not admin');
    }
}

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

function isAdmin(req, res, next) {
    const username = req.session.username;
    if (!username) {
        return res.status(403).send('Access denied');
    }

    User.findOne({ username, isAdmin: true }, (err, user) => {
        if (err || !user) {
            return res.status(403).send('Access denied');
        }
        next();
    });
}

app.post('/register', async (req, res) => {
    const { username, password } = req.body;

    try {
        console.log('============ USER: ', User.toString(), User.create)
        const user = await User.create({
            username: username,
            password: password,
            userID: generateUserID(),
            isAdmin: username === 'admin'
        });
        user.createdAt = new Date();
        user.updatedAt = new Date();
        await user.save();

        res.render('success', { message: 'Registration successful', link: '/login' });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).send('Internal Server Error');
    }
});


app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        console.log(User.create)
        const user = await User.findOne({ username });
        console.log(user, password)
        if (!user || user.password !== password) {
            return res.status(404).send('Invalid username or password');
        }

        req.session.username = username;

        if (user.isAdmin) {
            res.redirect('/admin');
        } else {
            res.redirect('/weather');
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).send('Internal Server Error');
    }
});



app.post('/admin/create-user', isAdmin, async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.create({
            username: username,
            password: password,
            userID: generateUserID(),
            isAdmin: false
        });
        user.createdAt = new Date();
        user.updatedAt = new Date();
        await user.save();

        return res.status(404).send('User created successfully');
        res.render('admin', { message: 'User created successfully' });
    } catch (error) {
        console.error('User creation error:', error);
        res.status(500).send('Internal Server Error');
    }
});


app.post('/admin/edit-user', isAdmin, async (req, res) => {
    const { oldUsername, newUsername, newPassword } = req.body;

    try {
        const user = await User.findOneAndUpdate(
            { username: oldUsername },
            { username: newUsername, password: newPassword },
            { new: true }
        );

        if (!user) {
            return res.status(404).send('User not found');
        }
        return res.status(404).send('User edited successfully');
        res.render('admin', { message: 'User edited successfully' });
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