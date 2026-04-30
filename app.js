function requestBuggy(block){

const lastRequest = localStorage.getItem("lastBuggyRequest");

if(lastRequest){

const diff = Date.now() - lastRequest;

if(diff < 600000){

document.getElementById("requestStatus").innerText =
"You have already requested a buggy. Please wait 10 minutes.";

return;

}

}


/* Increase request count */

firebase.database()
.ref("requests/"+block+"/count")
.transaction(function(count){

return (count || 0) + 1;

});


/* Save global request time */

localStorage.setItem("lastBuggyRequest", Date.now());

document.getElementById("requestStatus").innerText =
"Buggy request sent successfully.";

}
