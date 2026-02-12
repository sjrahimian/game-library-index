# Game Library Index

## Introduction

Game Library Index is a basic, bare-bones directory for your digital collection. It synchronizes with your Steam and GOG libraries to identify cross-store duplicates, reveal platform compatibility, and provide a unified index of your basic gaming metadata.

## Getting Started

Download the application from the latest [releases page](https://github.com/sjrahimian/game-library-index/releases/latest).

### GOG

You will need to login into your GOG account (uses the unofficial APIs) to grab your game library. It's not perfect; it works better if you have your username/password on-hand for quick input, otherwise you may have to try once or twice for it to "stick" and grab the data.

### Steam

You will need:

1. Steam Web API Key
2. Your 17-digit SteamID (a.k.a. *SteamID64*)

Register for a [Steam Web API Key here](https://steamcommunity.com/dev/apikey), and the SteamID64 can be found in your profile URL (e.g., `steamcommunity.com/profiles/1234567890#######`). _Nb._ Game Library Index **will not** save the API key or SteamID64; the key and ID will have to be provided each time a sync with the Steam library is attempted.

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

Install Next.js and npm.
After cloning the repository, or downloading via ZIP.

```bash
cd game-library-tracker/
npm install
npm start
```

Finally, in a separate terminal run: `npm run tailwind:watch`.

Build a release.
```bash
npm run package
```

## References

Special thanks to the folks behind [Electron React Boilerplate](https://github.com/electron-react-boilerplate) project.

## License

[GPL-3.0](./LICENSE) © Game Library Index

[MIT](./LICENSE-boilerplate) © Electron React Boilerplate
