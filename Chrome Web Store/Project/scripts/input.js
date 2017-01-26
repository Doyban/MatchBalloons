jewel.input = (function() {
    var dom = jewel.dom,
        $ = dom.$,
        settings = jewel.settings,
        // Obiekt "inputHandlers" sledzi powiazania pomiedzy zdarzeniami sterowania a dzialaniami w grze.
        inputHandlers;

    // Kody klawiszy.
    var keys = {
        37 : "KEY_LEFT",
        38 : "KEY_UP",
        39 : "KEY_RIGHT",
        40 : "KEY_DOWN",
        13 : "KEY_ENTER",
        32 : "KEY_SPACE",
        65 : "KEY_A",
        66 : "KEY_B",
        67 : "KEY_C",
        // Kody klawiszy alfabetu 68 - 87.
        88 : "KEY_X",
        89 : "KEY_Y",
        90 : "KEY_Z"
    };

    // Funkcja "handleClick()" oblicza wzgledne wspolrzedne kliknietego miejsca i klejnotu. Na koniec wywolywane jest dzialanie, ktore przesyla wspolrzedne klejnotu jako argumenty.
    function handleClick(event, control, click) {
        // Sprawdza, czy do otrzymanego sygnalu przypisano akcje.
        var action = settings.controls[control];
        if (!action) {
            return;
        }

        var board = $("#game-screen .game-board")[0],
            rect = board.getBoundingClientRect(),
            relX, relY,
            jewelX, jewelY;

        // Sprawdza, czy do otrzymanego sygnalu przypisano akcje.
        relX = click.clientX - rect.left;
        relY = click.clientY - rect.top;

        // Wspolrzedne klejnotu.
        jewelX = Math.floor(relX / rect.width * settings.cols);
        jewelY = Math.floor(relY / rect.height * settings.rows);

        // Wyzwala funkcje przypisane danemu dzialaniu.
        trigger(action, jewelX, jewelY);

        // Zapobiega zajsciu domyslnej odpowiedzi przegladarki na klikniecie.
        event.preventDefault();
    }

    function initialize() {
        inputHandlers = {};
        var board = $("#game-screen .game-board")[0];

        // Sterowanie mysza.
        dom.bind(board, "mousedown", function(event) {
            handleClick(event, "CLICK", event);
        });

        // Sterowanie dotykiem.
        dom.bind(board, "touchstart", function(event) {
            handleClick(event, "TOUCH", event.targetTouches[0]);
        });

        // Sterowanie klawiatura.
        dom.bind(document, "keydown", function(event) {
            var keyName = keys[event.keyCode];
            if (keyName && settings.controls[keyName]) {
                event.preventDefault();
                trigger(settings.controls[keyName]);
            }
        });

    }

    // Funkcja ta pobiera dwa parametry: nazwe dzialania w grze oraz funkcja, ktora ma byc z nia powiazana.
    function bind(action, handler) {
        // Zalacza dzialanie w grze do handlera.
        if (!inputHandlers[action]) {
            inputHandlers[action] = [];
        }
        inputHandlers[action].push(handler);
    }

    // Jest to funkcja, ktora uzywa handlerow DOM, zeby wyzwolic dzialania. Funkcja "trigger()" pobiera pojedynczy argument - nazwe dzialania - i wywoluje handler, ktory zostal z nia powiazany.
    function trigger(action) {
        // Wyzwala dzialanie w grze.
        var handlers = inputHandlers[action],
            args = Array.prototype.slice.call(arguments, 1);

        // Jezeli handler zostal powiazany z okreslonym dzialaniem - tj. jesli nazwa tego dzialania znajduje sie obiekcie "inputHandlers" - wywolywane sa wszystkie funkcje handlera. Wszystkie przekazane do funkcji "trigger()" argumenty poza argumentem "action" - zawierajacym dzialanie - sa wyodrebnione z wlasciwosci "arguments" przy uzyciu metody "slice()". Powstala tablica argumentow "args" jest nastepnie uzywana do wywolania handlera z tablicy "handlers" za pomoca metody "apply()".
        if (handlers) {
            for (var i=0;i<handlers.length;i++) {
                handlers[i].apply(null, args);
            }
        }
    }

    return {
        initialize : initialize,
        // Funkcja "bind()" zostala upubliczniona, aby mogla zostac uzyta w innych modulach.
        bind : bind
    };
})();
