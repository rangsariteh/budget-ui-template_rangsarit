import { Component, ViewChild, inject, Input } from '@angular/core';
import {
  IonButton,
  IonContent,
  IonIcon,
  IonInput,
  IonItem,
  ModalController,
  ViewDidEnter,
  ViewWillEnter,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonFab,
  IonFabButton
} from '@ionic/angular/standalone';
import { ReactiveFormsModule, Validators } from '@angular/forms';
import { FormBuilder } from '@angular/forms';
import { addIcons } from 'ionicons';
import { close, save, text, trash } from 'ionicons/icons';
import { finalize } from 'rxjs/operators';
import { CategoryService } from '../../service/category.service$';
import { LoadingIndicatorService } from '../../../shared/service/loading-indicator.service';
import { ToastService } from '../../../shared/service/toast.service';
import { Category, CategoryUpsertDto } from '../../../shared/domain';
import { ActionSheetService } from '../../../shared/service/action-sheet.service';
import { mergeMap } from 'rxjs';

@Component({
  selector: 'app-category-modal',
  templateUrl: './category-modal.component.html',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    IonButton,
    IonIcon,
    IonContent,
    IonItem,
    IonInput,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonFab,
    IonFabButton
  ]
})
export default class CategoryModalComponent implements ViewWillEnter, ViewDidEnter {
  // DI
  private readonly categoryService = inject(CategoryService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly loadingIndicatorService = inject(LoadingIndicatorService);
  private readonly modalCtrl = inject(ModalController);
  private readonly toastService = inject(ToastService);
  private readonly actionSheetService = inject(ActionSheetService);

  // Form initialization
  readonly categoryForm = this.formBuilder.group({
    id: [null! as string], // hidden
    name: ['', [Validators.required, Validators.maxLength(40)]]
  });

  // ViewChild for IonInput
  @ViewChild('nameInput') nameInput?: IonInput;

  // Passed into the component by the ModalController, available in ionViewWillEnter
  @Input() category: Category = {} as Category;

  constructor() {
    addIcons({ close, save, text, trash });
  }

  ionViewDidEnter(): void {
    this.nameInput?.setFocus();
  }

  ionViewWillEnter(): void {
    this.categoryForm.patchValue(this.category);
  }

  cancel(): void {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  save(): void {
    this.loadingIndicatorService.showLoadingIndicator({ message: 'Saving category' }).subscribe(loadingIndicator => {
      const category = this.categoryForm.value as CategoryUpsertDto;
      this.categoryService
        .upsertCategory(category)
        .pipe(finalize(() => loadingIndicator.dismiss()))
        .subscribe({
          next: () => {
            this.toastService.displaySuccessToast('Category saved');
            this.modalCtrl.dismiss(null, 'refresh');
          },
          error: error => this.toastService.displayWarningToast('Could not save category', error)
        });
    });
  }

  delete(): void {
    this.actionSheetService
      .showDeletionConfirmation('Are you sure you want to delete this category?')
      .pipe(mergeMap(() => this.loadingIndicatorService.showLoadingIndicator({ message: 'Deleting category' })))
      .subscribe(loadingIndicator => {
        this.categoryService
          .deleteCategory(this.category.id!)
          .pipe(finalize(() => loadingIndicator.dismiss()))
          .subscribe({
            next: () => {
              this.toastService.displaySuccessToast('Category deleted');
              this.modalCtrl.dismiss(null, 'refresh');
            },
            error: error => this.toastService.displayWarningToast('Could not delete category', error)
          });
      });
  }
}
