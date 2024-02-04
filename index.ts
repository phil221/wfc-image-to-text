import { createWorker } from 'tesseract.js';
import * as fs from "fs";

const parseIngredientsAndInstructions = (recipe: string[]) => {
  const ingredients: string[] = [];
  const instructions: string[] = [];

  const endIndex = recipe.indexOf(recipe.find(row => row.includes("Per serving")) || "");
  recipe.forEach((textRow, i) => {
    if(i > 3 && i < endIndex){
      textRow.at(1) !== "." ? ingredients.push(textRow) : instructions.push(textRow);
    }
  })
  ingredients.filter(item => item);
  instructions.filter(item => item);

  return [ingredients, instructions];
}

(async () => {
  const worker = await createWorker('eng');
    // fs.readdir("./recipes/", (err, files) => {
    //     files.forEach(async (file) => {
    //         console.log(file)
    //         const ret = await worker.recognize(file);
    //           console.log(ret.data.text);
    //     });
    // });
    const ret = await worker.recognize("./images/apfelkucken.png");
    const { text } = ret.data;

    const textArray = text.split("\n");
    const [ title ] = textArray;
    const lowercasedTitle = title.toLowerCase();
    const author = textArray.at(1);
    const servingsNumber = textArray.at(2);
    const prepTime = textArray.at(3);

    const [ ingredients, instructions ] = parseIngredientsAndInstructions(textArray);
    console.log("ingredients:", ingredients);
    // ingredients are weird
    // two on each line, usually
    // you have one or more numbers (amount), then strings (actual ingredient) for each item
    // So need to check for any numbers that follow the FIRST string
    // that comes after the FIRST numbers
    // and that is where the second item starts
    // kinda gross, but appears to be universal
    
    console.log("instructions:", instructions);

const contents = 
`---
name: ${title}
author: ${author}
servingsNumber: ${servingsNumber}
prepTime: ${prepTime}
ingredients: 
  - 
instructions: ${instructions.map(line => `\n  - ${line}`)}
comments: 
nutritionFacts: 
category: 
---`;

    fs.writeFile(`./recipes/${lowercasedTitle}.md`, contents, (err) => {
      if(err) {
        console.error(err);
      } else {
        console.log("it worked!!!!")
      }
    });
    await worker.terminate();
})();