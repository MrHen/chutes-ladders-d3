"use strict";

// ported from https://github.com/roycoding/chutes-and-ladders/blob/master/chutesladdersmarkov.py

var config = {
    use_fractions: true,
    post_convert: true
};

var placeCount = 100 + 1;

var transitions = {
    98:78,
    95:75,
    93:73,
    87:24,
    64:60,
    62:19,
    56:53,
    49:11,
    48:26,
    16:6,

    1:38,
    4:14,
    9:31,
    21:42,
    28:84,
    36:44,
    51:67,
    71:91,
    80:100
};

var transitionPairs = _.pairs(transitions);
var ladders = _.filter(transitionPairs, function(v) { return v[0] < v[1];});
var chutes = _.filter(transitionPairs, function(v) { return v[0] > v[1];});

var die = 6;

function getFraction(a, b) {
    return config.use_fractions ? math.fraction(a, b) : a / b;
}

function getOdds(i, j, debug) {
    var odds = 0;
    if (j === i && i === (placeCount - 1)) {
        odds = 1;
        if (debug) console.log('at end', i, j, odds);
    } else if (j <= i) {
        odds = 0;
        if (debug) console.log('backwards', i, j, odds);
    } else if (j > (i + die)) {
        odds = 0;
        if (debug) console.log('too far away', i, j, odds);
    } else if (((i + die) >= placeCount) && j === (placeCount - 1)) {
        odds = getFraction((i + die - placeCount + 2), die);
        if (debug) console.log('end clump', i, j, odds);
    } else {
        odds = getFraction(1, die);
        if (debug) console.log('success', i, j, odds);
    }
    return odds;
}

function getTransitions(count, jumps) {
    var T = [];

    for (var i = 0; i < count; i++) {
        var dest = [];
        for (var j = 0; j < count; j++) {
            dest.push(getOdds(i, j));
        }

        for (var key in jumps) {
            var final = jumps[key];
            dest[final] = math.add(dest[final], dest[key]);
            dest[key] = 0;
        }

        T.push(dest);
    }

    return T;
}

function getBoards(T, moves) {
    var L = _.fill(Array(T.length), 0);
    L[0] = 1;

    var boards = [];
    //boards.push(L);

    for (var i = 0; i < moves; i++) {
        L = math.multiply(L,T);

        if (config.post_convert) {
            //boards.push(_.map(L, function(n) { return 0 + n; }));
            boards.push(_.map(L.slice(1), function(n) { return 0 + n; }));
        } else {
            //boards.push(L);
            boards.push(L.slice(1));
        }
    }

    return boards;
}

var T = getTransitions(placeCount, transitions);

//console.log("created initial table", T);

var boards = getBoards(T, 50);

function listEquals(a, b) {
    if (a && b) {
        if (a.length != b.length) {
            console.log("lengths don't match");
            return false;
        }

        for (var i = 0; i < a.length; i++) {
            if (_.isArray(a[i])) {
                if (!_.isArray(b[i])) {
                    console.log("nested mismatch", i);
                    return false;
                }

                if (!listEquals(a[i], b[i])) {
                    console.log("  (nested)", i);
                    //return false;
                }
            } else if (a[i] != b[i]) {
                console.log("mismatch", i, a[i], b[i]);
                return false;
            }
        }

        return true;
    }

    return a === b;
}

function sumCheck(a) {
    for (var i = 0; i < a.length; i++) {
        if (math.sum(a[i]) != 1) {
            console.log("sum failed", i, math.sum(a[i]));
        }
    }
}
