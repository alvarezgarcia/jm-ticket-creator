# JM Tickets Creator
El proceso está escrito en Typescript y es completamente configurable sin ninguna transpilación posterior
con tan solo editar el archivo `.env` o estableciendo variables globales.

# Dependencias
- NodeJS >= 12

## Instalación de dependencias propias del proceso

```
$ npm i
```

## Configuración

```
$ cp .env.example .env
```

El nuevo archivo `.env` es un placeholder para rellenar con los datos pertinentes.

## Ejecución

### Transpilación
```
$ npm run build
```

El output del comando anterior convertirá el código tipado en convencional de Javascript y lo ubicará
en la carpeta `build/dist/app.js`.

### Invocación
```
$ npm run start
```