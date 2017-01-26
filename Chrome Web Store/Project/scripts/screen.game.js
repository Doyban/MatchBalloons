jewel.screens["game-screen"] = (function() {
    var gameState,
        settings = jewel.settings,
        storage = jewel.storage,
        board = jewel.board,
        display = jewel.display,
        input = jewel.input,
        dom = jewel.dom,
        audio = jewel.audio,
        $ = dom.$,
        cursor,
        firstRun = true,
        paused = false,
        pauseTime;

    // Funkcja "startGame()" powinna zajac sie zresetowaniem znacznika i zainicjalizowaniem modulow "board" i "display".
    function startGame() {
        // Obiekt zawiera informacje o poziomie trudnosci oraz kilka wlasciwosci odpowiedzialnych za sledzenie uplywu czasu w grze.
        gameState = {
            level : 0,
            score : 0,
            timer : 0, // Odniesienie do funkcji "setTimeout".
            startTime : 0, // Czas po rozpoczeciu etapu.
            endTime : 0 // Czas pozostaly do konca gry.
        };
        cursor = {
            x : 0,
            y : 0,
            selected : false
        };

        var startJewels;

        board.initialize(startJewels, function () {
            display.initialize(function () {
                display.redraw(board.getBoard(), function () {
                    audio.initialize();
                    advanceLevel();
                });
            });
        });
    }

    function announce(str) {
        var element = $("#game-screen .announcement")[0];
        element.innerHTML = str;

        // Za pomoca biblioteki Modernizr ustalisz, czy przegladarka uzytkownika obsluguje animacje CSS, czy bedziesz zmuszony uzyc alternatywnego rozwiazania.
        if (Modernizr.cssanimations) {
            dom.removeClass(element, "zoomfade");
            setTimeout(function () {
                dom.addClass(element, "zoomfade");
            }, 1);
        }
        else {
            // Funkcja "announce()" uzywa klasy "active", jesli program odkryje, ze animacje nie sa rozpoznawane. Metoda "setTimeout()" usunie te funkcje po jednej sekundzie.
            dom.addClass(element, "active");
            setTimeout(function () {
                dom.removeClass(element, "active");
            }, 1000);
        }
    }

    // Wywolanie "updateGameInfo()" w funkcji "startGame()" resetuje wszystkie parametry wyswietlania, przywracajac im oryginalne wartosci, wraz z rozpoczeciem nowej gry.
    function updateGameInfo() {
        $("#game-screen .score span")[0].innerHTML = gameState.score;
        $("#game-screen .level span")[0].innerHTML = gameState.level;
    }

    // Funkcja "advanceLevel()" zwieksza poziom gry i modyfikuje elementy interfejsu uzytkownika.
    function advanceLevel() {
        gameState.level++;
        announce("Level " + gameState.level);

        audio.play("levelup");

        updateGameInfo();

        gameState.startTime = Date.now();
        gameState.endTime = settings.baseLevelTimer * Math.pow(gameState.level, gameState.level);

        setLevelTimer(true);

        display.levelUp();
    }

    function addScore(points) {
        // Wartosc "baseLevelScore" jest zwiekszana przy uzyciu wartosci "baseLevelExp". To sprawia, ze luka pomiedzy granica punktow wzrasta z poziomu na poziom, co utrudnia rozgrywke. Wartosci, ktore wybralem, ustalaja limit na "1000", "1413", "2030", "2971" i "4431" dla pierwszych pieciu poziomow. Jezeli taki rozdzial Ci nie odpowiada, dopasuj ustawienia po swojemu.
        var nextLevelAt = Math.pow(settings.baseLevelScore, Math.pow(settings.baseLevelExp, gameState.level));

        gameState.score += points;

        if (gameState.score >= nextLevelAt) {
            advanceLevel();
        }
        updateGameInfo();
    }

    // Jezeli funkcja "setLevelTimer()" zostanie wywolana z parametrem "reset", zresetuje licznik, dopasowujac jego maksymalna wartosc do etapu gry.
    function setLevelTimer(reset) {
        if (gameState.timer) {
            clearTimeout(gameState.timer);
            gameState.timer = 0;
        }

        if (reset) {
            // Wlasciwosc "startTime" zapisuje czas wywolania funkcji, ktory zostanie uzyty pozniej do obliczenia tego, ile czasu minelo.
            gameState.startTime = Date.now();
            // Wlasciwosc "endTime" okresla, ile czasu zostalo dane graczowi na konkretnym poziomie. Wartosc wyrazenia "Math.pow()" zmniejsza sie wraz z przejsciem na kolejny poziom w wyniku uzycia negatywnego wykladnika.
            gameState.endTime = settings.baseLevelTimer * Math.pow(gameState.level, -0.01 *  gameState.level);
        }

        // Nawet jesli funkcja nie otrzyma parametru "reset", obliczy ona, ile czasu minelo od ostatniego ustawienia licznika.
        var delta = gameState.startTime + gameState.endTime - Date.now(),
        // Podzielenie wyniku przez pelny czas dany graczowi na danym poziomie zwraca liczbe w przedziale od "0" do "1", ktora nastepnie jest uzyta do ustawienia szerokosci wewnetrznego elementu w pasku postepu.
            percent = (delta / gameState.endTime) * 100,
            progress = $("#game-screen .time .indicator")[0];

        // Jezeli od rozpoczecia etapu uplynelo dosc duzo czasu, funkcja licznika czasu wywola funkcje "gameOver()", ktora zakonczy rozgrywke.
        if (delta < 0) {
            gameOver();
        }
        else {
            progress.style.width = percent + "%";
            // Jezeli gracz dotrwa do konca etapu, funkcja "setTimeout()" zostanie wywolana ponownie, aby zresetowac wartosc licznika czasu.
            gameState.timer = setTimeout(function () {
                setLevelTimer(false);
            }, 30);
        }
    }

    // Funkcja ta nakazuje modulowi wyswietlania odtworzenie animacji i wyswietlenie komunikatu po jej zakonczeniu.
    function gameOver() {
        audio.play("gameover");

        stopGame();

        storage.set("activeGameData", null);

        display.gameOver(function () {
            announce("Game over!");

            // Gdy funkcja "announce()" wyswietli komunikat "Koniec gry", ekran gry automatycznie przejdzie do listy wynikow, przekazujac uzyskane przez gracza punkty.
            setTimeout(function () {
                jewel.game.showScreen("main-menu", gameState.score);
            }, 2500);
        });
    }

    /* Metoda "run()" w ekranie gry uzywa asynchronicznej wersji funkcji "initialize()",
     * ktora przygotowalismy we wczesniejszych rozdzialach. */
    function run() {
        // Caly proces powiazywania powinien odbyc sie tylko raz, wiec dodaje test "firstRun", ktory zapobiegnie wielu nakladajacym sie powiazaniom.
        if (firstRun) {
            setup();
            firstRun = false;
        }
        startGame();
    }

    // Funkcja, ktora ustawi wartosc kursora, zmieniajac wyglad pola po jego wskazaniu i kliknieciu.
    function setCursor(x, y, select) {
        cursor.x = x;
        cursor.y = y;
        cursor.selected = select;
        display.setCursor(x, y, select);
    }

    function selectJewel (x, y) {
        if (arguments.length === 0) {
            selectJewel(cursor.x, cursor.y);
            return;
        }
        if (cursor.selected) {
            var dx = Math.abs(x - cursor.x),
                dy = Math.abs(y - cursor.y),
                dist = dx + dy;

            // Odleglosc rowna "1" oznacza, iz dwa pola ze soba sasiaduja, podczas gdy odleglosc "0" mowi, iz wybrano dwa razy ten sam klejnot. Wieksze odleglosci oznaczaja, ze gracz wybral jakis inny kamien. Jezeli gracz wybierze dwa razy ten sam klejnot, zostanie on odznaczony w wyniku wywolania funkcji "setCursor()" do ktorej przekazano parametr "false". Jesli oznaczony brylant sasiaduje z juz zaznaczonym, podejmiemy probe zamiany ich miejscami, wywolujac funkcje "board.swap()".
            if (dist === 0) {
                // Usuwa zaznaczenie z wczesniej wybranego pola.
                setCursor(x, y, false);
            }
            else if (dist === 1) {
                // Kod uruchamiany, jesli wybrano sasiedni klejnot.
                board.swap(cursor.x, cursor.y, x, y, playBoardEvents);
                setCursor(x, y, false);
            }
            else {
                // Wybiera inny klejnot.
                // W przypadku gdy uzytkownik wybral kamien znacznie oddalony od wczesniej zaznaczonego, znacznik zostanie przeniesiony do ostatnio wybranego brylantu.
                setCursor(x, y, true);
            }
        }
        else {
            setCursor(x, y, true);
        }
    }

    // Wspomniana funkcja "playerBoardEvents()" jest wywolywana za kazdym razem, gdy modul planszy skonczy przesuwac klejnoty i uaktualniac dane.
    function playBoardEvents(events) {
        // Jezeli tablica zdarzen zawiera jakiekolwiek elementy, w wyniku przetworzenia kodu pierwsze zdarzenie jest z niej usuwane i zachowywane w zmiennej "boardEvent". Funkcja "next()" pelni role pomocnicza - wywoluje funkcje "playBoardEvents()" rekurencyjnie do czasu usuniecia wszystkich zdarzen z tablicy.
        if (events.length > 0) {
            var boardEvent = events.shift(),
                next = function () {
                    playBoardEvents(events);
                };

            // Wszystkie obiekty zdarzen w tablicy "events" posiadaja wlasciwosc "type", ktora wskazuje na typ zdarzenia, oraz wlasciwosc "data", ktora zawiera wszystkie dane powiazane z danym wydarzeniem. Kazdy typ zdarzenia wyzwala rozne funkcje w module wyswietlania. Wymagane funkcje beda odpowiedzialne za asynchroniczne animowanie widoku. Funkcja "next()" jest przekazywana jako wywolanie zwrotne, ktorego rola jest zagwarantowanie, ze pozostale wydarzenia zostana przetworzone po zakonczeniu animacji.
            switch (boardEvent.type) {
                case "move":
                    display.moveJewels(boardEvent.data, next);
                    break;
                case "remove":
                    audio.play("match");
                    display.removeJewels(boardEvent.data, next);
                    break;
                case "refill":
                    announce("No moves!");
                    display.refill(boardEvent.data, next);
                    break;
                case "score": // Zdarzenie dla wynikow.
                    addScore(boardEvent.data);
                    next();
                    break;
                case "badswap":
                    audio.play("badswap");
                    break;
                default:
                    next();
                    break;
            }
        }
        else {
            display.redraw(board.getBoard(), function () {
                // Ponowne malowanie.
                // Wypelnia plansze klejnotami.
            });
        }
    }

    // Cala operacja przesuniecia rozpoczyna sie od wywolania ogolnej funkcji "moveCursor()", ktora przyjmuje dwa parametry - "x" i "y" - i przesuwa znacznik i podana liczbe krokow wzdluz osi wspolrzednych.
    function moveCursor(x, y) {
        // Tak jak mialo to miejsce w przypadku metody "selectJewel()", funkcja ta zachowuje sie na dwa sposoby - w zaleznosci od tego, czy gracz wybral wczesniej jakis kamien. Jezeli tak jest, metoda "moveCursor()" powinna wybrac inny klejnot, zamiast po prostu przesuwac znacznik.
        if (cursor.selected) {
            x += cursor.x;
            y += cursor.y;

            if (x >= 0 && x < settings.cols && y >= 0 && y < settings.rows) {
                selectJewel(x, y);
            }
        }
        // Jezeli gracz nie wybral zadnego klejnotu, pozycja znacznika jest zmieniana wskutek wywolania funkcji "setCursor()".
        else {
            x = (cursor.x + x + settings.cols) % settings.cols;
            y = (cursor.y + y + settings.rows) % settings.rows;
            setCursor(x, y, false);
        }
    }

    // Przesun kursor do gory.
    function moveUp() {
        moveCursor(0, -1);
    }

    // Przesun kursor w dol.
    function moveDown() {
        moveCursor(0, 1);
    }

    // Przesun kursor w lewo.
    function moveLeft() {
        moveCursor(-1, 0);
    }

    // Przesun kursor w prawo.
    function moveRight() {
        moveCursor(1, 0);
    }

    function stopGame() {
        clearTimeout(gameState.timer);
    }

    function saveGameData() {
        storage.set("activeGameData", {
            level : gameState.level,
            score : gameState.score,
            time : Date.now() - gameState.startTime,
            jewels : board.getBoard()
        });
    }

    // Jezeli wartosc zmiennej "enable" jest rowna zmiennej "paused", funkcja po prostu sie konczy. Dopoki stan gry sie nie zmieni, nie musisz nic robic. Gdy pauza zostanie wylaczona, nalezy zmodyfikowac wartosc wlasciwosci "gameInfo.startTime", dodajac do niej czas, ktory minal od wlaczenia pauzy i efektywnie przywracac licznik czasu do stanu sprzed zmiany trybu.
    function togglePause(enable) {
        if (enable === paused) return; // Bez zmian.

        var overlay = $("#game-screen .pause-overlay")[0];

        paused = enable;

        overlay.style.display = paused ? "block" : "none";

        if (paused) {
            clearTimeout(gameState.timer);
            gameState.timer = 0;
            pauseTime = Date.now();
        }
        else {
            gameState.startTime += Date.now() - pauseTime;
            setLevelTimer(false);
        }
    }

    // Wiazanie sygnalow sterowania z dzialaniem w grze.
    function setup() {
        input.initialize();
        input.bind("selectJewel", selectJewel);
        input.bind("moveUp", moveUp);
        input.bind("moveDown", moveDown);
        input.bind("moveLeft", moveLeft);
        input.bind("moveRight", moveRight);

        dom.bind("#game-screen button[name=exit]", "click", function () {
            togglePause(false);

            // Jesli gracz potwierdzi, ze pragnie powrocic do glownego menu gry, aplikacja automatycznie zachowa jej stan, zatrzyma licznik czasu i przeniesie uzytkownika do ekranu glownego.
                saveGameData();
                stopGame();

                jewel.game.showScreen("main-menu");
        });
    }

    return {
        run : run
    };
})();
