window.addEventListener('load', () => new beeMain());

export class beeMain extends EventTarget {
  constructor() {
    super();

    this.hintText = null;
    this.lettersArray = null;
    this.priorLettersArray = null;
    this.statsArray = null;
    this.letterCountArray = null;
    this.wordList = [];
    this.totalWords = null;
    this.wordsFound = 0;
    this.totalPoints = null;
    this.pointScore = 0;
    this.pangrams = 0;
    this.pangramsFound = 0;
    this.perfectPangrams = 0;
    this.perfectPangramsFound = 0;
    this.rank = 'Beginner';
    this.rankings = [
      {
        name: 'Beginner',
        percentage: 0,
        score: null,
      },
      {
        name: 'Good Start',
        percentage: 0.02,
        score: null,
      },
      {
        name: 'Moving Up',
        percentage: 0.05,
        score: null,
      },
      {
        name: 'Good',
        percentage: 0.08,
        score: null,
      },
      {
        name: 'Solid',
        percentage: 0.15,
        score: null,
      },
      {
        name: 'Nice',
        percentage: 0.25,
        score: null,
      },
      {
        name: 'Great',
        percentage: 0.4,
        score: null,
      },
      {
        name: 'Amazing',
        percentage: 0.5,
        score: null,
      },
      {
        name: 'Genius',
        percentage: 0.7,
        score: null,
      },
      {
        name: 'Queen Bee',
        percentage: 1,
        score: null,
      },
    ];
    this.bingoArray = [];
    this.isBingo = false;
    this.times = {
      start: {
        timestamp: null,
        elapsed: null,
      },
      genius: {
        timestamp: null,
        elapsed: null,
      },
      hints: {
        timestamp: null,
        elapsed: null,
      },
      definitions: {
        timestamp: null,
        elapsed: null,
      },
      queen_bee: {
        timestamp: null,
        elapsed: null,
      },
      current: {
        timestamp: null,
        elapsed: null,
      },
    };

    this.mode = 'hints';

    // DOM elements
    this.addWordContainer = document.getElementById('add-word-block');
    this.lettersBlockContainer = document.getElementById('letters-block');
    this.statsBlockContainer = document.getElementById('stats-block');
    this.gridTableContainer = document.getElementById('grid-table');
    this.beeGridInput = document.getElementById('bee-grid');
    this.beeWordInput = document.getElementById('bee-word');
    this.backspaceButton = document.getElementById('backspace-button');
    this.enterButton = document.getElementById('enter-button');
    this.shareButton = document.getElementById('share_button');
    this.askButton = document.getElementById('ask_button');
    this.notification = document.getElementById('notification');

    this.milestoneDialog = document.getElementById('milestone-dialog');
    this.dialogClose = document.getElementById('dialog-close');
    this.dialogStatus = document.getElementById('dialog-status');
    this.dialogTime = document.getElementById('dialog-time');
    this.dialogShareButton = document.getElementById('dialog-share_button');
    
    this.listTabsContainer = document.getElementById('list-tabs');
    this.twoLetterListsTab = document.getElementById('two-letter-lists-tab');
    this.twoLetterListContainer = document.getElementById('two-letter-lists');
    this.discoveryOrderListTab = document.getElementById('discovery-order-list-tab');
    this.discoveryOrderListContainer = document.getElementById('discovery-order-list');
    this.discoveryOrderList = null;
    
    this.wordCountStatEl = null;
    this.pointStatEl = null;
    this.rankStatEl = null;
    this.pangramStatEl = null;
    this.perfectPangramStatEl = null;
    this.bingoStatEl = null;

    this._init();
  }
  
  /**
   * Initializes the module.
   * @private
   * @memberOf beeMain
   */
  _init() {
    this.beeGridInput.addEventListener('input', this._parseHints.bind(this));

    this.beeWordInput.addEventListener('change', this._addWord.bind(this));
    this.beeWordInput.addEventListener('animationend', () => this.beeWordInput.classList.remove('accept', 'reject') );
    this.backspaceButton.addEventListener('click', this._backspace.bind(this) );
    this.enterButton.addEventListener('click', () => this.beeWordInput.dispatchEvent(new Event('change')) );
  
    this.shareButton.addEventListener('click', this._shareStatus.bind(this));
    this.dialogClose.addEventListener('click', this._closeDialog.bind(this) );

    this.dialogShareButton.addEventListener('click', this._shareStatus.bind(this));
  }

