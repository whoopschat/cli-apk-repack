# cli-apk-repack
> apk repack cli

### install
```
> npm install cli-apk-repack --save-dev
```

### usage
```
> cli-apk-repack
  Usage: cli-apk-repack [options]
  --input              input apk file
  --target             target apk file
  --appname            new apk app name
  --appicon            new apk app icon
  --packagename        new apk package name
  --pem                signapk pem file
  --pk8                signapk pk8 file
  --config             config file def: ./apk-config.json
  --help               show help
```

`apk-config.json`

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