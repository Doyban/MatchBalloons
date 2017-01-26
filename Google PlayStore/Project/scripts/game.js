jewel.game = (function() {
    var dom = jewel.dom,
        $ = dom.$;

    /* Ukrywa aktywny ekran (jeśli taki został wybrany) i wyświetla ekran
     * o określonym identyfikatorze. */
    /* Funkcja "showScreen()" powinna przyjmowac dowolna liczbe parametrow potrzebnych
     * w danym module ekranu. Przekazuje ona te parametry, wywolujac metode "run()" poprzez
     * wyzwolenie metody "apply()" z wybranymi argumentami.
     * Jesli nie jestes zaznajomiony z ta procedura, pozwol, ze Ci wyjasnie,
     * co dokladnie zachodzi w funkcji "showScreen()".
     * Po jej wywolaniu dostep do wszystkich przekazanych argumentow jest mozliwy
     * poprzez obiekt "arguments", nawet jesli ich nazwy nie odnosza sie do ekranow.
     * Obiekt "arguments" zachowaniem przypomina tablice. Podobnie jak tablica,
     * jest zlozony z listy elementow oraz posiada wlasciwosc "length", ktora okresla,
     * jak wiele argumentow sie w nim znajduje.
     * Argument "screenId" odpowiada komorce "arguments[0]" - pozostale, zawarte w nie-tablicy,
     * elementy zostana przekazane modulom ekranu.
     * Uzywam terminu "nie-tablica", poniewaz obiekt "arguments" nie posiada metod
     * charakterystycznych dla takiej konstrukcji, w tym np. metody "slice()",
     * ktorej mozna by uzyc do wyodrebnienia z niego elementow.
     * Mimo to mozesz uzyc funkcji "slice()" z przestrzeni nazw "Array.prototype".
     * W koncu w jezyku JavaScript funkcje moga zostac zinterpretowane jako obiekty.
     * Dlatego tez wszystkie funkcje posiadaja metode "call()", ktorej mozna uzyc do wywolania funkcji,
     * imitujacego wywolanie przez inny obiekt. Wystarczy przekazac do niej ten obiekt jako parametr.
     * Jezeli funkcja pobiera jakies parametry, powinny one zostac przekazane tuz po obiekcie.
     * Funkcje tablicy nie wymagaja, by obiekt, na ktorym maja wykonac operacje,
     * byl prawdziwa tablica; wystarczy, ze przypomina on liste.
     * Gdyby obiekt "arguments" jednak posiadal metode "slice()", wyrazenie:
     * "Array.prototype.slice.call(arguments, 1)"
     * byloby rownowazne instrukcji:
     * "arguments.slice(1)".
     * Wszystkie funkcje posiadaja metode "apply()". Metoda ta dziala podobnie do funkcji "call()",
     * z tym, ze nie przekazuje do niej wylacznie calego obiektu "arguments",
     * lecz rowniez tablice wartosci jako parametr dodatkowy.
     * Funkcja "showScreen()" uzywa tego mechanizmu do wywolania metody "run()" na module "screen"
     * z wykorzystaniem dostepnych argumentow.
     * Uwaga: Kluczowa roznica pomiedzy obiektami argumentow i tablic jest fakt,
     * iz w tych pierwszych elementy sa przypisane do nazwanych argumentow.
     * Przykladowo gdybys w funkcji "showScreen()" zmienil wartosc pozycji "arguments[0]",
     * doszloby rowniez do zmiany przypisanej do niej wczesniej zmiennej "screenId",
     * i na odwrot. */
    function showScreen(screenId) {
        var activeScreen = $("#game .screen.active")[0],
            screen = $("#" + screenId)[0];
        if (activeScreen) {
            dom.removeClass(activeScreen, "active");
        }

        // Wyodrebnia parametry ekranu z argumentow.
        var args = Array.prototype.slice.call(arguments, 1);
        // Uruchamia modul ekranu.
        jewel.screens[screenId].run.apply(
            jewel.screens[screenId], args
        );

        dom.addClass(screen, "active"); // Wyswietla poszukiwany ekran.
    }


    /* Umieszcza desen w tle. */
    function createBackground() {
        /* Biblioteka Modernizr pozwala sprawdzic poziom obslugi elementu "canvas" w przegladarce.
         * Tego mechanizmu uzywamy wlasnie w tym kodzie, aby w przypadku wykrycia braku wsparcia
         * uruchomic plan awaryjny. Jezeli element "canvas" jest rozpoznawany,
         * Modernizr tworzy nowe plotno. Wymiary plotna sa automatycznie okreslane przez metode
         * modelu DOM "getBoundingClientRect()". */
        if (!Modernizr.canvas) return;

        var canvas = document.createElement("canvas"),
            ctx = canvas.getContext("2d"),
            background = $("#game .background")[0],
            rect = background.getBoundingClientRect(),
            gradient,
            i;

        canvas.width = rect.width;
        canvas.height = rect.height;

        ctx.scale(rect.width, rect.height);

        gradient = ctx.createRadialGradient(
            0.1, 0.1, 0.4,
            0.5, 0.5, 1
        );
        gradient.addColorStop(0, "rgb(50, 80, 200)");
        gradient.addColorStop(1, "rgb(30, 30, 30)");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 1, 1);

        ctx.strokeStyle = "rgba(255, 255, 255 ,1)";
        ctx.strokeStyle = "rgba(0, 0, 0, 1)";
        ctx.lineWidth = 0.005;
        ctx.beginPath();

        for (i = 0; i < 5; i += 0.008) {
            ctx.moveTo(i, 0);
            ctx.lineTo(0, i + 0.6);
        }
        ctx.stroke();
        background.appendChild(canvas);
    }

    /* Wylacza wbudowane zdarzenie "touchmove", aby zapobiec przewijania obrazu. */
    function setup() {
        dom.bind(document, "touchmove", function(event) {
            event.preventDefault();
        });
        /* Ukrycie paska adresow przegladarki w urzadzeniach z systemem Android. */
        if (/Android/.test(navigator.userAgent)) {
            $("html")[0].style.height = "200%";
            setTimeout(function() {
                window.scrollTo(0, 1);
            }, 0);
        }
        createBackground();
    }

    // Odesłania metody publiczne.
    return {
        setup : setup,
        showScreen : showScreen
    };
})();
