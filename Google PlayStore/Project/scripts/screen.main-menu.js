jewel.screens["main-menu"] = (function() {
    var dom = jewel.dom,
        game = jewel.game,
        firstRun = true;

    function setup() {
        /* Wszystkie komponenty dziedziczace po znaczniku "ul" w menu otrzymuja ten sam handler.
         * Gdy dojdzie do wyzwolenia zdarzenia, funkcja handlera sprawdzi klikniety element i potwierdzi,
         * ze jest on przyciskiem. Po udanej walidacji handler przeniesie gracza do odpowiedniego ekranu,
         * posilkujac sie wartoscia atrybutu "name" przypisana do elementu.
         * Delegacja zdarzenia oszczedza zmudnego pisania kodu, a ponadto zapewnia dodatkowa funkcjonalnosc:
         * handler elementu rodzica bedzie automatycznie dzialal z dowolnymi wprowadzanymi nowymi elementami. */
//        dom.bind("#main-menu ul.menu", "click", function(e) {
//                if (e.target.nodeName.toLowerCase() === "button") {
//                var action = e.target.getAttribute("name");
//                game.showScreen(action);
//            }
//        });

        dom.bind("#main-menu button[name=game-screen]", "click", function () {
            game.showScreen("game-screen");
        });

        dom.bind("#main-menu button[name=invite]", "click", function () {
            game.showScreen("main-menu");
             inviteFriends();
        });
    }

    function run() {
        if (firstRun) {
            setup();
            firstRun = false;
        }
    }

    return {
        run : run
    };
})();