  /**
   * Parses the pasted input string from the NYT Spelling Bee hints page.
   * @param {Event} event The event on the element.
   * @private
   * @memberOf beeMain
   */
  _parseHints(event) {
    const target = event.target;
    this.hintText = target.value;

    if (this.hintText) {

      // TODO: find if user was previously in no-hints mode, by examinine if the letters array was the same
      if (this.lettersArray) {
        this.priorLettersArray = this.lettersArray.slice();
      }
      
      // get current list of letters
      const hasLetters = this._findLetterList();
 

      if (!hasLetters) {
        this._showMessage('No list of letters found', 'warn');
      } else {
        // compare prior and current list of letters, irrespective of order
        let isSameLetters = false;
        if (this.priorLettersArray) {
          isSameLetters = this.lettersArray.length === this.priorLettersArray.length &&
            this.lettersArray.every( (element) => this.priorLettersArray.includes(element) );
        } 
        
        // if there wasn't a prior (no-hints) session, or 
        //   if there was a session but it was for a different set of lettters,
        //   then start the clock for a new game
        if (!this.priorLettersArray || isSameLetters) {
          // start the clock
          this.times.start.timestamp =  Date.now(); 
        }    
        // console.log('isSameLetters', isSameLetters);


        this.listTabsContainer.classList.remove('hidden');
        this._createDiscoveryOrderList();

        const hasStats = this._findStats();
        if (!hasStats) {
          this.mode = 'no-hints';
          // no stats, only letters, so default to the discovered word tab
          this.discoveryOrderListTab.checked = true;
        } else {      
          // note time hints are posted
          this.times.hints.timestamp =  Date.now(); // start, genius, hints, definitions, queen_bee

          // set mode to having hints
          this.mode = 'hints';

          // has letters and stats, so default to the two-letter list tab
          this.twoLetterListsTab.checked = true;

          // find and display the grid and two-letter lists
          this._findGrid();
          this._findTwoLetterList();

          if (!isSameLetters) {
            // has a different letter array, so wipe the word list 
            this.wordList = [];
          } else {
            // has the same letter array, so this is the same session, 
            //  so add any existing discovered words in word list to two-letter lists
            this.wordList.forEach( (entry) => {
              const word = entry.word;
              
              // add word to discovery-order list
              this._displayDiscoveryOrderListWord( word, 'className', entry.isPangram );

              // find matching two-letter category
              const twoLetterCode = word.substring(0, 2).toUpperCase();
              this._displayTwoLetterListWord( word, twoLetterCode, entry.isPangram );
            });

            // now that we can calculate ranks, show rank
            this._updateRank();
          }
        }

        target.closest('details').removeAttribute('open');
        this.addWordContainer.classList.remove('hidden');
      }
    }
  }

  /**
   * Finds list of letters.
   * @private
   * @memberOf beeMain
   */
  _findLetterList() {
    const letterList = this.hintText.match(/(\w\s){6}\w/);
    if (letterList) {
      this.lettersBlockContainer.replaceChildren('');
      this.lettersArray = letterList[0].split(/\s/);

      for (let letterIndex = 0; letterIndex < this.lettersArray.length; letterIndex++) {
        const letter = this.lettersArray[letterIndex].toLowerCase();
        this.lettersArray[letterIndex] = letter;
        const letterButton = document.createElement('button');
        letterButton.append( letter );
        letterButton.classList.add('letter_button', 'button');
        if (letterIndex === 0) {
          letterButton.classList.add('center_letter');
        }
        letterButton.addEventListener('click', this._addLetter.bind(this) );
        this.lettersBlockContainer.append( letterButton );
      }

      // this.times.start.timestamp =  Date.now(); // start, genius, hints, definitions, queen_bee

      return true;
    } else {
      return false;
    }
  }

  /**
   * Finds and outputs the word statistics.
   * @private
   * @memberOf beeMain
   */
  _findStats() {
    const statsList = this.hintText.match(/WORDS: .+/);
    if (statsList) {
      // stats block found
      this.statsArray = statsList[0].split(',');
      this._showStats();
      return true;
    } else {
      // no stats block found, but show basic point and word counts
      this._showStats();
      return false;
    }
  }

  /**
   * Outputs the word statistics.
   * @private
   * @memberOf beeMain
   */
  _showStats() {
    // remove any existing stats cards
    this._clearStatBlock()

    // get stats and create stats cards
    this._showWordCount();
    this._showScoreAndRank();
    if (this.statsArray) {
      this._showPangrams();
      this._showBingo();
    } 
  }

  /**
   * Calculates the word count total possible score.
   * @private
   * @memberOf beeMain
   */
  _showWordCount() {
    if (this.statsArray) {
      // parse stats for total word count
      const totalWordsArray = this.statsArray[0].split(':');
      this.totalWords = parseInt(totalWordsArray[1]);
    }

    // create word status card
    this._createStatCard( 'words', 
      [
        {
          title: 'word-count',
          value: this.totalWords,
          current: this.wordsFound,
        },
      ]
    );
    this.wordCountStatEl = document.getElementById('word-count-current');

    if (!this.statsArray) {
      // if no stats, then we don't have a total word count, 
      // so replace the total word count with just the current word count
      this.wordCountStatEl.parentNode.replaceChildren(this.wordCountStatEl);
    }
  }

  /**
   * Calculates the score rankings based on the total possible score.
   * @private
   * @memberOf beeMain
   */
  _showScoreAndRank() {
    if (this.statsArray) {
      const scoreArray = this.statsArray[1].split(':');
      this.totalPoints = parseInt(scoreArray[1]);
  
      // let ranksOutput = '';
      if (this.totalPoints) {
        this.rankings.forEach(( rank ) => {
          rank.score = Math.round(this.totalPoints * rank.percentage); 

          // testing output
          // ranksOutput += `${rank.name}: ${rank.score}, `;
        });
        // console.log('rankings', ranksOutput);
      }
    } 
    // else {
    //   this.mode = 'no-hints';
    // }

    // show output
    this._createStatCard( 'points', 
      [
        {
          title: 'points',
          value: this.totalPoints,
          current: this.pointScore,
        },
        {
          title: 'rank',
          value: this.rank,
          current: this.rank,
        },
      ]
    );

    this.pointStatEl = document.getElementById('points-current');
    this.rankStatEl = document.getElementById('rank-stat');

    if (!this.statsArray) {
      // if no stats, then we can't determine rank, only raw points, 
      // so remove the total points and rank entry
      this.pointStatEl.parentNode.replaceChildren(this.pointStatEl);
      this.rankStatEl.remove();
    } else {
      // remove unnecessary points from ranking
      if (this.rankStatEl) {
        this.rankStatEl.replaceChildren( this.rankings[0].name );
      }
    }
  }

