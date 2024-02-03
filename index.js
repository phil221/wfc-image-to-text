import { createWorker } from 'tesseract.js';
import fs from "fs";

const parseIngredientsAndInstructions = (recipe) => {
  const ingredients = [];
  const instructions = [];
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

    // goal here is to grab the recipe text and parse it such that i can drop the 
    // parsed results into yaml files with formatted values for each yaml key

    // steps needed to parse correctly
    // 1. split into array based on newlines
    // 2. first 4 lines map directly to the first 4 yaml keys
    //    so can 1:1 map those starting from name to prep time
    // 3. ingredients are weirder, but the basic pattern is 
    //    each line of text contains two ingredients and on each line the
    //    boundary of the first one is the space before the number amount
    //    of the second one so split them based on that for each line
    // 4. Steps are a numbered list, so just need to find the 1. and check 
    //    where the numbers followed dots at the beginning of the lines stop
    //  

    const textArray = text.split("\n");
    const [ title ] = textArray;
    const lowercasedTitle = title.toLowerCase();
    const author = textArray.at(1);
    const servingsNumber = textArray.at(2);
    const prepTime = textArray.at(3);

    const [ ingredients, instructions ] = parseIngredientsAndInstructions(textArray);
    // console.log(textArray);
    // console.log("title:", title);
    // console.log("author:", author);
    // console.log("servingsNumber:", servingsNumber);
    // console.log("prepTime:", prepTime);
    console.log("ingredients:", ingredients);
    console.log("instructions:", instructions);

    const contents = `
      ---
      name: ${title}
      author: ${author}
      servingsNumber: ${servingsNumber}
      prepTime: ${prepTime}
      ingredients: 
          - 
      instructions:
          - 
      comments: 
      nutritionFacts: 
      category: 
      ---
    `;

    fs.writeFile(`./recipes/${lowercasedTitle}.md`, contents, (err) => {
      if(err) {
        console.error(err);
      } else {
        console.log("it worked!!!!")
      }
    });
    await worker.terminate();
})();