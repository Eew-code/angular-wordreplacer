import { Component, OnInit } from '@angular/core';
import { Editor } from 'tinymce';

interface Occurrence {
  index: number;
  length: number;
}

// Add this interface at the top of the file along with the Occurrence interface
interface Mark {
  index: number;
  length: number;
  type: string;
  text?: string; // Make text optional since not all marks need it
}

@Component({
  selector: 'app-word-replacer',
  template: `
    <div class="editor-container">
      <div class="search-replace-container">
        <input [(ngModel)]="searchWord" placeholder="Word to find" />
        <input [(ngModel)]="replaceWord" placeholder="Replace with" />
        <div class="button-group">
          <button (click)="findWord()">Find</button>
          <button (click)="previousMatch()" [disabled]="currentIndex === -1">Previous</button>
          <button (click)="nextMatch()" [disabled]="currentIndex === -1">Next</button>
          <button (click)="replaceCurrent()" [disabled]="currentIndex === -1">Replace</button>
          <button (click)="replaceAll()" [disabled]="occurrences.length === 0">Replace All</button>
        </div>
        <span class="stats">{{ stats }}</span>
      </div>
      <editor
        [init]="editorConfig"
        [(ngModel)]="editorContent"
        (onInit)="handleEditorInit($event)"
      ></editor>
    </div>
  `,
  styles: [
    `
    .editor-container {
      display: flex;
      flex-direction: column;
      gap: 20px;
      padding: 20px;
    }

    .search-replace-container {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .search-replace-container input {
      padding: 8px;
      border: 1px solid #ccc;
      border-radius: 4px;
      width: 100%;
      box-sizing: border-box;
    }

    .button-group {
      display: flex;
      flex-direction: row;
      gap: 10px;
      justify-content: flex-start;
    }

    .button-group button {
      padding: 8px 12px;
      border: 1px solid #ccc;
      border-radius: 4px;
      background-color: #f0f0f0;
      cursor: pointer;
    }

    .button-group button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .stats {
      font-size: 14px;
      color: #555;
    }

    editor {
      width: 100%;
      min-height: 300px;
    }

    :host ::ng-deep .current-match {
      background-color: #ffeb3b !important;
      color: black !important;
    }

    :host ::ng-deep .other-match {
      background-color: #fff59d !important;
      color: black !important;
    }

    :host ::ng-deep .replaced-match {
      background-color: #a5d6a7 !important;
      color: black !important;
      transition: background-color 0.3s ease;
    }
  `,
  ],
})
export class WordReplacerComponent implements OnInit {
  editor?: Editor;
  editorContent: string = '';
  searchWord: string = '';
  replaceWord: string = '';
  currentIndex: number = -1;
  occurrences: Occurrence[] = [];
  stats: string = '';

  editorConfig = {
    height: 500,
    menubar: false,
    plugins: [
      'advlist',
      'autolink',
      'lists',
      'link',
      'image',
      'charmap',
      'preview',
      'anchor',
      'searchreplace',
      'visualblocks',
      'code',
      'fullscreen',
      'insertdatetime',
      'media',
      'table',
      'code',
      'help',
      'wordcount',
    ],
    toolbar:
      'undo redo | blocks | ' +
      'bold italic forecolor | alignleft aligncenter ' +
      'alignright alignjustify | bullist numlist outdent indent | ' +
      'removeformat | help',
    content_style: `
      .current-match { background-color: #ffeb3b !important; color: black !important; }
      .other-match { background-color: #fff59d !important; color: black !important; }
      .replaced-match { background-color: #a5d6a7 !important; color: black !important; }
    `,
    valid_elements: '*[*]',
    extended_valid_elements: 'span[class]',
    formats: {
      current_match: { inline: 'span', classes: 'current-match' },
      other_match: { inline: 'span', classes: 'other-match' },
      replaced_match: { inline: 'span', classes: 'replaced-match' },
    },
  };

