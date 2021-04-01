# xApp: Account Merge

This XUMM (xumm.app) xApp allows users to perform an `AccountDelete` transaction.
All funds on the deleted account will be sent to the AccountDelete destination account,
which must be a verified (Read/Write, imported/generated with secret key / Tangem card) 
account imported into XUMM.

# Development

This xApp is being actively developed by XRPL Labs. This project is coded in Vue.

This project relies on https://github.com/XRPL-Labs/xapp-proxy-for-xumm-api, if you
want to run this source locally you will need to run an instance of the xApp proxy locally as well.

## Project setup

```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles and minifies for production
```
npm run build
```
