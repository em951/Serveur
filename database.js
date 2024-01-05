const { MongoClient } = require('mongodb');

// URL de connexion
const url = 'mongodb://127.0.0.1:27017';

// Nom de la base de données
const dbName = 'BDD_Dames';

// Fonction pour gérer l'authentification d'un joueur
async function authenticatePlayer(username, password) {
  const client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });

  try {
    await client.connect();
    console.log('Connecté à MongoDB');

    const db = client.db(dbName);

    // Vérifier l'existence du joueur dans la collection "players"
    const playersCollection = db.collection('Joueur');
    const player = await playersCollection.findOne({ pseudo: username, motDePasse: password });

    return player; // Renvoie le joueur trouvé ou null s'il n'existe pas
  } catch (err) {
    console.error('Erreur lors de l\'authentification du joueur :', err);
    throw err;
  } finally {
    await client.close();
  }
}

// Fonction pour enregistrer un nouveau joueur
async function registerPlayer(username, password) {
  const client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });

  try {
    await client.connect();
    console.log('Connecté à MongoDB');

    const db = client.db(dbName);

    // Vérifier si le joueur existe déjà
    const playersCollection = db.collection('Joueur');
    const existingPlayer = await playersCollection.findOne({ pseudo: username });

    if (existingPlayer) {
      throw new Error('Ce pseudo est déjà utilisé. Veuillez en choisir un autre.');
    }

    // Ajouter le nouveau joueur à la collection "players"
    const result = await playersCollection.insertOne({ pseudo: username, motDePasse: password });

    console.log('Joueur enregistré, ID :', result.insertedId);
  } catch (err) {
    console.error('Erreur lors de l\'enregistrement du joueur :', err);
    throw err;
  } finally {
    await client.close();
  }
}

// Fonction pour afficher la liste des joueurs
async function displayPlayerList() {
    const client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });

    try {
        await client.connect();
        console.log('Connecté à MongoDB');

        const db = client.db(dbName);

        const playersCollection = db.collection('Joueur');
        const playerList = await playersCollection.find().toArray();

        return playerList; // Retourner la liste des joueurs
    } catch (err) {
        console.error('Erreur lors de l\'affichage de la liste des joueurs :', err);
        throw err;
    } finally {
        await client.close();
    }
}


// Fonction pour supprimer un joueur
async function deletePlayer(username) {
    const client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });

    try {
        await client.connect();
        console.log('Connecté à MongoDB');

        const db = client.db(dbName);

        const playersCollection = db.collection('Joueur');
        const result = await playersCollection.deleteOne({ pseudo: username });

        console.log(`Joueur "${username}" supprimé. Nombre de documents supprimés : ${result.deletedCount}`);
    } catch (err) {
        console.error('Erreur lors de la suppression du joueur :', err);
        throw err;
    } finally {
        await client.close();
    }
}


/**
 * Crée une nouvelle partie dans la base de données.
 * @param {Object} player1 - Le joueur 1.
 * @param {Object} player2 - Le joueur 2.
 * @returns {ObjectId} - L'identifiant de la partie créée.
 */
async function createGame(player1, player2) {
  const client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });

  try {
      await client.connect();
      console.log('Connecté à MongoDB');

      const db = client.db(dbName);

      // Utilisez la collection 'Partie' pour stocker les informations sur la partie
      const gamesCollection = db.collection('Partie');

      // Insérez une nouvelle partie avec des informations initiales
      const result = await gamesCollection.insertOne({
          id_joueur_1: player1.connection.remoteAddress, // Utilisez une propriété appropriée pour identifier le joueur 1
          id_joueur_2: player2.connection.remoteAddress, // Utilisez une propriété appropriée pour identifier le joueur 2
          heureDebut: new Date(),
          heureFin: null, // Initialisé à null car la partie n'est pas encore terminée
          date: new Date(),
          vainqueur: null // Initialisé à null car la partie n'a pas encore de vainqueur
      });

      console.log('Partie créée, ID :', result.insertedId);

      return result.insertedId; // Retourne l'identifiant de la partie créée
  } catch (err) {
      console.error('Erreur lors de la création de la partie :', err);
      throw err;
  } finally {
      await client.close();
  }
}

module.exports = {
  authenticatePlayer,
  registerPlayer,
  displayPlayerList,
  deletePlayer,
  createGame, 
};
