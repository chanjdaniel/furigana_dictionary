const jmdict = require('./JmdictFurigana.json');
const furiganaDict = new Map();
const FileSystem = require("fs");

for (let i = 0; i < jmdict.length; i++) {
    let entry = jmdict[i]["text"];
    let j = 0;
    let groupArray = getGroupArray(entry);

    for (let k = 0; k < groupArray.length; k++) {
        let group = groupArray[k];
        if (containsKanji(group)) {
            if (!furiganaDict.has(group)) {
                furiganaDict.set(group, new Map());
            }
            let groupFurigana = getGroupFurigana(group, i);
            let context = k + 1 < groupArray.length ? groupArray[k + 1] : "";
            if (!furiganaDict.get(group).has(context)) {
                furiganaDict.get(group).set(context, groupFurigana);
            }
        }
    }
}

let furiganaObject = Object.fromEntries(furiganaDict);
let furiganaKeys = Object.keys(furiganaObject);
for (let i = 0; i < furiganaKeys.length; i++) {
    furiganaObject[furiganaKeys[i]] = Object.fromEntries(furiganaObject[furiganaKeys[i]]);
}

FileSystem.writeFile('furigana.json', JSON.stringify(furiganaObject), (error) => {
if (error) throw error;
});

let test = "気";
console.log(furiganaObject[test]);

// returns string containing furigana reading of kanji group using jmdict
// example: "阿吽" -> "あうん"
function getGroupFurigana(group, dictIdx) {
    let furigana = "";
    let dictEntry = jmdict[dictIdx]["furigana"];
    for (let i = 0; i < group.length; i++) {
        for (let j = 0; j < dictEntry.length; j++) {
            if (group[i] == dictEntry[j]["ruby"]) {
                furigana += dictEntry[j]["rt"];
                break;
            }
        }
    }
    return furigana;
}

// returns an array containing groups of kana/kanji in entry
// example: "阿吽の呼吸" -> ["阿吽", "の", "呼吸"]
function getGroupArray(entry) {
    let j = 0;
    let groupArray = [];
    while (j < entry.length) {
        let state = containsKanji(entry[j]);
        let first = j;
        while (j < entry.length) {
            if (state == containsKanji(entry[j])) {
                j++;
            } else {
                state = !state;
                break;
            }
        }
        groupArray.push(entry.substring(first, j));
    }
    return groupArray;
}

function containsKanji(text) {
    const re = /[\u4e00-\u9faf\u3400-\u4dbf]/;
    return re.test(text);
}