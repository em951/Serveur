const http = require('http');
const server = http.createServer();
server.listen(8080); // On écoute sur le port 8080
const database = require('./database.js');
const WebSocketServer = require('websocket').server;
const wsServer = new WebSocketServer({
    httpServer: server
});

// Mise en place des événements WebSockets
wsServer.on('request', function(request) {
    const connection = request.accept(null, request.origin);

    connection.on('message', function(message) {
        if (message.type === 'utf8') {
            const data = JSON.parse(message.utf8Data);

            switch (data.type) {
                case 'connexion_serveur':
                     handleConnexionServer(connection);
                    break;

                case 'authentication':
                    handleAuthentication(connection, data);
                    break;

                case 'join_game':
                    handleJoinGame(connection, data);
                    break;

                case 'player_move':
                    handlePlayerMove(connection, data);
                    break;

                case 'game_state':
                    handleGameState(connection, data);
                    break;

                case 'get_scores':
                    handleGetScores(connection, data);
                    break;

                default:
                    console.log('Message non géré :', data);
            }
        }
    });
    connection.on('close', function(reasonCode, description) {
        console.log('WebSocket Connection Closed:', reasonCode, description);
    
        if (isPlayerInGame(connection)) {

            endGame(connection);
        }
    
        informOtherPlayers(connection);
    });
    
});

// Fonctions spécifiques

function isPlayerInGame(connection) {
       //TO DO

    return false; 
}

function endGame(connection) {
    //TO DO
}

function informOtherPlayers(connection) {
    //TO DO
    // Envoi d'un message aux autres joueurs pour les informer de la déconnexion
}



function handleConnexionServer(connection) {
    console.log('Client connected to server:', connection.remoteAddress);

    const response = {
        type: 'connexion_serveur_response',
        content: 'Bien connecté au serveur!'
    };
    connection.sendUTF(JSON.stringify(response));
}


// Fonction pour gérer l'authentification d'un joueur
async function handleAuthentication(connection, data) {
    try {
        // Vérifier les informations d'authentification dans la base de données
        const player = await database.authenticatePlayer(data.username, data.password);

        // Si le joueur n'existe pas, l'enregistrer
        if (!player) {
            await database.registerPlayer(data.username, data.password);
        }

        // Afficher la liste des joueurs après l'authentification
        const listplayers = await database.displayPlayerList();
        console.log('Liste des joueurs :', listplayers);

        // Authentification réussie, envoyer une réponse positive
        const response = {
            type: 'authentication_response',
            isValid: true,
            content: 'Vous êtes bien identifié.',
        };

        // Envoyer la réponse au client
        connection.sendUTF(JSON.stringify(response));

        console.log('Informations d\'authentification reçues:', data);
    } catch (error) {
        console.error('Erreur lors de l\'authentification du joueur :', error);
        // Gérer l'erreur et renvoyer une réponse d'authentification invalide si nécessaire
        const response = {
            type: 'authentication_response',
            isValid: false,
            content: 'Erreur lors de l\'authentification du joueur',
        };
        connection.sendUTF(JSON.stringify(response));
    }
}


// Variable pour suivre le nombre de joueurs connectés
let connectedPlayers = [];

async function handleJoinGame(connection, data) {
    try {
        if (connectedPlayers.length < 2) {
            connectedPlayers.push({
                connection: connection,
                color: connectedPlayers.length === 0 ? 'white' : 'black',
                playerName: data.username
            });

            // Après l'ajout d'un joueur à connectedPlayers
            console.log('Joueur ajouté :', connectedPlayers);

            if (connectedPlayers.length === 2) {
                console.log('Noms des joueurs :', connectedPlayers.map(player => player.playerName));

                const gameId = await database.createGame(connectedPlayers[0], connectedPlayers[1]);

                const joinGameResponse = {
                    type: 'join_game_response',
                    success: true,
                    content: 'Vous avez rejoint une partie.',
                    playerColor: connectedPlayers[connectedPlayers.length - 1].color,
                    gameId: gameId
                };

                // Envoyer un message à tous les joueurs connectés
                connectedPlayers.forEach(player => {
                    player.connection.send(JSON.stringify(joinGameResponse));
                });

                const startGameMessage = {
                    type: 'start_game',
                    content: 'La partie a commencé !',
                    players: connectedPlayers.map(player => ({
                        color: player.color,
                        playerName: player.playerName
                    })),
                    gameId: gameId
                };

                // Après le début de la partie
                console.log('La partie a commencé. Joueurs :');
                connectedPlayers.forEach(player => {
                    console.log(`Joueur ${player.color}: ${player.playerName}`);
                });

                connectedPlayers.forEach(player => {
                    player.connection.send(JSON.stringify(startGameMessage));
                });

                // Réinitialiser la liste des joueurs connectés pour la prochaine partie
                connectedPlayers = [];
            } else {
                const joinGameResponse = {
                    type: 'join_game_response',
                    success: false,
                    content: 'En attente d\'un autre joueur...'
                };
                connection.send(JSON.stringify(joinGameResponse));
            }
        } else {
            const joinGameResponse = {
                type: 'join_game_response',
                success: false,
                content: 'La partie est pleine. Veuillez patienter.'
            };
            connection.send(JSON.stringify(joinGameResponse));
        }
    } catch (error) {
        console.error('Erreur lors de la gestion de la partie :', error);
        const joinGameResponse = {
            type: 'join_game_response',
            success: false,
            content: 'Erreur lors de la gestion de la partie'
        };
        connection.send(JSON.stringify(joinGameResponse));
    }

}


function handleGameState(connection, data) {
    //TO DO
    // Logique pour gérer l'état du jeu
    
}


function handlePlayerMove(connection, data) {
     //TO DO
    // Logique pour gérer les mouvements des joueurs
}



function handleGetScores(connection, data) {
    //TO DO
    // Logique pour récupérer les scores
}


