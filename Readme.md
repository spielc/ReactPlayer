# ReactPlayer

ReactPlayer is a music-player-application and a playground for me to play around and work with new technologies in the emerging web-/HTML5-world. So there is **absolutely** no guarantee, that the application will work at any point in time. As i am using the app quite heavily myself, you can assume that the code in this repository will be in quite a good shape though!

## Features

 * Desktop-centric music-player (currently only MP3 and Linux is really tested)
 * All your music is collected in a library
 * Support for multiple playlists
 * Filterable playlists and library
 * last.fm-Scrobbling
 * Adding files to the library is done using drag-and-drop

## Technologies

The most important technologies that are used in this project are:

 * [TypeScript](https://www.typescriptlang.org/)
 * [React](https://facebook.github.io/react/)
 * [Electron](http://electron.atom.io/)
 * [MobX](https://mobx.js.org)
 * [PouchDB](https://pouchdb.com)
 * [wavesurfer.js](https://wavesurfer-js.org)

## Installation

 If you want to use this application you currently have to build it yourself (maybe i'll add the possibility to generate OS-specific installable packages sometime in the future). Here are the necessary steps:

 1. Install [NodeJS](https://nodejs.org/en/)
 1. Clone (or download) this git-repostory
 1. Open a commandline and execute the command ```npm install```
 1. Now execute ```npm run build``` to compile/transpile the sourcecode
 1. Start the application by executing ```npm run start```

## Contributing

 As in every open-source projects user-contributions are more than welcome but i do have some restrictions what might make it into the application though:

 1. source-contributions have to written in TypeScript. My time is limited and i don't have the time nor am i willing to go down the untyped JavaScript-hole
 1. Don't assume that i will always use the bleeding-edge version of TypeScript though. So it's best to look into the package.json file and see what version is recorded there and only use features of the language present in this version!
 1. Be careful with the introduction of new dependencies! I only want **absolutely** needed stuff in my projects.
 1. I am a ***strict*** opponent of duplicated code!!!!!!!!! I will **ONLY** allow contributions which contain code duplicates if there exists a ***really good reason*** for the duplication!