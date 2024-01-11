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

                case 'leave_wait':
                    handleLeaveWaitGame(connection, data);
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

                case 'end_game':
                    handleEndGame(connection, data);
                    break;

                case 'closing_page':
                    handleClosingPage(connection, data);
                    break;

                case 'get_histo':
                    handleGetHisto(connection, data);
                    break;
                
                case 'get_high_players':
                    handleGetHighPlayers(connection, data);
                    break;

                default:
                    console.log('Message non géré :', data);
            }
        }
    });
    connection.on('close', function(reasonCode, description) {
        console.log('WebSocket Connection Closed:', reasonCode, description);
        
        /*if (isPlayerInGame(connection)) {

            endGame(connection);
        }
        
        informOtherPlayers(connection);*/
    });
    
});

// Fonctions spécifiques

async function handleGetHighPlayers(connection, data){
    
    const playerList = await (database.getPlayersByScore());
    console.log('Liste des joueurs :', playerList);
    const response = {
        type: 'get_high_players_reponse',
        isValid: true,
        content: 'Voici les plus hauts scores du serveur',
        username : data.username,
        lparties : JSON.stringify(playerList)
    };

    // Envoyer la réponse au client
    connection.sendUTF(JSON.stringify(response));
}

async function handleGetHisto(connection, data){
    let p = database.getPlayerByUsername(data.username);
    
    //const playerList = await database.displayHistoParties(data.username);
    const playerList = await (database.displayHistoParties(data.username));
    console.log('Liste des parties :', playerList);
    const response = {
        type: 'histo_reponse',
        isValid: true,
        content: 'Voici la liste des parties de l utilisateur.' + data.username,
        username : data.username,
        lparties : JSON.stringify(playerList)
    };

    // Envoyer la réponse au client
    connection.sendUTF(JSON.stringify(response));
}

function handleClosingPage(connection, data) {
    console.log("testest");
    let p = cplayers.find((element) => element.playerName == data.username);
    console.log(p);
    let index = cplayers.findIndex((element) => element.playerName == data.username);
    console.log(index);
    if (index !== -1) {
        p = cplayers.splice(index, 1);
        console.log(p.playerName, " supprimé");
        console.log("connexion supprimée, il reste " , cplayers);
    }

}

function isPlayerInGame(connection) {
       //TO DO

    return false; 
}

function handleEndGame(connection, data) {
    const game = database.endGame(data.idpartie, data.idwinner, data.idloser);
    console.log('idwinner : ', data.idwinner);
    console.log('idloser : ', data.idloser);
    //console.log(cplayers);
    if (game.id_joueur_1 == data.idwinner){
        
        let player1 = cplayers.find((element) => element.playerName == data.idwinner);

        const win = database.getPlayerByUsername(data.idwinner);
        let endGameResponse = {
            type: 'end_game_response',
            success: true,
            content: 'Vous avez gagné la partie!',
            idwinner : data.idwinner,
            end : 'won',
            gameId: data.idpartie
        };
        player1.connection.send(JSON.stringify(endGameResponse));

        let player2 = cplayers.find((element) => element.playerName == data.idloser);
        endGameResponse = {
        type: 'end_game_response',
        success: true,
        content: 'Vous avez perdu la partie...',
        idwinner : data.idwinner,
        end : 'loss',
        gameId: data.idpartie
        };
    
        player2.connection.send(JSON.stringify(endGameResponse));
    } else {
        let player1 = cplayers.find((element) => element.playerName == data.idloser);
        let endGameResponse = {
            type: 'end_game_response',
            success: true,
            content: 'Vous avez perdu la partie...',
            idwinner : data.idwinner,
            end : 'loss',
            gameId: data.idpartie
        };
    
        player1.connection.send(JSON.stringify(endGameResponse));

        let player2 = cplayers.find((element) => element.playerName == data.idwinner);
        endGameResponse = {
            type: 'end_game_response',
            success: true,
            content: 'Vous avez gagné la partie!',
            idwinner : data.idwinner,
            end : 'won',
            gameId: data.idpartie
        };
        player2.connection.send(JSON.stringify(endGameResponse));
    }
    
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


// Variable pour suivre le nombre de joueurs connectés
let cplayers = [];

// Fonction pour gérer l'authentification d'un joueur
async function handleAuthentication(connection, data) {
    try {
        // Vérifier les informations d'authentification dans la base de données
        const player = await database.authenticatePlayer(data.username, data.password);

        // Si le joueur n'existe pas, l'enregistrer
        if (!player) {
            await database.registerPlayer(data.username, data.password);
        }

        //rajouter test si joueur déjà connecté
        let activePlayer = cplayers.find((element) => element.playerName == data.username);
        console.log(activePlayer);
        if (activePlayer != undefined ){
            const response = {
                type: 'authentication_response',
                isValid: false,
                content: 'identification refusée, joueur déjà connecté.',
                username : data.username
            };
            connection.sendUTF(JSON.stringify(response));
        } else {
            // Afficher la liste des joueurs après l'authentification
            const listplayers = await database.displayPlayerList();
            console.log('Liste des joueurs :', listplayers);

            // Authentification réussie, envoyer une réponse positive
            const response = {
                type: 'authentication_response',
                isValid: true,
                content: 'Vous êtes bien identifié.',
                username : data.username
            };

            cplayers.push({
                connection: connection,
                playerName: data.username, 
                playerId : player._id//,
                //playerStatus : 'idle'
            });
            console.log('joueurs en ligne : ', cplayers);

            // Envoyer la réponse au client
            connection.sendUTF(JSON.stringify(response));

            console.log('Informations d\'authentification reçues:', data);
        }

        
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


// Variable pour suivre le nombre de joueurs en file d'attente
let connectedPlayers = [];

async function handleJoinGame(connection, data) {
    try {
        if (connectedPlayers.length < 2) {
            const playerColor = connectedPlayers.length === 0 ? 'white' : 'black';

            connectedPlayers.push({
                connection: connection,
                color: playerColor,
                playerName: data.username
            });

            console.log('Joueur ajouté :', connectedPlayers);
            let activePlayer = cplayers.find((element) => element.playerName == data.username);
            console.log(activePlayer);
            activePlayer.playerStatus = 'waiting';

            if (connectedPlayers.length === 2) {
                console.log('Noms des joueurs :', connectedPlayers.map(player => player.playerName));

                const gameId = await database.createGame(connectedPlayers[0], connectedPlayers[1]);

                const joinGameResponse = {
                    type: 'join_game_response',
                    success: true,
                    content: 'Vous avez rejoint une partie.',
                    playerColor: playerColor,
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

async function handleLeaveWaitGame(connection, data) {
    let leaveWaitResponse;
    if (connectedPlayers.length > 0){
        if (connectedPlayers[0].playerName == data.username){
            let p = connectedPlayers.shift();
            leaveWaitResponse = {
                type: 'leave_wait_response',
                success: true,
                content: 'Joueur ' + p.playerName + ' supprimé de file attente'
            };
            console.log('Joueur supprimé :', p.playerName);
        } else {
            leaveWaitResponse = {
                type: 'leave_wait_response',
                success: false,
                content: 'Joueur non supprimé de file attente'
            };
        }
    } else {
        leaveWaitResponse = {
            type: 'leave_wait_response',
            success: false,
            content: 'Joueur non supprimé de file attente'
        };
    }
    connection.send(JSON.stringify(leaveWaitResponse));
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


