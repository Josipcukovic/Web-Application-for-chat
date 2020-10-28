const loggedoutList = document.querySelectorAll(".logged-out");
const loggedInList = document.querySelectorAll(".logged-in");
const userName = document.getElementById("userName");
const podaci = document.getElementById("account-details");
const photo = document.getElementById("photo");
const storageDb = firebase.storage();
const verification = document.getElementById("Verification");
const pictureDetails = document.getElementById("pictureDetails");


function showElements(user) {

  if (user) {
    loggedInList.forEach((item) => (item.style.display = "block"));
    loggedoutList.forEach((item) => (item.style.display = "none"));
    if (user.emailVerified == false) {
      verification.style.display = "block";
    }
    if (user.emailVerified != false) {
      pictureDetails.style.display = "block";
      defaultPicture.getDownloadURL().then((link) => {
        const acc = `<div> 
        <img src="${user.photoURL != null ? user.photoURL : link}" width="200px" style="padding-left:10px;" >
        <p style=" font-size: 16px;  border-style:  ridge ;
        border-color: #eeeeee; padding-left:10px; "> Username: ${user.displayName}</p> 
        <p style="font-size: 16px;  border-style:  ridge ;
        border-color: #eeeeee; padding-left:10px; "> Email adress: ${user.email} </p> 
        </div>`;

        podaci.innerHTML = acc;
      });

    }
  }
  else {
    loggedInList.forEach((item) => (item.style.display = "none"));
    loggedoutList.forEach((item) => (item.style.display = "block"));
    verification.style.display = "none";
  }
};

////storage
photo.addEventListener("change", (e) => {
  var currentUser = firebase.auth().currentUser;
  const file = e.target.files[0];
  const name = file.name;
  const metadata = {
    contentType: file.type,
  };
  const Storageref = storageDb.ref("Profile pictures/" + currentUser.uid);
  alert("Pričekajte nekoliko trenutaka učitavanje slike profila.");

  Storageref.child(name).put(file, metadata).then((snapshot) => snapshot.ref.getDownloadURL()).then((link) => {
    currentUser.updateProfile({ photoURL: link }).then(function () {
      db.ref("/users/" + currentUser.uid).update({
        slika: link,
      });
      location.reload();
    }).catch(function (error) { window.alert(error.message) });

  });
});
/////////////////////kraj storage

// setup materialize components
document.addEventListener("DOMContentLoaded", function () {
  var modals = document.querySelectorAll(".modal");
  M.Modal.init(modals);
});
