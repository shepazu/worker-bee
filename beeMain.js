window.addEventListener('load', () => new beeMain());

export class beeMain extends EventTarget {
  constructor() {
    super();
    this.hintText = null;
    this.statsBlockContainer = document.getElementById('stats-block');
    this.gridTableContainer = document.getElementById('grid-table');
    this.twoLetterListContainer = document.getElementById('two-letter-lists');
    
    this._init();
  }
  
  /**
   * Initializes the module.
   * @private
   * @memberOf beeMain
   */
  _init() {
    this.beeGridInput = document.getElementById('bee-grid');
    this.beeGridInput.addEventListener('input', this._parseHints.bind(this));

    this.beeWordInput = document.getElementById('bee-word');
    this.beeWordInput.addEventListener('change', this._addWord.bind(this));
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
    }
  }

  /**
   * Finds list of letters.
   * @private
   * @memberOf beeMain
   */
  _findLetterList() {
    // const letterList = this.hintText.match(/(\w\s){6}\w/);
    const letterList = this.hintText.match(/(\w\s){6}\w/);
    if (letterList) {
      const letterArray = letterList[0].split(/\s/);
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

    // console.log('header', header);
    // console.log('wordLengths', wordLengths);
    // console.log('totals', totals);

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
    // const gridHeaderList = this.hintText.match(/(\d+).+Σ/);
    const gridHeaderList = this.hintText.match(/(\d[\s+\t+].+Σ)/);
    // console.log('gridHeaderList', gridHeaderList);
    if (gridHeaderList) {
      // const gridHeaderArray = gridHeaderList[0].trim().replace(/[\s\t]/g, ' ').split(/\s+/);
      const gridHeaderArray = this._whitespacedStringToArray( gridHeaderList[0] );
      // console.log('gridHeaderArray', gridHeaderArray);
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
    // const wordLengthLetterArray = this.hintText.match(/([a-z]){1}:\s.+\d/g);
    const wordLengthLetterArray = this.hintText.match(/\n([A-Za-z]){1}:\s.+\d/g);
    // console.log(wordLengthLetterArray);
    const gridTableArray = [];  
    if (wordLengthLetterArray) {
      const wordLengthRows = [];
      for (let row of wordLengthLetterArray) {
        // // console.log('row', row);
        // const wordLengthRowArray = row.trim().replace(/[\s\t]/g, ' ').split(/[\s+]/);
        // const wordLengthRowArray = row.split(/[\s+\t+]/);
        // console.log('wordLengthRowArray', wordLengthRowArray);

        // const wordLengthRowArray = row.trim().split(/[\s\t]/);
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
      // const wordLengthTotalArray = wordLengthTotalList[0].split(/[\s+\t+]/);
      // const wordLengthTotalArray = wordLengthTotalList[0].trim().replace(/[\s\t]/g, ' ').split(/[\s+]/);
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
    // console.log('trimmed', trimmed);
    // console.log('replaced', replaced);
    // console.log('strArray', strArray);
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

      const letterHead = row[0];
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

    // console.log('wordList', wordList);
    target.value = '';

    if (wordList) {
      const wordArray = wordList.split(/\W+/);
      for (let eachWord of wordArray) {
        eachWord = eachWord.toLowerCase();
        // see if the word has already been entered
        const prefoundWord = document.getElementById( eachWord );
        if (!prefoundWord) {

          // find first letter
          const firstLetter = eachWord.substring(0, 1).toUpperCase();

          // find matching two-letter category
          const twoLetters = eachWord.substring(0, 2).toUpperCase();

          console.log('_addWord:twoLetters', twoLetters);

          // find length of word
          const wordLength = eachWord.length;

          const twoLetterTerm = document.getElementById( twoLetters );

          if (twoLetterTerm) {
            const defEl = document.createElement('dd');
            defEl.id = eachWord;

            const wordEl = document.createElement('span');
            wordEl.append( eachWord );

            const wordLengthEl = document.createElement('span');
            wordLengthEl.append( `(${wordLength})` );

            defEl.append( wordEl, ' ', wordLengthEl );

            twoLetterTerm.after( defEl );

            // decrement the two-letter count
            let countEl = twoLetterTerm.querySelector('input[type=number]');
            // countEl.value = --countEl.value;
            this._setNumberInputValue( countEl, --countEl.value );

            // decrement the word-grid count
            let gridCountEl = document.getElementById(`${firstLetter}-${wordLength}`);
            if (gridCountEl) {
              // gridCountEl.value = --gridCountEl.value;
              this._setNumberInputValue( gridCountEl, --gridCountEl.value );
            }

            // decrement the word-grid letter total count
            let gridTotalCountEl = document.getElementById(`${firstLetter}-Σ`);
            if (gridTotalCountEl) {
              // gridTotalCountEl.value = --gridTotalCountEl.value;
              this._setNumberInputValue( gridTotalCountEl, --gridTotalCountEl.value );
            }

            // decrement the word-grid word-length total count
            let gridWordLengthTotalEl = document.getElementById(`Σ-${wordLength}`);
            gridWordLengthTotalEl.replaceChildren(--gridWordLengthTotalEl.textContent);

            // decrement the word-grid total word count
            let gridWordTotalEl = document.getElementById(`Σ-Σ`);
            gridWordTotalEl.replaceChildren(--gridWordTotalEl.textContent);
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
}
