const path = require('path')
const fs = require("fs");
const domparser = require('xmldom').DOMParser;
const file = require('./utils/file');
const exec = require('./utils/exec');
const toolDir = path.join(__dirname, '/../lib/tools');

function _unapk(apkFile, tempDir) {
    let start = Date.now();
    return new Promise((resolve, reject) => {
        file.deleteFolderSync(tempDir);
        let apk = path.relative(toolDir, apkFile);
        let temp = path.relative(toolDir, tempDir);
        let yml = path.join(tempDir, 'apktool.yml');
        let cmd = `apktool d [-s] -f ${apk} -o ${temp}`;
        exec.exec(cmd, { cwd: toolDir }, (strerr) => {
            if (file.existsSync(yml)) {
                resolve(`[APKTOOL] unapk ✔ (${Date.now() - start} ms)`);
            } else {
                reject(strerr);
            }
        }, "utf-8");
    });
}

function _iconlist(unpackDir, icon) {
    let iconpaths = `${icon}.png`.replace('@', '').split('/');
    let entrysList = [];
    const recursionFile = (nextPath) => {
        const fileList = fs.readdirSync(nextPath);
        if (!fileList.length) {
            return;
        }
        fileList.forEach(file => {
            let template = path.join(nextPath, `./${file}`);
            let fileStat = fs.statSync(template);
            if (fileStat.isDirectory()) {
                return recursionFile(template);
            }
            let found = iconpaths.filter(p => {
                return template.indexOf(p) >= 0;
            });
            if (found.length == iconpaths.length) {
                entrysList.push(template);
            }
        });
    }
    recursionFile(path.join(unpackDir, 'res'));
    return entrysList;
}

function _manifest(unpackDir, params = {}) {
    let start = Date.now();
    return new Promise((resolve) => {
        let manifest_xml = path.join(unpackDir, "AndroidManifest.xml");
        var content = fs.readFileSync(manifest_xml, 'utf-8');
        var dom = new domparser().parseFromString(content);
        let manifest = dom.documentElement;
        if (params.packagename) {
            manifest.setAttribute('package', params.packagename);
        }
        let permissions = manifest.getElementsByTagName("uses-permission");
        let perms = [];
        for (let index = 0; index < permissions.length; index++) {
            perms.push(permissions[index].getAttribute("android:name"));
        }
        if (params.permissions && params.permissions instanceof Array) {
            params.permissions.forEach(permission => {
                if (perms.indexOf(permission) == -1) {
                    let new_permission = dom.createElement("uses-permission");
                    new_permission.setAttribute("android:name", permission);
                    manifest.appendChild(new_permission);
                }
            });
        }
        let applications = manifest.getElementsByTagName("application")
        if (applications.length > 0) {
            let application = applications[0];
            let appicon = _iconlist(unpackDir, application.getAttribute("android:icon"));
            let approundicon = _iconlist(unpackDir, application.getAttribute("android:roundIcon"));
            if (params.appname) {
                application.setAttribute("android:label", params.appname);
            }
            if (params.appicon) {
                appicon.forEach(icon => {
                    file.copySync(params.appicon, icon);
                });
                approundicon.forEach(icon => {
                    file.copySync(params.approundicon || params.appicon, icon);
                });
            }
            let metadatas = application.getElementsByTagName("meta-data");
            if (metadatas != null && metadatas.length > 0) {
                for (var i = 0; i < metadatas.length; i++) {
                    let name = metadatas[i].getAttribute("android:name");
                    if (params.metadatas && params.metadatas[name]) {
                        application.removeChild(metadatas[i]);
                    }
                }
            }
            if (params.metadatas) {
                Object.keys(params.metadatas).forEach(key => {
                    var meta = dom.createElement("meta-data");
                    meta.setAttribute("android:name", key);
                    meta.setAttribute("android:value", params.metadatas[key]);
                    application.appendChild(meta);
                });
            }
        }
        fs.writeFileSync(manifest_xml, dom.toString());
        resolve(`[APKTOOL] manifest ✔ (${Date.now() - start} ms)`);
    });
}

function _enapk(tempDir, apkFile) {
    let start = Date.now();
    return new Promise((resolve, reject) => {
        file.deleteFileSync(apkFile);
        let apk = path.relative(toolDir, apkFile);
        let temp = path.relative(toolDir, tempDir);
        exec.exec(`apktool b -f ${temp} -o ${apk}`, { cwd: toolDir }, (strerr) => {
            if (file.existsSync(apkFile)) {
                resolve(`[APKTOOL] enapk ✔ (${Date.now() - start} ms)`);
            } else {
                reject(strerr);
            }
        }, "utf-8");
    });
}

function _signapk(apkFile, pemFile, pk8File, signedFile) {
    let start = Date.now();
    return new Promise((resolve, reject) => {
        file.deleteFileSync(signedFile);
        let apk = path.relative(toolDir, apkFile);
        let pem = path.relative(toolDir, pemFile);
        let pk8 = path.relative(toolDir, pk8File);
        let signed = path.relative(toolDir, signedFile);
        exec.exec(`signapk ${pem} ${pk8} ${apk} ${signed}`, { cwd: toolDir }, (strerr) => {
            if (file.existsSync(signedFile)) {
                resolve(`[APKTOOL] signapk ✔ (${Date.now() - start} ms)`);
            } else {
                reject(strerr);
            }
        }, "utf-8");
    });
}

function repack(params) {
    let start = Date.now();
    console.log('');
    console.log(`[APKTOOL] start...`);
    if (!params.input) {
        params.log && console.log("[APKTOOL] error ✘ : invalid parameters [input]");
        return Promise.reject('invalid parameters [input]')
    }
    if (!params.target) {
        params.log && console.log("[APKTOOL] error ✘ : invalid parameters [target]");
        return Promise.reject('invalid parameters [target]')
    }
    if (!params.pem) {
        params.log && console.log("[APKTOOL] error ✘ : invalid parameters [pem]");
        return Promise.reject('invalid parameters [pem]')
    }
    if (!params.pk8) {
        params.log && console.log("[APKTOOL] error ✘ : invalid parameters [pk8]");
        return Promise.reject('invalid parameters [pk8]')
    }
    let inputFile = params.input;
    let targetFile = params.target;
    let pemFile = params.pem;
    let pk8File = params.pk8;
    let tempDir = path.join(toolDir, '../../.temp/' + Date.now().toString(36));
    let unpackDir = path.join(tempDir, "unpack");
    let unsignFile = path.join(tempDir, "unsign.apk");
    return _unapk(inputFile, unpackDir).then((res) => {
        params.log && console.log(res);
        return _manifest(unpackDir, params);
    }).then((res) => {
        params.log && console.log(res);
        return _enapk(unpackDir, unsignFile);
    }).then((res) => {
        params.log && console.log(res);
        return _signapk(unsignFile, pemFile, pk8File, targetFile);
    }).then((res) => {
        params.log && console.log(res);
        params.log && console.log(`[APKTOOL] success ✔ (${Date.now() - start} ms) ${targetFile}`);
        params.log && console.log('');
        file.deleteFolderSync(tempDir);
        return targetFile;
    }).catch(err => {
        params.log && console.log(`[APKTOOL] error ✘ (${Date.now() - start} ms) ${err}`);
        params.log && console.log('');
        file.deleteFolderSync(tempDir);
        throw err;
    });
}

module.exports = exports = {
    repack
}

