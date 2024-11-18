import { Component, inject } from '@angular/core';
import { addIcons } from 'ionicons';
import { analytics, logOut, podium, pricetag } from 'ionicons/icons';
import { categoriesPath } from './category/category.routes';
import { expensesPath } from './expense/expense.routes';
import { AsyncPipe } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import {
  IonApp,
  IonAvatar,
  IonButton,
  IonButtons,
  IonChip,
  IonContent,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonMenu,
  IonMenuToggle,
  IonRouterOutlet,
  IonSplitPane,
  IonToolbar,
  IonFooter
} from '@ionic/angular/standalone';
import { AuthService } from './shared/service/auth.service';
import { UpdateService } from './shared/service/update.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: true,
  imports: [
    AsyncPipe,
    RouterLink,
    RouterLinkActive,

    // Ionic
    IonApp,
    IonSplitPane,
    IonMenu,
    IonContent,
    IonList,
    IonListHeader,
    IonLabel,
    IonChip,
    IonAvatar,
    IonMenuToggle,
    IonItem,
    IonIcon,
    IonToolbar,
    IonButtons,
    IonButton,
    IonRouterOutlet,
    IonFooter
  ]
})
export default class AppComponent {
  readonly authService = inject(AuthService);
  readonly appPages = [
    { title: 'Expenses', url: `/${expensesPath}`, icon: 'podium' },
    { title: 'Categories', url: `/${categoriesPath}`, icon: 'pricetag' }
  ];

  constructor() {
    // Add all used Ionic icons
    addIcons({ analytics, logOut, podium, pricetag });
    inject(UpdateService); // Reference UpdateService here as it won't be created otherwise
  }
}