  ngOnInit() {
    const DEFAULT_TEXT = `Timely communication through text messages is crucial for maintaining relationships and ensuring clarity. text When you respond promptly, it shows respect for the other person's time and fosters a sense of reliability. This can strengthen connections, whether in personal or professional contexts text.다시

    Additionally, timely texts can prevent misunderstandings and keep conversations flowing smoothly. text Delayed responses may lead to confusion or frustration, which can be easily avoided by simply texting back in a timely manner. Overall, being prompt in your replies enhances communication and builds trust. 다시`;
    this.editorContent = DEFAULT_TEXT;
  }

  handleEditorInit(e: any) {
    this.editor = e.editor;
  }

  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private createWordBoundaryRegex(word: string): RegExp {
    // This pattern matches:
    // (?<![\p{L}\p{N}_]) - negative lookbehind for any letter, number, or underscore
    // followed by our word
    // (?![\p{L}\p{N}_]) - negative lookahead for any letter, number, or underscore
    return new RegExp(
      `(?<![\\p{L}\\p{N}_])${this.escapeRegExp(word)}(?![\\p{L}\\p{N}_])`,
      'gu'
    );
  }

  findWord() {
    if (!this.editor || !this.searchWord.trim()) return;

    const content = this.editor.getContent();
    const cleanContent = this.removeSearchHighlights(content);

    // Use the new word boundary regex
    const searchRegex = this.createWordBoundaryRegex(this.searchWord);
    this.occurrences = [];
    let processedContent = cleanContent;
    let offset = 0;

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = cleanContent;
    const textContent = tempDiv.textContent || '';

    let match;
    const matches: { index: number; length: number }[] = [];

    while ((match = searchRegex.exec(textContent)) !== null) {
      const htmlIndex = this.findPositionInHtml(cleanContent, match.index);
      matches.push({
        index: htmlIndex,
        length: match[0].length,
      });
    }

    matches.forEach((matchInfo, index) => {
      const adjustedIndex = matchInfo.index + offset;
      this.occurrences.push({
        index: adjustedIndex,
        length: matchInfo.length,
      });

      const before = processedContent.substring(0, adjustedIndex);
      const matchText = processedContent.substring(
        adjustedIndex,
        adjustedIndex + matchInfo.length
      );
      const after = processedContent.substring(
        adjustedIndex + matchInfo.length
      );

      const spanClass =
        index === this.currentIndex ? 'current-match' : 'other-match';
      const highlightedMatch = `<span class="${spanClass}">${matchText}</span>`;

      processedContent = before + highlightedMatch + after;
      offset += highlightedMatch.length - matchText.length;
    });

    if (this.occurrences.length > 0) {
      if (this.currentIndex === -1) this.currentIndex = 0;
      this.editor.setContent(processedContent);
      this.updateStats();
      this.scrollToCurrentMatch();
    } else {
      this.editor.setContent(cleanContent);
      this.currentIndex = -1;
      this.stats = 'No matches found';
    }
  }

  // Add this new method to only remove search highlights
  private removeSearchHighlights(content: string): string {
    return content.replace(
      /<span class="(current-match|other-match)">(.*?)<\/span>/g,
      '$2'
    );
  }

  // Add this helper method to find the correct position in HTML
  private findPositionInHtml(html: string, textPosition: number): number {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    const walk = document.createTreeWalker(tempDiv, NodeFilter.SHOW_TEXT, null);

    let currentTextPosition = 0;
    let currentHtmlPosition = 0;
    let node: Node | null;

    while ((node = walk.nextNode())) {
      const textLength = node.textContent?.length || 0;

      if (currentTextPosition + textLength > textPosition) {
        // Found the text node containing our position
        const offset = textPosition - currentTextPosition;
        // Find position in original HTML
        let htmlPos = html.indexOf(node.textContent || '', currentHtmlPosition);
        return htmlPos + offset;
      }

      currentTextPosition += textLength;
      if (node.textContent) {
        currentHtmlPosition =
          html.indexOf(node.textContent, currentHtmlPosition) +
          node.textContent.length;
      }
    }

    return textPosition;
  }

  nextMatch() {
    if (this.occurrences.length === 0) return;
    this.currentIndex = (this.currentIndex + 1) % this.occurrences.length;
    this.findWord();
  }

