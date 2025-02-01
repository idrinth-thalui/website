import { MediaMatcher } from "@angular/cdk/layout";
import { ChangeDetectorRef, Component, OnDestroy, inject } from "@angular/core";
import {
	ActivatedRoute,
	RouterLink,
	RouterLinkActive,
	RouterOutlet,
} from "@angular/router";
import { MarkdownService } from "./services/markdown.service";
import { FooterComponent } from "./components/footer/footer.component";
import { DomSanitizer } from "@angular/platform-browser";

import { MatToolbarModule } from "@angular/material/toolbar";
import { MatListModule } from "@angular/material/list";
import { MatSidenavModule } from "@angular/material/sidenav";
import { MatIconModule, MatIconRegistry } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { MatTooltipModule } from "@angular/material/tooltip";

@Component({
	selector: "app-root",
	standalone: true,
	imports: [
		RouterLink,
		RouterLinkActive,
		RouterOutlet,
		FooterComponent,
		MatToolbarModule,
		MatButtonModule,
		MatIconModule,
		MatSidenavModule,
		MatListModule,
		MatIconModule,
    MatTooltipModule,
	],
	templateUrl: "./app.component.html",
	styleUrl: "./app.component.scss",
})
export class AppComponent implements OnDestroy {
	title = "Idrinth Thalui";
	mobileQuery: MediaQueryList;
	fileStructure: any;
	expandedSections: { [key: string]: boolean } = {};
	expandedSubSections: { [key: string]: boolean } = {};
  private iconRegistry = inject(MatIconRegistry);
  private sanitizer = inject(DomSanitizer);
	route = inject(ActivatedRoute);
	markdownService = inject(MarkdownService);

	private _mobileQueryListener: () => void;

	constructor() {
		const changeDetectorRef = inject(ChangeDetectorRef);
		const media = inject(MediaMatcher);

		this.mobileQuery = media.matchMedia("(max-width: 800px)");
		this._mobileQueryListener = () => changeDetectorRef.detectChanges();
		this.mobileQuery.addListener(this._mobileQueryListener);

    this.iconRegistry.addSvgIcon(
      'nexus',
      this.sanitizer.bypassSecurityTrustResourceUrl('icons/nexus.svg')
    );
    this.iconRegistry.addSvgIcon("github", this.sanitizer.bypassSecurityTrustResourceUrl("icons/github.svg"));
    this.iconRegistry.addSvgIcon("discord", this.sanitizer.bypassSecurityTrustResourceUrl("icons/discord.svg"));
	}

	ngOnInit(): void {
		this.markdownService.getFileStructure().subscribe((data) => {
			this.fileStructure = data;
		});
	}

	// Toggle top-level submenu
	toggleSubmenu(key: string) {
		// Close all other top-level submenus
		Object.keys(this.expandedSections).forEach((section) => {
			if (section !== key) {
				this.expandedSections[section] = false;
			}
		});

		// Close all nested submenus when switching top-level menus
		this.expandedSubSections = {};

		// Toggle the clicked top-level menu
		this.expandedSections[key] = !this.expandedSections[key];
	}

	// Toggle nested submenu
	toggleSubSubmenu(parentKey: string, key: string) {
		// Close all other nested submenus within the same top-level menu
		Object.keys(this.expandedSubSections).forEach((subSection) => {
			if (subSection !== key) {
				this.expandedSubSections[subSection] = false;
			}
		});

		// Toggle the clicked nested submenu
		this.expandedSubSections[key] = !this.expandedSubSections[key];
	}

	collapseAll() {
		this.expandedSections = {};
		this.expandedSubSections = {}; // Also collapse nested submenus
	}

	getObjectKeys(obj: any): string[] {
		if (!obj) return [];

		// Sort folders first, markdown files after
		const folders = Object.keys(obj).filter((key) => !key.endsWith(".md"));
		const markdownFiles = Object.keys(obj).filter((key) => key.endsWith(".md"));

		// Combine folders first and then markdown files
		return [...folders, ...markdownFiles];
	}

	hasSubItems(item: any): boolean {
		return item && typeof item === "object" && Object.keys(item).length > 0;
	}

	formatFileName(fileName: string): string {
		return this.markdownService.formatFileName(fileName);
	}

	ngOnDestroy(): void {
		this.mobileQuery.removeListener(this._mobileQueryListener);
	}
}
