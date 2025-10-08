import { Routes } from '@angular/router';
import { PlantComponent } from './plant/plant.component';
import { NotFoundComponent } from './not-found/not-found.component';

export const routes: Routes = [
  { path: 'plant/:id/:name', component: PlantComponent },
  { path: '**', component: NotFoundComponent }
];

