// client side server work will go here

const socket = io('http://192.168.1.3:8080');

const name = prompt("Tell me your name pls.");
const form = $('#msg-send-form');

function clearInput() {
    $('#msg-input').val("");
}

function append(position, data) {
    var div = document.createElement('div');
    div.classList = `msg-list ${position}`;
    if (data.name == null) {
        div.innerHTML = `<div class="message">
        <b>${data.message}</b>
        </div>`;
    } else {
        div.innerHTML = `<div class="message">
        <b>${data.name}:</b> ${data.message}
        </div>`;
    }
    $('#chat-box').append(div);
}

$("#msg-send-form").on("submit", function (e) {
    e.preventDefault();
    const message = $('#msg-input').val();
    socket.emit('send', message);
    append('right', {
        name: "You",
        message
    });
    clearInput();
})

socket.emit('new-user-joined', name);

socket.on('user-joined', name => {
    append('left', {
        name: null,
        message: `${name} joined the chat.`
    });
});

socket.on('receive', data => {
    append('left', data);
});

socket.on('user-left', name => {
    append('left', {name:null, message:`${name} left the chat.`});
});