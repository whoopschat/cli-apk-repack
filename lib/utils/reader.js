const fs = require('fs');

function reader(uri, encoding) {
    var encoding = encoding == null ? 'UTF-8' : encoding;
    console.log(encoding);
    try {
        var content = fs.readFileSync(uri, encoding);
        console.log(content);
        var regexjing = /\s*(#+)/;
        var regexkong = /\s*:\s*/;
        var keyvalue = {};
        var arr_case = null;
        var regexline = /.+/g;
        while (arr_case = regexline.exec(content)) {
            if (!regexjing.test(arr_case)) {
                keyvalue[arr_case.toString().split(regexkong)[0].trim()] = arr_case.toString().split(regexkong)[1] || "";
            }
        }
    } catch (e) {
        console.log(e);
        return null;
    }
    for (key in keyvalue) {
        while (keyvalue[key].indexOf("'") >= 0) {
            keyvalue[key] = keyvalue[key].replace(/'/, "");
        }
    }
    return keyvalue;
}

module.exports = {
    reader,
}