  /**
   * Calculates the pangrams based on the total possible score.
   * @private
   * @memberOf beeMain
   */
  _showPangrams() {
    const pangramArray = this.statsArray[2].split('(');
    this.pangrams = parseInt(pangramArray[0].split(':')[1]);
    this.perfectPangrams = pangramArray[1] ? parseInt(pangramArray[1].split(' ')[0]) : 0;
    const valuesArray = [
      {
        title: 'pangrams',
        value: this.pangrams,
        current: this.pangramsFound,    
      },
    ];
    if (this.perfectPangrams) {
      valuesArray.push({
        title: 'perfect',
        value: this.perfectPangrams,
        current: this.perfectPangramsFound,
      });
    }
    this._createStatCard( 'pangrams', valuesArray );

    this.pangramStatEl = document.getElementById('pangrams-current');
    this.perfectPangramStatEl = document.getElementById('perfect-current');

    const perfectPangramTotalEl = document.getElementById('perfect-total');
    if (perfectPangramTotalEl) {
      perfectPangramTotalEl.append( ' perfect' );
    }
  }

  /**
   * Creates a bingo card, if there is a bingo.
   * @private
   * @memberOf beeMain
   */
   _showBingo() {
    const bingo = this.statsArray[3];
    if (this.statsArray[3]) {
      this._createStatCard( 'bingo', [
        {
          title: 'bingo',
          value: null,
          current: null,
        },
      ]);
      this.bingoStatEl = document.getElementById('bingo-stat');
      this.bingoStatEl.replaceChildren('?');
    }
  }

  /**
   * REmove all stats cards from the stats block.
   * @private
   * @memberOf beeMain
   */
  _clearStatBlock() {
    this.statsBlockContainer.replaceChildren( '' );
  }

  /**
   * Create and insert a stat card.
   * @private
   * @memberOf beeMain
   */
  _createStatCard( title, valuesArray ) {
    const statsCard = document.createElement('div');
    statsCard.classList.add('stat_card');

    const statsTitle = document.createElement('p');
    statsTitle.classList.add('stats_title');
    statsTitle.append( title );
    statsCard.append( statsTitle );

    // this.statsBlockContainer
    for (const value of valuesArray) {
      const statValue = document.createElement('p');
      statValue.id = `${value.title}-stat`;
      statValue.classList.add('stat_value');

      const currentValue = document.createElement('span');
      currentValue.id = `${value.title}-current`;
      currentValue.append( value.current );

      const totalValue = document.createElement('span');
      totalValue.id = `${value.title}-total`;
      totalValue.append( value.value );

      statValue.append( currentValue, ' / ', totalValue );
      statsCard.append( statValue );
    }

    this.statsBlockContainer.append( statsCard );
  }


  /**
   * Finds the letter word-count grid and processes it to be output as a table.
   * @private
   * @memberOf beeMain
   */
  _findGrid() {
    const header = this._findGridHeader();
    const wordLengths = this._findWordLengthCounts();
    const totals = this._findWordLengthTotals();

    const gridTableArray = wordLengths;
    gridTableArray.unshift(header);
    gridTableArray.push(totals);

    this._createGrid(gridTableArray);
  }

  /**
   * Finds and formats the header row in the grid.
   * @private
   * @memberOf beeMain
   * @return {Array} An array of header word counts.
   */
  _findGridHeader() {
    // const gridHeaderList = this.hintText.match(/(\n\d[\s+\t+].+Σ)/);
    const gridHeaderList = this.hintText.match(/(\d[^\S+\r+\n+].+Σ)/);
    if (gridHeaderList) {
      const gridHeaderArray = this._whitespacedStringToArray( gridHeaderList[0] );
      this.letterCountArray = gridHeaderArray.slice(0, -1).map( (str) => parseInt(str, 10) );
      gridHeaderArray.unshift('');
      return gridHeaderArray;
    }
    return []; 
  }

  /**
   * Finds and formats rows of letters and word counts in the grid.
   * @private
   * @memberOf beeMain
   * @return {Array} An array of arrays of letters and word counts.
   */
  _findWordLengthCounts() {
    const wordLengthLetterArray = this.hintText.match(/\n([A-Za-z]){1}:\s.+\d/g);
    const gridTableArray = [];  
    if (wordLengthLetterArray) {
      const wordLengthRows = [];
      for (let row of wordLengthLetterArray) {
        const wordLengthRowArray = this._whitespacedStringToArray( row );
        wordLengthRows.push(wordLengthRowArray);
      }

      for (let wordLengthRow of wordLengthRows) {
        const newRow = wordLengthRow.map((str, index) => {
          if ( index === 0 ) {
            return str.replace(/[:\s\t]/g, '');
          }
          return parseInt(str) || '-';
        });
        gridTableArray.push(newRow);
      }
    }
    return gridTableArray;
  }

