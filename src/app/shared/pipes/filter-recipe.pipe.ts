import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'filterRecipe'
    //pure: false -> Por defecto es true. 
    //Si Ponemos a false, cada vez que cambie el valor del objeto sobre el cual se aplica la directiva, se llamara al transform.
})
export class FilterRecipePipe implements PipeTransform {
    transform(value: any, filterString: string, propertyName: string): any {
        if (value.length === 0 || filterString === '') {
            return value;
        }
        const resultArray = [];
        for (const item of value) {
            if (item[propertyName] === filterString) {
                resultArray.push(item);
            }
        }
        return resultArray;
    }
}
