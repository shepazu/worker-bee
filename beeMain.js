window.addEventListener('load', () => new beeMain());

export class beeMain extends EventTarget {
  constructor() {
    super();
    this.hintText = null;
    this.lettersArray = null;
    this.letterCountArray = null;
    this.wordList = [];
    this.addWordContainer = document.getElementById('add-word-block');
    this.lettersBlockContainer = document.getElementById('letters-block');
    this.statsBlockContainer = document.getElementById('stats-block');
    this.gridTableContainer = document.getElementById('grid-table');
    this.twoLetterListContainer = document.getElementById('two-letter-lists');
    this.beeGridInput = document.getElementById('bee-grid');
    this.beeWordInput = document.getElementById('bee-word');
    this.backspaceButton = document.getElementById('backspace-button');
    this.enterButton = document.getElementById('enter-button');

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
      this._findLetterList();
      this._findStats();
      this._findGrid();
      this._findTwoLetterList();

      target.closest('details').removeAttribute('open');
      this.addWordContainer.classList.remove('hidden');
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
      this.lettersArray = letterList[0].split(/\s/);

      // const lettersEl = document.createElement('p');
      // lettersEl.append( this.lettersArray.join(' ') );
      // lettersEl.classList.add('letters_list');
      // this.lettersBlockContainer.append( lettersEl );

      for (const letter of this.lettersArray) {
        const letterButton = document.createElement('button');
        letterButton.append( letter );
        letterButton.classList.add('letter_button', 'button');
        letterButton.addEventListener('click', this._addLetter.bind(this) );
        this.lettersBlockContainer.append( letterButton );
      }
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
      const statsArray = statsList[0].split(/\s\[A-Z]/);
    }

    const statsEl = document.createElement('p');
    // statsEl.append( statsArray.join('. ') );
    statsEl.append( statsList );
    statsEl.classList.add('stats_list');
    this.statsBlockContainer.append( statsEl );
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

