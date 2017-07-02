import {app, BrowserWindow, ipcMain} from "electron";
import { WindowManagementMessage_Define, WindowManagementMessage_Show, WindowManagementMessage_RegisterHandler, WindowManagementMessage_LifeCycleEvent, WindowRegisterHandlerType, WindowManagementMessage_UnregisterHandler } from "./base/typedefs";

const MainWindow = "MainWindow";

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
//let win: Electron.BrowserWindow;
let windows = new Map<string, Electron.BrowserWindow>();
// map IPC-Object=>WindowID=>EventID
let lifeCycleEventHandlers = new Map<Electron.WebContents, Map<string, string>>();

function createWindow () {
    // Create the browser window.
    let win = new BrowserWindow({width: 800, height: 600});
    win.maximize();

    // and load the index.html of the app.
    win.loadURL(`file://${__dirname}/index.html`);

    // Open the DevTools.
    // win.webContents.openDevTools();

    // Emitted when the window is closed.
    win.on("closed", () => {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        win = null;
    });
    windows.set(MainWindow, win);
}

// // TODO add ipc-messagehandler for the window-register- and window-show-events
// ipcMain.on("synchronous-message", (event, data) => {
//     console.log(data);
//     event.returnValue = data;
// });

// ipcMain.on(WindowManagementMessage_Define, (event, data) => {
//     let winDef = data as WindowDefinitionType;
//     let retValue = false;
//     if (winDef) {
//         console.log(winDef.URL);
//         winDef.Options.parent = windows.get(MainWindow);
//         let window = new BrowserWindow(winDef.Options);
//         window.loadURL(winDef.URL);
//         // window.on("close", (event) => {
//         //     event.preventDefault();
//         // })
//         window.on("closed", () => {
//             window.removeAllListeners();
//             window = null;
//             console.log(`Window '${winDef.WindowId}' closed!`);
//         });
//         windows.set(winDef.WindowId, window);
//         retValue = true;
//     }
//     event.returnValue = retValue;
// });

// ipcMain.on(WindowManagementMessage_Show, (event, data) => {
//     let windowName = data as string;
//     let retValue = false;
//     if (windowName && windows.has(windowName)) {
//         windows.get(windowName).show();
//         retValue = true;
//     }
//     event.returnValue = retValue;
// });

// ipcMain.on(WindowManagementMessage_RegisterHandler, (event, data) => {
//     let blub = data as WindowRegisterHandlerType;
//     let windowName = blub.WindowId;
//     if (windowName && windows.has(windowName)) {
//         windows.get(windowName).on(blub.EventId, () => {
//             //console.log(`sending "${event.sender}.send(WindowManagementMessage_LifeCycleEvent, [${windowName}, ${blub.EventId}])"`);
//             event.sender.send(WindowManagementMessage_LifeCycleEvent, [windowName, blub.EventId]);
//         });
//     }
//     event.returnValue = true;
// });

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createWindow);

// Quit when all windows are closed.
app.on("window-all-closed", () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== "darwin") {
        app.quit()
    }
});

app.on("activate", () => {
    let win = windows.get(MainWindow);
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
        createWindow()
    }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.