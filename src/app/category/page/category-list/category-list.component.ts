import { Component, inject, OnDestroy } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonProgressBar,
  IonRow,
  IonCol,
  IonItem,
  IonLabel,
  IonSkeletonText,
  IonGrid,
  IonContent,
  IonIcon,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonRefresher,
  IonRefresherContent,
  IonSelect,
  IonInput,
  IonSelectOption,
  IonButtons,
  IonTitle,
  IonMenuButton,
  IonList,
  IonFab,
  IonFabButton
} from '@ionic/angular/standalone';
import { ModalController } from '@ionic/angular/standalone';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { add, alertCircleOutline, search, swapVertical } from 'ionicons/icons';
import CategoryModalComponent from '../../component/category-modal/category-modal.component';
import { CategoryService } from '../../service/category.service$';
import { ToastService } from '../../../shared/service/toast.service';
import { finalize } from 'rxjs/operators';
import { Category, CategoryCriteria, SortOption } from '../../../shared/domain';
import { Subscription, interval } from 'rxjs';
import { debounce } from 'rxjs/operators';

@Component({
  selector: 'app-category-list',
  templateUrl: './category-list.component.html',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonProgressBar,
    IonRow,
    IonCol,
    IonItem,
    IonLabel,
    IonSkeletonText,
    IonGrid,
    IonContent,
    IonIcon,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonRefresher,
    IonRefresherContent,
    IonSelect,
    IonInput,
    IonSelectOption,
    IonButtons,
    IonTitle,
    IonMenuButton,
    IonList,
    IonFab,
    IonFabButton
  ]
})
export default class CategoryListComponent implements OnDestroy {
  // DI
  private readonly modalCtrl = inject(ModalController);
  private readonly categoryService = inject(CategoryService);
  private readonly toastService = inject(ToastService);
  private readonly formBuilder = inject(NonNullableFormBuilder);

  categories: Category[] | null = null;
  readonly initialSort = 'name,asc';
  lastPageReached = false;
  loading = false;
  searchCriteria: CategoryCriteria = { page: 0, size: 25, sort: this.initialSort };

  readonly sortOptions: SortOption[] = [
    { label: 'Created at (newest first)', value: 'createdAt,desc' },
    { label: 'Created at (oldest first)', value: 'createdAt,asc' },
    { label: 'Name (A-Z)', value: 'name,asc' },
    { label: 'Name (Z-A)', value: 'name,desc' }
  ];

  private searchFormSubscription?: Subscription;

  readonly searchForm = this.formBuilder.group({
    name: [''],
    sort: [this.initialSort]
  });

  constructor() {
    addIcons({ swapVertical, search, alertCircleOutline, add });
  }

  async openModal(): Promise<void> {
    const modal = await this.modalCtrl.create({ component: CategoryModalComponent });
    modal.present();
    const { role } = await modal.onWillDismiss();
    if (role === 'refresh') {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      this.reloadCategories();
    }
  }

  private loadCategories(next?: () => void): void {
    if (!this.searchCriteria.name) delete this.searchCriteria.name;

    this.loading = true;

    this.categoryService
      .getCategories(this.searchCriteria)
      .pipe(
        finalize(() => {
          this.loading = false;
          if (next) next();
        })
      )
      .subscribe({
        next: categories => {
          if (this.searchCriteria.page === 0 || !this.categories) this.categories = [];

          this.categories.push(...categories.content);

          this.lastPageReached = categories.last;
        },
        error: error => {
          this.toastService.displayWarningToast('Could not load categories', error);
        }
      });
  }

  ionViewDidEnter(): void {
    this.searchFormSubscription = this.searchForm.valueChanges
      .pipe(
        debounce(searchParams => interval(searchParams.name?.length ? 400 : 0)) // Debounce based on name input length
      )
      .subscribe(searchParams => {
        this.searchCriteria = { ...this.searchCriteria, ...searchParams, page: 0 };
        this.loadCategories(); // Reload categories with updated criteria
      });
  }

  ionViewWillLeave(): void {
    if (this.searchFormSubscription) {
      this.searchFormSubscription.unsubscribe();
    }
  }

  ionViewDidLeave(): void {
    this.searchFormSubscription?.unsubscribe();
    this.searchFormSubscription = undefined;
  }

  loadNextCategoryPage($event: CustomEvent): void {
    this.searchCriteria.page++;

    this.loadCategories(() => {
      ($event.target as HTMLIonInfiniteScrollElement).complete();
    });
  }

  reloadCategories(event: CustomEvent): void {
    this.searchCriteria.page = 0;
    this.categories = null;

    this.loadCategories(() => {
      (event.target as HTMLIonRefresherElement).complete();
    });
  }

  onSortChange(selectedSort: string): void {
    this.searchCriteria.sort = selectedSort;

    this.reloadCategories({ target: {} } as CustomEvent); // Reuse reloadCategories logic, ignoring event object
  }

  onSearchSubmit(): void {
    const { name, sort } = this.searchForm.value;
    this.searchCriteria.name = name;
    if (sort != null) {
      this.searchCriteria.sort = sort;
    }

    this.reloadCategories({ target: {} } as CustomEvent); // Reuse reloadCategories logic, ignoring event object
  }

  ngOnDestroy(): void {
    if (this.searchFormSubscription) {
      this.searchFormSubscription.unsubscribe();
    }
  }
}
