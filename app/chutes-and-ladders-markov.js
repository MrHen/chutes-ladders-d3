"use strict";

// ported from https://github.com/roycoding/chutes-and-ladders/blob/master/chutesladdersmarkov.py

var config = {
    use_fractions: true,
    post_convert: true,
    loop: false
};

var placeCount = 100 + 2;
var crashZone = placeCount - 1;
var finish = placeCount - 2;

var places = _.range(2, placeCount - 1); // don't let arrows hit 0, 1 or 100
var transition_count = 0;

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

for(var i = 0; i < transition_count; i++) {
    var ladder = i % 2 === 0;

    var rand = _.sample(places, 2);
    places = _.difference(places, rand);

    var high = Math.max(rand[0], rand[1]);
    var low = Math.min(rand[0], rand[1]);

    if (ladder) {
        transitions[low] = high;
    } else {
        transitions[high] = low;
    }
}

var curves = [];
//curves.push({start:10,end:12});
//curves.push({start:50,end:54});

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

//var dice = [
//    [1,2],
//    [2,3,3,4,4,4],
//    [4,5,6,6,7,7,8,8],
//    [7,8,9,10,11,12],
//    [11,12,13,14,15,16,17,18,19,20],
//    [21,22,23,24,25,26,27,28,29,30]
//];

//var dice = [
//    [1,2,3,4],
//    [3,4,5,6],
//    [5,6,7,8]
//];

var dice = [
    [1,2,3,4,5,6]
];

function getFraction(a, b) {
    return config.use_fractions ? math.fraction(a, b) : a / b;
}

function getTransitions(count, jumps, curves, die) {
    console.log('saw curves', curves);
    var T = [];

    for (var i = 0; i < count; i++) {
        var dest = _.fill(Array(placeCount), 0);
        if (i === crashZone) {
            dest[crashZone] = 1;
        } else {
            for (var j = 0; j < die.length; j++) {
                var end = i + die[j];
                if (end >= finish) {
                    if (config.loop) {
                        end = end % finish;
                    } else {
                        end = finish;
                    }
                }

                for (var c = 0; c < curves.length; c++) {
                    if (i < curves[c].start && end > curves[c].end) {
                        //console.log('skipped curve', i, end);
                        end = crashZone;
                        break;
                    }
                }

                dest[end] = math.add(dest[end], getFraction(1, die.length));
            }

            for (var key in jumps) {
                var final = jumps[key];
                dest[final] = math.add(dest[final], dest[key]);
                dest[key] = 0;
            }
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

        boards.push(convertBoard(L));
    }

    return boards;
}

function getBoardsUsingPolicy(T, policy, moves) {
    var L = _.fill(Array(placeCount), 0);
    L[0] = 1;

    var boards = [];

    var odds = getOddsUsingPolicy(T, policy);

    for (var i = 0; i < moves; i++) {
        L = math.multiply(L,odds);

        boards.push(convertBoard(L));
    }

    return boards;
}

function getOddsUsingPolicy(T, policy) {
    var odds = [];
    for (var start = 0; start < placeCount; start++) {
        odds.push(T[policy[start]][start]);
    }
    return odds;
}

var discountFactor = .9;

function getPolicy(T, V) {
    var policy = _.fill(Array(placeCount), 0);

    for(var state = 0; state < placeCount; state++) {

        var max = null;
        var best = null;
        for(var action = 0; action < T.length; action++) {

            var sum = 0;
            for(var next = 0; next < placeCount; next++) {
                var prob = T[action][state][next];
                if (prob === 0) {
                    continue;
                }

                var reward = getReward(state, next);
                var future = discountFactor * V[next];
                sum += prob * (reward + future);
            }

            if (max === null || sum > max) {
                max = sum;
                best = action;
            }
        }
        policy[state] = best;
    }

    return policy;
}

function nextPolicy(policies, T, V) {
    var old = _.last(policies);
    policies.push(getPolicy(T, V));
    return old && math.deepEqual(old, _.last(policies));
}

function getValues(T, policy, old) {
    var values = _.fill(Array(placeCount), 0);

    for (var state = 0; state < placeCount; state++) {
        var action = policy[state];

        var sum = 0;
        for (var next = 0; next < placeCount; next++) {
            var prob = T[action][state][next];
            if (prob === 0) {
                continue;
            }

            var reward = getReward(state, next);
            var future = discountFactor * old[next];
            sum += prob * (reward + future);
        }
        values[state] = sum;
    }

    //console.log('values finished', values);
    return values;
}

function nextValues(V, T, policy) {
    var old = _.last(V);
    V.push(getValues(T, policy, old));
    return old && math.deepEqual(old, _.last(V));
}

function findOptimalPolicy(T) {
    var policies = [];
    var V = [];
    V.push(_.fill(Array(placeCount), 0));

    var max = 1000000;
    console.log("starting...");
    while(max && !nextPolicy(policies, T, _.last(V))) {
        console.log("new policy", max);
        while(--max && !nextValues(V, T, _.last(policies))) {
        }
    }

    return {policies:policies, V:V};
}

function getReward(start, end) {
    if (end === finish) {
        return 1;
    }

    if (end === crashZone) {
        return -10;
    }

    return 0;
}

function convertBoard(board) {
    if (config.post_convert) {
        //boards.push(_.map(L, function(n) { return 0 + n; }));
        return _.map(board.slice(1), function(n) { return 0 + n; });
    } else {
        //boards.push(L);
        return board.slice(1);
    }
}

var T = _.map(dice, function(die) { return getTransitions(placeCount, transitions, curves, die); });

var t_boards = _.map(T, function(transitions) { return getBoards(transitions, 50)});

var boards = t_boards[1];

var iterate = findOptimalPolicy(T);
var optimal_odds = getOddsUsingPolicy(T, _.last(iterate.policies));
var optimal_board = getBoardsUsingPolicy(T, _.last(iterate.policies), 50);

var diff = math.subtract(optimal_board, t_boards[0]);

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
            } else if (!math.equal(a[i], b[i])) {
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
        if (!math.equal(math.sum(a[i]), 1)) {
            console.log("sum failed", i, math.sum(a[i]));
        }
    }
}
