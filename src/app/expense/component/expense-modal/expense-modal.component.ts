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
  IonFabButton,
  IonNote,
  IonDatetime,
  IonDatetimeButton,
  IonModal
} from '@ionic/angular/standalone';
import { ReactiveFormsModule, Validators } from '@angular/forms';
import { FormBuilder } from '@angular/forms';
import { addIcons } from 'ionicons';
import { close, save, text, trash, pricetag, calendar, cash } from 'ionicons/icons';
import { finalize } from 'rxjs/operators';
import { ExpenseService } from '../../service/expense.service$';
import { LoadingIndicatorService } from '../../../shared/service/loading-indicator.service';
import { ToastService } from '../../../shared/service/toast.service';
import { Expense, ExpenseUpsertDto } from '../../../shared/domain';
import { ActionSheetService } from '../../../shared/service/action-sheet.service';
import { parseISO, formatISO } from 'date-fns';
import { mergeMap } from 'rxjs';

@Component({
  selector: 'app-expense-modal',
  templateUrl: './expense-modal.component.html',
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
    IonFabButton,
    IonNote,
    IonDatetime,
    IonDatetimeButton,
    IonModal
  ]
})
export default class ExpenseModalComponent implements ViewWillEnter, ViewDidEnter {
  // Dependency Injection
  private readonly expenseService = inject(ExpenseService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly loadingIndicatorService = inject(LoadingIndicatorService);
  private readonly modalCtrl = inject(ModalController);
  private readonly toastService = inject(ToastService);
  private readonly actionSheetService = inject(ActionSheetService);

  // Form initialization
  readonly ExpenseForm = this.formBuilder.group({
    id: [null! as string], // hidden
    name: ['', [Validators.required, Validators.maxLength(40)]],
    date: ['', Validators.required], // Date field
    amount: [0, [Validators.required, Validators.pattern('^[0-9]*\\.?[0-9]+$')]] // Amount field
  });

  // ViewChild for IonInput
  @ViewChild('nameInput') nameInput?: IonInput;

  // Passed into the component by the ModalController
  @Input() expense: Expense = {} as Expense;

  constructor() {
    addIcons({ close, save, text, trash, pricetag, calendar, cash });
  }

  // Required method for ViewWillEnter
  ionViewWillEnter(): void {
    this.ExpenseForm.patchValue(this.expense); // Patch values if editing an expense
  }

  ionViewDidEnter(): void {
    this.nameInput?.setFocus();
  }

  cancel(): void {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  save(): void {
    this.loadingIndicatorService.showLoadingIndicator({ message: 'Saving expense' }).subscribe(loadingIndicator => {
      const expense = this.ExpenseForm.value as ExpenseUpsertDto;
      this.expenseService
        .upsertExpense(expense)
        .pipe(finalize(() => loadingIndicator.dismiss()))
        .subscribe({
          next: () => {
            this.toastService.displaySuccessToast('Expense saved');
            this.modalCtrl.dismiss(null, 'refresh');
          },
          error: error => this.toastService.displayWarningToast('Could not save expense', error)
        });
    });
  }

  delete(): void {
    this.actionSheetService
      .showDeletionConfirmation('Are you sure you want to delete this expense?')
      .pipe(mergeMap(() => this.loadingIndicatorService.showLoadingIndicator({ message: 'Deleting expense' })))
      .subscribe(loadingIndicator => {
        this.expenseService
          .deleteExpense(this.expense.id!)
          .pipe(finalize(() => loadingIndicator.dismiss()))
          .subscribe({
            next: () => {
              this.toastService.displaySuccessToast('Expense deleted');
              this.modalCtrl.dismiss(null, 'refresh');
            },
            error: error => this.toastService.displayWarningToast('Could not delete expense', error)
          });
      });
  }
}
