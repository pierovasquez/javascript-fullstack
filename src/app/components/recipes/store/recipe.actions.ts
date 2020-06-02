import { Action } from '@ngrx/store';
import { Recipe } from 'src/app/models/recipe.model';


export const SET_RECIPES = '[Recipes] Set Recipes';


export class SetRecipes implements Action {
  readonly type: string = SET_RECIPES;

  constructor(public payload: Recipe[]) {}
}

export type RecipesActions = SetRecipes;
