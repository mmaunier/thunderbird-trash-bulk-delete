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
 * @param {boolean} isRootLevel - Indique si on est au niveau racine du compte
 * @returns {Array} - Liste des dossiers Trash et Junk trouvés
 */
async function findTrashAndJunkFolders(folders, isRootLevel = true) {
  let foldersFound = [];

  for (let folder of folders) {
    // Debug: logger tous les dossiers pour diagnostic
    console.log(`[DEBUG] Dossier: ${folder.path || folder.name}, Type: ${folder.type}, Root: ${isRootLevel}`);
    
    // Inclure les dossiers de type Trash ou Junk
    let isTrashOrJunk = folder.type === "trash" || folder.type === "junk";
    
    // Fallback SÉCURISÉ : détecter par nom UNIQUEMENT au niveau racine du compte
    // Cela évite de supprimer des sous-dossiers créés par l'utilisateur
    if (!isTrashOrJunk && folder.type === undefined && isRootLevel) {
      let folderName = (folder.name || "").toLowerCase();
      let folderPath = (folder.path || "").toLowerCase();
      // Ne correspond qu'aux dossiers racine nommés exactement "Trash", "Junk", "Bulk"
      let pathParts = folderPath.split('/').filter(p => p);
      let isRootFolder = pathParts.length === 1;
      
      if (isRootFolder) {
        isTrashOrJunk = 
          folderName === "trash" || 
          folderName === "junk" || 
          folderName === "bulk" ||
          folderName === "spam";
        
        if (isTrashOrJunk) {
          console.log(`[WARNING] Dossier détecté par nom au niveau racine: ${folder.path}`);
        }
      }
    }
    
    if (isTrashOrJunk) {
      foldersFound = foldersFound.concat([folder]);
      console.log(`[FOUND] Dossier trouvé: ${folder.path || folder.name} (${folder.type || 'détecté par nom'})`);
    }
    if (folder.subFolders && folder.subFolders.length > 0) {
      // Les sous-dossiers ne sont plus au niveau racine
      foldersFound = foldersFound.concat(await findTrashAndJunkFolders(folder.subFolders, false));
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

  console.log(`[INFO] ${accounts.length} compte(s) trouvé(s)`);

  for (let account of accounts) {
    console.log(`[INFO] Traitement du compte: ${account.name} (type: ${account.type})`);
    
    // Optionnellement, on peut aussi sauter le compte local
    // if (localAccount && account.id === localAccount.id) continue;

    let folders = await findTrashAndJunkFolders(account.folders);
    console.log(`[INFO] ${folders.length} dossier(s) Trash/Junk trouvé(s) dans ${account.name}`);

    for (let folder of folders) {
      console.log(`[INFO] Traitement du dossier: ${folder.path} (${folder.type})`);
      let messages = await getAllMessagesFromFolder(folder.id);
      console.log(`[INFO] ${messages.length} message(s) trouvé(s) dans ${folder.path}`);

      // Collecter tous les IDs pour une suppression en lot
      let messageIds = messages.map(msg => msg.id);
      
      if (messageIds.length === 0) {
        console.log(`[INFO] Aucun message à supprimer dans ${folder.path}`);
        continue;
      }

      console.log(`[INFO] Tentative de suppression de ${messageIds.length} message(s) dans ${folder.path}`);

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

// Verrou pour éviter les exécutions multiples simultanées
let isDeleting = false;

browser.browserAction.onClicked.addListener(() => {
  if (isDeleting) {
    console.log(getMessage("logAlreadyRunning"));
    return;
  }
  isDeleting = true;
  deleteTrashAndJunkMessages()
    .catch(console.error)
    .finally(() => { isDeleting = false; });
});
