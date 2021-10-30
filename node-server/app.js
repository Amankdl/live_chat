require('dotenv').config()
const express = require('express')
const app = express();
const http = require('http').createServer(app)
const io = require('socket.io')(http);
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const Users = require('./models/users');
const Chat = require('./models/chat');

// const io = require("socket.io")(8080,{
//     cors: {
//       origin: '*',
//     }
//   });

app.use(express.urlencoded({
    extended: true
}));

app.use(express.json())

// Connect to mongodb
const dbURI = "mongodb+srv://amankdl:qwertypoi@learnnode.0wehc.mongodb.net/learnnode?retryWrites=true&w=majority";
mongoose.connect(dbURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then((result) => {
        http.listen(8080, () => {
            console.log("Server started");
        });
        console.log("connected to db");
    })
    .catch((error) => {
        console.log(error);
    });

// to handle user registration.
app.post('/register', (req, res) => {
    const providedFields = Object.keys(req.body);
    ['name', 'email', 'phone', 'password'].forEach(field => {
        if (!providedFields.includes(field)) {
            res.json({
                status: false,
                message: `${field} not exists.`
            })
        }
    });
    const payload = {
        name: req.body.name
    };
    const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '15m'
    });
    const user = new Users(req.body);
    user.setPassword(req.body.password);
    user.save()
        .then((result) => {
            res.json({
                status: true,
                message: "success",
                data: {
                    _id: result._id,
                    name: result.name,
                    email: result.email,
                    phone: result.phone,
                    accessToken: accessToken,
                    salt: result.salt,
                    hash: result.hash,
                    createdAt: result.createdAt,
                    updatedAt: result.updatedAt
                }
            })
        })
        .catch((error) => {
            res.json({
                status: false,
                message: error.code == "11000" ? "Email or number already exsists." : error
            })
        });
});

// to handle user login
app.post('/login', (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    if (!username) {
        return res.json({
            status: false,
            message: "username not provided",
        })
    } else if (!password) {
        return res.json({
            status: false,
            message: "password not provided",
        })
    }

    const usernameKey = validateEmail(username) ? 'email' : 'phone';
    var data = {};
    data[usernameKey] = username;

    Users.findOne(data).exec(async function (error, user) {
        if (error) {
            return res.json({
                status: false,
                message: "Somethig went wrong on our side, we are fixing.",
            })
        }

        if (user == null) {
            return res.json({
                status: false,
                message: "User not found."
            })
        } else {
            if (user.validPassword(req.body.password)) {
                const payload = {
                    name: username
                };
                const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
                    expiresIn: '15m'
                });
                return res.json({
                    status: true,
                    message: "success",
                    data: {
                        _id: user._id,
                        name: user.name,
                        email: user.email,
                        phone: user.phone,
                        accessToken: accessToken,
                        salt: user.salt,
                        hash: user.hash,
                        createdAt: user.createdAt,
                        updatedAt: user.updatedAt
                    }
                });
            } else {
                return res.json({
                    status: false,
                    message: "Invalid password."
                });
            }
        }
    });
});

app.get('/', authenticateToken, (req, res) => {
    res.send("Node Server is running. Yay!!")
})

function validateEmail(email) {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) res.json({
        status: false,
        message: "Invalid auth token."
    });

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, decodedToken) => {
        if (error) res.json({
            status: false,
            message: "Invalid auth token."
        });
        req.authenticateToken = decodedToken;
        next();
    });
}

function getJwtPayload(token) {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(Buffer.from(base64, 'base64').toString().split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
};

const users = {};
var chatCount = 0;
var chats = {};
io.on('connection', socket => {
    socket.on('new-user-joined', name => {
        users[socket.id] = name;
        console.log(socket.id);
        socket.broadcast.emit("user-joined", name);
    });

    socket.on('send', async data => {
        const chat = new Chat({
            user_id: data.id,
            message: data.message,
            index: chatCount++,
            time: new Date()
        });
        await chat.save();
        socket.broadcast.emit("receive", {
            message: data.message,
            name: users[socket.id]
        });
    });

    socket.on('disconnect', () => {
        delete users[socket.id]
        // if (!Object.keys(users).length) {
        //     console.log(chats);
        //     console.log("send chats to mongodb");
        // }
        socket.broadcast.emit("user-left", users[socket.id]);
    });

})