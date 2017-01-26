jewel.display = (function () {
    var dom = jewel.dom,
        $ = dom.$,
        canvas, ctx,
        cols, rows,
        jewelSize,
        jewels,
        firstRun = true,
        cursor,
        previousCycle,
        animations = [];

    function createBackground() {
        var background = document.createElement("canvas"),
            bgctx = background.getContext("2d");

        dom.addClass(background, "background");
        background.width = cols * jewelSize;
        background.height = rows * jewelSize;

        bgctx.fillStyle = "rgba(255, 255, 255, 0.3";
        for (var x = 0; x < cols; x++) {
            for (var y = 0; y < rows; y++) {
                if((x + y) % 2) {
                    bgctx.fillRect(x * jewelSize, y * jewelSize, jewelSize, jewelSize);
                }
            }
        }
        return background;
    }

    function setup() {
        var boardElement = $("#game-screen .game-board")[0];

        cols = jewel.settings.cols;
        rows = jewel.settings.rows;
        jewelSize = jewel.settings.jewelSize;

        canvas = document.createElement("canvas");
        ctx = canvas.getContext("2d");
        dom.addClass(canvas, "board");
        canvas.width = cols * jewelSize;
        canvas.height = rows * jewelSize;
        ctx.scale(jewelSize, jewelSize);

        boardElement.appendChild(createBackground());
        boardElement.appendChild(canvas);

        // Metoda "setup()" sledzi czas, ktory uplynal w poprzednim cyklu. Jest to bardzo wazne, poniewaz informacja o czasie, ktory uplynal od ostatniego uaktualnienia, przyda sie w dalszej fazie wyswietlania animacji.
        previousCycle = Date.now();
        requestAnimationFrame(cycle);
    }

    // Kazda animacja jest dodawana do listy w postaci prostej struktury - obiektu opisujacego czas rozpoczecia, czas trwania oraz posiadajacego wlasciwosc "fncs", ktora zawiera odniesienia do trzech funkcji: "fncs.before()", "fncs.render()" i "fncs.done()". Funkcje te sa wywolywane w roznych momentach w trakcie wyswietlania animacji. Wlasciwosc "pos" jest wartoscia z zakresu od 0 do 1, wskazujaca na przebieg animacji, gdzie 0 jest poczatkiem, a 1 jej koncem.
    function addAnimation(runTime, fncs) {
        var anim = {
            runTime : runTime,
            startTime : Date.now(),
            pos : 0,
            fncs : fncs
        };
        animations.push(anim);
    }

    // Kazdy obiekt animacji posiada funkcje "render()", a niektore rowniez funkcje "before()". Funkcja "before()" jest wyzwalana w kazdym cyklu przed wywolaniem funkcji "render()". Caly mechanizm polega na wykorzystaniu funkcji "before()" w celu przygotowania nastepnej klatki i wyczyszczenia plotna po ostatniej klatce. Wazne jest, aby wszystkie animacje wywolaly metode "before()" przed funkcja "render()". W przeciwnym razie funkcje "before()" jednej animacji moglaby negatywnie wplynac na dzialanie metody "render()" innego obiektu.
    function renderAnimations(time, lastTime) {
        var anims = animations.slice(0), // Kopiuje liste.
            n = anims.length,
            animTime,
            anim,
            i;

        // Powtarzalne wywolywanie funkcji "before()".
        for (i = 0; i < n; i++) {
            anim = anims[i];

            if (anim.fncs.before) {
                anim.fncs.before(anim.pos);
            }
            anim.lastPos = anim.pos;
            animTime = (lastTime - anim.startTime);
            anim.pos = animTime / anim.runTime;
            anim.pos = Math.max(0, Math.min(1, anim.pos));
        }
        // Za kazdym razem gdy licznik czasu animacji (funkcja "cycle()") wywola funkcje "renderAnimations()", tablica "animations" jest czyszczona i tworzona od podstaw w petli. Dzieki temu dodawane sa tylko te animacje, ktore nie zostaly wczesniej zakonczone.
        animations = []; // Reset listy animacji.

        for (i = 0; i < n; i++) {
            anim = anims[i];
            anim.fncs.render(anim.pos, anim.pos - anim.lastPos);

            // Jesli animacja zostala odtworzona w pelni - tzn. jej przebieg ma wartosc "1" - jej obiekt wywoluje metode "done()"; w innym przypadku obiekt jest przenoszony na koniec listy.
            if (anim.pos === 1) {
                if (anim.fncs.done) {
                    anim.fncs.done();
                }
            }
            else {
                animations.push(anim);
            }
        }
    }

    /* Funkcja "drawJewel()" uzywa ustawienia wlasciwosci "jewelSize",
     * aby wybrac wlasciwy zestaw obrazow kamieni. */
    function drawJewel(type, x, y, scale, rot) {
        var image = jewel.images["images/balloons.png"];
        ctx.save();
        if (typeof scale !== "undefined" && scale > 0) {
            ctx.beginPath();
            ctx.rect(x, y, 1, 1);
            ctx.clip();
            ctx.translate(x + 0.5, y + 0.5);
            ctx.scale(scale, scale);
            if (rot) {
                ctx.rotate(rot);
            }
            ctx.translate(-x - 0.5, -y - 0.5);
        }
        /* Sprite'y klejnotow zostaly zaladowane wstepnie wczesniej,
         * wiec obiekt "image" jest gotowy do uzycia w wywolaniu "ctx.drawImage()". */
        ctx.drawImage(image,
            type * jewelSize, 0, jewelSize, jewelSize,
            x, y, 1, 1
        );
        ctx.restore();
    }

    function refill(newJewels, callback) {
        var lastJewel = 0;
        addAnimation(1000, {
            render : function(pos) {
                var thisJewel = Math.floor(pos * cols * rows),
                    i, x, y;
                for (i = lastJewel; i < thisJewel; i++) {
                    x = i % cols;
                    y = Math.floor(i / cols);
                    clearJewel(x, y);
                    drawJewel(newJewels[x][y], x, y);
                }
                lastJewel = thisJewel;
                canvas.style.webkitTransform =
                    "rotateX(" + (360 * pos) + "deg)";
            },
            done : function() {
                canvas.style.webkitTransform = "";
                callback();
            }
        });
    }

    /* Funkcja "redraw()" najpierw czysci cale plotno, po czym przechodzi w petli przez
     * wszystkie sloty w planszy, ustawiajac na kazdym z nich obraz klejnotu.
     * Samym malowaniem klejnotow zajmuje sie funkcja pomocnicza "drawJewel()".
     * Zauwaz, ze funkcja "redraw()" pobiera dane z wywolania zwrotnego. */
    function redraw(newJewels, callback) {
        var x, y;
        jewels = newJewels;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (x = 0; x < cols; x++) {
            for (y = 0; y < rows; y++) {
                drawJewel(jewels[x][y], x, y);
            }
        }
        callback();
        renderCursor();
    }
    
    // Prosta funkcja pomocnicza "cleaJewel()". Jej zadaniem jest wyczyszczenie wskazywanego przez okreslone wspolrzedne pola w elemencie "canvas".
    function clearJewel(x, y) {
        ctx.clearRect(x, y, 1, 1);
    }

    // Funkcja "clearCursor()" usuwa zawartosc pola oznaczonego przez znacznik i ponownie maluje na nim klejnot.
    function clearCursor() {
        if (cursor) {
            var x = cursor.x,
                y = cursor.y;
            clearJewel(x, y);
            drawJewel(jewels[x][y], x, y);
        }
    }

    // Funkcja wyswietlajaca znacznik - finish.
    function renderCursor() {
        if (!cursor) {
            return;
        }
        var x = cursor.x,
            y = cursor.y;

        clearCursor();

        if (cursor.selected) {
            ctx.save();
            ctx.globalCompositeOperation = "lighter";
            ctx.globalAlpha = 0.8;
            drawJewel(jewels[x][y], x, y);
            ctx.restore();
        }
        ctx.save();
        ctx.lineWidth = 0.05 * jewelSize;
        ctx.strokeStyle = "rgba(250, 250 ,150 , 0.8)";
        ctx.strokeRect(
            (x + 0.05) * jewelSize, (y + 0.05) * jewelSize,
            0.9 * jewelSize, 0.9 * jewelSize
        );
        ctx.restore();
    }

    // Znacznik graficzny jest udostepniany przez funkcje "setCursors()".
    function setCursor(x, y, selected) {
        clearCursor();
        // Jezeli ta funkcja zostanie wywolana bez parametrow, nada ona obiektowi "cursor" wartosc "null", co w efekcie usunie go z planszy. W innym przypadku uaktualni jego wspolrzedne.
        if (arguments.length > 0) {
            cursor = {
                x : x,
                y : y,
                selected : selected
            };
        } else {
            cursor = null;
        }
        renderCursor();
    }

    // Funkcja "moveJewels()" operuje na wszystkich klejnotach w dwoch odrebnych petlach, najpierw czyszczac stare pola, a nastepnie malujac nowe kamienie w nowych slotach. Takie podejscie zapobiega przypadkowemu usunieciu wlasnie namalowanego klejnotu.
    function moveJewels(movedJewels, callback) {
        var n = movedJewels.length,
            oldCursor = cursor;
        cursor = null;
        movedJewels.forEach(function(e) {
            var x = e.fromX, y = e.fromY,
                dx = e.toX - e.fromX,
                dy = e.toY - e.fromY,
                dist = Math.abs(dx) + Math.abs(dy);
            addAnimation(300 * dist, {
                before : function(pos) {
                    pos = Math.sin(pos * Math.PI / 2);
                    clearJewel(x + dx * pos, y + dy * pos);
                },
                render : function(pos) {
                    pos = Math.sin(pos * Math.PI / 2);
                    drawJewel(
                        e.type,
                        x + dx * pos, y + dy * pos
                    );
                },
                done : function() {
                    if (--n == 0) {
                        cursor = oldCursor;
                        callback();
                    }
                }
            });
        });
    }

    // Funkcja "removeJewels()" jest nawet prostsza od "moveJewels()", poniewaz czysci wszystkie zdefiniowane w niej pola.
    function removeJewels(removedJewels, callback) {
        var n = removedJewels.length;
        removedJewels.forEach(function(e) {
            addAnimation(300, {
                before : function() {
                    clearJewel(e.x, e.y);
                },
                render : function(pos) {
                    ctx.save();
                    ctx.globalAlpha = 1 - pos;
                    drawJewel(
                        e.type, e.x, e.y,
                        1 - pos, pos * Math.PI * 2
                    );
                    ctx.restore();
                },
                done : function() {
                    if (--n == 0) {
                        callback();
                    }
                }
            });
        });
    }

    function levelUp(callback) {
        addAnimation(1500, {
            before : function(pos) {
                var j = Math.floor(pos * rows * 3),
                    x, y;
                for (y = 0, x = j; y < rows; y++, x--) {
                    if (x >= 0 && x < cols) { // Sprawdzenie granic.
                        clearJewel(x, y);
                        drawJewel(jewels[x][y], x, y);
                    }
                }
            },
            render : function(pos) {
                var j = Math.floor(pos * rows * 3),
                    x, y;
                ctx.save(); // Zapisz stan.
                ctx.globalCompositeOperation = "lighter";
                for (y = 0, x = j; y < rows; y++, x--) {
                    if (x >= 0 && x < cols) { // Sprawdzenie granic.
                        drawJewel(jewels[x][y], x, y, 1.1);
                    }
                }
                ctx.restore();
            },
            done : callback
        });
    }

    function explodePieces(pieces, pos, delta) {
        var piece, i;
        for (i = 0; i < pieces.length; i++) {
            piece = pieces[i];

            piece.vel.y += 100 * delta;
            piece.pos.y += piece.vel.y * delta;
            piece.pos.x += piece.vel.x * delta;

            if (piece.pos.x < 0 || piece.pos.x > cols) {
                piece.pos.x = Math.max(0, piece.pos.x);
                piece.pos.x = Math.min(cols, piece.pos.x);
                piece.vel.x *= -1;
            }

            ctx.save();
            ctx.globalCompositeOperation = "lighter";
            ctx.translate(piece.pos.x, piece.pos.y);
            ctx.rotate(piece.rot * pos * Math.PI * 4);
            ctx.translate(-piece.pos.x, -piece.pos.y);
            drawJewel(piece.type,
                piece.pos.x - 0.5,
                piece.pos.y - 0.5
            );
            ctx.restore();
        }
    }

    function explode(callback) {
        var pieces = [],
            piece,
            x, y;
        for (x = 0; x < cols; x++) {
            for (y = 0; y < rows; y++) {
                piece = {
                    type : jewels[x][y],
                    pos : {
                        x : x + 0.5,
                        y : y + 0.5
                    },
                    vel : {
                        x : (Math.random() - 0.5) * 20,
                        y : -Math.random() * 10
                    },
                    rot : (Math.random() - 0.5) * 3
                }
                pieces.push(piece);
            }
        }

        addAnimation(4000, {
            before : function(pos) {
                ctx.clearRect(0, 0, cols, rows);
            },
            render : function(pos, delta) {
                explodePieces(pieces, pos, delta);
            },
            done : callback
        });
    }


    function gameOver(callback) {
        addAnimation(500, {
            render : function(pos) {
                canvas.style.left =
                    0.2 * pos * (Math.random() - 0.2) + "em";
                canvas.style.top =
                    0.2 * pos * (Math.random() - 0.2) + "em";
            },
            done : function() {
                canvas.style.left = "0";
                canvas.style.top = "0";
                explode(callback);
            }
        });
    }

    function renderCursor(time) {
        if (!cursor) {
            return;
        }
        var x = cursor.x,
            y = cursor.y,
            t1 = (Math.sin(time / 200) + 1) / 2,
            t2 = (Math.sin(time / 400) + 1) / 2;

        clearCursor();

        if (cursor.selected) {
            ctx.save();
            ctx.globalCompositeOperation = "lighter";
            ctx.globalAlpha = 0.8 * t1;
            drawJewel(jewels[x][y], x, y);
            ctx.restore();
        }
        ctx.save();
        ctx.lineWidth = 0.05;
        ctx.strokeStyle =
            "rgba(250,250,150," + (0.5 + 0.5 * t2) + ")";
        ctx.strokeRect(x + 0.05, y + 0.05, 0.9, 0.9);
        ctx.restore();
    }

    function cycle() {
        var time = Date.now();
        
        renderCursor(time);
        renderAnimations(time, previousCycle);
        previousCycle = time;
        requestAnimationFrame(cycle);
    }

    function initialize(callback) {
        if (firstRun) {
            setup();
            firstRun = false;
        }
        callback();
    }

    return {
        initialize : initialize,
        redraw : redraw,
        setCursor : setCursor,
        moveJewels : moveJewels,
        removeJewels : removeJewels,
        refill : refill,
        levelUp : levelUp,
        gameOver : gameOver
    }
})();
