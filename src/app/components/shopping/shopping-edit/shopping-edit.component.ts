import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Ingredient } from 'src/app/models/ingredients.model';
import { ShoppingListService } from '../shopping-list/shopping-list.service';
import { NgForm } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-shopping-edit',
  templateUrl: './shopping-edit.component.html',
  styleUrls: ['./shopping-edit.component.scss']
})
export class ShoppingEditComponent implements OnInit {

  @ViewChild('shoppingEditForm', { static: false }) shoppingForm: NgForm;

  private ngUnsubscribe: Subject<void> = new Subject<void>();


  public editMode = false;
  public editedItemIndex: number;
  public editedItem: Ingredient;
  constructor(
    private shoppingListService: ShoppingListService
  ) { }

  ngOnInit() {
    this.shoppingListService.startedEditing$.pipe(takeUntil(this.ngUnsubscribe)).subscribe(index => {
      this.editMode = true;
      this.editedItemIndex = index;
      this.editedItem = this.shoppingListService.getIngredientByIndex(index);
      this.shoppingForm.setValue({
        name: this.editedItem.name,
        amount: this.editedItem.amount
      });
    });
  }

  onAddItem(form: NgForm) {
    const value = form.value;
    const newIngredient: Ingredient = new Ingredient(value.name, value.amount);
    if (!this.editMode) {
      this.shoppingListService.addIngredient(newIngredient);
    } else {
      this.shoppingListService.updateIngredient(this.editedItemIndex, newIngredient);
    }
    this.resetForm();
  }

  private resetForm() {
    this.shoppingForm.reset();
    this.editMode = false;
  }

  onDeleteItem() {
    if (this.editMode) {
      this.shoppingListService.deleteIngredient(this.editedItemIndex);
      this.resetForm();
    }
  }

  onClear() {
    this.resetForm();
  }
}
