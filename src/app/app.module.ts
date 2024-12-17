import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { EditorModule } from '@tinymce/tinymce-angular';
import { AppComponent } from './app.component';
import { WordReplacerComponent } from './word-replacer/word-replacer.component';

@NgModule({
  declarations: [AppComponent, WordReplacerComponent],
  imports: [BrowserModule, FormsModule, EditorModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
