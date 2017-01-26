var jewel = {
    screens : {},
    settings : {
        rows : 8,
        cols : 8,
        baseScore : 100,
        numJewelTypes : 7,
        baseLevelTimer : 60000,
        baseLevelScore : 1500,
        baseLevelExp : 1.05,
        // Aby polaczyc zdarzenia i dzialania, musisz wpierw powiazac kazde z dzialan ze slowem kluczem.
        controls : {
            KEY_UP : "moveUp",
            KEY_LEFT : "moveLeft",
            KEY_DOWN : "moveDown",
            KEY_RIGHT : "moveRight",
            KEY_ENTER : "selectJewel",
            KEY_SPACE : "selectJewel",
            CLICK : "selectJewel",
            TOUCH : "selectJewel"
        }
    },
    images : {}
};

window.addEventListener("load", function() { // Oczekiwanie na zaladowanie glownego dokumentu.
    var jewelProto = document.getElementById("jewel-proto"),
    /* Dzieki metodzie "getBoundingClientRect()" otrzymamy wspolrzedne oraz wymiary elementu. */
        rect = jewelProto.getBoundingClientRect(); // Okresla rozmiar klejnotu.

    jewel.settings.jewelSize = rect.width;


    Modernizr.addTest("standalone", function () {
        return (window.navigator.standalone != false);
    });

    /* Rozszerza funkcjonalnosc systemu "yepnope" o wstepne ladowanie. */
    /* Uzycie przedrostka pozwala dolaczyc lancuch znakow "preload!" do sciezek plikow
     * przekazanych funkcji "Modernizr.load()". Jezeli wskazany plik zawiera ten przedrostek,
     * zapisany w nim kod nie jest wykonywany po zaladowaniu. */
    yepnope.addPrefix("preload", function(resource) {
        resource.noexec = true;
        return resource;
    });

    var numPreload = 0,
        numLoaded = 0;

    /* Przedrostki maja dwa cele: sledzic, ile plikow jest ladowanych i ktore z nich zostaly
     * w pelni wczytane. */
    yepnope.addPrefix("loader", function(resource) {
        // console.log("Ładowanie: " + resource.url)

        /* Przedrostek "!loader" uzywa prostych wyrazen regularnych, aby okreslic,
         * czy zasob jest obrazem, i - w przypadku gdy zostanie to potwierdzone - zatrzymac
         * probe wykonywanie go jako skryptu. */
        var isImage = /.+\.(jpg|png|gif)$/i.test(resource.url);
        resource.noexec = isImage;

        /* W tym momencie licznik zwieksza swoja wartosc, tak aby po rozpoczeciu wczytywania
         * zawartosc zmiennej "numPreload" byla rowna liczbie zaladowanych plikow. */
        numPreload++;

        /* Funkcje powiazane z przedrostkami pozwalaja rowniez zalaczyc metoda do wlasciwosci
         * "autoCallback" nalezacej do obiektu "resource". Metoda ta jest wywolywana wraz
         * z zakonczeniem ladowania plikow.
         * Mechanizmu tego uzylem do zwiekszania licznika "numLoaded" i zapisania wszystkich
         * obrazow w kontenerze "jewel.images". */
        resource.autoCallback = function(e) {
            // console.log("Postęp ładowania: " + resource.url)

            numLoaded++;
            if (isImage) {
                var image = new Image();
                image.src = resource.url;
                jewel.images[resource.url] = image;
            }
        };
        return resource;
    });

    function getLoadProgress() {
        if (numPreload > 0) {
            return numLoaded / numPreload;
        }
        else {
            return 0;
        }
    }

    /**
     * Po tym, jak strona skonczy ladowanie podstawowych skryptow, do gry wkracza Modernizr, ktory wczytuje pozostale pliki.
     * Modernizr automatycznie wywoluje funkcje "complete()" po zaladowaniu danych,
     * przez co stanowi wspanialy system zarzadzania logika programu.
     */
    /* Ladowanie - etap 1. */
    /* Modul magazynu powinien zostac wczytany we wczesniejszej fazie ladowania skryptu "loader.js". Uzywajac wlasciwosci "Modernizr.localstorage", mozesz sprawdzic, czy dana przegladarka obsluguje obiekt "localStorage", i awaryjnie uruchomic modul plikow "cookie", jesli bedzie to konieczne. */
    Modernizr.load([ // Rozpoczecie dynamicznego ladowania.
        {
            test : Modernizr.localstorage,
            yep : "scripts/storage.js",
            nope : "scripts/storage.cookie.js"
        },{
            /* Nastepujace skrypty sa ladowane domyslnie. */
            load : [
                "scripts/sizzle.js",
                "scripts/dom.js",
                "scripts/requestAnimationFrame.js",
                "scripts/game.js"
            ]
        },{
            test : Modernizr.standalone,
            yep : "scripts/screen.splash.js",
            /* Funkcja wywolywana po zaladowaniu wszystkich plikow i zakonczeniu glownego programu. */
            complete : function () {
                //console.log("Załadowano wszystkie pliki!");
                //alert("Sukces!");
                jewel.game.setup();
                if (Modernizr.standalone) {
                    jewel.game.showScreen("splash-screen",
                        /* Funkcja odpowiedzialna za sledzenie postepu jest przekazywana do
                         * modulu ekran powitalnego, by ten mial informacje o stanie wczytywania.
                         * Tego samego wzorca postepowania mozesz uzyc np. do przekazania
                         * punktacji gry do ekranu wynikow. */
                        getLoadProgress);
                }
            }
        }
    ]);

    /* Ladowanie - etap 2. */
    /* Drugi etap jest aktywowany, tylko jesli gra dziala w trybie niezaleznym,
    co pozwala zaoszczedzic uzytkownikowi na kosztach transferu sciaganych zasobow gry. */
    // System wczytywania skryptow Modernizra nie obsluguje zagniezdzonych testow, wiec bedziemy musieli przygotowac trzy odrebne testy, aby poradzic sobie z trzema trybami wczytywania. Pozytywny wynik pierwszego testu spowoduje wczytanie modulu wyswietlania WebGL. Przejscie drugiego testu spowoduje wczytanie modulu obslugujacego plotno, ale nie standardu WebGL. Trzeci test wczyta modul DOM, ale tylko jesli element "canvas" - i w zwiazku z tym standard WebGL - jest niedostepny.
    if (Modernizr.standalone) {
        Modernizr.load([
           {
                test : Modernizr.canvas,
                yep : "loader!scripts/display.canvas.js"
            }, {
                test : Modernizr.webworkers,
                /* Wlasciwosc "yep" stala sie tablica skryptow - jak widac,
                 * druga pozycja jest w niej plik pracownika z przedrostkiem "preload!".
                 * To wlasnie dzieki jego obecnosci plik zostaje wczytany,
                 * ale zapisany w nim kod nie jest przetwarzany.
                 * Dlatego tez funkcje i obiekty wazne tylko w srodowisku pracownika
                 * nie przysporza zadnych problemow. */
                yep : [
                    "loader!scripts/board.worker-interface.js",
                    /* (Porownanie do przedrostkow "loader!")
                     * Uwaga: Przedrostek "preload!" w skrypcie "board.worker.js" zostawiamy bez zmian.
                     * Najbezpieczniej bedzie pozwolic zaladowac sie temu plikowi w tle.
                     * Konstruktor "Worker()" nie wymaga zaladowania pliku,
                     * wiec nawet w przypadku gdy gra zostanie rozpoczeta przed wczytaniem skryptu pracownika,
                     * caly program bedzie dzialal prawidlowo. */
                    "preload!scripts/board.worker.js" // Ladowanie modulu pracownika.
                ],
                nope : "loader!scripts/board.js"
            }, {
                load : [
                    "loader!scripts/audio.js",
                    "loader!scripts/input.js",
                    "loader!scripts/screen.highscore.js",
                    "loader!scripts/screen.main-menu.js",
                    "loader!scripts/screen.game.js",
                    "loader!images/balloons.png"
                ]
            }
        ]);
    }

}, false);