  /**
   * Finds and formats the footer row of grid totals.
   * @private
   * @memberOf beeMain
   * @return {Array} An array of footer grid totals.
   */
  _findWordLengthTotals() {
    const wordLengthTotalList = this.hintText.match(/Σ:\s.+\d/);
    if (wordLengthTotalList) {
      const wordLengthTotalArray = this._whitespacedStringToArray( wordLengthTotalList[0] );
      return wordLengthTotalArray;
    }
    return []; 
  }

  /**
   * Finds and formats the footer row of grid totals.
   * @private
   * @memberOf beeMain
   * @return {Array} An array of footer grid totals.
   */
  _whitespacedStringToArray(str = '') {
    const trimmed = str.trim();
    const replaced = trimmed.replace(/\t+/g, ' ').replace(/\s+/g, ' ');
    const strArray = replaced.split(/\s+/);
    return strArray; 
  }

  /**
   * Finds list of two-letter codes.
   * @private
   * @memberOf beeMain
   */
  _findTwoLetterList() {
    let twoLetterArray = this.hintText.match(/\w\w-\d+/g);
    if (twoLetterArray) {
      twoLetterArray = twoLetterArray.map((str) => str.toUpperCase() );
      this._createTwoLetterList( twoLetterArray );
    }  else {
      this._showMessage('No list of two letters found', 'warn');
    }
  }

  /**
   * Creates word count grid as table.
   * @param {Array} gridTableArray The array of all grid cells.
   * @private
   * @memberOf beeMain
   */
  _createGrid( gridTableArray ) {
    const gridTable = document.createElement('table');
    const tableHead = gridTable.createTHead();
    const tableBody = gridTable.createTBody();
    const tableFoot = gridTable.createTFoot();

    const rowLength = gridTableArray.length;
    for (let rowIndex = 0; rowIndex < rowLength; rowIndex++) {
      const row = gridTableArray[rowIndex];

      let container = tableBody;
      if (rowIndex === 0) {
        container = tableHead;
      } else if (rowIndex === rowLength - 1) {
        container = tableFoot;
      }

      const letterHead = row[0].toUpperCase();
      const rowEl = container.insertRow();
      let columnLength = row.length;
      for (let columnIndex = 0; columnIndex < columnLength; columnIndex++) {
        const column = row[columnIndex];
        const wordCount = gridTableArray[0][columnIndex].trim();

        let cellType = 'td';
        let cellContent = column;
        let cellId = null;
        if (rowIndex === 0 || columnIndex === 0) {
          cellType = 'th';
        } else if (rowIndex === rowLength - 1) {
          cellId = `Σ-${wordCount}`;
        } else {
          if (typeof column === 'number') {
            const id = `${letterHead}-${wordCount}`;
            if (columnIndex === columnLength - 1) {
              cellContent = column;
              cellId = id;
            } else {
              cellContent = this._createNumberInput( column, id );
            }
          } else {
            cellContent = '';
          }
        }

        const cellEl = document.createElement(cellType);
        if (cellId) {
          cellEl.id = cellId;
        }
        cellEl.append(cellContent);
        rowEl.append(cellEl);
      }
    }

    this.gridTableContainer.replaceChildren(gridTable); 
  }

  /**
   * Creates discovery-order list output.
   * @private
   * @memberOf beeMain
   */
  _createDiscoveryOrderList() {
    this.discoveryOrderList = document.createElement('ol');
    this.discoveryOrderListContainer.replaceChildren( this.discoveryOrderList ); 
  }

  /**
   * Creates two letter list output.
   * @param {Array} twoLetterArray The lest of two letter codes, with the first two letter and the length of the word.
   * @private
   * @memberOf beeMain
   */
  _createTwoLetterList( twoLetterArray ) {
    const list = document.createElement('dl');

    for (const twoLetterCount of twoLetterArray) {
      const twoLetterCodeArray = twoLetterCount.split('-');
      const twoLetterCode = twoLetterCodeArray[0];
      const count = parseInt(twoLetterCodeArray[1]);

      const twoLetterTermEl = document.createElement('dt');
      twoLetterTermEl.classList.add(twoLetterCode[0], twoLetterCode);
      twoLetterTermEl.id = twoLetterCode;

      const twoLetterItem = document.createElement('span');
      twoLetterItem.append( twoLetterCode );
      twoLetterItem.classList.add('two_letter_code');
      twoLetterTermEl.append( twoLetterItem );

      const separator = document.createElement('span');
      separator.classList.add('separator');
      separator.append( '-' );
      twoLetterTermEl.append( separator );

      const twoLetterValue = this._createNumberInput( count, `${twoLetterCount}-count` );
      twoLetterTermEl.append( twoLetterValue );

      const lengthCountEl = document.createElement('span');
      lengthCountEl.classList.add('length-counts');
      twoLetterTermEl.append( lengthCountEl );

      list.append( twoLetterTermEl );
    }

    this.twoLetterListContainer.replaceChildren( list ); 
  }

