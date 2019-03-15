# cli-apktool
> apktool cli

### install
```
> npm install cli-apktool --save-dev
```

### usage
```
> cli-apktool
  Usage: cli-apktool [options]
  --input              input apk file
  --target             target apk file
  --appname            new apk app name
  --appicon            new apk app icon
  --packagename        new apk package name
  --pem                signapk pem file
  --pk8                signapk pk8 file
  --config             config file def: ./apktool-config.json
  --help               show help
```

`apktool-config.json`

```json
{
  "appname": "new app name",
  "packagename": "new app packagename",
  "metadatas": {
    "key1":"value1",
    "key2":"value2"
  },
  "appicon": "new app icon",
  "pem": "apk signapk pem file",
  "pk8": "apk signapk pk8 file"
}
```