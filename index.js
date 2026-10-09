import { Gladys, logger } from '@gladysassistant/integration-sdk';

const gladys = new Gladys();


// Variables qui contiendront la configuration de l'utilisateur
let memosUrl = '';
let memosToken = '';

// 1. Écouter les mises à jour de configuration dans l'interface de Gladys
gladys.onConfigUpdated(async (config) => {
  memosUrl = config.MEMOS_URL || 'http://localhost:5230';
  memosToken = config.MEMOS_TOKEN;
  logger.info(`Configuration Memos mise à jour. URL : ${memosUrl}`);
});

// 2. Gérer l'envoi de messages de Gladys vers Memos
// (Par exemple lors du déclenchement d'une scène de notification Gladys)
gladys.onMessageSend(async (message) => {
  if (!memosToken) {
    logger.warn("Impossible d'envoyer la note : Token Memos manquant.");
    return;
  }

  try {
    const response = await fetch(`${memosUrl}/api/v1/memo`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${memosToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: `📝 **Gladys Plus Notification :**\n${message.text}`,
        visibility: 'PRIVATE'
      })
    });

    if (response.ok) {
      logger.info("Note enregistrée avec succès dans Memos.");
      await gladys.setDeliveryStatus(message.id, 'delivered');
    } else {
      logger.error(`Erreur Memos API : ${response.statusText}`);
      await gladys.setDeliveryStatus(message.id, 'failed');
    }
  } catch (error) {
    logger.error("Erreur de connexion à l'API Memos", error);
  }
});

// Démarrer l'écoute avec le SDK
gladys.start();

