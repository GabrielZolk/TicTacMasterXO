export const translations = {
  pt: {
    // Home Screen
    homeTitle: 'TicTac Master XO',
    chooseGameMode: 'Escolha o Modo de Jogo',
    madeWithLove: 'Feito com ❤️ para amantes do jogo da velha',
    
    // Game Modes
    vsAI: {
      title: 'VS IA',
      subtitle: 'Desafie o computador',
      description: 'Jogue contra IA inteligente com diferentes níveis de dificuldade',
    },
    twoPlayers: {
      title: '2 Jogadores',
      subtitle: 'Jogue com um amigo',
      description: 'Multiplayer local - joguem alternadamente no mesmo dispositivo',
    },
    classic: {
      title: 'Modo Clássico',
      subtitle: 'Regras tradicionais',
      description: 'Jogo clássico do tic-tac-toe - vence quem conseguir 3 em linha!',
    },
    infinity: {
      title: 'Modo Infinito',
      subtitle: 'Tabuleiro dinâmico',
      description: 'Peças removidas automaticamente - possibilidades infinitas!',
    },
    gravity: {
      title: 'Gravity',
      subtitle: 'Peças caem',
      description: 'Peças caem para baixo!',
    },
    blind: {
      title: 'Cego',
      subtitle: 'Memória',
      description: 'Jogadas ficam escondidas!',
    },
    bigBoard: {
      title: 'Grande',
      subtitle: 'Tabuleiro 4x4',
      description: 'Tabuleiro 4x4 - 4 em linha!',
    },
    survival: {
      title: 'Sobrevivência',
      subtitle: 'Vidas limitadas',
      description: '3 vidas - não perca todas!',
    },

    // Opponent Selection
    chooseOpponent: 'Escolher Oponente',
    whoToPlayAgainst: 'Contra quem você quer jogar?',
    tip: 'Dica',
    classicTip: 'No Modo Clássico, vence quem conseguir 3 peças em linha primeiro!',
    infinityTip: 'No Modo Infinito, as peças mais antigas são removidas automaticamente após 6 jogadas!',
    
    // Difficulty Screen
    chooseDifficulty: 'Escolha a Dificuldade',
    whatChallenge: 'Qual nível de desafio você quer?',
    difficulties: {
      noob: {
        title: 'Noob',
        subtitle: 'Fácil demais',
        description: 'IA apenas começando a aprender. Perfeito para iniciantes!',
      },
      mediano: {
        title: 'Mediano',
        subtitle: 'Equilibrado',
        description: 'IA com estratégia básica. Um bom desafio!',
      },
      expert: {
        title: 'Expert',
        subtitle: 'Difícil',
        description: 'IA experiente com táticas avançadas. Prepare-se!',
      },
      challenger: {
        title: 'Challenger',
        subtitle: 'Impossível',
        description: 'IA quase perfeita. Só para os melhores jogadores!',
      },
      troll: {
        title: 'Troll',
        subtitle: 'Provocativo',
        description: 'IA que fala demais e provoca a cada jogada. Você aguenta?',
      },
    },
    difficultyTip: 'O modo Troll inclui mensagens provocativas durante o jogo. Ideal para quem gosta de um pouco de diversão extra!',
    tip: 'Dica',
    
    // Game Screen
    playerTurn: 'Vez do Jogador',
    playerWins: 'Jogador {player} Ganhou!',
    draw: 'Empate!',
    aiThinking: 'IA está pensando...',
    newRound: 'Nova Rodada',
    restartGame: 'Reiniciar Jogo',
    restartConfirm: 'Isso resetará o placar. Tem certeza?',
    cancel: 'Cancelar',
    restart: 'Reiniciar',
    wins: 'vitórias',
    pieces: 'Peças',
    infinityDescription: 'Peças mais antigas são removidas automaticamente',
    gameOptions: 'Opções do Jogo',
    
    // Game End Modal
    gameResult: {
      victory: 'Vitória!',
      defeat: 'Derrota!',
      draw: 'Empate!',
      gameOver: 'Fim de Jogo',
      victoryMessage: 'Parabéns! Você venceu!',
      defeatMessage: 'Que pena! Tente novamente!',
      drawMessage: 'Ninguém venceu desta vez!',
      winner: 'Vencedor',
    },
    actions: {
      playAgain: 'Jogar Novamente',
      viewBoard: 'Ver Tabuleiro',
    },
    
    // Settings Screen
    settings: 'Configurações',
    preferences: 'Preferências',
    soundEffects: 'Efeitos Sonoros',
    soundDescription: 'Habilitar efeitos sonoros e feedback de áudio',
    hapticFeedback: 'Feedback Tátil',
    hapticDescription: 'Habilitar feedback de vibração para interações',
    theme: 'Tema',
    themeDescription: 'Atualmente usando tema {theme}',
    language: 'Idioma',
    languageDescription: 'Idioma da interface',
    about: 'Sobre',
    aboutTitle: 'TicTac Master XO',
    version: 'Versão 1.0.0',
    aboutDescription: 'A melhor experiência de jogo da velha com múltiplos modos de jogo, oponentes IA, e o inovador Modo Infinito. Desafie-se e seus amigos nesta versão moderna do jogo clássico.',
    
    // Statistics Screen
    statistics: 'Estatísticas',
    overallStats: 'Estatísticas Gerais',
    playerStats: 'Estatísticas por Jogador',
    gameDistribution: 'Distribuição de Jogos',
    noGamesYet: 'Nenhum Jogo Jogado',
    startPlaying: 'Comece a jogar para ver suas estatísticas aqui!',
    totalGames: 'Jogos Totais',
    currentStreak: 'Sequência Atual',
    bestStreak: 'Melhor Sequência',
    winRate: '% de Vitórias',
    losses: 'Derrotas',
    draws: 'Empates',
    playerXWins: 'Vitórias do Jogador X',
    playerOWins: 'Vitórias do Jogador O',
    
    // Themes
    dark: 'escuro',
    light: 'claro',
    
    // Languages
    languages: {
      pt: 'Português',
      en: 'English',
      es: 'Español',
      fr: 'Français',
    },
    
    // Game Status
    gameStatus: {
      win: 'Você Ganhou! 🎉',
      lose: 'Você Perdeu! 😔',
      draw: 'Empate! 🤝',
      aiWin: 'IA Ganhou! 🤖',
      aiLose: 'IA Perdeu! 😢',
      playerXWin: 'Jogador X Ganhou!',
      playerOWin: 'Jogador O Ganhou!',
    },
  },
  
  en: {
    // Home Screen
    homeTitle: 'TicTac Master XO',
    chooseGameMode: 'Choose Game Mode',
    madeWithLove: 'Made with ❤️ for tic-tac-toe lovers',
    
    // Game Modes
    vsAI: {
      title: 'VS AI',
      subtitle: 'Challenge the computer',
      description: 'Play against intelligent AI with different difficulty levels',
    },
    twoPlayers: {
      title: '2 Players',
      subtitle: 'Play with a friend',
      description: 'Local multiplayer - take turns on the same device',
    },
    classic: {
      title: 'Classic Mode',
      subtitle: 'Traditional rules',
      description: 'Classic tic-tac-toe game - first to get 3 in a line wins!',
    },
    infinity: {
      title: 'Infinity Mode',
      subtitle: 'Dynamic board',
      description: 'Pieces automatically removed - endless possibilities!',
    },
    gravity: {
      title: 'Gravity',
      subtitle: 'Pieces fall down',
      description: 'Pieces fall down!',
    },
    blind: {
      title: 'Blind',
      subtitle: 'Memory',
      description: 'Moves are hidden!',
    },
    bigBoard: {
      title: 'Big',
      subtitle: '4x4 Board',
      description: '4x4 board - 4 in a row!',
    },
    survival: {
      title: 'Survival',
      subtitle: 'Limited lives',
      description: '3 lives - don\'t lose them all!',
    },

    // Opponent Selection
    chooseOpponent: 'Choose Opponent',
    whoToPlayAgainst: 'Who do you want to play against?',
    tip: 'Tip',
    classicTip: 'In Classic Mode, first to get 3 pieces in a line wins!',
    infinityTip: 'In Infinity Mode, oldest pieces are automatically removed after 6 moves!',
    
    // Difficulty Screen
    chooseDifficulty: 'Choose Difficulty',
    whatChallenge: 'What level of challenge do you want?',
    difficulties: {
      noob: {
        title: 'Noob',
        subtitle: 'Too easy',
        description: 'AI just starting to learn. Perfect for beginners!',
      },
      mediano: {
        title: 'Medium',
        subtitle: 'Balanced',
        description: 'AI with basic strategy. A good challenge!',
      },
      expert: {
        title: 'Expert',
        subtitle: 'Hard',
        description: 'Experienced AI with advanced tactics. Get ready!',
      },
      challenger: {
        title: 'Challenger',
        subtitle: 'Impossible',
        description: 'Near-perfect AI. Only for the best players!',
      },
      troll: {
        title: 'Troll',
        subtitle: 'Provocative',
        description: 'AI that talks too much and taunts with every move. Can you handle it?',
      },
    },
    difficultyTip: 'Troll mode includes provocative messages during the game. Ideal for those who like a little extra fun!',
    tip: 'Tip',
    
    // Game Screen
    playerTurn: 'Player Turn',
    playerWins: 'Player {player} Wins!',
    draw: "It's a Draw!",
    aiThinking: 'AI is thinking...',
    newRound: 'New Round',
    restartGame: 'Restart Game',
    restartConfirm: 'This will reset the score. Are you sure?',
    cancel: 'Cancel',
    restart: 'Restart',
    wins: 'wins',
    pieces: 'Pieces',
    infinityDescription: 'Oldest pieces are automatically removed',
    gameOptions: 'Game Options',
    
    // Game End Modal
    gameResult: {
      victory: 'Victory!',
      defeat: 'Defeat!',
      draw: 'Draw!',
      gameOver: 'Game Over',
      victoryMessage: 'Congratulations! You won!',
      defeatMessage: 'Too bad! Try again!',
      drawMessage: 'Nobody won this time!',
      winner: 'Winner',
    },
    actions: {
      playAgain: 'Play Again',
      viewBoard: 'View Board',
    },
    
    // Settings Screen
    settings: 'Settings',
    preferences: 'Preferences',
    soundEffects: 'Sound Effects',
    soundDescription: 'Enable sound effects and audio feedback',
    hapticFeedback: 'Haptic Feedback',
    hapticDescription: 'Enable vibration feedback for interactions',
    theme: 'Theme',
    themeDescription: 'Currently using {theme} theme',
    language: 'Language',
    languageDescription: 'Interface language',
    about: 'About',
    aboutTitle: 'TicTac Master XO',
    version: 'Version 1.0.0',
    aboutDescription: 'The ultimate tic-tac-toe experience with multiple game modes, AI opponents, and innovative Infinity Mode. Challenge yourself and friends in this modern take on the classic game.',
    
    // Statistics Screen
    statistics: 'Statistics',
    overallStats: 'Overall Statistics',
    playerStats: 'Player Statistics',
    gameDistribution: 'Game Distribution',
    noGamesYet: 'No Games Played Yet',
    startPlaying: 'Start playing to see your statistics here!',
    totalGames: 'Total Games',
    currentStreak: 'Current Streak',
    bestStreak: 'Best Streak',
    winRate: '% Win Rate',
    losses: 'Losses',
    draws: 'Draws',
    playerXWins: 'Player X Wins',
    playerOWins: 'Player O Wins',
    
    // Themes
    dark: 'dark',
    light: 'light',
    
    // Languages
    languages: {
      pt: 'Português',
      en: 'English',
      es: 'Español',
      fr: 'Français',
    },
    
    // Game Status
    gameStatus: {
      win: 'You Won! 🎉',
      lose: 'You Lost! 😔',
      draw: "It's a Draw! 🤝",
      aiWin: 'AI Won! 🤖',
      aiLose: 'AI Lost! 😢',
      playerXWin: 'Player X Wins!',
      playerOWin: 'Player O Wins!',
    },
  },
  
  es: {
    // Home Screen
    homeTitle: 'TicTac Master XO',
    chooseGameMode: 'Elige Modo de Juego',
    madeWithLove: 'Hecho con ❤️ para amantes del tres en raya',
    
    // Game Modes
    vsAI: {
      title: 'VS IA',
      subtitle: 'Desafía a la computadora',
      description: 'Juega contra IA inteligente con diferentes niveles de dificultad',
    },
    twoPlayers: {
      title: '2 Jugadores',
      subtitle: 'Juega con un amigo',
      description: 'Multijugador local - túrnense en el mismo dispositivo',
    },
    classic: {
      title: 'Modo Clásico',
      subtitle: 'Reglas tradicionales',
      description: 'Juego clásico del tres en raya - ¡gana quien consiga 3 en línea!',
    },
    infinity: {
      title: 'Modo Infinito',
      subtitle: 'Tablero dinámico',
      description: '¡Piezas removidas automáticamente - posibilidades infinitas!',
    },
    gravity: {
      title: 'Gravedad',
      subtitle: 'Las piezas caen',
      description: '¡Las piezas caen hacia abajo!',
    },
    blind: {
      title: 'Ciego',
      subtitle: 'Memoria',
      description: '¡Los movimientos están ocultos!',
    },
    bigBoard: {
      title: 'Grande',
      subtitle: 'Tablero 4x4',
      description: '¡Tablero 4x4 - 4 en línea!',
    },
    survival: {
      title: 'Supervivencia',
      subtitle: 'Vidas limitadas',
      description: '¡3 vidas - no las pierdas todas!',
    },

    // Opponent Selection
    chooseOpponent: 'Elegir Oponente',
    whoToPlayAgainst: '¿Contra quién quieres jugar?',
    tip: 'Consejo',
    classicTip: '¡En Modo Clásico, gana quien consiga 3 piezas en línea primero!',
    infinityTip: '¡En Modo Infinito, las piezas más antiguas se eliminan automáticamente después de 6 movimientos!',
    
    // Difficulty Screen
    chooseDifficulty: 'Elige Dificultad',
    whatChallenge: '¿Qué nivel de desafío quieres?',
    difficulties: {
      noob: {
        title: 'Novato',
        subtitle: 'Muy fácil',
        description: '¡IA apenas empezando a aprender. Perfecto para principiantes!',
      },
      mediano: {
        title: 'Medio',
        subtitle: 'Equilibrado',
        description: '¡IA con estrategia básica. Un buen desafío!',
      },
      expert: {
        title: 'Experto',
        subtitle: 'Difícil',
        description: '¡IA experimentada con tácticas avanzadas. Prepárate!',
      },
      challenger: {
        title: 'Retador',
        subtitle: 'Imposible',
        description: '¡IA casi perfecta. Solo para los mejores jugadores!',
      },
      troll: {
        title: 'Troll',
        subtitle: 'Provocativo',
        description: '¿IA que habla demasiado y provoca en cada jugada. ¿Puedes manejarlo?',
      },
    },
    difficultyTip: '¡El modo Troll incluye mensajes provocativos durante el juego. Ideal para quienes gustan de diversión extra!',
    tip: 'Consejo',
    
    // Game Screen
    playerTurn: 'Turno del Jugador',
    playerWins: '¡Jugador {player} Gana!',
    draw: '¡Es un Empate!',
    aiThinking: 'IA está pensando...',
    newRound: 'Nueva Ronda',
    restartGame: 'Reiniciar Juego',
    restartConfirm: 'Esto reiniciará el marcador. ¿Estás seguro?',
    cancel: 'Cancelar',
    restart: 'Reiniciar',
    wins: 'victorias',
    pieces: 'Piezas',
    infinityDescription: 'Las piezas más antiguas se eliminan automáticamente',
    gameOptions: 'Opciones del Juego',
    
    // Game End Modal
    gameResult: {
      victory: '¡Victoria!',
      defeat: '¡Derrota!',
      draw: '¡Empate!',
      gameOver: 'Fin del Juego',
      victoryMessage: '¡Felicidades! ¡Ganaste!',
      defeatMessage: '¡Qué pena! ¡Inténtalo de nuevo!',
      drawMessage: '¡Nadie ganó esta vez!',
      winner: 'Ganador',
    },
    actions: {
      playAgain: 'Jugar de Nuevo',
      viewBoard: 'Ver Tablero',
    },
    
    // Settings Screen
    settings: 'Configuración',
    preferences: 'Preferencias',
    soundEffects: 'Efectos de Sonido',
    soundDescription: 'Habilitar efectos de sonido y retroalimentación de audio',
    hapticFeedback: 'Retroalimentación Háptica',
    hapticDescription: 'Habilitar retroalimentación de vibración para interacciones',
    theme: 'Tema',
    themeDescription: 'Actualmente usando tema {theme}',
    language: 'Idioma',
    languageDescription: 'Idioma de la interfaz',
    about: 'Acerca de',
    aboutTitle: 'TicTac Master XO',
    version: 'Versión 1.0.0',
    aboutDescription: 'La mejor experiencia de tres en raya con múltiples modos de juego, oponentes IA, y el innovador Modo Infinito. Desafíate a ti mismo y a tus amigos en esta versión moderna del juego clásico.',
    
    // Statistics Screen
    statistics: 'Estadísticas',
    overallStats: 'Estadísticas Generales',
    playerStats: 'Estadísticas por Jugador',
    gameDistribution: 'Distribución de Juegos',
    noGamesYet: 'Aún No Se Han Jugado Partidas',
    startPlaying: '¡Comienza a jugar para ver tus estadísticas aquí!',
    totalGames: 'Juegos Totales',
    currentStreak: 'Racha Actual',
    bestStreak: 'Mejor Racha',
    winRate: '% de Victorias',
    losses: 'Derrotas',
    draws: 'Empates',
    playerXWins: 'Victorias del Jugador X',
    playerOWins: 'Victorias del Jugador O',
    
    // Themes
    dark: 'oscuro',
    light: 'claro',
    
    // Languages
    languages: {
      pt: 'Português',
      en: 'English',
      es: 'Español',
      fr: 'Français',
    },
    
    // Game Status
    gameStatus: {
      win: '¡Ganaste! 🎉',
      lose: '¡Perdiste! 😔',
      draw: '¡Es un Empate! 🤝',
      aiWin: '¡IA Ganó! 🤖',
      aiLose: '¡IA Perdió! 😢',
      playerXWin: '¡Jugador X Gana!',
      playerOWin: '¡Jugador O Gana!',
    },
  },
  
  fr: {
    // Home Screen
    homeTitle: 'TicTac Master XO',
    chooseGameMode: 'Choisir le Mode de Jeu',
    madeWithLove: 'Fait avec ❤️ pour les amateurs de morpion',
    
    // Game Modes
    vsAI: {
      title: 'VS IA',
      subtitle: 'Défiez l\'ordinateur',
      description: 'Jouez contre une IA intelligente avec différents niveaux de difficulté',
    },
    twoPlayers: {
      title: '2 Joueurs',
      subtitle: 'Jouer avec un ami',
      description: 'Multijoueur local - alternez sur le même appareil',
    },
    classic: {
      title: 'Mode Classique',
      subtitle: 'Règles traditionnelles',
      description: 'Jeu classique du morpion - le premier à obtenir 3 en ligne gagne !',
    },
    infinity: {
      title: 'Mode Infini',
      subtitle: 'Plateau dynamique',
      description: 'Pièces supprimées automatiquement - possibilités infinies !',
    },
    gravity: {
      title: 'Gravité',
      subtitle: 'Les pièces tombent',
      description: 'Les pièces tombent vers le bas !',
    },
    blind: {
      title: 'Aveugle',
      subtitle: 'Mémoire',
      description: 'Les mouvements sont cachés !',
    },
    bigBoard: {
      title: 'Grand',
      subtitle: 'Plateau 4x4',
      description: 'Plateau 4x4 - 4 en ligne !',
    },
    survival: {
      title: 'Survie',
      subtitle: 'Vies limitées',
      description: '3 vies - ne les perdez pas toutes !',
    },

    // Opponent Selection
    chooseOpponent: 'Choisir l\'Adversaire',
    whoToPlayAgainst: 'Contre qui voulez-vous jouer ?',
    tip: 'Astuce',
    classicTip: 'En Mode Classique, le premier à obtenir 3 pièces en ligne gagne !',
    infinityTip: 'En Mode Infini, les pièces les plus anciennes sont supprimées automatiquement après 6 coups !',
    
    // Difficulty Screen
    chooseDifficulty: 'Choisir la Difficulté',
    whatChallenge: 'Quel niveau de défi voulez-vous ?',
    difficulties: {
      noob: {
        title: 'Débutant',
        subtitle: 'Trop facile',
        description: 'IA qui commence tout juste à apprendre. Parfait pour les débutants !',
      },
      mediano: {
        title: 'Moyen',
        subtitle: 'Équilibré',
        description: 'IA avec stratégie de base. Un bon défi !',
      },
      expert: {
        title: 'Expert',
        subtitle: 'Difficile',
        description: 'IA expérimentée avec des tactiques avancées. Préparez-vous !',
      },
      challenger: {
        title: 'Challenger',
        subtitle: 'Impossible',
        description: 'IA presque parfaite. Seulement pour les meilleurs joueurs !',
      },
      troll: {
        title: 'Troll',
        subtitle: 'Provocateur',
        description: 'IA qui parle trop et nargue à chaque coup. Pouvez-vous le supporter ?',
      },
    },
    difficultyTip: 'Le mode Troll inclut des messages provocateurs pendant le jeu. Idéal pour ceux qui aiment un peu de fun supplémentaire !',
    tip: 'Astuce',
    
    // Game Screen
    playerTurn: 'Tour du Joueur',
    playerWins: 'Le Joueur {player} Gagne !',
    draw: 'C\'est un Match Nul !',
    aiThinking: 'L\'IA réfléchit...',
    newRound: 'Nouvelle Manche',
    restartGame: 'Redémarrer le Jeu',
    restartConfirm: 'Cela réinitialisera le score. Êtes-vous sûr ?',
    cancel: 'Annuler',
    restart: 'Redémarrer',
    wins: 'victoires',
    pieces: 'Pièces',
    infinityDescription: 'Les pièces les plus anciennes sont supprimées automatiquement',
    gameOptions: 'Options du Jeu',
    
    // Game End Modal
    gameResult: {
      victory: 'Victoire !',
      defeat: 'Défaite !',
      draw: 'Égalité !',
      gameOver: 'Fin du Jeu',
      victoryMessage: 'Félicitations ! Vous avez gagné !',
      defeatMessage: 'Dommage ! Essayez encore !',
      drawMessage: 'Personne n\'a gagné cette fois !',
      winner: 'Gagnant',
    },
    actions: {
      playAgain: 'Rejouer',
      viewBoard: 'Voir le Plateau',
    },
    
    // Settings Screen
    settings: 'Paramètres',
    preferences: 'Préférences',
    soundEffects: 'Effets Sonores',
    soundDescription: 'Activer les effets sonores et les retours audio',
    hapticFeedback: 'Retour Haptique',
    hapticDescription: 'Activer le retour de vibration pour les interactions',
    theme: 'Thème',
    themeDescription: 'Utilise actuellement le thème {theme}',
    language: 'Langue',
    languageDescription: 'Langue de l\'interface',
    about: 'À Propos',
    aboutTitle: 'TicTac Master XO',
    version: 'Version 1.0.0',
    aboutDescription: 'L\'expérience ultime du morpion avec plusieurs modes de jeu, des adversaires IA, et le Mode Infini innovant. Défiez-vous et vos amis dans cette version moderne du jeu classique.',
    
    // Statistics Screen
    statistics: 'Statistiques',
    overallStats: 'Statistiques Générales',
    playerStats: 'Statistiques par Joueur',
    gameDistribution: 'Distribution des Jeux',
    noGamesYet: 'Aucun Jeu Joué Pour L\'Instant',
    startPlaying: 'Commencez à jouer pour voir vos statistiques ici !',
    totalGames: 'Jeux Totaux',
    currentStreak: 'Série Actuelle',
    bestStreak: 'Meilleure Série',
    winRate: '% de Victoires',
    losses: 'Défaites',
    draws: 'Matchs Nuls',
    playerXWins: 'Victoires du Joueur X',
    playerOWins: 'Victoires du Joueur O',
    
    // Themes
    dark: 'sombre',
    light: 'clair',
    
    // Languages
    languages: {
      pt: 'Português',
      en: 'English',
      es: 'Español',
      fr: 'Français',
    },
    
    // Game Status
    gameStatus: {
      win: 'Vous avez Gagné ! 🎉',
      lose: 'Vous avez Perdu ! 😔',
      draw: 'C\'est un Match Nul ! 🤝',
      aiWin: 'L\'IA a Gagné ! 🤖',
      aiLose: 'L\'IA a Perdu ! 😢',
      playerXWin: 'Le Joueur X Gagne !',
      playerOWin: 'Le Joueur O Gagne !',
    },
  },
} as const;

