// To handle socket-io request

const io = require("socket.io")(8080,{
    cors: {
      origin: '*',
    }
  });
const users = {};
io.on('connection', socket => {
    console.log(socket.id);
    socket.on('new-user-joined', name => {
      users[socket.id] = name;
      console.log(socket.id);  
        socket.broadcast.emit("user-joined", name);
    });

    socket.on('send', message => {
        socket.broadcast.emit("receive", {message: message, name: users[socket.id]});
    });

    socket.on('disconnect', ()=> {
      socket.broadcast.emit("user-left", users[socket.id]);
   });

})