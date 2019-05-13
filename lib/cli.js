#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const apktool = require('./');
const minimist = require('minimist');
const program = minimist(process.argv.slice(2), []);

if (program._) {
    delete program._;
}

let options = {};

let confPath = path.join(process.cwd(), program.config || './apk-config.json');
if (fs.existsSync(confPath)) {
    Object.assign(options, require(confPath))
}

Object.assign(options, program);

if (program.help) {
    console.log("");
    console.log("");
    console.log("Usage: cli-apk-repack [options]");
    console.log("  --input                    input apk file");
    console.log("  --target                   target apk file");
    console.log("  --appname                  reset apk app name");
    console.log("  --appicon                  reset apk app icon");
    console.log("  --approundicon             reset apk app round icon");
    console.log("  --packagename              reset apk package name");
    console.log("  --permissions              append user-permission list use ',' split");
    console.log("  --meta_xx                  reset meta data");
    console.log("  --string_xx                reset string value");
    console.log("  --package_xx               reset package name");
    console.log("  --file_xx                  replace file");
    console.log("  --sign_type                sign type : jarsigner | signapk");
    console.log("  --jarsigner_store          jarsigner store file");
    console.log("  --jarsigner_store_pass     jarsigner store pass");
    console.log("  --jarsigner_key_alias      jarsigner key alias");
    console.log("  --jarsigner_key_pass       jarsigner key pass");
    console.log("  --signapk_pem              signapk pem file");
    console.log("  --signapk_pk8              signapk pk8 file");
    console.log("  --config                   config file def: ./apk-config.json");
    console.log("  --help                     show help");
    console.log("");
    console.log("");
    return;
}

if (options.appicon) {
    options.appicon = path.join(process.cwd(), options.appicon);
}

if (options.input) {
    options.input = path.join(process.cwd(), options.input);
}

if (options.target) {
    options.target = path.join(process.cwd(), options.target);
}

if (options.signapk_pem) {
    options.signapk_pem = path.join(process.cwd(), options.signapk_pem);
}

if (options.signapk_pk8) {
    options.signapk_pk8 = path.join(process.cwd(), options.signapk_pk8);
}

if (options.signapk_pk8) {
    options.signapk_pk8 = path.join(process.cwd(), options.signapk_pk8);
}

if (options.jarsigner_store) {
    options.jarsigner_store = path.join(process.cwd(), options.jarsigner_store);
}

options.log = true;

apktool.repack(options);