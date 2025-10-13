        // CONFIGURAÇÃO FIREBASE EMBUTIDA
        const firebaseConfig = {
            apiKey: "AIzaSyDXVYDMwvnUoCUMTlvh8egzqS06_o497y8",
            authDomain: "mtg-tracker-ea7a2.firebaseapp.com",
            databaseURL: "https://mtg-tracker-ea7a2-default-rtdb.firebaseio.com",
            projectId: "mtg-tracker-ea7a2",
            storageBucket: "mtg-tracker-ea7a2.firebasestorage.app",
            messagingSenderId: "365839696243",
            appId: "1:365839696243:web:72d8c6b1d4acafbc7c506",
            measurementId: "G-029H8PTYRH"
        };

        // VARIÁVEIS MULTI-USUÁRIO
        const USERS = ['Chico', 'Capi', 'Maciel', 'Avelã', 'Gominho'];
        const NOVO_USUARIO_OPCAO = 'NOVO_USUARIO';
        
        const NOVO_DECK_OPCAO = 'NOVO_DECK';
        const NOVA_MATCHUP_OPCAO = 'NOVA_MATCHUP';
        
        // Lista completa e padronizada de formatos 
        const ALL_FORMATS = [
            'Standard', 'Pioneer', 'Modern', 'Legacy', 'Vintage', 
            'Commander', 'Pauper', 'Explorer', 'Alchemy', 'Brawl',
            'Draft', 'Sealed', 'Outros'
        ].sort(); 

        // --- METAGAMES POR FORMATO --- 
        const METAGAME_DECKS_BY_FORMAT = {
            'Modern': [
                'Esper Goryo\'s', 'Tameshi Belcher', 'Boros Energy', 'Eldrazi Tron',
                'Izzet Affinity', 'Esper Blink', 'Simic Neoform', 'Domain Zoo',
                'Azorius Control', 'Mono-Green Tron', 'Murktide Regent', 'Rhinos',
                'Living End', 'Yawgmoth', 'Amulet Titan', 'Outro'
            ],
            'Pioneer': [
                'Rakdos Midrange', 'Izzet Phoenix', 'Azorius Control', 'Lotus Field Combo',
                'Gruul Prowess', 'Boros Convoke', 'Abzan Greasefang', 'Mono Black Midrange',
                'Selesnya Angels', 'Niv to Light', 'Outro'
            ],
            'Legacy': [
                'Izzet Delver', 'Dimir Reanimator', 'Eldrazi', 'Red Stompy',
                'Dimir Tempo', 'Azorius Control', 'Jeskai Control',
                '4c Initiative', 'The EPIC Storm', 'Outro'
            ],
            'Standard': [
                'Izzet Cauldron', 'Dimir Midrange', 'Mono Red Aggro', 'Boros Burn',
                'Azorius Control', 'Mono Black', 'Gruul Landfall', 'Jeskai Artifacts',
                'Esper Control', 'Outro'
            ],
            'Pauper': [
                'Mono-Blue Terror', 'Madness Burn', 'Grixis Affinity',
                'Mono-Black Sacrifice', 'Golgari Gardens', 'Jeskai Ephemerate',
                'Spy Combo', 'Burn', 'Elves', 'Outro'
            ]
        };
        // ------------------------------------

        // VARIÁVEIS DE CONEXÃO E DADOS
        let firebaseApp = null;
        let dbRef = null; 
        let allData = {}; 

        let currentUser = localStorage.getItem('lastUser') || null;
        let currentFormat = localStorage.getItem('lastFormat') || null;
        let currentDeck = localStorage.getItem('lastDeck') || null;

        const userSelect = document.getElementById('user-select');
        const currentFormatSelect = document.getElementById('current-format-select');
        const currentDeckSelect = document.getElementById('current-deck-select');
        const deckOponenteSelect = document.getElementById('deck-oponente-select');
        const matchupSelect = document.getElementById('matchup-select');
        const statusElement = document.getElementById('status');
        const form = document.getElementById('matchup-form');
        const novaMatchupContainer = document.getElementById('nova-matchup-container');
        const novaMatchupInput = document.getElementById('nova-matchup-input');
        const novoDeckContainer = document.getElementById('novo-deck-container');
        const novoDeckInput = document.getElementById('novo-deck-input');
        const novoUsuarioContainer = document.getElementById('novo-usuario-container');
        const novoUsuarioInput = document.getElementById('novo-usuario-input');
        const displayDiv = document.getElementById('matchup-stats-display');
        const fileInput = document.getElementById('file-input');
        const matchFieldset = document.getElementById('match-fieldset');
        
        // Elementos a serem desativados/ativados
        const controlsToToggle = [
            currentFormatSelect, currentDeckSelect, deckOponenteSelect, matchupSelect,
            document.getElementById('play-draw-select'),
            document.getElementById('g1-result'), document.getElementById('g2-result'),
            document.getElementById('g3-result'), document.getElementById('submit-match'),
            document.getElementById('export-btn'), document.getElementById('import-btn')
        ];


        // FUNÇÕES DE CONEXÃO FIREBASE
        function initializeFirebase(config) {
            try {
                if (!firebaseApp) {
                    firebaseApp = firebase.initializeApp(config);
                }
                
                statusElement.textContent = 'Conectado ao Firebase. Selecione um usuário.';
                statusElement.className = 'success';
            } catch (e) {
                console.error("Erro ao inicializar o Firebase:", e);
                statusElement.textContent = `Erro ao inicializar o Firebase: ${e.message}`;
                statusElement.className = 'error';
            }
        }
        
        function toggleControls(enable) {
            controlsToToggle.forEach(control => {
                if (control) {
                    control.disabled = !enable;
                }
            });
            matchFieldset.disabled = !enable;
        }

        function loadUserData(username) {
            if (!firebaseApp) return;

            dbRef = firebaseApp.database().ref(`users/${username}`);
            currentUser = username;
            
            // Ativa os controles de export/import
            document.getElementById('export-btn').disabled = false;
            document.getElementById('import-btn').disabled = false;

            // Desativa os controles de partida/deck
            currentDeckSelect.disabled = true;
            matchFieldset.disabled = true;
            matchupSelect.disabled = true;

            statusElement.textContent = `Carregando dados de ${username}...`;
            statusElement.className = 'loading';
            
            // Listener principal para carregar e atualizar os dados em tempo real
            dbRef.on('value', (snapshot) => {
                allData = snapshot.val() || { };
                
                popularFormatSelector(); 
                
                // Tenta manter o deck e formato selecionados
                const lastFormat = localStorage.getItem('lastFormat');
                const lastDeck = localStorage.getItem('lastDeck');

                if (lastFormat) {
                    currentFormatSelect.value = lastFormat;
                    currentFormat = lastFormat;
                    
                    popularDeckSelector(); 

                    if (lastDeck && getCurrentDecks(lastFormat)[lastDeck]) {
                        currentDeck = lastDeck;
                        currentDeckSelect.value = lastDeck;
                        onDeckChange(lastDeck, false); 
                    } else {
                        currentDeck = null;
                        onDeckChange(null);
                    }
                } else {
                    currentFormat = null;
                    currentDeck = null;
                    onFormatChange(false);
                }
                
                // Garante que o seletor de formato esteja ativo após o login
                currentFormatSelect.disabled = false; 

                statusElement.textContent = `Usuário: ${currentUser}. Dados atualizados (Cloud).`;
                statusElement.className = 'success';
            }, (error) => {
                console.error("Erro de conexão com o Firebase:", error);
                statusElement.textContent = `Erro ao carregar dados do usuário ${username}: ${error.message}`;
                statusElement.className = 'error';
                toggleControls(false);
            });
        }
        
        function popularUserSelector() {
            userSelect.innerHTML = '';
            userSelect.appendChild(new Option('Selecione seu Nome', '', true, true));

            USERS.forEach(name => {
                userSelect.appendChild(new Option(name, name));
            });
            userSelect.appendChild(new Option('--- Novo Usuário ---', NOVO_USUARIO_OPCAO));
            
            // Tenta pré-selecionar o último usuário usado (se houver)
            if (currentUser && USERS.includes(currentUser)) {
                userSelect.value = currentUser;
                loadUserData(currentUser);
            }
        }
        
        function setNovoUsuario() {
            const nomeUsuario = novoUsuarioInput.value.trim();
            if (!nomeUsuario || USERS.includes(nomeUsuario)) {
                statusElement.textContent = 'Nome de usuário inválido ou já existe.';
                statusElement.className = 'error';
                return;
            }
            
            USERS.push(nomeUsuario); 
            localStorage.setItem('lastUser', nomeUsuario);
            popularUserSelector();
            userSelect.value = nomeUsuario;
            novoUsuarioContainer.style.display = 'none';
            novoUsuarioInput.value = '';
            
            loadUserData(nomeUsuario);
        }

        // Popula o seletor de Formato (usa TODOS os formatos, não só os jogados)
        function popularFormatSelector() {
            currentFormatSelect.innerHTML = '';
            currentFormatSelect.appendChild(new Option('Selecione o Formato', '', true, true));
            
            ALL_FORMATS.forEach(format => { // Usa a lista ALL_FORMATS
                const option = document.createElement('option');
                option.value = format;
                
                let display_text = format;
                if (allData[format] && allData[format].decks && Object.keys(allData[format].decks).length > 0) {
                    display_text += ' (Jogado)';
                }
                option.textContent = display_text;
                currentFormatSelect.appendChild(option);
            });
        }

        function getCurrentDecks(format) {
            return allData[format] && allData[format].decks ? allData[format].decks : {};
        }

        function onFormatChange(shouldSave = true) {
            currentFormat = currentFormatSelect.value;
            if (shouldSave) {
                 localStorage.setItem('lastFormat', currentFormat); 
            }
            
            currentDeck = null;
            currentDeckSelect.value = '';
            localStorage.removeItem('lastDeck');

            if (currentFormat) {
                currentDeckSelect.disabled = false;
                popularDeckSelector(); 
                
                matchFieldset.disabled = true;
                matchupSelect.disabled = true;
            } else {
                currentDeckSelect.disabled = true;
                matchFieldset.disabled = true;
                matchupSelect.disabled = true;
                
                currentDeckSelect.innerHTML = '<option value="" disabled selected>Selecione um Formato Primeiro</option>';
            }
            
            updateStatsDisplay(null); 
        }

        // FUNÇÃO CORRIGIDA PARA ATIVAR O FORMULÁRIO DE REGISTRO
        function onDeckChange(deckName, shouldSave = true) {
            if (shouldSave) {
                localStorage.setItem('lastDeck', deckName);
            }
            
            // Pega referências dos elementos
            const deckOponenteSelect = document.getElementById('deck-oponente-select');
            const playDrawSelect = document.getElementById('play-draw-select');
            const g1Result = document.getElementById('g1-result');
            const g2Result = document.getElementById('g2-result');
            const g3Result = document.getElementById('g3-result');
            const submitMatch = document.getElementById('submit-match');


            if (!deckName) { 
                currentDeck = null;
                novoDeckContainer.style.display = 'none';
                document.getElementById('current-deck-name').textContent = 'Selecione um Deck';
                
                // Desativa Form
                matchFieldset.disabled = true;
                matchupSelect.disabled = true;
                
                updateStatsDisplay(null);
                return;
            }
            
            if (deckName === NOVO_DECK_OPCAO) {
                currentDeck = null;
                novoDeckContainer.style.display = 'block';
                novoDeckInput.focus();
                
                // Desativa Form
                matchFieldset.disabled = true;
                matchupSelect.disabled = true;
            } else {
                currentDeck = deckName;
                novoDeckContainer.style.display = 'none';
                document.getElementById('current-deck-name').textContent = deckName;
                
                // Reativa a interface de registro de partida
                matchFieldset.disabled = false; // Ativa o container principal

                // ATIVAÇÃO INDIVIDUAL DOS CONTROLES DO FORMULÁRIO
                deckOponenteSelect.disabled = false;
                playDrawSelect.disabled = false;
                g1Result.disabled = false;
                g2Result.disabled = false;
                g3Result.disabled = false;
                submitMatch.disabled = false;
                matchupSelect.disabled = false; // Seletor de Matchup Stats
                
                // Atualiza as outras listas e estatísticas
                popularDropdowns(); 
                updateStatsDisplay(null); 
            }
        }

        function popularDeckSelector() {
            console.log('popularDeckSelector called, currentFormat:', currentFormat);
            
            if (!currentFormat) {
                currentDeckSelect.innerHTML = '<option value="" disabled selected>Selecione um Formato Primeiro</option>';
                currentDeckSelect.disabled = true;
                return; 
            }

            currentDeckSelect.innerHTML = '';
            currentDeckSelect.appendChild(new Option('Selecione seu Deck Atual', '', false, false));
            
            const metagameDecks = METAGAME_DECKS_BY_FORMAT[currentFormat] || [];
            console.log('Metagame decks for', currentFormat, ':', metagameDecks);
            
            const uniqueDeckOptions = new Set();
            
            // Adiciona todos os decks do metagame
            metagameDecks.forEach(deck => {
                if (deck !== 'Outro') {
                    uniqueDeckOptions.add(deck);
                }
            });
            
            // Adiciona decks já criados pelo usuário
            const existingUserDecks = getCurrentDecks(currentFormat);
            const existingUserDeckNames = Object.keys(existingUserDecks);
            console.log('Existing user decks:', existingUserDeckNames);
            
            existingUserDeckNames.forEach(name => {
                uniqueDeckOptions.add(name);
            });
            
            const finalDeckList = Array.from(uniqueDeckOptions).sort();
            console.log('Final deck list:', finalDeckList);

            finalDeckList.forEach(name => {
                currentDeckSelect.appendChild(new Option(name, name));
            });
            
            currentDeckSelect.appendChild(new Option('--- Criar Novo Deck ---', NOVO_DECK_OPCAO));
            
            // CRITICAL: Habilita o seletor de deck
            currentDeckSelect.disabled = false;
            
            // Tenta selecionar o deck atual se ainda existir
            if (currentDeck && (finalDeckList.includes(currentDeck) || currentDeck === NOVO_DECK_OPCAO)) {
                currentDeckSelect.value = currentDeck;
            } else {
                currentDeck = null;
                currentDeckSelect.value = '';
                onDeckChange(null, false);
            }
        }
        
        function criarNovoDeck() {
            const nomeDeck = novoDeckInput.value.trim();
            if (!nomeDeck || !dbRef || !currentFormat) {
                statusElement.textContent = 'Erro: Selecione um usuário e formato primeiro.';
                statusElement.className = 'error';
                return;
            }
            if (getCurrentDecks(currentFormat)[nomeDeck]) {
                statusElement.textContent = 'Esse deck já existe nesse formato!';
                statusElement.className = 'error';
                return;
            }
            
            const deckRef = dbRef.child(currentFormat).child('decks').child(nomeDeck);
            deckRef.set({})
                .then(() => {
                    currentDeck = nomeDeck;
                    novoDeckContainer.style.display = 'none';
                    novoDeckInput.value = '';
                    
                    popularDeckSelector();
                    currentDeckSelect.value = nomeDeck;
                    onDeckChange(nomeDeck);
                    
                    statusElement.textContent = `Deck "${nomeDeck}" criado com sucesso no formato ${currentFormat}!`;
                    statusElement.className = 'success';
                })
                .catch(error => {
                    statusElement.textContent = `Erro ao criar deck: ${error.message}`;
                    statusElement.className = 'error';
                });
        }
        function addMatch(newMatch) {
            if (!currentDeck || !currentFormat || !dbRef) {
                statusElement.textContent = 'Erro: Selecione um formato e um deck.';
                statusElement.className = 'error';
                return;
            }
            
            const matchRef = dbRef.child(currentFormat).child('decks').child(currentDeck);

            matchRef.push(newMatch)
                .then(() => {
                    statusElement.textContent = 'Partida registrada com sucesso! Sincronizando...';
                    statusElement.className = 'loading';
                })
                .catch(error => {
                    statusElement.textContent = `Erro ao salvar partida: ${error.message}`;
                    statusElement.className = 'error';
                });
        }
        
        // Exporta a estrutura completa de allData (todos os formatos)
        function exportData() {
            if (!currentUser) return;
            
            const data = JSON.stringify(allData, null, 2);
            if (data === '{}' || Object.keys(allData).length === 0) {
                statusElement.textContent = 'Não há dados para exportar.';
                statusElement.className = 'error';
                return;
            }
            const filename = `${currentUser}_multi_deck_tracker_data.json`;
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
                        
            statusElement.textContent = `Dados de ${currentUser} exportados com sucesso!`;
            statusElement.className = 'success';
        }
        
        function importData(jsonString) {
            if (!dbRef || !currentUser) {
                statusElement.textContent = 'Erro: Selecione um usuário antes de importar dados.';
                statusElement.className = 'error';
                return;
            }
            try {
                const importedDataRaw = JSON.parse(jsonString);                                
                
                if (typeof importedDataRaw !== 'object' || Array.isArray(importedDataRaw)) {
                    statusElement.textContent = 'Erro: O arquivo deve ser um objeto JSON válido.';
                    statusElement.className = 'error';
                    return;
                }
                
                let dataToSave = importedDataRaw;

                dbRef.set(dataToSave)
                    .then(() => {
                        statusElement.textContent = `Dados importados para ${currentUser} e sincronizados com o Firebase!`;
                        statusElement.className = 'success';
                    })
                    .catch(e => {
                        statusElement.textContent = `Erro ao importar para o Firebase: ${e.message}`;
                        statusElement.className = 'error';
                    });
                
            } catch (e) {
                statusElement.textContent = `Erro ao analisar o arquivo de importação: ${e.message}`;
                statusElement.className = 'error';
            }
        }


        function handleFileSelect(event) {
            const file = event.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (e) => importData(e.target.result);
            reader.onerror = () => {
                statusElement.textContent = 'Erro ao ler o arquivo';
                statusElement.className = 'error';
            };
            reader.readAsText(file);
            event.target.value = null;
        }
        
        // Função de cálculo de estatísticas aprimorada (inclui Play/Draw)
        function calculateStats(filteredData) {
            const matchesArray = Object.values(filteredData || {});
            
            let totalMatches = 0, matchesWon = 0, totalGames = 0, gamesWon = 0;
            let g1Total = 0, g1Won = 0, g2Total = 0, g2Won = 0, g3Total = 0, g3Won = 0;
            
            // Rastreamento Play/Draw
            let playTotalMatches = 0, playWonMatches = 0;
            let drawTotalMatches = 0, drawWonMatches = 0;

            for (const match of matchesArray) {
                
                const g1 = match.g1Result ? match.g1Result.toLowerCase() : '';
                const g2 = match.g2Result ? match.g2Result.toLowerCase() : '';
                const g3 = match.g3Result ? match.g3Result.toLowerCase() : 'not_played';
                const playDraw = match.playDraw ? match.playDraw.toLowerCase() : null; 

                if (g1) { g1Total++; if (g1 === 'win') { g1Won++; gamesWon++; } }
                if (g2) { g2Total++; if (g2 === 'win') { g2Won++; gamesWon++; } }
                if (g3 !== 'not_played' && g3) { g3Total++; if (g3 === 'win') { g3Won++; gamesWon++; } }

                totalMatches++;
                let wins = (g1 === 'win' ? 1 : 0) + (g2 === 'win' ? 1 : 0) + (g3 === 'win' ? 1 : 0);
                let matchWon = wins >= 2;
                if (matchWon) matchesWon++;
                
                // Rastreamento Play/Draw
                if (playDraw === 'play') {
                    playTotalMatches++;
                    if (matchWon) playWonMatches++;
                } else if (playDraw === 'draw') {
                    drawTotalMatches++;
                    if (matchWon) drawWonMatches++;
                }
            }

            totalGames = g1Total + g2Total + g3Total;

            const formatWR = (num, den) => den > 0 ? (num / den * 100).toFixed(1) + '%' : '--%';
            
            return {
                totalMatches: totalMatches,
                generalWinRate: formatWR(matchesWon, totalMatches),
                gameWinRate: formatWR(gamesWon, totalGames),
                g1WinRate: formatWR(g1Won, g1Total),
                g2WinRate: formatWR(g2Won, g2Total),
                g3WinRate: formatWR(g3Won, g3Total),
                playWinRate: formatWR(playWonMatches, playTotalMatches),
                drawWinRate: formatWR(drawWonMatches, drawTotalMatches),
            };
        }

        // Função centralizada para atualizar a exibição de estatísticas
        function updateStatsDisplay(matchupName = null) {
            const currentMatches = getCurrentMatches();
            let filteredMatches;

            // Elementos de contagem de jogos
            const countGeralElement = document.getElementById('match-count-geral');
            const countMatchupElement = document.getElementById('match-count-matchup');
            
            // Para Matchup Stats
            const displayDiv = document.getElementById('matchup-stats-display');
            const statsDisplayDiv = document.getElementById('stats-display'); 

            if (matchupName) {
                // Estatísticas por Matchup
                filteredMatches = Object.values(currentMatches).filter(m => m.deckOponente === matchupName);
                document.getElementById('matchup-name').textContent = matchupName;
                displayDiv.style.display = 'block';
            } else {
                // Estatísticas Gerais
                filteredMatches = currentMatches;
                displayDiv.style.display = 'none';
            }

            const stats = calculateStats(filteredMatches);
            const matchCount = stats.totalMatches;

            if (matchupName) {
                // Atualiza contagem Matchup
                countMatchupElement.textContent = matchCount; 

                // Atualiza Matchup Stats
                document.getElementById('matchup-wr-match').textContent = stats.generalWinRate;
                document.getElementById('matchup-wr-game').textContent = stats.gameWinRate;
                document.getElementById('matchup-wr-g1').textContent = stats.g1WinRate;
                document.getElementById('matchup-wr-g2').textContent = stats.g2WinRate;
                document.getElementById('matchup-wr-g3').textContent = stats.g3WinRate;
                document.getElementById('matchup-wr-play').textContent = stats.playWinRate;
                document.getElementById('matchup-wr-draw').textContent = stats.drawWinRate;
                
            } else {
                // Atualiza contagem Geral
                countGeralElement.textContent = matchCount;

                // Atualiza General Stats
                document.getElementById('wr-match-geral').textContent = stats.generalWinRate;
                document.getElementById('wr-game-geral').textContent = stats.gameWinRate;
                document.getElementById('wr-g1-geral').textContent = stats.g1WinRate;
                document.getElementById('wr-g2-geral').textContent = stats.g2WinRate;
                document.getElementById('wr-g3-geral').textContent = stats.g3WinRate;
                document.getElementById('wr-play-geral').textContent = stats.playWinRate;
                document.getElementById('wr-draw-geral').textContent = stats.drawWinRate;


                document.getElementById('current-deck-name').textContent = currentDeck || 'Nenhum';
                
                // Mensagem de status
                if (currentDeck && matchCount > 0) {
                    statusElement.textContent = `${currentDeck} (${currentFormat}): ${matchCount} partidas registradas.`;
                    statusElement.className = 'success';
                } else if (currentDeck && matchCount === 0) {
                    statusElement.textContent = `Deck "${currentDeck}" pronto. Registre sua primeira partida!`;
                    statusElement.className = 'warning';
                } else if (currentUser && !currentFormat) {
                     statusElement.textContent = `Usuário: ${currentUser}. Selecione um Formato!`;
                     statusElement.className = 'info';
                }
            }
        }

        function getCurrentMatches() {
            if (!currentFormat || !currentDeck) return {};
            return allData[currentFormat]?.decks?.[currentDeck] || {};
        }

        function popularDropdowns() {
            if (!currentFormat || !currentDeck) {
                deckOponenteSelect.innerHTML = '<option value="" disabled selected>Selecione um Deck Primeiro</option>';
                matchupSelect.innerHTML = '<option value="" disabled selected>Selecione um Deck...</option>';
                matchupSelect.disabled = true; 
                return;
            }

            const currentMatches = getCurrentMatches();
            
            let uniqueDecks = [...(METAGAME_DECKS_BY_FORMAT[currentFormat] || [])];
            
            const recordedDecks = new Set(Object.values(currentMatches)
                .map(m => m.deckOponente)
            );

            recordedDecks.forEach(deck => {
                if (!uniqueDecks.includes(deck)) uniqueDecks.push(deck);
            });
            
            const outroIndex = uniqueDecks.indexOf('Outro');
            if (outroIndex > -1) {
                 uniqueDecks.splice(outroIndex, 1);
            }

            uniqueDecks.sort();

            // Popula seletor de Deck Oponente
            deckOponenteSelect.innerHTML = '';
            deckOponenteSelect.appendChild(new Option('Selecione o Deck Oponente', '', true, true));
            uniqueDecks.forEach(name => {
                deckOponenteSelect.appendChild(new Option(name, name));
            });
            deckOponenteSelect.appendChild(new Option('--- Nova Matchup (Manual) ---', NOVA_MATCHUP_OPCAO));


            // Popula seletor de Estatísticas por Matchup (somente decks registrados)
            const statsDecks = [...recordedDecks].sort();
            matchupSelect.innerHTML = '';
            matchupSelect.appendChild(new Option('Selecione um Matchup...', ''));
            statsDecks.forEach(name => matchupSelect.appendChild(new Option(name, name)));
            
            if (statsDecks.length > 0) {
                matchupSelect.disabled = false;
            } else {
                matchupSelect.disabled = true;
            }
        }

        // Event Listeners
        
        currentFormatSelect.addEventListener('change', () => onFormatChange(true));

        userSelect.addEventListener('change', (e) => {
            const selectedUser = e.target.value;
            if (selectedUser === NOVO_USUARIO_OPCAO) {
                novoUsuarioContainer.style.display = 'block';
                novoUsuarioInput.focus();
                toggleControls(false); 
            } else {
                novoUsuarioContainer.style.display = 'none';
                loadUserData(selectedUser);
            }
        });
        
        currentDeckSelect.addEventListener('change', (e) => {
            onDeckChange(e.target.value);
        });

        form.addEventListener('submit', (e) => {
            e.preventDefault();
                        
            if (!currentDeck || !currentFormat) {
                statusElement.textContent = 'Selecione um Formato e um Deck primeiro!';
                statusElement.className = 'error';
                return;
            }
            
            let deckOponente = deckOponenteSelect.value;
            
            if (deckOponente === NOVA_MATCHUP_OPCAO) {
                deckOponente = novaMatchupInput.value.trim();
                if (!deckOponente) {
                    statusElement.textContent = 'Digite o nome da nova matchup!';
                    statusElement.className = 'error';
                    return;
                }
            }
            
            const g1Result = document.getElementById('g1-result').value;
            const g2Result = document.getElementById('g2-result').value;
            const g3Result = document.getElementById('g3-result').value;
            const playDraw = document.getElementById('play-draw-select').value;
            
            if (!deckOponente || !g1Result || !g2Result || !playDraw) {
                statusElement.textContent = 'Preencha todos os campos obrigatórios!';
                statusElement.className = 'error';
                return;
            }

            const newMatch = {
                timestamp: new Date().toISOString(),
                deckProprio: currentDeck,
                deckOponente: deckOponente,
                playDraw: playDraw,
                g1Result: g1Result,
                g2Result: g2Result,
                g3Result: g3Result
            };
                        
            addMatch(newMatch);
            
            // Limpa o formulário, menos o Play/Draw
            form.reset();
            document.getElementById('g3-result').value = 'not_played';
            deckOponenteSelect.value = '';
            novaMatchupContainer.style.display = 'none';
        });

        matchupSelect.addEventListener('change', (e) => {
            const selectedMatchup = e.target.value;
            if (selectedMatchup) {
                updateStatsDisplay(selectedMatchup);
            } else {
                displayDiv.style.display = 'none';
                updateStatsDisplay(null);
            }
        });

        deckOponenteSelect.addEventListener('change', (e) => {
            if (e.target.value === NOVA_MATCHUP_OPCAO) {
                novaMatchupContainer.style.display = 'block';
                novaMatchupInput.focus();
            } else {
                novaMatchupContainer.style.display = 'none';
                novaMatchupInput.value = '';
            }
        });

        // I/O Listeners
        document.getElementById('export-btn').addEventListener('click', exportData);
        document.getElementById('import-btn').addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', handleFileSelect, false);

        // Initialization
        document.addEventListener('DOMContentLoaded', () => {
            initializeFirebase(firebaseConfig);
            popularUserSelector();
        });