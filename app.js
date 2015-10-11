var searchfield = document.getElementById("searchfield");
var results = document.getElementById("results");

searchfield.addEventListener("keypress", function(e) {
    // Only respond to the enter key.
    if (e.keyCode != 13)
        return;

    // This breaks for English words with "ux", but... that's OK.
    var term = xreplace(searchfield.value);

    // Normalize "to foo", "to be foo", and "be foo" => "foo".
    if (term.startsWith('to ')) {
        term = term.substr(3);
    }
    if (term.startsWith('be ')) {
        term = term.substr(3);
    }

    var matchlist = search(term);

    // If no results were found, try fixing input to a standard dictionary form.
    if (matchlist.length === 0) {
        var normalized = normalize_suffix(term);
        if (normalized !== term) {
            matchlist = search(normalized);
        }
    }

    results.innerHTML = makehtml(matchlist);
}, false);

// Support the x-system.
function xreplace(text) {
    var pairs = [
        ['cx', 'ĉ'],
        ['gx', 'ĝ'],
        ['hx', 'ĥ'],
        ['jx', 'ĵ'],
        ['sx', 'ŝ'],
        ['ux', 'ŭ'],
        ['Cx', 'Ĉ'],
        ['Gx', 'Ĝ'],
        ['Hx', 'Ĥ'],
        ['Jx', 'Ĵ'],
        ['Sx', 'Ŝ'],
        ['Ux', 'Ŭ']
    ];

    text = text.replace('X', 'x');
    for (var i = 0; i < pairs.length; ++i) {
        text = text.replace(pairs[i][0], pairs[i][1]);
    }
    return text;
}

// Given an esperanto word, try to get a standard form.
function normalize_suffix(word) {
    var suffices = [
        ['as', 'i'],
        ['os', 'i'],
        ['is', 'i'],
        ['us', 'i'],
        ['u',  'i'],

        ['oj', 'o'],
        ['ojn', 'o'],
        ['on', 'o'],

        ['aj', 'a'],
        ['ajn', 'a'],
        ['an', 'a'],

        ['en', 'e']
    ];

    for (var i = 0; i < suffices.length; ++i) {
        if (word.endsWith(suffices[i][0])) {
            return word.slice(0, -1 * suffices[i][0].length) + suffices[i][1];
        }
    }

    return word;
}

// Given an esperanto word subject to normal grammar rules, get the root.
function getroot(word) {
    word = normalize_suffix(word);

    // Remove the function indicator.
    var lastchar = word[word.length - 1]
    if (lastchar === 'a' || lastchar === 'i' || lastchar === 'o') {
        word = word.slice(0, -1);
    }

    // Get out of participle form.
    var suffices = [
        'ant', 'ont', 'int', 'unt', 'at', 'ot', 'it', 'ut'
    ];

    for (var i = 0; i < suffices.length; ++i) {
        if (word.endsWith(suffices[i])) {
            return word.slice(0, -1 * suffices[i].length);
        }
    }

    return word;
}

// Returns a list of match indices into espdic.
function search(word) {
    var lowerWord = word.toLowerCase();
    var matches = [];

    // Find all potentially matching candidates quickly.
    // Does not care whether the entry was in English or Esperanto.
    for (var i = 0; i < espdic.length; ++i) {
        var entry = espdic[i];
        for (var j = 0; j < entry.length; ++j) {
            if (entry[j].toLowerCase().includes(lowerWord)) {
                matches.push(i);
                break;
            }
        }
    }

    // Filter out exact matches.
    var exactmatches = [];
    for (var i = 0; i < matches.length; ++i) {
        var entry = espdic[matches[i]];
        for (var j = 0; j < entry.length; ++j) {
            var lower = entry[j].toLowerCase();

            // Normalize "to foo", "to be foo", and "be foo" => "foo".
            if (lower.startsWith('to ')) {
                lower = lower.substr(3);
            }
            if (lower.startsWith('be ')) {
                lower = lower.substr(3);
            }

            if (lower === lowerWord) {
                exactmatches.push(matches[i]);
                break;
            }
        }
    }

    // If there are exact matches, just return those.
    if (exactmatches.length > 0) {
        return exactmatches;
    }

    return matches;
}

// Given an esperanto word, look up an etymology.
function find_etymology(word) {
    // The etymology dictionary is entirely in lowercase.
    var lowerWord = word.toLowerCase();

    // Look for the word directly.
    for (var i = 0; i < etymology.length; ++i) {
        if (etymology[i][0] === lowerWord) {
            return etymology[i][1];
        }
    }

    // If it wasn't found, try to compare roots.
    // We can't do this in the first place because of exceptions.
    // For example, "tri" and "tro" have distinct etymologies.
    var root = getroot(lowerWord);
    for (var i = 0; i < etymology.length; ++i) {
        if (etymology[i][0].slice(0, -1) === root) {
            return etymology[i][1];
        }
    }

    return "";
}

// Given a list of match indices into espdic, display them as HTML.
function makehtml(matchlist) {
    if (matchlist.length === 0) {
        return "Nenio trovita.";
    }

    if (matchlist.length > 20) {
        return "Tro multe da rezultoj!";
    }

    html = "";
    for (var i = 0; i < matchlist.length; ++i) {
        var entry = espdic[matchlist[i]];

        html += '<div class="resultrow">';
        html += '<span class="eo-result">' + entry[0] + '</span>';

        html += '<span class="en-result">' + entry.slice(1).join(', ') + '</span>';

        var etym = find_etymology(entry[0]);
        if (etym.length > 0) {
            html += '<div class="etym-result">' + etym + '</div>';
        }
        html += '</div>';   
    }

    return html;
}
