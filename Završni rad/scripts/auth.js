
// slušaj hoce li se stanje promjeniti
var previousUser = 1;
auth.onAuthStateChanged((user) => {
  if (user) {

    showElements(user);
    userName.innerHTML = user.displayName;
    previousUser = user;

  } else {
    showElements();
    if (previousUser != 1) {
      db.ref("/users/" + previousUser.uid).update({
        active: false,
      });
      previousUser = 1;
    }
  }
});

const signup = document.getElementById("signup-form");
const messageScreen = document.getElementById("messages");
const msgInput = document.getElementById("msg-input");
const msgBtn = document.getElementById("msg-btn");
const chatName = document.getElementById("chat-header");
const msgRef = db.ref("/msgs");
const defaultPicture = firebase.storage().ref("default slika/macka.jpg");
const numberOfUnreadMessages = document.getElementById("newMessages");
var chosenNameID = 0;
var unreadMessagesCounter = 0;
const unreadMessages = document.getElementById("unreadMessages");
const seenMsg = document.getElementById("SeenMsg");
const Users = document.getElementById("Users");


signup.addEventListener("submit", (e) => {
  e.preventDefault();
  const email = document.getElementById("signup-email").value;
  const password = signup["signup-password"].value;
  let name = signup["signup-name"].value;
  let surname = document.getElementById("signup-surname").value;
  const fullname = name + " " + surname;
  const test = /^[A-ZČŠĐŽĆ][A-Za-zČčŠĐđžŽćĆ]{0,}$/;

  if (test.test(name) && test.test(surname)) {
    auth.createUserWithEmailAndPassword(email, password).then(() => {
      //updejtat njegov user name
      var currentUser = firebase.auth().currentUser;

      currentUser.updateProfile({ displayName: fullname }).catch(function (error) {
        // An error happened.
        console.log(error)
      });

      ShowAlertMessage(currentUser);
      AddUserToDatabase(currentUser);
    })
      .catch((error) => {
        window.alert(error.message);
      });
  }
  else {
    alert("Name and Surname can't use special characters also first letter must be capital");
    signup.reset();
  }

});

function ShowAlertMessage(currentUser) {

  if (currentUser.emailVerified == false) {
    window.alert("Please Verify your email in order to use our chat!");
  }
}

function AddUserToDatabase(trenutniUser) {
  const email = document.getElementById("signup-email").value;
  const password = signup["signup-password"].value;
  const name = signup["signup-name"].value;
  const surname = document.getElementById("signup-surname").value;
  const fullName = name + " " + surname;
  const modal = document.querySelector("#modal-signup");

  defaultPicture.getDownloadURL().then((link) => {

    const user = {
      slika: link,
      active: true,
      id: trenutniUser.uid,
      email,
      password,
      ime: fullName,
    };

    userRef.child(`${trenutniUser.uid}`).set(user);
    M.Modal.getInstance(modal).close();
    signup.reset();
    location.reload();
  });
}


/////////////////////logout
const logout = document.getElementById("logout");

logout.addEventListener("click", (event) => {
  event.preventDefault();

  auth.signOut().catch((error) => {
    window.alert(error.message);
  });
});



///////////////////logiranje
const login = document.getElementById("login-form");

login.addEventListener("submit", (event) => {
  event.preventDefault();
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;

  auth.signInWithEmailAndPassword(email, password).then(function () {

    const modal = document.querySelector("#modal-login");
    M.Modal.getInstance(modal).close();
    login.reset();
    var currentUser = firebase.auth().currentUser;
    ShowAlertMessage(currentUser);
    UpdateActiveStatus(currentUser);

    location.reload();
  })
    .catch((error) => {
      window.alert(error.message);
    });
});


function UpdateActiveStatus(currentUser) {
  db.ref("/users/" + currentUser.uid).update({
    active: true,
  });
}

////za chit chat

function checkMessages(data) {

  seenMsg.style.display = "none ";
  updateUnreadMessages(data);
  updateMessageScreen(data);
  updateSeen(data);
  //automatsko skrolanje
  messageScreen.scrollIntoView(false);
  ShowSeen(data);
}

msgRef.on("child_added", checkMessages);


function updateUnreadMessages(data) {

  const { IDsender, IDreciever, text, isSeen } = data.val();
  var senderName = db.ref("/users/" + IDsender + "/ime");
  var name;
  var currentUser = firebase.auth().currentUser;

  ////ime sendera poruke
  senderName.on("value", function (snapshot) {
    name = snapshot.val();

    /////provjerava jel pogledana poruka
    if (currentUser.uid == IDreciever && isSeen == false && chosenNameID != IDsender) {
      unreadMessagesCounter++;
      var picture = db.ref("/users/" + IDsender + "/slika");
      picture.on("value", (snapshot) => {
        profilePic = snapshot.val();

        unreadMessages.innerHTML += ` <div style="  border-style:  ridge ; border-color: #eeeeee;"> <img src="${profilePic}" width=50px height=50px />  ${name}:  ${text} </div> `;
      });
    }

    numberOfUnreadMessages.innerHTML = `Unread messages (${unreadMessagesCounter})`;
  });

}


