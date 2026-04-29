'use strict';

const Translations = (() => {

  let currentLang = 'it';

  const LANGUAGES = { it: 'Italiano', en: 'English', es: 'Español', fr: 'Français' };

  /* ══════════════════════════════════════════
     DICTIONARY
  ══════════════════════════════════════════ */
  const DICT = {

    /* ── UI BUTTONS ─────────────────────────── */
    btn_roll_dice:        { it: 'Lancia i Dadi',     en: 'Roll Dice',       es: 'Lanzar Dados',     fr: 'Lancer les Dés'    },
    btn_end_turn:         { it: 'Fine Turno',         en: 'End Turn',        es: 'Fin del Turno',    fr: 'Fin du Tour'       },
    btn_buy:              { it: 'Compra',             en: 'Buy',             es: 'Comprar',          fr: 'Acheter'           },
    btn_pass:             { it: 'Passa',              en: 'Pass',            es: 'Pasar',            fr: 'Passer'            },
    btn_ok:               { it: 'OK',                 en: 'OK',              es: 'OK',               fr: 'OK'                },
    btn_cancel:           { it: 'Annulla',            en: 'Cancel',          es: 'Cancelar',         fr: 'Annuler'           },
    btn_close:            { it: 'Chiudi',             en: 'Close',           es: 'Cerrar',           fr: 'Fermer'            },
    btn_start_game:       { it: 'Inizia Partita',     en: 'Start Game',      es: 'Iniciar Partida',  fr: 'Démarrer Partie'   },
    btn_join_game:        { it: 'Unisciti',           en: 'Join Game',       es: 'Unirse',           fr: 'Rejoindre'         },
    btn_mortgage:         { it: 'Ipoteca',            en: 'Mortgage',        es: 'Hipotecar',        fr: 'Hypothéquer'       },
    btn_unmortgage:       { it: 'Riscatta',           en: 'Unmortgage',      es: 'Rescatar',         fr: 'Racheter'          },
    btn_build:            { it: 'Costruisci',         en: 'Build',           es: 'Construir',        fr: 'Construire'        },
    btn_sell:             { it: 'Vendi',              en: 'Sell',            es: 'Vender',           fr: 'Vendre'            },
    btn_trade:            { it: 'Scambia',            en: 'Trade',           es: 'Intercambiar',     fr: 'Échanger'          },
    btn_pay_bail:         { it: 'Paga Cauzione',      en: 'Pay Bail',        es: 'Pagar Fianza',     fr: 'Payer Caution'     },
    btn_use_card:         { it: 'Usa Carta',          en: 'Use Card',        es: 'Usar Carta',       fr: 'Utiliser Carte'    },
    btn_settings:         { it: 'Impostazioni',       en: 'Settings',        es: 'Configuración',    fr: 'Paramètres'        },
    btn_place_bet:        { it: 'Scommetti',          en: 'Place Bet',       es: 'Apostar',          fr: 'Parier'            },

    /* ── GAME MODES ─────────────────────────── */
    mode_classic:         { it: 'Classico',           en: 'Classic',         es: 'Clásico',          fr: 'Classique'         },
    mode_quick:           { it: 'Veloce',             en: 'Quick',           es: 'Rápido',           fr: 'Rapide'            },
    mode_betting:         { it: 'Scommesse',          en: 'Betting',         es: 'Apuestas',         fr: 'Paris'             },

    /* ── PLAYER MESSAGES ────────────────────── */
    msg_current_turn:     { it: 'Turno di {{name}}',               en: "{{name}}'s Turn",               es: 'Turno de {{name}}',            fr: 'Tour de {{name}}'              },
    msg_rolled:           { it: '{{name}} lancia {{sum}} ({{d1}}+{{d2}})', en: '{{name}} rolled {{sum}} ({{d1}}+{{d2}})', es: '{{name}} lanzó {{sum}}', fr: '{{name}} lance {{sum}}'   },
    msg_doubles:          { it: 'DOPPIO! Lancia ancora.',          en: 'DOUBLES! Roll again.',           es: '¡DOBLES! Lanza de nuevo.',     fr: 'DOUBLES! Relancez.'            },
    msg_triple_doubles:   { it: 'Tre doppi! Vai in prigione.',     en: 'Three doubles! Go to jail.',     es: 'Tres dobles. A la cárcel.',    fr: 'Trois doubles. En prison.'     },
    msg_go_collected:     { it: '{{name}} passa dal Via e riceve {{amount}}€', en: '{{name}} passes Go and collects {{amount}}€', es: '{{name}} pasa por Salida y recibe {{amount}}€', fr: '{{name}} passe par Départ et reçoit {{amount}}€' },

    /* ── PROPERTY MESSAGES ──────────────────── */
    msg_prop_available:   { it: '{{prop}} disponibile: {{price}}€',  en: '{{prop}} available: {{price}}€',  es: '{{prop}} disponible: {{price}}€',  fr: '{{prop}} disponible: {{price}}€'  },
    msg_prop_owned_self:  { it: 'Sei il proprietario di {{prop}}.',  en: 'You own {{prop}}.',               es: 'Eres el dueño de {{prop}}.',       fr: 'Vous êtes propriétaire de {{prop}}.' },
    msg_prop_owned_other: { it: '{{prop}} appartiene a {{owner}}. Affitto: {{rent}}€', en: '{{prop}} owned by {{owner}}. Rent: {{rent}}€', es: '{{prop}} de {{owner}}. Alquiler: {{rent}}€', fr: '{{prop}} à {{owner}}. Loyer: {{rent}}€' },
    msg_prop_bought:      { it: '{{name}} acquista {{prop}} per {{price}}€', en: '{{name}} buys {{prop}} for {{price}}€', es: '{{name}} compra {{prop}} por {{price}}€', fr: '{{name}} achète {{prop}} pour {{price}}€' },
    msg_rent_paid:        { it: '{{name}} paga {{rent}}€ di affitto a {{owner}}', en: '{{name}} pays {{rent}}€ rent to {{owner}}', es: '{{name}} paga {{rent}}€ de alquiler a {{owner}}', fr: '{{name}} paie {{rent}}€ de loyer à {{owner}}' },
    msg_mortgaged:        { it: '{{prop}} ipotecata per {{amount}}€', en: '{{prop}} mortgaged for {{amount}}€', es: '{{prop}} hipotecada por {{amount}}€', fr: '{{prop}} hypothéquée pour {{amount}}€' },
    msg_unmortgaged:      { it: '{{prop}} riscattata per {{amount}}€', en: '{{prop}} unmortgaged for {{amount}}€', es: '{{prop}} rescatada por {{amount}}€', fr: '{{prop}} rachetée pour {{amount}}€' },
    msg_house_built:      { it: 'Casa costruita su {{prop}}',       en: 'House built on {{prop}}',          es: 'Casa construida en {{prop}}',      fr: 'Maison construite sur {{prop}}'    },
    msg_hotel_built:      { it: 'Hotel costruito su {{prop}}',      en: 'Hotel built on {{prop}}',          es: 'Hotel construido en {{prop}}',     fr: 'Hôtel construit sur {{prop}}'      },

    /* ── JAIL ───────────────────────────────── */
    msg_go_to_jail:       { it: '{{name}} va in prigione!',        en: '{{name}} goes to jail!',           es: '¡{{name}} va a la cárcel!',        fr: '{{name}} va en prison!'            },
    msg_jail_turn:        { it: '{{name}} è in prigione ({{turns}}/3)', en: '{{name}} is in jail ({{turns}}/3)', es: '{{name}} en la cárcel ({{turns}}/3)', fr: '{{name}} en prison ({{turns}}/3)' },
    msg_jail_escaped_roll:{ it: '{{name}} esce dalla prigione con un doppio!', en: '{{name}} escapes jail with doubles!', es: '{{name}} sale con dobles.', fr: '{{name}} sort avec un double!' },
    msg_jail_escaped_pay: { it: '{{name}} paga la cauzione e viene liberato.', en: '{{name}} pays bail and is released.', es: '{{name}} paga la fianza.', fr: '{{name}} paie sa caution.' },
    msg_jail_escaped_card:{ it: '{{name}} usa la carta Uscite di prigione.', en: '{{name}} uses Get Out of Jail card.', es: '{{name}} usa la carta.', fr: '{{name}} utilise la carte.' },
    msg_jail_fine:        { it: '{{name}} paga {{amount}}€ di multa per uscire.', en: '{{name}} pays {{amount}}€ fine to leave.', es: '{{name}} paga {{amount}}€ de multa.', fr: '{{name}} paie {{amount}}€ d\'amende.' },

    /* ── TAX ────────────────────────────────── */
    msg_tax_income:       { it: '{{name}} paga {{amount}}€ di imposta sul reddito.', en: '{{name}} pays {{amount}}€ income tax.', es: '{{name}} paga {{amount}}€ de impuesto.', fr: '{{name}} paie {{amount}}€ d\'impôt.' },
    msg_tax_luxury:       { it: '{{name}} paga {{amount}}€ di tassa di lusso.',     en: '{{name}} pays {{amount}}€ luxury tax.',  es: '{{name}} paga {{amount}}€ de lujo.',     fr: '{{name}} paie {{amount}}€ de luxe.'  },

    /* ── CARDS ──────────────────────────────── */
    msg_card_drawn:       { it: '{{name}} pesca una carta {{type}}', en: '{{name}} draws a {{type}} card', es: '{{name}} saca una carta {{type}}', fr: '{{name}} tire une carte {{type}}' },
    card_type_chance:     { it: 'Sorte',                            en: 'Chance',                          es: 'Suerte',                           fr: 'Chance'                            },
    card_type_community:  { it: 'Cassa della Comunità',            en: 'Community Chest',                 es: 'Fondo Común',                      fr: 'Caisse Commune'                    },

    /* ── TRADE ──────────────────────────────── */
    msg_trade_proposed:   { it: '{{from}} propone uno scambio a {{to}}', en: '{{from}} proposes a trade to {{to}}', es: '{{from}} propone intercambio a {{to}}', fr: '{{from}} propose un échange à {{to}}' },
    msg_trade_accepted:   { it: '{{to}} accetta lo scambio.',       en: '{{to}} accepts the trade.',        es: '{{to}} acepta el intercambio.',    fr: '{{to}} accepte l\'échange.'        },
    msg_trade_rejected:   { it: '{{to}} rifiuta lo scambio.',       en: '{{to}} rejects the trade.',        es: '{{to}} rechaza el intercambio.',   fr: '{{to}} refuse l\'échange.'         },

    /* ── AUCTION ────────────────────────────── */
    msg_auction_start:    { it: 'Asta per {{prop}}! Base: {{min}}€', en: 'Auction for {{prop}}! Starting: {{min}}€', es: 'Subasta por {{prop}}. Mínimo: {{min}}€', fr: 'Enchère pour {{prop}}! Départ: {{min}}€' },
    msg_auction_bid:      { it: '{{name}} offre {{amount}}€',        en: '{{name}} bids {{amount}}€',        es: '{{name}} oferta {{amount}}€',      fr: '{{name}} enchérit {{amount}}€'     },
    msg_auction_won:      { it: '{{name}} vince l\'asta per {{amount}}€', en: '{{name}} wins auction for {{amount}}€', es: '{{name}} gana la subasta por {{amount}}€', fr: '{{name}} remporte l\'enchère pour {{amount}}€' },

    /* ── BANKRUPTCY ─────────────────────────── */
    msg_bankrupt:         { it: '{{name}} è in bancarotta!',        en: '{{name}} is bankrupt!',            es: '¡{{name}} está en bancarrota!',    fr: '{{name}} est en faillite!'         },
    msg_bankrupt_join_bet:{ it: '{{name}} entra in modalità scommesse con {{chips}} chip.', en: '{{name}} joins betting mode with {{chips}} chips.', es: '{{name}} entra al modo apuestas con {{chips}} fichas.', fr: '{{name}} rejoint les paris avec {{chips}} jetons.' },

    /* ── BETTING MODE ───────────────────────── */
    msg_bet_high:         { it: 'Alto (>7) × 1.5',                 en: 'High (>7) × 1.5',                 es: 'Alto (>7) × 1.5',                  fr: 'Haut (>7) × 1.5'                  },
    msg_bet_low:          { it: 'Basso (<7) × 1.5',                en: 'Low (<7) × 1.5',                  es: 'Bajo (<7) × 1.5',                  fr: 'Bas (<7) × 1.5'                   },
    msg_bet_seven:        { it: 'Esatto 7 × 4',                    en: 'Exact 7 × 4',                     es: 'Exacto 7 × 4',                     fr: 'Exact 7 × 4'                       },
    msg_bet_double:       { it: 'Doppio × 3',                      en: 'Double × 3',                      es: 'Dobles × 3',                       fr: 'Double × 3'                        },
    msg_bet_exact:        { it: 'Numero esatto × 6',               en: 'Exact number × 6',                es: 'Número exacto × 6',                fr: 'Numéro exact × 6'                  },
    msg_bet_won:          { it: '{{name}} vince la scommessa! +{{amount}} chip', en: '{{name}} wins the bet! +{{amount}} chips', es: '{{name}} gana la apuesta! +{{amount}} fichas', fr: '{{name}} gagne le pari! +{{amount}} jetons' },
    msg_bet_lost:         { it: '{{name}} perde la scommessa. -{{amount}} chip', en: '{{name}} loses the bet. -{{amount}} chips', es: '{{name}} pierde la apuesta. -{{amount}} fichas', fr: '{{name}} perd le pari. -{{amount}} jetons' },
    msg_reentry:          { it: '{{name}} ha raggiunto {{chips}} chip e rientra in gioco!', en: '{{name}} reached {{chips}} chips and re-enters!', es: '{{name}} alcanzó {{chips}} fichas y ¡vuelve!', fr: '{{name}} atteint {{chips}} jetons et revient!' },

    /* ── GAME FLOW ──────────────────────────── */
    msg_game_created:     { it: 'Partita creata. Codice: {{code}}', en: 'Game created. Code: {{code}}',    es: 'Partida creada. Código: {{code}}',  fr: 'Partie créée. Code: {{code}}'      },
    msg_game_joined:      { it: '{{name}} si è unito alla partita.', en: '{{name}} joined the game.',      es: '{{name}} se unió.',                 fr: '{{name}} a rejoint la partie.'     },
    msg_game_started:     { it: 'La partita inizia!',               en: 'The game begins!',                es: '¡Empieza el juego!',                fr: 'La partie commence!'               },
    msg_game_over:        { it: '{{name}} vince la partita! 🎉',    en: '{{name}} wins the game! 🎉',      es: '¡{{name}} gana! 🎉',                fr: '{{name}} gagne! 🎉'                },
    msg_waiting_players:  { it: 'In attesa di giocatori…',          en: 'Waiting for players…',            es: 'Esperando jugadores…',              fr: 'En attente de joueurs…'            },
    msg_not_your_turn:    { it: 'Non è il tuo turno.',              en: 'Not your turn.',                  es: 'No es tu turno.',                   fr: 'Ce n\'est pas votre tour.'         },
    msg_already_rolled:   { it: 'Hai già lanciato.',                en: 'You already rolled.',             es: 'Ya lanzaste.',                      fr: 'Vous avez déjà lancé.'             },
    msg_must_roll_first:  { it: 'Devi prima lanciare i dadi.',      en: 'You must roll first.',            es: 'Debes lanzar primero.',             fr: 'Vous devez d\'abord lancer.'       },

    /* ── ERRORS ─────────────────────────────── */
    err_not_enough_money: { it: 'Non hai abbastanza soldi.',        en: 'Not enough money.',               es: 'No tienes suficiente dinero.',      fr: 'Pas assez d\'argent.'              },
    err_no_monopoly:      { it: 'Devi avere il monopolio per costruire.', en: 'You need the full set to build.', es: 'Necesitas el monopolio para construir.', fr: 'Il faut le monopole pour construire.' },
    err_max_houses:       { it: 'Numero massimo di case raggiunto.', en: 'Maximum houses reached.',        es: 'Máximo de casas alcanzado.',        fr: 'Nombre maximum de maisons atteint.' },
    err_sell_hotel_first: { it: 'Vendi prima l\'hotel.',            en: 'Sell the hotel first.',           es: 'Vende el hotel primero.',           fr: 'Vendez l\'hôtel d\'abord.'         },
    err_already_mortgaged:{ it: 'Proprietà già ipotecata.',         en: 'Property already mortgaged.',     es: 'Propiedad ya hipotecada.',          fr: 'Propriété déjà hypothéquée.'       },
    err_invalid_bet:      { it: 'Scommessa non valida.',            en: 'Invalid bet.',                    es: 'Apuesta no válida.',                fr: 'Pari invalide.'                    },
    err_invalid_code:     { it: 'Codice partita non valido.',       en: 'Invalid game code.',              es: 'Código de partida inválido.',       fr: 'Code de partie invalide.'          },
    err_game_full:        { it: 'Partita piena (max 6 giocatori).', en: 'Game full (max 6 players).',      es: 'Partida llena (máx. 6).',           fr: 'Partie complète (max 6 joueurs).'  },
    err_game_started:     { it: 'La partita è già iniziata.',       en: 'Game already started.',           es: 'La partida ya empezó.',             fr: 'La partie a déjà commencé.'        },

    /* ── NAV / LAYOUT ───────────────────────── */
    nav_logout:           { it: 'Esci',               en: 'Logout',            es: 'Salir',             fr: 'Quitter'           },

    /* ── LOBBY ──────────────────────────────── */
    lobby_your_profile:   { it: 'Il tuo profilo',     en: 'Your profile',      es: 'Tu perfil',         fr: 'Ton profil'        },
    lobby_your_name:      { it: 'Nome',               en: 'Name',              es: 'Nombre',            fr: 'Nom'               },
    lobby_your_token:     { it: 'Pedina',             en: 'Token',             es: 'Ficha',             fr: 'Pion'              },
    lobby_selected:       { it: 'Selezionata:',       en: 'Selected:',         es: 'Seleccionada:',     fr: 'Sélectionnée:'     },
    lobby_rooms:          { it: 'Stanze',             en: 'Rooms',             es: 'Salas',             fr: 'Salles'            },
    lobby_create_room:    { it: '+ Crea stanza',      en: '+ Create room',     es: '+ Crear sala',      fr: '+ Créer salle'     },
    lobby_no_rooms:       { it: 'Nessuna stanza aperta. Creane una!', en: 'No open rooms. Create one!', es: 'Sin salas. ¡Crea una!', fr: 'Aucune salle. Créez-en une!' },
    lobby_modal_title:    { it: 'Nuova stanza',       en: 'New room',          es: 'Nueva sala',        fr: 'Nouvelle salle'    },
    lobby_modal_name:     { it: 'Nome stanza',        en: 'Room name',         es: 'Nombre sala',       fr: 'Nom salle'         },
    lobby_modal_max:      { it: 'Giocatori massimi',  en: 'Max players',       es: 'Jugadores máx.',    fr: 'Joueurs max.'      },
    lobby_modal_cancel:   { it: 'Annulla',            en: 'Cancel',            es: 'Cancelar',          fr: 'Annuler'           },
    lobby_modal_confirm:  { it: 'Crea',               en: 'Create',            es: 'Crear',             fr: 'Créer'             },

    /* ── LOGIN ──────────────────────────────── */
    login_subtitle:       { it: 'Inserisci la password per entrare', en: 'Enter password to access', es: 'Ingresa la contraseña', fr: 'Entrez le mot de passe' },
    login_enter:          { it: 'Entra',              en: 'Enter',             es: 'Entrar',            fr: 'Entrer'            },
    login_error:          { it: 'Password errata. Riprova.', en: 'Wrong password. Try again.', es: 'Contraseña incorrecta.', fr: 'Mot de passe incorrect.' },
  };

  /* ══════════════════════════════════════════
     INTERPOLATION  {{var}} → value
  ══════════════════════════════════════════ */
  function interpolate(str, vars) {
    if (!vars) return str;
    return str.replace(/\{\{(\w+)\}\}/g, (_, key) =>
      vars[key] !== undefined ? vars[key] : `{{${key}}}`
    );
  }

  /* ══════════════════════════════════════════
     PUBLIC — t()
  ══════════════════════════════════════════ */
  function t(key, vars) {
    const entry = DICT[key];
    if (!entry) {
      console.warn(`[i18n] Missing key: "${key}"`);
      return key;
    }
    const raw = entry[currentLang] || entry['en'] || key;
    return interpolate(raw, vars);
  }

  function setLanguage(lang) {
    if (LANGUAGES[lang]) {
      currentLang = lang;
      document.documentElement.lang = lang;
      document.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
    }
  }

  function getLanguage()  { return currentLang; }
  function getLanguages() { return { ...LANGUAGES }; }
  function getKeys()      { return Object.keys(DICT); }

  return { t, setLanguage, getLanguage, getLanguages, getKeys };

})();

/* ── Global shorthand ───────────────────────── */
const t = (key, vars) => Translations.t(key, vars);
