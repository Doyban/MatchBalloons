var inviteFriends = function () {
    facebookConnectPlugin.showDialog({
        method: 'apprequests',
        message: 'Play MatchBalloons with me!'
    },
    function(response) {console.log(response)},
    function(response) {console.log(response)}
)};

var shareScore = function(n) {
    facebookConnectPlugin.showDialog({
        method: "feed",
        link: "https://apps.facebook.com/matchballoons/",
        caption: "Play MatchBallons!",
        name: "My best score in MatchBalloons is " + n + "!",
        description: "I scored " + n + " points in MatchBalloons. Can you beat my score?",
        picture: "https://doyban.com/facebook/matchballoons/images/logo.png"
    },
    function(response) {console.log(response)},
    function(response) {console.log(response)}
)};