  previousMatch() {
    if (this.occurrences.length === 0) return;
    this.currentIndex =
      this.currentIndex <= 0
        ? this.occurrences.length - 1
        : this.currentIndex - 1;
    this.findWord();
  }

  replaceCurrent() {
    if (
      !this.editor ||
      !this.searchWord.trim() ||
      !this.replaceWord ||
      this.currentIndex === -1
    )
      return;

    const content = this.editor.getContent();
    const currentMatch = this.occurrences[this.currentIndex];

    // Create markers for the current match position
    const markerRegex = new RegExp(
      `(<span class="current-match">${this.escapeRegExp(
        this.searchWord
      )}</span>)`
    );

    // Replace only the current match while preserving all other spans
    const processedContent = content.replace(
      markerRegex,
      `<span class="replaced-match">${this.replaceWord}</span>`
    );

    this.editor.setContent(processedContent);

    // Remove the replaced occurrence from our tracking array
    this.occurrences.splice(this.currentIndex, 1);

    // Adjust current index if we're not at the end
    if (this.currentIndex >= this.occurrences.length) {
      this.currentIndex = this.occurrences.length > 0 ? 0 : -1;
    }

    // Refresh the search to update highlighting
    if (this.occurrences.length > 0) {
      this.findWord();
    } else {
      this.stats = 'No more matches';
    }
  }

  replaceAll() {
    if (!this.editor || !this.searchWord.trim() || !this.replaceWord) return;

    const content = this.editor.getContent();
    const cleanContent = this.removeSearchHighlights(content);

    // Use the same word boundary regex here
    const searchRegex = this.createWordBoundaryRegex(this.searchWord);
    const matches: { index: number; length: number }[] = [];
    let match;

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = cleanContent;
    const textContent = tempDiv.textContent || '';

    while ((match = searchRegex.exec(textContent)) !== null) {
      const htmlIndex = this.findPositionInHtml(cleanContent, match.index);
      matches.push({
        index: htmlIndex,
        length: match[0].length,
      });
    }

    let processedContent = cleanContent;
    let offset = 0;
    let replacementCount = 0;

    matches.forEach((matchInfo) => {
      const adjustedIndex = matchInfo.index + offset;
      const before = processedContent.substring(0, adjustedIndex);
      const after = processedContent.substring(
        adjustedIndex + matchInfo.length
      );

      const replacement = `<span class="replaced-match">${this.replaceWord}</span>`;

      processedContent = before + replacement + after;
      offset += replacement.length - matchInfo.length;
      replacementCount++;
    });

    this.editor.setContent(processedContent);
    this.occurrences = [];
    this.currentIndex = -1;
    this.stats = `${replacementCount} occurrence${
      replacementCount !== 1 ? 's' : ''
    } replaced`;
  }

  private removeAllHighlights(content: string): string {
    return content.replace(
      /<span class="(current-match|other-match|replaced-match)">(.*?)<\/span>/g,
      '$2'
    );
  }

  // Add this helper method to maintain highlights
  private maintainHighlights() {
    if (!this.editor) return;

    // Ensure replaced matches maintain their highlight
    const replacedMatches = this.editor.dom.select('span.replaced-match');
    replacedMatches.forEach((match) => {
      this.editor?.dom.addClass(match, 'replaced-match');
    });

    // Ensure current matches maintain their highlight
    if (this.currentIndex >= 0 && this.currentIndex < this.occurrences.length) {
      const currentMatches = this.editor.dom.select('span.current-match');
      currentMatches.forEach((match) => {
        this.editor?.dom.addClass(match, 'current-match');
      });
    }
  }

  private scrollToCurrentMatch() {
    setTimeout(() => {
      const currentMatch = this.editor
        ?.getBody()
        .getElementsByClassName('current-match')[0];
      if (currentMatch) {
        currentMatch.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  }

  private updateStats() {
    this.stats =
      this.occurrences.length > 0
        ? `${this.currentIndex + 1} of ${this.occurrences.length} matches`
        : 'No matches found';
  }
}
