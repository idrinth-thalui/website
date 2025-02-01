import { Component, inject, OnInit } from "@angular/core";
import { MarkdownService } from "../../services/markdown.service";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { Subscription } from "rxjs";
import { Title } from "@angular/platform-browser";
import { marked } from "marked";

import { MatCardModule } from "@angular/material/card";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatDividerModule } from "@angular/material/divider";

@Component({
	selector: "app-display",
	standalone: true,
	imports: [
		RouterLink,
		MatCardModule,
		MatButtonModule,
		MatIconModule,
		MatDividerModule,
	],
	templateUrl: "./display.component.html",
	styleUrl: "./display.component.scss",
})
export class DisplayComponent implements OnInit {
	title: string = "";
	content: string = "";
	htmlContent: string = "";
	directoryContent: string[] = [];
	currentPathSegments: string[] = [];
	titleService = inject(Title);
	route = inject(ActivatedRoute);
	markdownService = inject(MarkdownService);
	private routeSubscription!: Subscription;

	ngOnInit() {
    // Subscribe to route changes and load content
    this.route.url.subscribe((urlSegments) => {
      const pathSegments = urlSegments.map((segment) => segment.path);

      // Explicitly handle the root path separately
      if (this.route.snapshot.url.length === 0) {
        this.titleService.setTitle('Overview | Idrinth Thalui'); // Set root path title
        this.loadMarkdownContent(["README.md"]); // Still load the README.md content
      } else {
        this.setDynamicBrowserTitle(pathSegments); // For non-root paths
        this.loadMarkdownContent(pathSegments);    // Load content based on the actual path
      }
    });
  }

  setDynamicBrowserTitle(pathSegments: string[]) {
    let formattedTitle: string;

    // If it's the root path, set to "Overview" explicitly
    if (this.route.snapshot.url.length === 0) {
      formattedTitle = 'Overview';
    } else {
      // Filter out segments ending in ".md"
      const filteredSegments = pathSegments.filter(segment => !segment.endsWith('.md'));

      if (filteredSegments.length === 0) {
        formattedTitle = 'Overview';
      } else {
        // Use the last non-.md part of the path, and capitalize it
        const lastSegment = filteredSegments[filteredSegments.length - 1];
        formattedTitle = this.capitalizeSegment(lastSegment);
      }
    }

    // Set the browser tab title using the Title service
    this.titleService.setTitle(`${formattedTitle} | Idrinth Thalui`);
  }

  // Capitalize each word in the route segment
  capitalizeSegment(segment: string): string {
    return segment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  loadMarkdownContent(pathSegments: string[]) {
    this.markdownService.getFileStructure().subscribe((data) => {
      this.processMarkdownContent(data, pathSegments);
    });
  }

  async processMarkdownContent(data: any, pathSegments: string[]) {
    let current: { [key: string]: any } | undefined = data;

    // Traverse the JSON based on the path segments
    for (const segment of pathSegments) {
      if (current && current[segment]) {
        current = current[segment];
      } else {
        console.error(`Invalid path segment: ${segment} in current object.`);
        return;
      }
    }

    // If current is an object, it's a directory
    if (typeof current === "object") {
      this.content = ""; // Clear markdown content

      // Sort directory content: folders first, markdown files second
      const folders = Object.keys(current).filter(
        (key) => !key.endsWith(".md")
      );
      const markdownFiles = Object.keys(current).filter((key) =>
        key.endsWith(".md")
      );

      // Combine folders and markdown files, folders come first
      this.directoryContent = [...folders, ...markdownFiles];

      this.setDynamicBrowserTitle(pathSegments); // Update browser title
    }
    // If current is a string, it's a markdown file
    else if (typeof current === "string") {
      this.directoryContent = []; // Clear directory content
      this.content = current;

      // Await the result from marked.parse()
      let parsedContent = await marked.parse(this.content);

      // Now safely call the replaceImageSource method
      this.htmlContent = this.replaceImageSource(parsedContent);

      this.setDynamicBrowserTitle(pathSegments); // Update browser title
    } else {
      console.error(
        "Markdown content or directory not found at the specified path."
      );
    }
  }


	replaceImageSource(html: string): string {
		// Replace image sources that start with either "/assets" or "assets"
		return html.replace(/<img src="\/?assets/g, '<img src="/images');
	}

	generateTitle(pathSegments: string[]) {
		if (pathSegments.length === 0) {
			this.title = ""; // No title for root path
			return;
		}

		// Use the second-to-last segment as the category
		const category =
			pathSegments.length > 1
				? this.markdownService.formatFileName(
						pathSegments[pathSegments.length - 2]
				  )
				: "";

		// Format the last segment for the detailed file name
		const fileName = this.markdownService.formatFileName(
			pathSegments[pathSegments.length - 1]
		);

		if (category) {
			// Combine category and formatted file name
			this.title = `${category}: ${fileName}`;
		} else {
			this.title = fileName;
		}
	}

	formatFileName(fileName: string): string {
		return this.markdownService.formatFileName(fileName);
	}

	// Build routerLink for each item in the directory
	buildRouterLink(item: string): string[] {
		return [...this.currentPathSegments, item];
	}

	ngOnDestroy() {
		// Unsubscribe from route changes when the component is destroyed
		if (this.routeSubscription) {
			this.routeSubscription.unsubscribe();
		}
	}
}