  /**
   * Adds a word to the list of found words.
   * @param {Event} event The event on the element.
   * @private
   * @memberOf beeMain
   */
  _addWord( event ) {
    const target = event.target;
    const addWordList = target.value.trim();

    // clear the input
    target.value = '';

    if (addWordList) {
      const wordArray = addWordList.split(/\W+/);
      for (let eachWord of wordArray) {
        eachWord = eachWord.toLowerCase();

        if (!eachWord.includes(this.lettersArray[0])) {
          this.beeWordInput.classList.add('reject');
          this._showMessage('Missing central letter');
        } else {
          // find length of word
          const wordLength = eachWord.length;
  
          // see if the word has already been entered
          // const prefoundWord = document.getElementById( `word-${word}` );
          // const prefoundWord = this.wordList.find(() ==> );
          const prefoundWord = this.wordList.find(({ word }) => word === eachWord);
          if (this.mode === 'hints' && !this.letterCountArray.includes(wordLength)) {
            this.beeWordInput.classList.add('reject');
            this._showMessage('Wrong number of letters');
          } else if (prefoundWord) {
            this.beeWordInput.classList.add('reject');
            this._showMessage('Word already found');
          } else{    
            // find first letter
            const firstLetter = eachWord.substring(0, 1).toUpperCase();
  
            // find matching two-letter category
            const twoLetterCode = eachWord.substring(0, 2).toUpperCase();
  
            const twoLetterTerm = document.getElementById( twoLetterCode );
  
            // make sure all letters in word are in letters list
            const isCorrectLetters = eachWord.split('').every((letter) => this.lettersArray.includes(letter));
  
            if (this.mode === 'hints' && !twoLetterTerm) {
              this.beeWordInput.classList.add('reject');
              this._showMessage('Doesn\'t match starting letters');
            } else if (!isCorrectLetters) {
              this.beeWordInput.classList.add('reject');
              this._showMessage('Doesn\'t match letters');
            } else {
              // word seems to be a valid entry, modulo inclusion in the game dictionary,
              //  so insert it into the two-letter list
              this.beeWordInput.classList.add('accept');
   
              const isPangram = this._checkPangram( eachWord );
              this._checkBingo( firstLetter );

              // add word to master word list
              this.wordList.push({
                word: eachWord,
                timestamp: Date.now(),
                isPangram,
                isPerfectPangram: null,
              });

              // this._showMessage('word added', '');


              // console.log('this.wordList', this.wordList);

              this.wordsFound = this.wordList.length;
              this._updateWordCount();

              // // add word to discovery-order list
              this._displayDiscoveryOrderListWord( eachWord, 'className', isPangram );

              // add word to appropriate two-letter list
              if (twoLetterTerm) {
                this._displayTwoLetterListWord( eachWord, twoLetterCode, isPangram );
              }

              // update score
              this._updateScore(wordLength, isPangram);
            }
          }
        }
      }
    }
  }

  /**
   * Adds a word to the discovery-order list.
   * @param {string} word The word to be added.
   * @private
   * @memberOf beeMain
   */
  _displayDiscoveryOrderListWord( word, className, isPangram ) {
    // add word to discovery-order list
    const wordDefEl = this._createWordListItem( word, false, className, isPangram );

    // get timestamp of entry
    const wordEntry = this.wordList.find(( entry ) => entry.word === word);

    const millis = wordEntry.timestamp - this.times.start.timestamp;
    // const seconds = Math.floor(millis / 1000);    
    const timeEl = document.createElement('time');
    // timeEl.append( ` ${seconds}s` );
    timeEl.append( this._formatTime(millis) );
    wordDefEl.append( ' ', timeEl );

    this.discoveryOrderList.append( wordDefEl );
  }

  /**
   * Adds a word to the appropriate two-letter list.
   * @param {string} word The word to be added.
   * @private
   * @memberOf beeMain
   */
  _displayTwoLetterListWord( word, className, isPangram ) {
    const twoLetterTerm = document.getElementById( className );

    const wordDefEl = this._createWordListItem( word, true, className, isPangram )
    twoLetterTerm.after( wordDefEl );

    // sort words alphabetically
    const siblingWords = Array.from(this.twoLetterListContainer.querySelectorAll(`dd.${className}`));
    siblingWords.sort( (a, b) => {
      if (a.id < b.id) {
        return -1;
      } else if (a.id > b.id) {
        return 1;
      }
      return 0;
    });
    twoLetterTerm.after( ...siblingWords );

    // update two-letter term and grid numbers
    this._updateGridCountsByWord( word );              
  }

  /**
   * Creates a list element for a word.
   * @param {string} word The word to be added.
   * @param {Boolean} isTwoLetterItem Whether this is for the two-letter lists or not.
   * @param {string} className A class for the element.
   * @param {Boolean} isPangram Whether this word is a pangram or not.
   * @private
   * @memberOf beeMain
   * @return {Element} The resulting word list element.
   */
  _createWordListItem( word, isTwoLetterItem, className, isPangram ) {
    let itemTag = 'dd';
    let itemId = `${word}-two-letters-word`;
    if (!isTwoLetterItem) {
      itemTag = 'li';
      itemId = `${word}-discovery-word`;
    }
    const defEl = document.createElement(itemTag);
    defEl.classList.add(className);
    defEl.id = itemId;

    const removeButton = document.createElement('button');
    removeButton.type = 'remove';
    removeButton.setAttribute('aria-label', `Remove ${word} from list`);
    removeButton.append( '×' );
    removeButton.addEventListener('click', this._removeWord.bind(this) );
    
    const wordEl = document.createElement('a');
    wordEl.href = `https://www.wordnik.com/words/${word}`;
    wordEl.target= '_blank';
    wordEl.append( word );

    if (isPangram) {
      wordEl.classList.add('pangram-word');
    }

    const wordLengthEl = document.createElement('span');
    wordLengthEl.append( `(${word.length})` );

    defEl.append( removeButton, wordEl, ' ', wordLengthEl );

    // parentEl.after( defEl );

    return defEl;
  }

