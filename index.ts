import { createWorker } from 'tesseract.js';
import * as fs from "fs";

const parseIngredientsAndInstructions = (recipe: string[]) => {
  const ingredients: string[] = [];
  const instructions: string[] = [];
  recipe.forEach((textRow, i) => {
    const endofInstructions = textRow[0] === "P";
    if(i > 3 && !endofInstructions){
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