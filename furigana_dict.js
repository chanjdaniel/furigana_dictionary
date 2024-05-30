const jmdict = require('./JmdictFurigana.json');
const furiganaDict = new Map();
const FileSystem = require("fs");

// extract patterns from dictionary
for (let i = 0; i < jmdict.length; i++) {
    let entry = jmdict[i]["text"];
    let j = 0;
    let groupArray = getGroupArray(entry);

    for (let k = 0; k < groupArray.length; k++) {
        let group = groupArray[k];
        if (containsKanji(group)) {
            if (!furiganaDict.has(group)) {
                furiganaDict.set(group, new Map());
                furiganaDict.get(group).set("pre", new Map());
                furiganaDict.get(group).set("post", new Map());
            }
            let groupFurigana = getGroupFurigana(group, i);
            let precontext = k - 1 >= 0 ? groupArray[k - 1] : "";
            let postcontext = k + 1 < groupArray.length ? groupArray[k + 1] : "";
            if (!furiganaDict.get(group).get("post").has(postcontext)) {
                furiganaDict.get(group).get("post").set(postcontext, groupFurigana);
            }
            if (!furiganaDict.get(group).get("pre").has(precontext) && precontext.length > 1) {
                furiganaDict.get(group).get("pre").set(precontext, groupFurigana);
            }
        }
    }
}

// update dictionary with common conjugation rules
for (let [kanji, context] of furiganaDict.entries()) {
    for (let [postcontext, reading] of context.get("post").entries()) {
        if (isVerbEnding(postcontext)) {
            let teForm = getTeForm(postcontext);
            if (!furiganaDict.get(kanji).get("post").has(teForm)) {
                furiganaDict.get(kanji).get("post").set(teForm, reading);
            }
            let potentialTeForm = getPotentialTeForm(postcontext);
            if (!furiganaDict.get(kanji).get("post").has(potentialTeForm)) {
                furiganaDict.get(kanji).get("post").set(potentialTeForm, reading);
            }
            let potentialForm = getPotentialForm(postcontext);
            if (!furiganaDict.get(kanji).get("post").has(potentialForm)) {
                furiganaDict.get(kanji).get("post").set(potentialForm, reading);
            }
        }

        if (postcontext == "い" || postcontext == "しい") {
            let kuForm = getAdjKuForm(postcontext);
            if (!furiganaDict.get(kanji).get("post").has(kuForm)) {
                furiganaDict.get(kanji).get("post").set(kuForm, reading);
            }

            let condForm = getAdjCondForm(postcontext);
            if (!furiganaDict.get(kanji).get("post").has(condForm)) {
                furiganaDict.get(kanji).get("post").set(condForm, reading);
            }

            let souForm = getAdjSouForm(postcontext);
            if (!furiganaDict.get(kanji).get("post").has(souForm)) {
                furiganaDict.get(kanji).get("post").set(souForm, reading);
            }

            let saForm = getAdjSaForm(postcontext);
            if (!furiganaDict.get(kanji).get("post").has(saForm)) {
                furiganaDict.get(kanji).get("post").set(saForm, reading);
            }
        }
    }
}

// remove redundant dictionary entries (does that make the program slower??)
// for (let [kanji, context] of furiganaDict.entries()) {
//     for (let [postcontext, reading] of context.get("post").entries()) {
        
//     }
// }

let furiganaObject = Object.fromEntries(furiganaDict);
let kanjiKeys = Object.keys(furiganaObject);
for (let i = 0; i < kanjiKeys.length; i++) {
    let kanjiKey = kanjiKeys[i];
    furiganaObject[kanjiKey] = Object.fromEntries(furiganaObject[kanjiKey]);
    let furiganaKeys = Object.keys(furiganaObject[kanjiKey]);
    for (let j = 0; j < furiganaKeys.length; j++) {
        let furiganaKey = furiganaKeys[j];
        furiganaObject[kanjiKey][furiganaKey] = Object.fromEntries(furiganaObject[kanjiKey][furiganaKey]);
    }
}

FileSystem.writeFile('furiganaDict.json', JSON.stringify(furiganaObject), (error) => {
if (error) throw error;
});


// HELPERS

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

function isVerbEnding(text) {
    const re = /^(?:く|ぐ|む|ぶ|ぬ|る|う|つ|す|しむ|じむ|きる|じる|[けげめべねれえてせ]る)$/;
    return re.test(text);
}

function getPotentialForm(postcontext) {
    let teForm = ""
    let verbEnding = postcontext[0];
    if (postcontext.length == 2) {
        verbEnding = postcontext[1];
        teForm += postcontext[0];
    }
    if (verbEnding == "く") {
        teForm += "ける";
    } else if (verbEnding == "ぐ") {
        teForm += "げる";
    } else if (verbEnding == "む") {
        teForm += "める";
    } else if (verbEnding == "ぶ") {
        teForm += "べる";
    } else if (verbEnding == "ぬ") {
        teForm += "ねる";
    } else if (verbEnding == "る") {
        teForm += "れる";
    } else if (verbEnding == "う") {
        teForm += "える";
    } else if (verbEnding == "つ") {
        teForm += "てる";
    } else if (verbEnding == "す") {
        teForm += "せる";
    }
    return teForm;
}

function getPotentialTeForm(postcontext) {
    let teForm = ""
    let verbEnding = postcontext[0];
    if (postcontext.length == 2) {
        verbEnding = postcontext[1];
        teForm += postcontext[0];
    }
    if (verbEnding == "く") {
        teForm += "けて";
    } else if (verbEnding == "ぐ") {
        teForm += "げて";
    } else if (verbEnding == "む") {
        teForm += "めて";
    } else if (verbEnding == "ぶ") {
        teForm += "べて";
    } else if (verbEnding == "ぬ") {
        teForm += "ねて";
    } else if (verbEnding == "る") {
        teForm += "れて";
    } else if (verbEnding == "う") {
        teForm += "えて";
    } else if (verbEnding == "つ") {
        teForm += "てて";
    } else if (verbEnding == "す") {
        teForm += "せて";
    }
    return teForm;
}

function getTeForm(postcontext) {
    let teForm = ""
    let verbEnding = postcontext[0];
    if (postcontext.length == 2) {
        verbEnding = postcontext[1];
        teForm += postcontext[0];
    }
    if (verbEnding == "く") {
        teForm += "いて";
    } else if (verbEnding == "ぐ") {
        teForm += "いで";
    } else if (verbEnding == "む") {
        teForm += "んで";
    } else if (verbEnding == "ぶ") {
        teForm += "んで";
    } else if (verbEnding == "ぬ") {
        teForm += "んで";
    } else if (verbEnding == "る") {
        teForm += "って";
    } else if (verbEnding == "う") {
        teForm += "って";
    } else if (verbEnding == "つ") {
        teForm += "って";
    } else if (verbEnding == "す") {
        teForm += "して";
    }
    return teForm;
}

function getAdjKuForm(adjEnding) {
    if (adjEnding == "い") {
        return "く";
    } else if (adjEnding == "しい") {
        return "しく";
    }
}

function getAdjCondForm(adjEnding) {
    if (adjEnding == "い") {
        return "ければ";
    } else if (adjEnding == "しい") {
        return "しければ";
    }
}

function getAdjSouForm(adjEnding) {
    if (adjEnding == "い") {
        return "そう";
    } else if (adjEnding == "しい") {
        return "しそう";
    }
}

function getAdjSaForm(adjEnding) {
    if (adjEnding == "い") {
        return "さ";
    } else if (adjEnding == "しい") {
        return "しさ";  
    }
}