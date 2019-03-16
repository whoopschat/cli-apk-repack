const fs = require('fs');
const path = require('path');
const func = require('./func');

function copySync(src, dst) {
    fs.createReadStream(src).pipe(fs.createWriteStream(dst));
}

function mkdirsSync(dirname, mode) {
    if (fs.existsSync(dirname)) {
        return true;
    } else {
        if (mkdirsSync(path.dirname(dirname), mode)) {
            fs.mkdirSync(dirname, mode);
            return true;
        }
    }
    return false;
}

function createFolderSync(file) {
    try {
        var sep = path.sep
        var folders = path.dirname(file).split(sep);
        var p = '';
        while (folders.length) {
            p += folders.shift() + sep;
            if (!fs.existsSync(p)) {
                fs.mkdirSync(p);
            }
        }
    } catch (error) {
    }
}

function deleteFileSync(path) {
    try {
        fs.unlinkSync(path);
    } catch (error) {
    }
}

function deleteFolderSync(path) {
    try {
        var files = [];
        if (fs.existsSync(path)) {
            files = fs.readdirSync(path);
            files.forEach(function (file) {
                var curPath = path + "/" + file;
                if (fs.statSync(curPath).isDirectory()) {
                    deleteFolderSync(curPath);
                } else {
                    deleteFileSync(curPath);
                }
            });
            if (fs.statSync(path).isDirectory()) {
                fs.rmdirSync(path);
            }
        }
    } catch (error) {
    }
}

function createFileSync(file, content) {
    createFolderSync(file);
    fs.createWriteStream(file);
    fs.writeFileSync(file, content);
}

function existsSync(file) {
    return fs.existsSync(file);
}

function replaceFilesSync(src, filter, options) {
    if (Object.keys(options).length <= 0) {
        return;
    }
    const releaceFile = (nextPath) => {
        const fileList = fs.readdirSync(nextPath);
        if (!fileList.length) {
            return;
        }
        fileList.forEach(file => {
            let targetFile = path.join(nextPath, `./${file}`);
            let fileStat = fs.statSync(targetFile);
            if (fileStat.isDirectory()) {
                return releaceFile(targetFile);
            }
            if (filter && filter(targetFile)) {
                let content = fs.readFileSync(targetFile, 'utf-8');
                Object.keys(options).forEach(key => {
                    if (key != options[key]) {
                        content = func.stringReplaceAll(content, key, options[key]);
                    }
                });
                fs.writeFileSync(targetFile, content)
            }
        });
    }
    releaceFile(src);
}

module.exports = {
    existsSync,
    mkdirsSync,
    createFileSync,
    createFolderSync,
    deleteFolderSync,
    deleteFileSync,
    replaceFilesSync,
    copySync,
}