export type Language = keyof typeof translations;
export type TranslationKey = keyof typeof translations['pt'];

// Helper type for nested translation keys
export type NestedTranslationKey = 
  | 'vsAI.title' | 'vsAI.subtitle' | 'vsAI.description'
  | 'twoPlayers.title' | 'twoPlayers.subtitle' | 'twoPlayers.description'
  | 'classic.title' | 'classic.subtitle' | 'classic.description'
  | 'infinity.title' | 'infinity.subtitle' | 'infinity.description'
  | 'difficulties.noob.title' | 'difficulties.noob.subtitle' | 'difficulties.noob.description'
  | 'difficulties.mediano.title' | 'difficulties.mediano.subtitle' | 'difficulties.mediano.description'
  | 'difficulties.expert.title' | 'difficulties.expert.subtitle' | 'difficulties.expert.description'
  | 'difficulties.challenger.title' | 'difficulties.challenger.subtitle' | 'difficulties.challenger.description'
  | 'difficulties.troll.title' | 'difficulties.troll.subtitle' | 'difficulties.troll.description'
  | 'languages.pt' | 'languages.en' | 'languages.es' | 'languages.fr'
  | 'gameStatus.win' | 'gameStatus.lose' | 'gameStatus.draw' 
  | 'gameStatus.aiWin' | 'gameStatus.aiLose'
  | 'gameStatus.playerXWin' | 'gameStatus.playerOWin';
