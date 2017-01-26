jewel.board = (function(){
    /**
     *  Funkcje gry.
     */
    var settings,
        jewels, // Tablica tablic, czyli dwuwymiarowa tablica reprezentujaca stan planszy.
        cols,
        rows,
        baseScore,
        numJewelTypes;

    /* Typ klejnotu jest wybierany przy uzyciu funkcji "randomJewel()". */
    function randomJewel() {
        return Math.floor(Math.random() * numJewelTypes);
    }

    function getJewel(x, y) {
        if (x < 0 || x > cols - 1 || y < 0 ||y > rows - 1) {
            return -1; // Jesli ktorakolwiek ze wspolrzednych wykracza poza zakres planszy.
        }
        else {
            return jewels[x][y];
        }
    }

    function fillBoard() {
        var x, y,
            type;
        jewels = [];

        for (x = 0; x < cols; x++) {
            jewels[x] = [];
            for (y = 0; y < rows; y++) {
                type = randomJewel();
                /* Usuwanie poczatkowych lancuchow. */
                while ((type === getJewel(x - 1, y) &&
                        type === getJewel(x - 2, y)) ||
                       (type === getJewel(x, y - 1) &&
                        type === getJewel(x, y - 2))) {
                    type = randomJewel();
                }
                jewels[x][y] = type;
            }
        }
        
       /* Rekurencyjnie wypelnia plansze, jesli nie ma na niej zadnych ruchow. */
        if (!hasMoves()) {
            fillBoard();
        }
    }

    /* Zwraca liczbe w najdluzszym lancuchu, ktory zawiera kamien o wspolrzednych (x, y). */
    function checkChain(x, y) {
        var type = getJewel(x, y),
            left = 0, right = 0,
            down = 0, up = 0;

        /* Sprawdza kamienie po prawej. */
        while (type === getJewel(x + right + 1, y)) {
            right++;
        }

        /* Sprawdza kamienie po lewej. */
        while (type === getJewel(x - left - 1, y)) {
            left++;
        }

        /* Sprawdza kamienie u gory. */
        while (type === getJewel(x, y + up + 1)) {
            up++;
        }

        /* Sprawdza kamienie u dolu. */
        while (type === getJewel(x, y - down - 1)) {
            down++;
        }
        
        return Math.max(left + 1 + right, up + 1 + down);
    }

    /* Zwraca wartosc "true", jesli klejnot (x1, y1) moze zostac zamieniony miejscem z (x2, y2),
     * tworzac dopasowanie. */
    function canSwap(x1, y1, x2, y2) {
        var type1 = getJewel(x1, y1),
            type2 = getJewel(x2, y2),
            chain;

        if (!isAdjacent(x1, y1, x2, y2)) {
            return false;
        }

        /* Tymczasowo zamienia miejscami wybrane kamienie. */
        jewels[x1][y1] = type2;
        jewels[x2][y2] = type1;

        chain = (checkChain(x2, y2) > 2
        || checkChain(x1, y1) > 2);

        jewels[x1][y1] = type1;
        jewels[x2][y2] = type2;

        return chain;
    }

    /* Zwraca wartosc "true", jesli klejnot (x1, y1) moze zostac zamieniony miejscem z (x2, y2),
     * tworzac dopasowanie. */
    function canSwap(x1, y1, x2, y2) {
        var type1 = getJewel(x1, y1),
            type2 = getJewel(x2, y2),
            chain;

        if (!isAdjacent(x1, y1, x2, y2)) {
            return false;
        }

        /* Tymczasowo zamienia miejscami wybrane kamienie. */
        jewels[x1][y1] = type2;
        jewels[x2][y2] = type1;

        chain = (checkChain(x2, y2) > 2
              || checkChain(x1, y1) > 2);

        jewels[x1][y1] = type1;
        jewels[x2][y2] = type2;

        return chain;
    }

    /* Zwraca wartosc "true", jesli klejnot (x1, y1) sasiaduje z kamieniem (x2, y2). */
    function isAdjacent(x1, y1, x2, y2) {
        var dx = Math.abs(x1 - x2),
            dy = Math.abs(y1 - y2);

        return (dx + dy === 1);
    }

    /* Zwraca dwuwymiarowa mape dlugosci lancuchow. */
    function getChains() {
        var x, y,
            chains = [];

        for (x = 0; x < cols; x++) {
            chains[x] = [];
            for (y = 0; y < rows; y++) {
                chains[x][y] = checkChain(x, y);
            }
        }
        return chains;
    }

    /* Tworzy kopie planszy z klejnotami. */
    function getBoard() {
        var copy = [],
            x;

        for (x = 0; x < cols; x++) {
            copy[x] = jewels[x].slice(0);
        }
        return copy;
    }

    /* Zwraca wartosc "true", jesli znajdzie przynajmniej jeden mozliwy ruch. */
    function hasMoves() {
        for (var x = 0; x < cols; x++) {
            for (var y = 0; y < rows; y++) {
                if (canJewelMove(x, y)) {
                    return true;
                }
            }
        }
        return false;
    }

    /* Funkcja ta usuwa klejnoty z planszy i przesuwa w ich miejsce nowe. */
    /* W celu polaczenia danych z tablic "removed", "moved" i "score" z informacjami zwracanymi
     * przez rekurencyjne wywolania dodano opcjonalny argument zdarzenia w funkcji "check()".
     * Argument ten jest uzywany tylko w rekurencyjnych wywolaniach. */
    function check(events) {
        var chains = getChains(),
            hadChains = false, score = 0,
            removed = [], moved = [], gaps = [];

        /* Petla sprawdza wiersze od dolu do gory zamiast z gory na dol.
         * Rozwiazanie to pozwoli natychmiastowo przemiescic inne klejnoty w dole planszy.
         * Algorytm ten zachowuje licznik kazdej kolumny wewnatrz tablicy "gaps".
         * Nim zacznie on przetwarzac kolejna kolumne, ustawia jej licznik na "0". */
        for (var x = 0; x < cols; x++) {
            gaps[x] = 0;
            for (var y = rows - 1; y >= 0; y--) {
                /* Jesli dana komorka zostala oznaczona na mapie wartoscia wieksza niz 2,
                 * informacja o umiejscowieniu i typie klejnotu zostaje zapisana w tablicy "removed"
                 * z wykorzystaniem literalu obiektu. */
                if (chains[x][y] > 2) {
                    hadChains = true;
                    /* Za kazdym razem gdy usuniety zostanie, licznik jest zwiekszany o 1.
                     * Z kolei jezeli klejnot pozostaje na swoim miejscu, licznik "gaps" okresli,
                     * czy powinien on zostac przesunity w dol. Stanie sie tak,
                     * jezeli licznik ma wartosc dodatnia - wtedy klejnot opadnie w dol o rowna
                     * mu liczbe wierszy. */
                    gaps[x]++;
                    removed.push({
                        x : x, y : y,
                        type : getJewel(x, y)
                    });

                    /* Dodaje punkty do wyniku. Za kazdy skladowy klejnot lancucha gra dodaje
                     * punkty do ogolnego wyniku. Liczba otrzymanych punktow zalezy od dlugosci lancucha.
                     * Kazdy dodatkowy lancuch podawaja wynik. */
                    score += baseScore * Math.pow(2, (chains[x][y] - 3));
                }
                else if (gaps[x] > 0) {
                    /* Wartosc dodatnia licznika jest zapisana w tablicy "moved" - za pomoca
                     * podobnego literalu obiektu, z tym ze tym razem zachowane zostana w niej
                     * pozycja poczatkowa i koncowa.
                     * W tym momencie nalezy uaktualnic tablice "jewels",
                     * poniewaz wskazywane przez nia wspolrzedne ulegly zmianie. */
                    moved.push({
                        toX : x, toY : y + gaps[x],
                        fromX : x, fromY : y,
                        type : getJewel(x, y)
                    });
                    jewels[x][y + gaps[x]] = getJewel(x, y);
                }
            }

            /* Dodaje nowe klejnoty u gory planszy. */
            for (y = 0; y < gaps[x]; y++) {
                jewels[x][y] = randomJewel();
                moved.push({
                    toX : x, toY : y,
                    fromX : x, fromY : y - gaps[x],
                    type : jewels[x][y]
                });
            }
          }

            /* Jesli do funkcji nie zostanie przekazany zaden argument,
             * zdarzenia sa przypisywane do pustej tablicy. */
            events = events || [];

            if (hadChains) {
                events.push({
                    type: "remove",
                    data: removed
                }, {
                    type : "score",
                    data : score
                }, {
                    type : "move",
                    data : moved
                });

                /* Wypelnia plansze ponownie, jesli gracz nie bedzie mial zadnego ruchu. */
                if (!hasMoves()) {
                    fillBoard();
                    events.push({
                        type : "refill",
                        data : getBoard()
                    });
                }

                return check(events);
            }
            else {
                return events;
            }
      }

    /* Zwraca "true", jesli wspolrzedne (x, y) sa odwzorowane na planszy i jesli kamien w tym
     * punkcie moze pozostac zamieniony z sasiadem. */
    function canJewelMove(x, y) {
        return ((x > 0 && canSwap(x, y, x - 1, y)) ||
                (x < cols - 1 && canSwap(x, y, x + 1, y)) ||
                (y > 0 && canSwap(x, y, x, y - 1)) ||
                (y < rows - 1 && canSwap(x, y, x, y + 1)));
    }

    /* Jesli istnieje taka mozliwosc, zamienia miejscami klejnot w komorce (x1, y1)
     * z klejnotem w komorce (x2, y2). */
    /* Funkcja "swap()" zostanie odslonieta dla pozostalej czesci kodu i moze wplynac na stan planszy,
     * totez musi ona dzialac zgodnie z tym samym asynchronicznym mechanizmem co funkcja "initialize()".
     * Dlatego tez poza dwoma zestawami wspolrzednych metoda "swap()" przyjmuje jako parametr funkcje
     * zwrotna. W zaleznosci od tego, czy ruch uzytkownika sie powiedzie,
     * wywolanie zwrotne otrzyma jako parametr albo liste zdarzen, albo wartosc "false"
     * (w przypadku nieuznanego ruchu). */
    function swap(x1, y1, x2, y2, callback) {
        var tmp, swap1, swap2,
            events = [];
        swap1 = {
            type : "move",
            data : [{
                type : getJewel(x1, y1),
                fromX : x1, fromY : y1, toX : x2, toY : y2
            },{
                type : getJewel(x2, y2),
                fromX : x2, fromY : y2, toX : x1, toY : y1
            }]
        };
        swap2 = {
            type : "move",
            data : [{
                type : getJewel(x2, y2),
                fromX : x1, fromY : y1, toX : x2, toY : y2
            },{
                type : getJewel(x1, y1),
                fromX : x2, fromY : y2, toX : x1, toY : y1
            }]
        };
        if (isAdjacent(x1, y1, x2, y2)) {
            events.push(swap1);
            if (canSwap(x1, y1, x2, y2)) {
                /* Zamienia klejnoty miejscami. */
                tmp = getJewel(x1, y1);
                jewels[x1][y1] = getJewel(x2, y2);
                jewels[x2][y2] = tmp;
                events = events.concat(check()); // Sprawdza plansze i pobiera liste zdarzen.
            } else {
                events.push(swap2, {type : "badswap"});
            }
            callback(events);
        }
    }


    // Funkcja "initialize()" przyjmuje od teraz dodatkowy parametr i jesli przekazesz do niej zestaw klejnotow, uzyje go ona zamiast losowo wygenerowanych kamieni.
    function initialize(startJewels, callback) {
        settings = jewel.settings;
        numJewelTypes = settings.numJewelTypes;
        baseScore = settings.baseScore;
        cols = settings.cols;
        rows = settings.rows;
        
        if (startJewels) {
            jewels = startJewels;
        }
        else {
            fillBoard();
        }
        callback();
    }

    function print() {
        var str = "";
        for (var y = 0; y < rows; y++) {
            for (var x = 0; x < cols; x++) {
                str += getJewel(x, y) + " ";
            }
            str += "\r\n";
        }
        console.log(str);
    }

    return {
        initialize : initialize,
        swap : swap,
        canSwap : canSwap,
        getBoard : getBoard,
        print : print
    };

})();
