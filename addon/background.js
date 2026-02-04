// i18n Helper
function formatMessage(template, values) {
  return template.replace(/\{(\w+)\}/g, (match, key) => values[key] || match);
}

function getMessage(name, substitutions) {
  return browser.i18n.getMessage(name, substitutions);
}

/**
 * Recherche récursivement tous les dossiers de type Trash ou Junk
 * @param {Array} folders - Liste des dossiers à parcourir
 * @returns {Array} - Liste des dossiers Trash et Junk trouvés
 */
async function findTrashAndJunkFolders(folders) {
  let foldersFound = [];

  for (let folder of folders) {
    // Inclure les dossiers de type Trash ou Junk
    if (folder.type === "trash" || folder.type === "junk") {
      foldersFound = foldersFound.concat([folder]);
    }
    if (folder.subFolders && folder.subFolders.length > 0) {
      foldersFound = foldersFound.concat(await findTrashAndJunkFolders(folder.subFolders));
    }
  }

  return foldersFound;
}

/**
 * Récupère tous les messages d'un dossier (gère la pagination)
 * @param {string} folderId - ID du dossier
 * @returns {Array} - Liste de tous les messages
 */
async function getAllMessagesFromFolder(folderId) {
  let allMessages = [];
  let messageList = await browser.messages.list(folderId);
  
  allMessages = allMessages.concat(messageList.messages);
  
  // Gérer la pagination si nécessaire
  while (messageList.id) {
    messageList = await browser.messages.continueList(messageList.id);
    allMessages = allMessages.concat(messageList.messages);
  }
  
  return allMessages;
}

/**
 * Supprime tous les messages des dossiers Trash et Junk de tous les comptes (sauf local)
 * 
 * Utilise l'API messages.delete() avec l'option isUserAction: true
 * pour permettre l'annulation (Ctrl+Z) par l'utilisateur.
 * 
 * Par défaut, les messages sont envoyés à la corbeille du compte
 * (selon les paramètres du compte). Pour une suppression permanente,
 * les messages sont déjà dans Trash/Junk, donc ils seront supprimés définitivement.
 */
async function deleteTrashAndJunkMessages() {
  console.log(getMessage("logStart"));

  let accounts = await browser.accounts.list();
  let deletedCount = 0;

  // Identifier le compte local (type "none" ou nom contenant "local")
  let localAccount = accounts.find(acc => 
    acc.type === "none" || 
    acc.name.toLowerCase().includes("local") ||
    acc.name.toLowerCase().includes("lokal")
  );

  for (let account of accounts) {
    // Optionnellement, on peut aussi sauter le compte local
    // if (localAccount && account.id === localAccount.id) continue;

    let folders = await findTrashAndJunkFolders(account.folders);

    for (let folder of folders) {
      let messages = await getAllMessagesFromFolder(folder.id);

      // Collecter tous les IDs pour une suppression en lot
      let messageIds = messages.map(msg => msg.id);
      
      if (messageIds.length === 0) continue;

      try {
        // Suppression avec isUserAction pour permettre l'annulation (undo)
        // Note: Pour les messages déjà dans Trash/Junk, la suppression
        // sera généralement permanente selon les paramètres du serveur
        await browser.messages.delete(messageIds, {
          isUserAction: true
        });
        
        for (let msg of messages) {
          let template = getMessage("logDeleted");
          console.log(formatMessage(template, { subject: msg.subject }));
        }
        
        deletedCount += messageIds.length;
      } catch (e) {
        // En cas d'erreur, essayer de supprimer message par message
        for (let msg of messages) {
          try {
            await browser.messages.delete([msg.id], {
              isUserAction: true
            });
            let template = getMessage("logDeleted");
            console.log(formatMessage(template, { subject: msg.subject }));
            deletedCount++;
          } catch (err) {
            let template = getMessage("logError");
            console.error(formatMessage(template, { id: msg.id, error: err.message }));
          }
        }
      }
    }
  }

  let template = getMessage("logComplete");
  console.log(formatMessage(template, { count: deletedCount }));
}

browser.browserAction.onClicked.addListener(() => {
  deleteTrashAndJunkMessages().catch(console.error);
});
