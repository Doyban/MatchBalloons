jewel.board = (function() {
    var dom = jewel.dom,
        settings,
        worker,
        messageCount,
        callbacks;


    function post(command, data, callback) {
        callbacks[messageCount] = callback;
        worker.postMessage({
            id : messageCount,
            command : command,
            data : data
        });
        messageCount++;
    }

    function messageHandler(event) {
        // Usun znacznik komentarza ponizej, aby zapisac wiadomosci pracownika w logach.
//         console.log(event.data);

        var message = event.data;

        jewels = message.jewels;

        if (callbacks[message.id]) {
            callbacks[message.id](message.data);
            delete callbacks[message.id];
        }
    }

    function initialize(startJewels, callback) {
        settings = jewel.settings;
        rows = settings.rows;
        cols = settings.cols;
        messageCount = 0;
        callbacks = [];
        worker = new Worker("scripts/board.worker.js");
        dom.bind(worker, "message", messageHandler);

        var data = {
            settings : settings,
            startJewels : startJewels
        };
        post("initialize", data, callback);
    }


    function swap(x1, y1, x2, y2, callback) {
        post("swap", {
            x1 : x1,
            y1 : y1,
            x2 : x2,
            y2 : y2
        }, callback);
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

    function getJewel(x, y) {
        if (x < 0 || x > cols-1 || y < 0 || y > rows-1) {
            return -1;
        } else {
            return jewels[x][y];
        }
    }

    /* Odslanianie metod publicznych. */
    return {
        initialize : initialize,
        swap : swap,
        getBoard : getBoard,
        print : print
    };

})();