    this._createTable(gridTableArray);
  }

  /**
   * Finds and formats the header row in the grid.
   * @private
   * @memberOf beeMain
   * @return {Array} An array of header word counts.
   */
  _findGridHeader() {
    const gridHeaderList = this.hintText.match(/(\d[\s+\t+].+Σ)/);
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
    }    
  }

  /**
   * Creates word count grid as table.
   * @param {Array} gridTableArray The array of all grid cells.
   * @private
   * @memberOf beeMain
   */
  _createTable( gridTableArray ) {
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
      for (let columnIndex = 0; columnIndex < row.length; columnIndex++) {
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
            cellContent = this._createNumberInput( column, `${letterHead}-${wordCount}` );
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
   * Creates two letter list output.
   * @param {Array} twoLetterArray The lest of two letter codes, with the first two letter and the length of the word.
   * @private
   * @memberOf beeMain
   */
  _createTwoLetterList( twoLetterArray ) {
    const heading = document.createElement('h2');
    heading.append( 'Two letter list' );

    const list = document.createElement('dl');

    for (const twoLetterCount of twoLetterArray) {
      const twoLetterCodeArray = twoLetterCount.split('-');
      const twoLetters = twoLetterCodeArray[0];
      const count = parseInt(twoLetterCodeArray[1]);

      const twoLetterTermEl = document.createElement('dt');
      twoLetterTermEl.id = twoLetters;

      const twoLetterItem = document.createElement('span');
      twoLetterItem.append( twoLetters );
      twoLetterItem.classList.add('two_letter_code');
      twoLetterTermEl.append( twoLetterItem );

      const separator = document.createElement('span');
      separator.classList.add('separator');
      separator.append( '-' );
      twoLetterTermEl.append( separator );

      const twoLetterValue = this._createNumberInput( count, `${twoLetterCount}-count` );
      twoLetterTermEl.append( twoLetterValue );

      list.append( twoLetterTermEl );
    }

    this.twoLetterListContainer.replaceChildren(heading, list); 
  }

  /**
   * Adds a word to the list of found words.
   * @param {Event} event The event on the element.
   * @private
   * @memberOf beeMain
   */
  _addWord( event ) {
    const target = event.target;
    const wordList = target.value.trim();

    // clear the input
    target.value = '';

    if (wordList) {
      const wordArray = wordList.split(/\W+/);
      for (let eachWord of wordArray) {
        eachWord = eachWord.toLowerCase();

        // find length of word
        const wordLength = eachWord.length;

        // see if the word has already been entered
        const prefoundWord = document.getElementById( `word-${eachWord}` );
        if (!this.letterCountArray.includes(wordLength)) {
          this.beeWordInput.classList.add('reject');
          console.warn('Wrong number of letters');
        } else if (prefoundWord) {
          this.beeWordInput.classList.add('reject');
          console.warn('Word already found');
        } else{    
          // find first letter
          const firstLetter = eachWord.substring(0, 1).toUpperCase();

          // find matching two-letter category
          const twoLetters = eachWord.substring(0, 2).toUpperCase();

          const twoLetterTerm = document.getElementById( twoLetters );

          // make sure all letters in word are in letters list
          const isCorrectLetters = eachWord.split('').every((letter) => this.lettersArray.includes(letter));

          if (!twoLetterTerm) {
            this.beeWordInput.classList.add('reject');
            console.warn('Doesn\'t match starting letters');
          } else if (!isCorrectLetters) {
            this.beeWordInput.classList.add('reject');
            console.warn('Doesn\'t match letters');
          } else {
            // word seems to be a valid entry, modulo inclusion in the game dictionary,
            //  so insert it into the two-letter list
            this.beeWordInput.classList.add('accept');

            // add word to master word list
            this.wordList.push(eachWord);

            const defEl = document.createElement('dd');
            defEl.classList.add(twoLetters);
            defEl.id = `word-${eachWord}`;

            const removeButton = document.createElement('button');
            removeButton.type = 'remove';
            removeButton.setAttribute('aria-label', `Remove ${eachWord} from list`);
            removeButton.append( '×' );
            removeButton.addEventListener('click', this._removeWord.bind(this) );
            

            const wordEl = document.createElement('a');
            wordEl.href = `https://www.wordnik.com/words/${eachWord}`;
            wordEl.target= '_blank';
            wordEl.append( eachWord );

            const wordLengthEl = document.createElement('span');
            wordLengthEl.append( `(${wordLength})` );

            defEl.append( removeButton, wordEl, ' ', wordLengthEl );

            twoLetterTerm.after( defEl );

            // sort words alphabetically
            const siblingWords = Array.from(this.twoLetterListContainer.querySelectorAll(`dd.${twoLetters}`));
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
            this._updateCountByWord( eachWord );
          }
        }
      }
    }
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
  _updateCountByWord( word, isDecrement = true ) {
    const modifier = isDecrement ? -1 : 1; 

    // find first letter
    const firstLetter = word.substring(0, 1).toUpperCase();
    // find matching two-letter category
    const twoLetters = word.substring(0, 2).toUpperCase();
    const wordLength = word.length;
    const twoLetterTerm = document.getElementById( twoLetters );


    // decrement or increment the two-letter count
    let countEl = twoLetterTerm.querySelector('input[type=number]');
    this._setNumberInputValue( countEl, (+countEl.value + modifier) );

    // decrement or increment the word-grid count
    let gridCountEl = document.getElementById(`${firstLetter}-${wordLength}`);
    if (gridCountEl) {
      this._setNumberInputValue( gridCountEl, (+gridCountEl.value + modifier) );
    }

    // decrement or increment the word-grid letter total count
    let gridTotalCountEl = document.getElementById(`${firstLetter}-Σ`);
    if (gridTotalCountEl) {
      this._setNumberInputValue( gridTotalCountEl, (+gridTotalCountEl.value + modifier) );
    }

    // decrement or increment the word-grid word-length total count
    let gridWordLengthTotalEl = document.getElementById(`Σ-${wordLength}`);
    gridWordLengthTotalEl.replaceChildren( (+gridWordLengthTotalEl.textContent + modifier) );

    // decrement or increment the word-grid total word count
    let gridWordTotalEl = document.getElementById(`Σ-Σ`);
    gridWordTotalEl.replaceChildren( (+gridWordTotalEl.textContent + modifier) );
  }

  /**
   * Sets the value of a number input element.
   * @param {Element} target The input element to be set.
   * @param {string} value The value for the input element.
   * @private
   * @memberOf beeMain
   * @return {Element} The number input element.
   */
  _setNumberInputValue( target, value ) {
    target.value = value;
    target.setAttribute('value', value);
    return target;
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
    const word = target.parentNode.id.replace('word-', '');
    // update two-letter term and grid numbers
    this._updateCountByWord( word, false );
    target.parentNode.remove();
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

}