  /**
   * Creates a number input element.
   * @param {string} value The value for the input element.
   * @param {string} id The id for the input element.
   * @private
   * @memberOf beeMain
   * @return {Element} The number input element.
   */
  _createNumberInput( value, id ) {
    const numberInput = document.createElement('input');
    numberInput.id = id;
    numberInput.type = 'number';
    numberInput.min = 0;
    // numberInput.value = value;
    this._setNumberInputValue( numberInput, value );

    return numberInput;
  }

  /**
   * Updates the counts in a number input.
   * @param {string} value The value for the input element.
   * @param {string} id The id for the input element.
   * @private
   * @memberOf beeMain
   * @return {Element} The number input element.
   */
  _updateGridCountsByWord( word, isDecrement = true ) {
    const modifier = isDecrement ? -1 : 1; 

    // find first letter
    const firstLetter = word.substring(0, 1).toUpperCase();
    // find matching two-letter category
    const twoLetterCode = word.substring(0, 2).toUpperCase();
    const wordLength = word.length;
    const twoLetterTerm = document.getElementById( twoLetterCode );


    // decrement or increment the two-letter count
    let countEl = twoLetterTerm.querySelector('input[type=number]');
    const countValue = +countEl.value + modifier;
    this._setNumberInputValue( countEl, countValue );
    if (countValue === 0) {
      this._toggleTwoLetterGroup( twoLetterCode );
    } else if (countValue === 1 && !isDecrement) {
      this._toggleTwoLetterGroup( twoLetterCode, false );
    }

    // decrement or increment the word-grid count
    let gridCountEl = document.getElementById(`${firstLetter}-${wordLength}`);
    if (gridCountEl) {
      const gridCountValue = +gridCountEl.value + modifier;
      const isDim = (gridCountValue === 0) ? true: false;
      this._setNumberInputValue( gridCountEl, gridCountValue, isDim );
    }

    // decrement or increment the word-grid letter total count
    let gridRowTotalCountEl = document.getElementById(`${firstLetter}-Σ`);
    // if (gridRowTotalCountEl) {
    //   this._setNumberInputValue( gridRowTotalCountEl, (+gridRowTotalCountEl.value + modifier) );
    // }
    gridRowTotalCountEl.replaceChildren( (+gridRowTotalCountEl.textContent + modifier) );


    // decrement or increment the word-grid word-length total count
    let gridWordLengthTotalEl = document.getElementById(`Σ-${wordLength}`);
    gridWordLengthTotalEl.replaceChildren( (+gridWordLengthTotalEl.textContent + modifier) );

    // decrement or increment the word-grid total word count
    let gridWordTotalEl = document.getElementById(`Σ-Σ`);
    const totalWordsLeft = +gridWordTotalEl.textContent + modifier;
    gridWordTotalEl.replaceChildren( totalWordsLeft );

    if (totalWordsLeft === 0) {
      // note time queen bee is reached
      // this.times.queen_bee.timestamp =  Date.now(); // start, genius, hints, definitions, queen_bee
    }

  
    this._showLetterCounts( firstLetter );
  }

  /**
   * Sets the value of a number input element.
   * @param {Element} target The input element to be set.
   * @param {string} value The value for the input element.
   * @param {Boolean} isDim Whether the value should be dimmed; default is false.
   * @private
   * @memberOf beeMain
   * @return {Element} The number input element.
   */
  _setNumberInputValue( target, value, isDim = false ) {
    target.value = value;
    target.setAttribute('value', value);
    if (isDim) {
      target.classList.add('dim');
    } else {
      target.classList.remove('dim');
    }
    return target;
  }

  /**
   * Count letter counts.
   * @param {string} firstLetter The first letter .
   * @private
   * @memberOf beeMain
   */
  _showLetterCounts( firstLetter ) {
    const letterCountsInputs = Array.from(this.gridTableContainer.querySelectorAll(`[id^=${firstLetter}-]`));
    const letterBinCounts = [];
    for (const el of letterCountsInputs) {
      const bin = el.id.split('-')[1];
      if (bin !== 'Σ') {
        let binCount = '';
        if (el.value > 0) {
          binCount = bin;
          if (el.value > 1) {
            binCount = `${el.value} ${bin}s`
          }
          letterBinCounts.push(binCount);
        }
      }
    }

    let letterBinTotals = letterBinCounts.join(', ');
    const twoLetterLists = Array.from(this.twoLetterListContainer.querySelectorAll(`.${firstLetter} span.length-counts`));
    const activeTwoLetterLists = twoLetterLists.filter( (el) => {
      // remove any previous displays
      el.textContent = '';

      // find only the elements greater than zero
      const input = el.parentNode.querySelector('input');
      return (input.value > 0);
    });
    
    if (activeTwoLetterLists.length > 1) {
      letterBinTotals = `?: ${letterBinTotals}`;
    }

    for (const entry of activeTwoLetterLists) {
      entry.textContent = letterBinTotals;
    }
  }

