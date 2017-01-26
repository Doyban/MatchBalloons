jewel.screens["highscore"] = (function () {
    var dom = jewel.dom,
        $ = dom.$,
        game = jewel.game,
        storage = jewel.storage,
        numScores = 10,
        firstRun = true;

    function setup() {
        var backButton = $("#highscore footer button[name=back]")[0];

        dom.bind(backButton, "click", function (e) {
            game.showScreen("main-menu");
        });
    }

    function run(score) {
        if (firstRun) {
            setup();
            firstRun = false;
        }
        populateList();

        if (typeof score != "undefined") {
            enterScore(score);
        }
    }

    // Po tym, jak funkcja "populateList()" pobierze dane z wynikami, upewni sie, ze wpisy "numScores" znajduja sie na liscie. W ten sposob lista wynikow zostanie wypelniona wynikami 0 punktow. Element listy zostaje wypelniony wpisami, z ktorych kazdy zawiera dwa elementy "span".
    function populateList() {
        var scores = getScores(),
            list = $("#highscore ol.score-list")[0],
            item, nameEl, scoreEl, i;

        // Sprawdz czy lista jest pelna.
        for (i = scores.length; i < numScores; i++) {
            scores.push({
                name : " ",
                score : 0
            });
        }

        list.innerHTML = "";

        for (i = 0; i < scores.length; i++) {
            item = document.createElement("li");

            nameEl = document.createElement("span");
            nameEl.innerHTML = scores[i].name;

            scoreEl = document.createElement("span");
            scoreEl.innerHTML = scores[i].score;

            item.appendChild(nameEl);
            item.appendChild(scoreEl);
            list.appendChild(item);
        }
    }

    function getScores() {
        return storage.get("highscore") || [];
    }

    // Funkcja "enterScore()" przeszukuje liste zapisanych wynikow do samego jej konca lub momentu, gdy znajdzie wynik mniejszy od wyniku gracza. Wysyla ona do uzytkownika zapytanie o nazwe i po uzyskaniu odpowiedzi wpisuje jego imie w wybranym miejscu na liscie, uzywajac metody "splice()". Funkcja uzywa potem metody "slice()", zeby wydobyc 10 pierwszych elementow i zachowac je w module magazynu. Na koniec wywoluje funkcje "populateList()".

    function enterScore(score) {
        var scores = getScores(),
            name, i, entry;

        for (i = 0; i <= scores.length; i++) {
            if (i === scores.length || score > scores[i].score) {
                name = prompt("Write your name: ");
                entry = {
                    name : name,
                    score : score
                };

                scores.splice(i, 0, entry);

                shareScore(entry.score);
                console.log("Score is " + entry.score);

                storage.set("highscore", scores.slice(0, numScores));

                populateList();

                return;
            }
        }
    }

    return {
        run : run
    };
})();
