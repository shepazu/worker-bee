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
    this.beeGridInput.addEventListener('input', this._parseGrid.bind(this));

    this.beeWordInput = document.getElementById('bee-word');
    this.beeWordInput.addEventListener('change', this._addWord.bind(this));
  }

  /**
   * Parses the pasted input string from the NYT Spelling Bee hints page.
   * @param {Event} event The event on the element.
   * @private
   * @memberOf beeMain
   */
  _parseGrid(event) {
    const target = event.target;
    this.hintText = target.value;

    if (this.hintText) {
      this._findLetterList();
      this._findStats();
      this._findGrid();
      this._findTwoLetterList();
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
    const gridHeaderList = this.hintText.match(/(\d+).+Σ/);
    if (gridHeaderList) {
      const gridHeaderArray = gridHeaderList[0].split(/\t/);
      gridHeaderArray.unshift('');
      return gridHeaderArray;
    }
  }

  /**
   * Finds and formats rows of letters and word counts in the grid.
   * @private
   * @memberOf beeMain
   * @return {Array} An array of arrays of letters and word counts.
   */
  _findWordLengthCounts() {
    const wordLengthLetterArray = this.hintText.match(/([a-z]){1}:\s.+\d/g);
    if (wordLengthLetterArray) {
      const wordLengthRows = [];
      for (let row of wordLengthLetterArray) {
        const wordLengthRowArray = row.split(/\t/);
        wordLengthRows.push(wordLengthRowArray);
      }

      const gridTableArray = [];  
      for (let wordLengthRow of wordLengthRows) {
        const newRow = wordLengthRow.map((str, index) => {
          if ( index === 0 ) {
            return str.replace(/[:\s]/g, '');
          }
          return parseInt(str) || '-';
        });
        gridTableArray.push(newRow);
      }
      return gridTableArray;
    }
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
      const wordLengthTotalArray = wordLengthTotalList[0].split(/\t/);
      return wordLengthTotalArray;
    }    
  }

  /**
   * Finds list of two-letter codes.
   * @private
   * @memberOf beeMain
   */
  _findTwoLetterList() {
    const twoLetterArray = this.hintText.match(/\w\w-\d+/g);
    if (twoLetterArray) {
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
        let cellType = 'td';
        let cellContent = column;
        if (rowIndex === 0 || columnIndex === 0) {
          cellType = 'th';
        } else if (rowIndex !== rowLength - 1) {
          if (typeof column === 'number') {
            const wordCount = gridTableArray[0][columnIndex].trim();
            cellContent = this._createNumberInput( column, `${letterHead}-${wordCount}` );
          } else {
            cellContent = '';
          }
        }

        const cellEl = document.createElement(cellType);
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
    const newWord = target.value.trim();

    if (newWord) {
      // find first letter
      const firstLetter = newWord.substring(0, 1);

      // find matching two-letter category
      const twoLetters = newWord.substring(0, 2);

      // find length of word
      const wordLength = newWord.length;

      const twoLetterTerm = document.getElementById( twoLetters );

      if (twoLetterTerm) {
        const defEl = document.createElement('dd');

        const wordEl = document.createElement('span');
        wordEl.append( newWord );

        const wordLengthEl = document.createElement('span');
        wordLengthEl.append( `(${wordLength})` );

        defEl.append( wordEl, ' ', wordLengthEl );

        twoLetterTerm.after( defEl );

        // decrement the two-letter count
        let countEl = twoLetterTerm.querySelector('input[type=number]');
        countEl.value = --countEl.value;

        // decrement the word-grid count
        let gridCountEl = document.getElementById(`${firstLetter}-${wordLength}`);
        if (gridCountEl) {
          gridCountEl.value = --gridCountEl.value;
        }

        // decrement the word-grid letter total count
        let gridTotalCountEl = document.getElementById(`${firstLetter}-Σ`);
        if (gridTotalCountEl) {
          gridTotalCountEl.value = --gridTotalCountEl.value;
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
    numberInput.value = value;

    return numberInput;
  }

}
