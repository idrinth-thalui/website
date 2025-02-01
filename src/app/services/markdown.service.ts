import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MarkdownService {
  http = inject(HttpClient);

  getFileStructure(): Observable<Object> {
    return this.http.get("https://api-idrinth-thalui.idrinth.de");
  }

  // Method to format markdown file names
  formatFileName(fileName: string): string {
    // Remove the ".md" extension
    let formattedName = fileName.replace(/.md$/i, '');

    // Remove "IdrinthFollower" from the file name if it exists
    formattedName = formattedName.replace(/^idrinthfollower/i, '');

    // Add spaces between camelCase or PascalCase words
    formattedName = formattedName.replace(/([a-z])([A-Z])/g, '$1 $2');

    return formattedName.trim();
  }
}
