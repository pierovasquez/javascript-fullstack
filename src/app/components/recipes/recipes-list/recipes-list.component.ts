import { Component, OnInit, EventEmitter, Output } from '@angular/core';
import { Recipe } from 'src/app/models/recipe.model';
import { RecipesService } from '../recipes.service';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-recipes-list',
  templateUrl: './recipes-list.component.html',
  styleUrls: ['./recipes-list.component.scss']
})
export class RecipesListComponent implements OnInit {

  recipes: Recipe[];

  constructor(
    private recipesService: RecipesService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit() {
    this.recipesService.recipesChanged$.subscribe(recipes => this.recipes = recipes);
    this.recipes = this.recipesService.getRecipes();
  }

  onNewRecipe() {
    this.router.navigate(['new'], { relativeTo: this.route });
  }

}
