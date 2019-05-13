# cli-apk-repack
> apk repack cli

### install
```
> npm install cli-apk-repack --save-dev
```

### usage
```
> cli-apk-repack --help
  Usage: cli-apk-repack [options]
    --input                    input apk file
    --target                   target apk file
    --appname                  reset apk app name
    --appicon                  reset apk app icon
    --approundicon             reset apk app round icon
    --packagename              reset apk package name
    --permissions              append user-permission list use ',' split
    --meta_xx                  reset meta data
    --string_xx                reset string value
    --package_xx               reset package name
    --file_xx                  replace file
    --sign_type                sign type : jarsigner | signapk
    --jarsigner_store          jarsigner store file
    --jarsigner_store_pass     jarsigner store pass
    --jarsigner_key_alias      jarsigner key alias
    --jarsigner_key_pass       jarsigner key pass
    --signapk_pem              signapk pem file
    --signapk_pk8              signapk pk8 file
    --config                   config file def: ./apk-config.json
    --help                     show help
```

`apk-config.json`

```json
{
  "appname": "reset apk app name",
  "appicon": "reset apk app icon",
  "packagename": "reset apk package name",
  "pem": "signapk pem file",
  "pk8": "signapk pk8 file"
}
```