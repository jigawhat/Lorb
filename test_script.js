// test_script.js


// var data = [["wef", 5, "fvd"], ["wef", 5, "fvd"], ]
function range(size, startAt=0) {
    return [...Array(size).keys()].map(i => i + startAt);
}

// var null_x = [0, -1, -1, -1];
// var data = Array(...Array(10)).map(() => null_x.slice(0));
// data[0][2] = 1
// var data = range(10);

data = [ [ 0, 0, -1, -1 ],
         [ 0, 1, -1, -1 ],
         [ 0, 2, -1, -1 ],
         [ 0, 3, -1, -1 ],
         [ 0, 4, -1, -1 ],
         [ 1, 0, -1, -1 ],
         [ 1, 1, -1, -1 ],
         [ 1, 2, -1, -1 ],
         [ 1, 3, -1, -1 ],
         [ 1, 4, -1, -1 ],
 ];

team_i = 0;
role_i = 0;
cid_i = 0;
opgg_i = 0;

var data = {
    "team:": 1,
    "role": 3,
    "cid": -1,
    "opgg": -1,
}
var values = Object.keys(data).map(function(key){
    return data[key];
});

var a = 5;
var b = 7;
var c = a;
a = b;
b = c;
var a;

// console.log(300 / 100)
// console.log((true) ? 3 : 5);
// console.log(data);
// console.log([...Array(10).keys()].map(i => 0));
a = [1, 2];
a[2] = 3;
// console.log(a, typeof a);
// console.log(a.slice(0,3))
// console.log(Math.max.apply(null, [0,4,2,6,2,3,4]))
// console.log("dfgr_57".split('_')[1]);

var req_data_init = [
    [ 0, 0, -1, -1 ],
    [ 0, 1, -1, -1 ],
    [ 0, 2, -1, -1 ],
    [ 0, 3, -1, -1 ],
    [ 0, 4, -1, -1 ],
    [ 1, 0, -1, -1 ],
    [ 1, 1, -1, -1 ],
    [ 1, 2, -1, -1 ],
    [ 1, 3, -1, -1 ],
    [ 1, 4, -1, -1 ],
];

var clone_2d_arr = function(arr) {
    res = [];
    for (i = 0; i < arr.length; i++) {
        res[i] = arr[i].slice(0);
    }
    return res;
};

var req_data = clone_2d_arr(req_data_init);
req_data[0][0] = 7;

console.log(req_data_init[0]);
console.log(req_data[0]);
console.log(Math.floor(10/3))


