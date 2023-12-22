/* setup websocket and callback for received message */
var ws = new WebSocket("ws://localhost:8763/");

/* new message callback */
ws.onmessage = function (event) {
	recMessage(event.data)
};

/* Close connection when window closed */
window.onbeforeunload = function() {
	ws.onclose = function () {};
	ws.close();
};

function generateRandomKey(length) {
    var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    var key = "";
    for (var i = 0; i < length; i++) {
        key += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return key;
}

function sendMessage() {
    /* Grab values */
    var key = document.getElementById("keyTextbox").value;
    var username = document.getElementById("usernameTextbox").value;
    var message = document.getElementById("messageBox").value;
    var imageInput = document.getElementById("imageInput");
    var toSend = "";
    var encrypted = "";

    /* Ignore blank messages */
    if (message === "" && !imageInput.files.length) return;

    /* Prevent blank key */
    if (key === "") {
        logMessageToList("Client: Please set a custom encryption key to chat");
        return;
    }

    /* Prevent blank username */
    if (username === "") {
        logMessageToList("Client: Please set a custom username to chat");
        return;
    }

    /* Handle image attachment */
    if (imageInput.files.length > 0) {
        parseImageAsBase64(imageInput.files[0])
            .then(base64Data => {
                // Append the base64-encoded image data to the message
                message += " [Image: " + base64Data + "]";
                sendEncryptedMessage();
            })
            .catch(error => {
                console.error("Error parsing image as base64:", error);
            });
    } else {
        sendEncryptedMessage();
    }

	
    function sendEncryptedMessage() {
        /* Encrypt and send message to server */
        toSend = username + ": " + message;
        encrypted = encryptMessage(toSend, key);
        ws.send(encrypted);

        /* Clear textboxes */
        document.getElementById("messageBox").value = "";
        imageInput.value = ""; // Clear the file input
    }
}

function parseImageAsBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function (event) {
            // Resolve the promise with the base64-encoded image data
            resolve(event.target.result.split(',')[1]);
        };
        reader.onerror = function (error) {
            reject(error);
        };
        reader.readAsDataURL(file);
    });
}

function encryptMessage(message, key) {
	encrypted = CryptoJS.AES.encrypt(message, key);
	return encrypted;
}

function decryptMessage(message, key) {
	var decrypted = CryptoJS.AES.decrypt(message, key);
	decrypted = decrypted.toString(CryptoJS.enc.Utf8);
	/* If message can't be decrypted, warn user */
	if(decrypted == "") {
		decrypted = "Client: A plaintext or non-decryptable message has been received (See raw message bar)"
	}
	return decrypted;
}

ws.onmessage = function (event) {
    recMessage(event.data);
};

function recMessage(message) {
    /* Update raw data box */
    document.getElementById("rawData").textContent = message;

    /* Attempt to decrypt message */
    var key = document.getElementById("keyTextbox").value;
    var decrypted = decryptMessage(message, key);

    /* Check if the message contains an image */
    if (decrypted.includes("[Image:")) {
        renderBase64Image(decrypted);
    } else {
        /* Add to message list */
        logMessageToList(decrypted);
    }
}

function renderBase64Image(message) {
    /* Extract base64-encoded image data from the message */
    var base64Data = message.match(/\[Image:(.*?)\]/);
    
    if (base64Data && base64Data.length > 1) {
        /* Extract text content before the image tag */
        var textContent = message.split("[Image:")[0];

        /* Create an image element and set its source to the base64 data */
        var img = document.createElement('img');
        img.src = "data:image/png;base64," + base64Data[1];

        /* Create a new list item, fill with text content and image, append to message list */
        var messageList = document.getElementById("messages");
        var newMessage = document.createElement('li');
        var content = document.createTextNode(textContent);

        newMessage.appendChild(content);
        newMessage.appendChild(img);

        messageList.appendChild(newMessage);
    }
}


function logMessageToList(message) {
	/* Create new list item, fill with message, append to message list */
	var messageList = document.getElementById("messages");
	var newMessage = document.createElement('li');
	var content = document.createTextNode(message);

	newMessage.appendChild(content);
	messageList.appendChild(newMessage);
}

function inputReturnHit() {
	if (event.keyCode == 13 && !event.shiftKey) {
		// Prevent newline being entered to textarea
		if(event.preventDefault) event.preventDefault();
		sendMessage();
		return false;
	}
}

/* Initally set the height to be based off window's inner height,
   for better fullscreen on mobile*/
let vh = window.innerHeight * 0.01;
document.documentElement.style.setProperty('--vh', `${vh}px`);

/* If window is resized, updated the height variable */
window.addEventListener('resize', () => {
	let vh = window.innerHeight * 0.01;
	document.documentElement.style.setProperty('--vh', `${vh}px`);
});