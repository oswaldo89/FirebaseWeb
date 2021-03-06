var config = {
    apiKey: "AIzaSyDb6IO-GLo9RjlXErZRJdYe6DhjU2GbIHY",
    authDomain: "realtime4ever-1a17a.firebaseapp.com",
    databaseURL: "https://realtime4ever-1a17a.firebaseio.com",
    projectId: "realtime4ever-1a17a",
    storageBucket: "realtime4ever-1a17a.appspot.com",
    messagingSenderId: "129529109723"
};
firebase.initializeApp(config);

const messaging = firebase.messaging();
messaging.requestPermission().then(function() {
    return messaging.getToken();
}).then(function(token) {
    console.log(token);
}).catch(function(err) {
    console.log('Ocurrio un error.')
});

//listener de notificaciones.
messaging.onMessage(function(payload) {
    console.log("Mensaje recibido: ", payload);
});

// Registro de nuevos usuarios en firebase
$(document).on("click", "#registrar", function() {
    firebase.auth().createUserWithEmailAndPassword($("#user_register").val(), $("#password_register").val()).then(function(user) {
        user.sendEmailVerification().then(function() {
            console.log("Se envio un correo de verificacion.");
        });
    }).catch(function(error) {
        var errorCode = error.code;
        var errorMessage = error.message;
        alert(errorMessage)
    });
});

//Iniciar sesion con un usuario registrado en firebase
$(document).on("click", "#entrar", function() {
    firebase.auth().signInWithEmailAndPassword($("#txt_user").val(), $("#password").val()).then(function(user) {
        if (!user.emailVerified) {
            alert('Verifica tu direccion de correo electrónico.');
        } else {
            console.log('login correcto');
            connect(user.uid);
            getOnlineUsers();
        }
    }).catch(function(error) {
        var errorCode = error.code;
        var errorMessage = error.message;
        alert(errorMessage)
    });
});

//Cuando el status de algun usuario pasa de conectado/desconectado
firebase.auth().onAuthStateChanged(function(user) {
    if (user != null)
        connect(user.uid);
});

//se ejecuta cuando un registro es modificado.
var ref = firebase.database().ref('/status/');
ref.on('child_changed', function(data) {
    getOnlineUsers();
    $("#txt_user").val(firebase.auth().currentUser.email);
});

//obtiene solo los usuarios online
function getOnlineUsers(){
    firebase.database().ref('/status/').orderByChild('state').equalTo("online").once('value').then(function(snapshot) {
      var onlineUsers = snapshot.val() == null ? 0 : Object.keys(snapshot.val()).length;
      $("#users_online").empty();
      $("#users_online").append(onlineUsers);
    });
}

function connect() {
    if (firebase.auth().currentUser != null) {
        const uid = firebase.auth().currentUser.uid
        const userStatusDatabaseRef = firebase.database().ref(`/status/${uid}`);
        const isOfflineForDatabase = {
            state: "offline",
            last_changed: firebase.database.ServerValue.TIMESTAMP
        };

        const isOnlineForDatabase = {
            state: "online",
            last_changed: firebase.database.ServerValue.TIMESTAMP
        };
        firebase.database().ref(".info/connected").on("value", function(snapshot) {
            if (snapshot.val() == false) {
                return;
            };
            userStatusDatabaseRef.onDisconnect().set(isOfflineForDatabase).then(function() {
                userStatusDatabaseRef.set(isOnlineForDatabase);
            });
        });
    }
}