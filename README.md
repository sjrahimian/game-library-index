# Game Library Index

## Introduction

Game Library Index is a basic, bare-bones directory for your digital collection. It synchronizes with your Steam and GOG libraries to identify cross-store duplicates, reveal platform compatibility, and provide a unified index of your basic gaming metadata.

## Getting Started

### GOG

You will need to login into your GOG account (uses the unofficial APIs) to grab your game library.

### Steam

You will need to register for a [Steam Web API Key](https://steamcommunity.com/dev/apikey), after which you can pull your games library.

_Nb._ Game Library Index **will not** save your API key; the key will have to be provided each time a sync with the Steam library is attempted.

## Setup

### For Windows

Using the the installer or portable just follow the instructions. You may get a warning ("*Windows protected your PC*" or something). Click "More info" > "Run anyway". This appears because the app hasn't built up "reputation" with Microsoft's servers, yet. It is perfectly safe, I think...at least my code is safe.

### For Linux

Linux requires you to explicitly grant "execute" permissions to the file before it will open.

#### GUI

Right-click the .AppImage file > Select Properties > Permissions tab:

1. Check the box that says "Allow executing file as program".
2. Close the window and double-click the file to launch.

#### Via Terminal

Open terminal and run:

```bash
chmod +x game-library-index_linux_v*_portable.AppImage
./game-library-index_linux_portable_0.4.6_x64.AppImage
```

## Development Setup

After cloning the repository, or downloading via ZIP.

```bash
cd game-library-tracker/
npm install
npm start
```

Build a release.
```bash
npm run package
```

## References

Special thanks to the folks behind [Electron React Boilerplate](https://github.com/electron-react-boilerplate) project.

## License

[GPL-3.0](./LICENSE) © Game Library Index

[MIT](./LICENSE-boilerplate) © Electron React Boilerplate