  /**
   * Toggle the opacity of a group of two-letter elements.
   * @param {string} twoLetterCode The class code for two-letter elements to be set.
   * @param {Boolean} isDim Whether the value should be dimmed; default is true.
   * @private
   * @memberOf beeMain
   */
  _toggleTwoLetterGroup( twoLetterCode, isDim = true ) {
    // const className = isDim ? ''
    const twoLetterEls = Array.from(this.twoLetterListContainer.querySelectorAll(`.${twoLetterCode}`));
    twoLetterEls.forEach( (el) => {
      if (isDim) {
        el.classList.add('dim');
        this._showMessage(`All ${twoLetterCode} words found!`, '');
      } else {
        el.classList.remove('dim');
      }
    });
  }

  /**
   * Checks if word is a pangram.
   * @param {string} value The word to be checked.
   * @param {Boolean} isIncrement Whether the value should be incremented or decremented; default is true.
   * @private
   * @memberOf beeMain
   * @return {Boolean} Whether the word is a pangram; true if yes, false if no.
   */
  _checkPangram( word, isIncrement = true ) {
    const modifier = isIncrement ? 1 : -1;
    // make sure all letters in word are in letters list
    const isPangram = this.lettersArray.every((letter) => word.includes(letter));
    if (isPangram) { 
      this.pangramsFound += modifier;
      if (word.length === 7) { 
        this.perfectPangramsFound += modifier;
      }
    }

    // update pangram display
    if (this.pangramStatEl) {
      this.pangramStatEl.replaceChildren(this.pangramsFound);
      if (this.perfectPangramStatEl) {
        this.perfectPangramStatEl.replaceChildren(this.perfectPangramsFound);
      }
    }

    return isPangram;
  }

  /**
   * Checks if bingo has been reached.
   * @param {string} value The word to be checked.
   * @private
   * @memberOf beeMain
   * @return {Boolean} Whether the word is a pangram; true if yes, false if no.
   */
  _checkBingo( firstLetter ) {
    // , isRemove = false
    if (!this.bingoArray.includes(firstLetter)) {
      this.bingoArray.push(firstLetter);
      if (this.bingoArray.length === 7) {
        this.isBingo = true;
      }
    }

    if (this.isBingo) {
      this._showMessage('Bingo!', '');
      this.bingoStatEl.replaceChildren('!');
    }
  }

  /**
   * Updates the score.
   * @param {Number} letterCount The value for the score.
   * @param {Boolean} isPangram Whether the word is a pangram; default is false.
   * @param {Boolean} isIncrement Whether the value should be incremented or decremented; default is true.
   * @private
   * @memberOf beeMain
   */
  _updateScore( letterCount, isPangram = false, isIncrement = true ) {
    const modifier = isIncrement ? 1 : -1;

    // point constants
    const fourLetterPoints = 1;
    const longerWordPoints = letterCount;
    const pangramBonusPoints = 7;

    let points = 0
    if (letterCount === 4) {
      points = fourLetterPoints * modifier;
    } else {
      points = longerWordPoints * modifier;
    }
    this.pointScore += points;

    let message = `${points} point${(points > 1)? 's' : ''}`;
    if (isPangram) {
      this.pointScore += (pangramBonusPoints * modifier);
      message = `Pangram! ${points} points, plus ${pangramBonusPoints} bonus points!`;
    }

    // update score display
    if (this.pointStatEl) {
      this.pointStatEl.replaceChildren(this.pointScore);
    }

    this._showMessage(message, '');

    this._updateRank();
  }

  /**
   * Updates the rank and displays it.
   * @private
   * @memberOf beeMain
   */
  _updateRank() {
    // find ranking
    let rank = null;
    for (const ranking of this.rankings) {
      if (this.pointScore >= ranking.score) {
        rank = ranking.name;
      } else {
        break;
      }
    }

    this.rank = rank;
    if (this.rankStatEl) {
      this.rankStatEl.replaceChildren( this.rank );
    }
  
    if (this.rank === 'Genius') {
      this.times.genius.timestamp =  Date.now(); // start, genius, hints, definitions, queen_bee
      // this._displayMilestone(); 
    } else if (this.rank === 'Queen Bee') {
      this.times.queen_bee.timestamp =  Date.now(); // start, genius, hints, definitions, queen_bee
      this._displayMilestone(); 
    }
  }

  /**
   * Updates the word count.
   * @param {string} value The value for the input element.
   * @param {string} id The id for the input element.
   * @private
   * @memberOf beeMain
   * @return {Element} The number input element.
   */
  _updateWordCount( isIncrement = true ) {
    const modifier = isIncrement ? 1 : -1;
    // if (letterCount === 4) {
    //   this.pointScore += modifier;
    // } else {
    //   this.pointScore += (letterCount * modifier);
    // }
    if (this.wordCountStatEl) {
      this.wordCountStatEl.replaceChildren( this.wordsFound );
    }
  }

  // /**
  //  * Sets the value of a number input element.
  //  * @param {Event} event The event on the element.
  //  * @private
  //  * @memberOf beeMain
  //  */
  // _updateInputValue( event ) {
  //   const target = event.target;
  //   this._setNumberInputValue( target, target.value );
  // }


  /**
   * Removes the word from the list of found words.
   * @param {Event} event The event on the element.
   * @private
   * @memberOf beeMain
   */
  _removeWord( event ) {
    const target = event.target;
    const targetWord = target.parentNode.id.split('-')[0];
    // update two-letter term and grid numbers
    this._updateGridCountsByWord( targetWord, false );
    const isPangram = this._checkPangram( targetWord, false );
    this._updateScore( targetWord.length, isPangram, false );

    const twoLetterEntry = document.getElementById(`${targetWord}-two-letters-word`); 
    twoLetterEntry.remove();
    const discoveryEntry = document.getElementById(`${targetWord}-discovery-word`); 
    discoveryEntry.remove();

    const wordIndex = this.wordList.findIndex(({ word }) => word === targetWord);
    this.wordList.splice( wordIndex, 1 );
  }

