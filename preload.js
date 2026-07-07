const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  /*Envío manual*/
  sendEmail: () => ipcRenderer.invoke('send-email'),
  /*Guardar correo programado*/
  saveEmail: (data) => ipcRenderer.invoke('save-email', data)
});