function updateMessageScreen(data) {

  const { IDsender, IDreciever, text } = data.val();
  var currentUser = firebase.auth().currentUser;

  if ((IDreciever == currentUser.uid && IDsender == chosenNameID) || (IDreciever == chosenNameID && IDsender == currentUser.uid)) {
    msg = `<li class=${IDsender == currentUser.uid ? `msg-my` : `msg`}> <span>  ${text}</span> </li>`;
    messageScreen.innerHTML += msg;
  }

}


function updateSeen(data) {

  const { IDsender, IDreciever, isSeen } = data.val();
  var currentUser = firebase.auth().currentUser;
  var ActiveStatus;
  var Active = db.ref("/users/" + IDreciever + "/active");

  Active.on("value", snapshot => {
    ActiveStatus = snapshot.val();
  })

  ///provjera jel poruka procitana
  if (chosenNameID == IDsender && ActiveStatus == true && currentUser.uid == IDreciever && isSeen == false) {
    db.ref("/msgs/" + data.key).update({
      isSeen: true,
    })
  }

  if (currentUser.uid == IDsender && chosenNameID == IDreciever && isSeen == false) {
    msgRef.once("child_changed", ShowSeen);
  }
}


////na kraju funkcije pozivas show data zato sto ako tek dodje u chat da mu pise seen, a onaj listener kod ifa je ako je u chatu da mu pise seen
function ShowSeen(data) {
  const { IDsender, IDreciever, isSeen } = data.val();
  var currentUser = firebase.auth().currentUser;

  if (isSeen == true && chosenNameID == IDreciever && currentUser.uid == IDsender) {
    seenMsg.style.display = "block";
    seenMsg.scrollIntoView();
  }
}


msgBtn.addEventListener("click", (event) => {
  event.preventDefault();

  if (!msgInput.value.trim()) {
    return;
  }

  var message = msgInput.value;
  msgInput.value = "";
  ///sve dok je vece ili jednako n-u izvrti ovu petlju, rastavi na 2 dijela kako bi mogao dodjeliti crticu
  ///ako prvi dio na kraju nema razmak(prazan prostor) i iduci znak isto nije razmak i prvi dio je duzine 75(max) stavi crticu
  for (var n = 0; msgInput.value.trim().length >= n;) {

    var firstPart = message.slice(n, n + 75);
    var secondPart = message.slice(n, n + 76);

    if (firstPart.slice(74) != " " && secondPart.slice(75) != " " && firstPart.length == 75) {
      msgInput.value += firstPart + "-" + "<br>";
    }
    else if (firstPart.length == 75) {
      msgInput.value += firstPart + "<br>";
    }
    else {
      msgInput.value += firstPart;
    }
    n = n + 75;
  }

  AddMessageToDatabase(msgInput)
});


function AddMessageToDatabase(msgInput) {
  var currentUser = firebase.auth().currentUser;

  const msg = {
    isSeen: false,
    IDsender: currentUser.uid,
    IDreciever: chosenNameID,
    text: msgInput.value,
  };
  msgRef.push(msg);
  msgInput.value = "";
}


function chooseChat(userCounter) {

  messageScreen.innerHTML = "";
  unreadMessages.innerHTML = "";
  numberOfUnreadMessages.innerHTML = "";
  unreadMessagesCounter = 0;

  msgRef.off("child_added", checkMessages);
  msgBtn.removeAttribute("disabled");

  // ispiši korisnikove podatke tako da pristupiš bazi podataka
  chosenNameID = userID[userCounter - 1];

  var chosenName = db.ref("/users/" + userID[userCounter - 1] + "/ime");

  chosenName.on("value", function (snapshot) {
    chatName.innerHTML = snapshot.val();
  });
  ///tu pozovi provjeri
  msgRef.on("child_added", checkMessages);
}



var userID = [];
var userCounter = 0;
var refreshInterval;
refreshInterval = setInterval(Refresh, 60000);///svaku minutu refreshaj

function showUsers(data) {
  const { slika, id, ime, active } = data.val();
  userCounter++;
  var Korisnik = `<p onclick="chooseChat(${userCounter})" style="background-color: #f5f5f5;"> <a href="#"><img src= ${slika} width="50px" height="50px" style="border-radius: 25%;"> <z style= "background-color:${active == true ? `green` : `red`};  border-radius: 50%; color: ${active == true ? `green` : `red`}; font-size: 9px; margin-right:20px;"> oo</z> <br> ${ime}  </a>  </p> `;
  Users.innerHTML += Korisnik;
  userID.push(id);
}

userRef.on("child_added", showUsers);


function Refresh() {
  userRef.off("child_added", showUsers);
  Users.innerHTML = "";
  userRef.on("child_added", showUsers);
}


function Search() {
  const SearchName = document.getElementById("searchName").value;
  Users.innerHTML = "";
  userRef.orderByChild("ime").equalTo(SearchName).on("child_added", showUsers);
}


function SendEmail() {
  var currentUser = firebase.auth().currentUser;

  currentUser.sendEmailVerification().then(function () {
    window.alert("Email has been sent, please log in again after verification.");
    auth.signOut();
    location.reload();
  }).catch(function (error) {
    // An error happened.
    window.alert(error.message)
  });
}