  /**
   * Adds a letter to the found word input.
   * @param {Event} event The event on the element.
   * @private
   * @memberOf beeMain
   */
  _addLetter( event ) {
    const target = event.target;
    const letter = target.textContent;
    this.beeWordInput.value += letter;
  }

  /**
   * Removes a letter to the found word input.
   * @param {Event} event The event on the element.
   * @private
   * @memberOf beeMain
   */
  _backspace() {
    this.beeWordInput.value = this.beeWordInput.value.slice(0, -1);
  }

  /**
   * Returns milliseconds into hh:mm:ss format.
   * @param {Number} milliseconds The milliseconds to be converted.
   * @private
   * @memberOf beeMain
   * @return {string} The time in hh:mm:ss format.
   */
  _formatTime( milliseconds ) {
    const hours = Math.floor((milliseconds / 1000 / 60 / 60) % 24);
    const minutes = Math.floor((milliseconds / 1000 / 60) % 60);
    const seconds = Math.floor((milliseconds / 1000) % 60);

    let time = '';
    if (hours) {
      time += `${hours}h`;
    }

    if (minutes) {
      time += `${minutes}m`;
    }

    if (seconds) {
      time += `${seconds}s`;
    }

    // return [
    //     hours.toString().padStart(2, '0'),
    //     minutes.toString().padStart(2, '0'),
    //     seconds.toString().padStart(2, '0')
    // ].join(':');
    return time;
  }

  /**
   * Posts a message to the user.
   * @param {string} message The message to be posted.
   * @param {string} codeType The type of message.
   * @private
   * @memberOf beeMain
   */
  _showMessage( message, codeType) {
    console.warn(message, codeType);

    // Add the 'show' class to notification
    this.notification.textContent = message;
    this.notification.className = 'show';

    // After 3 seconds, remove the show class from DIV
    setTimeout(() => { this.notification.className = this.notification.className.replace('show', ''); }, 3000);
  }


  /**
   * Displays milestone dialog.
   * @private
   * @memberOf beeMain
   */
   _displayMilestone() {
    // let elapsedTime = 0;
    let message = '';
    if (this.rank === 'Genius') {
      this.times.genius.elapsed = this.times.genius.timestamp - this.times.start.timestamp;
      this.times.current.elapsed = this.times.genius.elapsed;
      message = this.rank;
    } else if (this.rank === 'Queen Bee') {
      this.times.queen_bee.elapsed = this.times.queen_bee.timestamp - this.times.start.timestamp;
      this.times.current.elapsed = this.times.queen_bee.elapsed;

      message = `👑 ${this.rank} 🐝`;

      // now that puzzle is solved, remove dimming from all elements
      const dimmedEls = Array.from( document.querySelectorAll('.dim') );
      for (const dimmedEl of dimmedEls) {
        dimmedEl.classList.remove('dim');
      }
    }

    // display status dialog with score, time, and share options
    this.milestoneDialog = document.getElementById('milestone-dialog');
    this.dialogStatus.textContent = message;
    this.dialogTime.textContent = this._formatTime(this.times.current.elapsed);
    // this.dialogShareButton

    if (typeof this.milestoneDialog.showModal === 'function') {
      this.milestoneDialog.showModal();
    } else {
      this._showMessage('Dialog API not supported by this browser');
    }
  }

  /**
   * Closes milestone dialog.
   * @private
   * @memberOf beeMain
   */
   _closeDialog () {
    this.milestoneDialog.close(); 
  }

  /**
   * Posts a message to the user.
   * @private
   * @memberOf beeMain
   */
  async _shareStatus( event ) {
    const target = event.target;

    let message = null;
    if ( target === this.shareButton ) {
      let rank = this.rank;
      this.times.current.timestamp =  Date.now(); 
      if (this.rank === 'Queen Bee') {
        rank = '👑🐝! Show me the honey';
        this.times.current.elapsed = this.times.queen_bee.elapsed;
      } else if (this.rank === 'Genius') {
        rank = '🤓 Genius';
        this.times.current.elapsed = this.times.genius.elapsed;
      } else {
        this.times.current.elapsed = this.times.current.timestamp - this.times.start.timestamp;
      }
      message = `Spelling Bee: ${rank}! Time: ${this._formatTime(this.times.current.elapsed)}`;
    } else if ( target === this.askButton ) {
      const remainingWords = '';
      message = `List of remaining words: ${remainingWords}!`;
    }

    try {
      const shareData = {
        title: 'Worker Bee',
        text: message,
      }

      if (navigator.share) {
        await navigator.share(shareData);
        this._showMessage('Status shared successfully', '');
      } else if (navigator.clipboard) {
        navigator.clipboard.writeText(shareData.text)
          .then(() => {
            this._showMessage('Status copied to clipboard');
          })
          .catch(err => {
            this._showMessage('Error in copying text: ', err);
          });
      } else {
        this._showMessage('Can\' share content!', 'warn');
      }
    } catch (err) {
      console.error(`Error: ${err}`);
    }
  }
}
