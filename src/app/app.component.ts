import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  template: `
    <div>
      <h1>Word Replacer with TinyMCE</h1>
      <app-word-replacer></app-word-replacer>
    </div>
  `,
  styles: [`
    h1 { color: #333; }
  `]
})
export class AppComponent { }