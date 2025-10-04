import { Routes } from '@angular/router';
import { PlantComponent } from './plant/plant.component';

export const routes: Routes = [
  {
    path: 'plant/:id',
    component: PlantComponent,
  },
  { path: '**', redirectTo: 'plant/PLANT001', pathMatch: 'full' }
];
