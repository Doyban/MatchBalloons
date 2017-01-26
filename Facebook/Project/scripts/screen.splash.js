jewel.screens["splash-screen"] = (function() {
    var game = jewel.game,
        dom = jewel.dom,
        $ = dom.$,
        firstRun = true;

    /* Inicjuje petle, ktora wywoluje funkcje "checkProgress()" tak dlugo,
     * az metoda "getLoadProgress()" zwroci "1". */
    function setup(getLoadProgress) {
        var scr = $("#splash-screen")[0];

        function checkProgress() {
            var p = getLoadProgress() * 100;
            /* Element oznaczony klasa ".indicator" jest powiekszany proporcjonalnie do wartosci
             * licznika postepu. Osiagniecie przez licznik wartosci "1" spowoduje wyswietlenie
             * komunikatu "Dalej..." oraz dolaczenie handlera zdarzen "click",
             * dzieki ktoremu uzytkownik bedzie mogl przejsc do glownego menu. `*/
            $(".indicator", scr)[0].style.width = p + "%";

            if (p == 100) {
                $(".continue", scr)[0].style.display = "block";
                /*
                 * Funkcja "dom.bind()" pobiera selektor CSS w formie lancucha znakow,
                 * znajduje pasujacy do niego element i dolacza do niego handler
                 * odpowiadajacy wybranemu zdarzeniu. */
                dom.bind(scr, "click", function() {
                    jewel.game.showScreen("main-menu");
                });
            } else {
                setTimeout(checkProgress, 10);
            }
        }
        checkProgress();
    }

    /* Przy pierwszym wywolwaniu publiczna metoda "run()" odwoluje sie do funkcji "setup()".
     * Funkcja ta ustawia handler zdarzen (tj. funkcje odpowiedzialna za obsluge zdarzenia),
     * ktory przechodzi miedzy ekraniami, gdy uzytkownik kliknie lub puknie w wyswietlacz. */
    /* Z uwagi na zmiany, ktore wprowadzilismy w skrypcie "loader.js" zilustrowane na listinach
     * 7.8 i 7.9, metoda "run()" przyjmuje teraz jako parametr funkcje "getLoadProgress()".
     * Trafia ona do funkcji "setup()", ktora jest znacznie ciekawsza. */
    function run(getLoadProgress) {
        if (firstRun) {
            setup(getLoadProgress);
            firstRun = false;
        }
    }

    return {
        run : run
    };
})();
