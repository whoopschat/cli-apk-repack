const path = require('path')
const fs = require("fs");
const domparser = require('xmldom').DOMParser;
const fst = require('./utils/fst');
const exec = require('./utils/exec');
const func = require('./utils/func');
const toolDir = path.join(__dirname, '/../lib/tools');
const version = require(path.join(__dirname, '/../package.json')).version;

function _unapk(apkFile, tempDir) {
    let start = Date.now();
    return new Promise((resolve, reject) => {
        fst.deleteFolderSync(tempDir);
        let apk = path.relative(toolDir, apkFile);
        let temp = path.relative(toolDir, tempDir);
        let yml = path.join(tempDir, 'apktool.yml');
        let cmd = `apktool d [-s] -f ${apk} -o ${temp}`;
        exec.exec(cmd, { cwd: toolDir }, (strerr) => {
            if (fst.existsSync(yml)) {
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

function _replace(unpackDir, params = {}) {
    let start = Date.now();
    return new Promise((resolve, reject) => {
        try {
            let manifest_xml = path.join(unpackDir, "AndroidManifest.xml");
            var content = fs.readFileSync(manifest_xml, 'utf-8');
            var dom = new domparser().parseFromString(content);
            let manifest = dom.documentElement;
            let packagename = manifest.getAttribute('package');
            let permissions = manifest.getElementsByTagName("uses-permission");
            let perms = [];
            for (let index = 0; index < permissions.length; index++) {
                perms.push(permissions[index].getAttribute("android:name"));
            }
            if (params.permissions && typeof params.permissions === 'string') {
                params.permissions.split(',').forEach(permission => {
                    if (permission && perms.indexOf(permission) == -1) {
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
                        fst.copySync(params.appicon, icon);
                    });
                    approundicon.forEach(icon => {
                        fst.copySync(params.approundicon || params.appicon, icon);
                    });
                }
                let metadatas = application.getElementsByTagName("meta-data");
                if (metadatas != null && metadatas.length > 0) {
                    for (var i = 0; i < metadatas.length; i++) {
                        let name = metadatas[i].getAttribute("android:name");
                        if (params[`meta_${name}`]) {
                            application.removeChild(metadatas[i]);
                        }
                    }
                }
                let metas = func.parserOpts(params, 'meta_', (key, val) => key != val);
                Object.keys(metas).forEach(key => {
                    var meta = dom.createElement("meta-data");
                    meta.setAttribute("android:name", key);
                    meta.setAttribute("android:value", metas[key]);
                    application.appendChild(meta);
                });
            }
            fs.writeFileSync(manifest_xml, dom.toString());
            let opts = {};
            let push_replace_opts = (from, to, isPackage = true) => {
                opts[from] = to;
                if (isPackage) {
                    opts[from.split('.').join('/')] = to.split('.').join('/');
                }
            }
            if (params.packagename) {
                push_replace_opts(packagename, params.packagename);
            }
            let packages = func.parserOpts(params, 'package_', (key, val) => key != val);
            Object.keys(packages).forEach(key => {
                push_replace_opts(key, packages[key]);
            });
            let strings = func.parserOpts(params, 'string_', (key, val) => key != val);
            Object.keys(strings).forEach(key => {
                push_replace_opts(key, strings[key], false);
            });
            fst.replaceFilesSync(unpackDir, (item) => {
                let ext = path.extname(item)
                return ext == '.xml' || ext == '.smali';
            }, opts);
            resolve(`[APKTOOL] replace ✔ (${Date.now() - start} ms)`);
        } catch (error) {
            reject(error);
        }
    });
}

function _enapk(tempDir, apkFile) {
    let start = Date.now();
    return new Promise((resolve, reject) => {
        fst.deleteFileSync(apkFile);
        let apk = path.relative(toolDir, apkFile);
        let temp = path.relative(toolDir, tempDir);
        exec.exec(`apktool b -f ${temp} -o ${apk}`, { cwd: toolDir }, (strerr) => {
            if (fst.existsSync(apkFile)) {
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
        fst.deleteFileSync(signedFile);
        let apk = path.relative(toolDir, apkFile);
        let pem = path.relative(toolDir, pemFile);
        let pk8 = path.relative(toolDir, pk8File);
        let signed = path.relative(toolDir, signedFile);
        exec.exec(`signapk ${pem} ${pk8} ${apk} ${signed}`, { cwd: toolDir }, (strerr) => {
            if (fst.existsSync(signedFile)) {
                resolve(`[APKTOOL] signapk ✔ (${Date.now() - start} ms)`);
            } else {
                reject(strerr);
            }
        }, "utf-8");
    });
}

function _zipalign(unalignFile, signedFile) {
    let start = Date.now();
    return new Promise((resolve, reject) => {
        fst.deleteFileSync(signedFile);
        let unalign = path.relative(toolDir, unalignFile);
        let signed = path.relative(toolDir, signedFile);
        exec.exec(`zipalign -v 4 ${unalign} ${signed}`, { cwd: toolDir }, (strerr) => {
            if (fst.existsSync(signedFile)) {
                resolve(`[APKTOOL] zipalign ✔ (${Date.now() - start} ms)`);
            } else {
                reject(strerr);
            }
        }, "utf-8");
    });
}

function repack(params) {
    let start = Date.now();
    params.log && console.log('');
    params.log && console.log(`[APKTOOL] version:${version}`);
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
    let unalignFile = path.join(tempDir, "unalign.apk");
    params.log && console.log('[APKTOOL] unapk...');
    return _unapk(inputFile, unpackDir).then((res) => {
        params.log && console.log(res);
        params.log && console.log('[APKTOOL] replace...');
        return _replace(unpackDir, params);
    }).then((res) => {
        params.log && console.log(res);
        params.log && console.log('[APKTOOL] enapk...');
        return _enapk(unpackDir, unsignFile);
    }).then((res) => {
        params.log && console.log(res);
        params.log && console.log('[APKTOOL] signapk...');
        return _signapk(unsignFile, pemFile, pk8File, unalignFile);
    }).then(res => {
        params.log && console.log(res);
        params.log && console.log('[APKTOOL] zipalign...');
        return _zipalign(unalignFile, targetFile);
    }).then((res) => {
        params.log && console.log(res);
        params.log && console.log(`[APKTOOL] success ✔ (${Date.now() - start} ms) ${targetFile}`);
        params.log && console.log('');
        fst.deleteFolderSync(tempDir);
        return targetFile;
    }).catch(err => {
        params.log && console.log(`[APKTOOL] error ✘ (${Date.now() - start} ms) ${err}`);
        params.log && console.log('');
        fst.deleteFolderSync(tempDir);
        throw err;
    });
}

module.exports = exports = {
    repack
}

