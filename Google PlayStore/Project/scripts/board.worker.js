/* Z uwagi na to, ze modul zostal stworzony w przestrzeni nazw "jewel",
 * nalezy utworzyc pusty obiekt "jewel" przed importem skryptu. Gdybys pominal ta linijke,
 * wykonanie importowanego skryptu zakonczyloby sie bledem. */
var jewel = {};

importScripts("board.js");

/* Pracownik obsluguje  dwie komenty - "initialize" i "swap" - ktore wczesniej odwzorowalismy
 * w metodach o tej samej nazwie. Gdy pracownik zarejestruje instrukcje "initialize",
 * wlasciwosc "data" powinna pobrac obiekt "settings" z przestrzeni nazw "jewel"
 * w komponencie rodzica. */
addEventListener("message", function(event) {
    var board = jewel.board,
        message = event.data;

    switch (message.command) {
        /* Pamietaj, ze funkcja "board.initialize()" przyjmuje jako swoj jedyny parametr
         * wywolanie zwrotne. Wywolanie to jest definiowane w pracowniku i przenoszone do metody
         * "board.initialize()" oraz wszystkich innych funkcji obiektu planszy.
         * Wyzwolone wywolanie zwrotne zwraca parametr "data" do glownego watku - w postaci
         * wiadomosci. Od tej pory to od glownego programu zalezy, co zrobi z otrzymana informacja. */
        case "initialize" :
            jewel.settings = message.data.settings;
            board.initialize(message.data.startJewels, callback);
            break;
        case "swap" :
            board.swap(
                message.data.x1,
                message.data.y1,
                message.data.x2,
                message.data.y2,
                callback
            );
            break;
    }

    function callback(data) {
        postMessage({
            id : message.id,
            data : data,
            jewels : board.getBoard()
        });
    }

}, false);
