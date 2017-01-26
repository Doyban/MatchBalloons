jewel.audio = (function () {
    var dom = jewel.dom,
        extension,
        sounds,
        activeSounds;

    function initialize() {
        extension = formatTest();

        if (!extension) {
            return;
        }
        sounds = {};
        activeSounds = [];
    }

    // Funkcja "createAudio()" przyjmuje jeden parametr - nazwe pliku dzwiekowego, bez rozszerzenia, ktore ustalilismy wczesniej podczas inicjalizacji modulu "audio". Funkcja ta nie zwraca tylko elementu; zachowuje rowniez odniesienie do niego w obiekcie "sounds". Obiekt ten zawiera po jednej tablicy dla kazdego efektu dzwiekowego ze wszystkimi stworzonymi dla niego elementami "audio". Umozliwia to ponowne wykorzystanie elementow, ktore skonczyly odtwarzanie dzwieku.
    function createAudio(name) {
        var el = new Audio("sounds/" + name + "." + extension);

        dom.bind(el, "ended", cleanActive);
        
        sounds[name] = sounds[name] || [];
        sounds[name].push(el);
        
        return el;
    }

    // Nie sledzimy, w ktorym miejscu tablicy "activeSounds" znajduje sie konkretny element, wiec najpewniejszym rozwiazaniem jest usuniecie wszystkich komponentow, ktorych wykonywanie zostalo zakonczone. Elementy sa usuwane za pomoca metody "splice()", ktora modyfikuje tablice, usuwajac z niej okreslona liczbe komponentow, zaczynajac od podanego indeksu. Rzecz jasna wiaze sie to ze zmiana dlugosci tablicy. Dlatego tez wazne jest, aby warunek w petli porownywal zmienna "i" z aktualna dlugoscia tablicy, a nie - co jest zwykle lepsza praktyka - z zachowana wczesniej wartoscia.
    function cleanActive() {
        for (var i = 0; i < activeSounds.length; i++) {
            if (activeSounds[i].ended) {
                activeSounds.splice(i, 1);
            }
        }
    }

    // Funkcja "getAudioElement()" najpierw sprawdza, czy istnieje juz element "audio", z ktorego moglaby skorzystac. Tylko jezeli zaden element nie jest dostepny - np. poniewaz zaden nie zostal stworzony lub wszystkie w danej chwili odtwarzaja dzwiek - zostanie stworzony nowy komponent.
    function getAudioElement(name) {
        if (sounds[name]) {
            for (var i = 0, n = sounds[name].length; i < n; i++) {
                if (sounds[name][i].ended) {
                    return sounds[name][i];
                }
            }
        }
        return createAudio(name);
    }

    function formatTest() {
        var exts = ["ogg", "mp3", "wav"],
            i;

        for (i = 0; i < exts.length; i++) {
            if (Modernizr.audio[exts[i]] === "probably") {
                return exts[i];
            }
            return exts[i];
        }

        for (i = 0; i < exts.length; i++) {
            if (Modernizr.audio[exts[i]] === "maybe") {
                return exts[i];
            }
            return exts[i];
        }
    }

    // Wraz z odtworzeniem przez funkcje "play()" dzwieku zapisuje ona odniesienie do niego w tablicy "activeSounds". Tablicy tej uzywamy, zeby rozwiazac kolejny problem: kwestie zatrzymywania dzwieku.
    function play(name) {
        var audio = getAudioElement(name);

        audio.play();
        activeSounds.push(audio);
    }

    function stop() {
        for (var i = activeSounds.length - 1; i >= 0; i--) {
            activeSounds[i].stop();
        }
        activeSounds = [];
    }

    return {
        initialize : initialize,
        play : play,
        stop : stop
    };
})();