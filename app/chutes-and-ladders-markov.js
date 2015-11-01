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

// https://boardgamegeek.com/article/3959568#3959568
//d4 - 1st gear 1,1,2,2
//d6 - 2nd gear 2,3,3,4,4,4
//d8 - 3rd gear 4,5,6,6,7,7,8,8
//d12 - 4th gear the numbers 7 through 12 twice
//d20 - 5th gear the numbers 11 through 20 twice
//d30 - 6th gear the numbers 21 through 30 three times

var dice = [
    [1,2],
    [2,3,3,4,4,4],
    [4,5,6,6,7,7,8,8],
    [7,8,9,10,11,12],
    [11,12,13,14,15,16,17,18,19,20],
    [21,22,23,24,25,26,27,28,29,30]
];

function getFraction(a, b) {
    return config.use_fractions ? math.fraction(a, b) : a / b;
}

function getTransitions(count, jumps, die) {
    var T = [];

    for (var i = 0; i < count; i++) {
        var dest = _.fill(Array(placeCount), 0);

        for (var j = 0; j < die.length; j++) {
            var end = i + die[j];
            if (end >= placeCount) {
                end = placeCount - 1;
            }
            dest[end] = math.add(dest[end], getFraction(1, die.length));
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

var T = _.map(dice, function(die) { return getTransitions(placeCount, transitions, die)});

var boards = getBoards(T[1], 50);

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
