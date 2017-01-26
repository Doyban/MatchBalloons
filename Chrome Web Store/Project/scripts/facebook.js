window.fbAsyncInit = function() {
  FB.init({
    appId      : '1110731322343575',
    xfbml      : true,
    version    : 'v2.7'
  });

  // ADD ADDITIONAL FACEBOOK CODE HERE
  FB.getLoginStatus(function(response) {
    if (response.status === 'connected') {
      console.log('Logged in.');
    }
    else {
      FB.login();
    }
  });
};

function onLogin(response) {
    if (response.status == "connected") {
        FB.api("/me?fields=first_name", function(data) {
          facebookName = data.first_name;
        });
    }
}

function shareScore(n){
     FB.ui({
          method: "feed",
          link: "https://apps.facebook.com/matchballoons/",
          caption: "Play MatchBallons!",
          name: "My best score in MatchBalloons is " + n + "!",
          description: "I scored " + n + " points in MatchBalloons. Can you beat my score?",
          picture: "https://doyban.com/facebook/matchballoons/images/logo.png"
     }, function(response){});
}

function inviteFriends() {
    FB.ui({
        method: 'apprequests',
        message: 'Play MatchBalloons with me!'
    }, function(response){
        console.log(response);
});
}

(function(d, s, id){
  var js, fjs = d.getElementsByTagName(s)[0];
  if (d.getElementById(id)) {return;}
  js = d.createElement(s); js.id = id;
  js.src = "//connect.facebook.net/en_US/sdk.js";
  fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));
