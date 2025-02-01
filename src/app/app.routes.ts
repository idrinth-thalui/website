import { Routes } from '@angular/router';
import { DisplayComponent } from './components/display/display.component';

export const routes: Routes = [
  {path: '**', component: DisplayComponent},
];
