import { createScheduler, createWorker } from "tesseract.js";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const imagesDir = path.resolve(__dirname, "./images");

type Ingredient = {
  firstItem: string;
  secondItem: string;
};

const scheduler = createScheduler();
const worker1 = await createWorker("eng");
const worker2 = await createWorker("eng");

(async () => {
  scheduler.addWorker(worker1);
  scheduler.addWorker(worker2);
  let pngs = fs.readdirSync(imagesDir);
  const results = await Promise.all(
    pngs.map((png) => scheduler.addJob("recognize", `./images/${png}`))
  );
  const data = results.map((r) => r.data);
  const text = data.map((d) => d.text);

  for (let i = 0; i < text.length; i++) {
    const contents = parse(text[i]);
    writeToFs(contents);
  }

  await scheduler.terminate();
})();

function parse(text: string) {
  const textArray = text.split("\n");
  const [title] = textArray;
  const lowercasedTitle = title.toLowerCase();
  const author = textArray.at(1);
  const servingsNumber = textArray.at(2);
  const prepTime = textArray.at(3);

  const [ingredients, instructions] =
    parseIngredientsAndInstructions(textArray);
  const nutritionRow = textArray.find((row) =>
    row.includes("Per serving")
  ) as string;
  let comments = "";
  const lineAfterInstructionsIndex =
    textArray.indexOf(instructions.at(-1) as string) + 1;
  const nutritionRowIndex = textArray.indexOf(nutritionRow);
  if (lineAfterInstructionsIndex !== nutritionRowIndex) {
    comments = textArray
      .slice(lineAfterInstructionsIndex, nutritionRowIndex)
      .join("");
  }
  let nutritionFacts = "";
  if (nutritionRow) {
    const nutritionRowIndex = textArray.indexOf(nutritionRow);
    const nutritionValues = textArray.slice(nutritionRowIndex);
    nutritionFacts = nutritionValues.filter((value) => value).join(",");
  }

  return {
    lowercasedTitle,
    author,
    title,
    servingsNumber,
    prepTime,
    ingredients,
    instructions,
    comments,
    nutritionFacts,
  };
}

function writeToFs({
  instructions,
  nutritionFacts,
  lowercasedTitle,
  title,
  author,
  servingsNumber,
  prepTime,
  ingredients,
  comments,
}: any) {
  const contents = `---
name: ${title}
author: ${author}
servingsNumber: ${servingsNumber}
prepTime: ${prepTime}
ingredients: ${(ingredients as Ingredient[]).map(
    (line) => `\n  - ${line.firstItem}\t\t${line.secondItem}`
  )}
instructions: ${instructions.map((line: string) => `\n  - ${line}`)}
comments: ${comments}
nutritionFacts: '${nutritionFacts}'
category:
---`;

  fs.writeFile(
    `./recipes/${lowercasedTitle.split(" ").join("-")}.md`,
    contents,
    (err) => {
      if (err) {
        console.error(`error parsing recipe for '${lowercasedTitle}':`, err);
      } else {
        console.log(`file for '${lowercasedTitle}' generated`);
      }
    }
  );
}

function parseIngredientsAndInstructions(recipe: string[]) {
  const ingredients: string[] = [];
  const instructions: string[] = [];

  const endIndex = recipe.indexOf(
    recipe.find((row) => row.includes("Per serving")) || ""
  );
  recipe.forEach((textRow, i) => {
    if (i > 3 && i < endIndex) {
      textRow.at(1) !== "."
        ? ingredients.push(textRow)
        : instructions.push(textRow);
    }
  });
  ingredients.filter((item) => item);
  instructions.filter((item) => item);

  // ingredients are weird
  // two on each line, usually
  // you have one or more numbers (amount), then strings (actual ingredient) for each item
  // So need to check for any numbers that follow the FIRST string
  // that comes after the FIRST numbers
  // and that is where the second item starts
  // kinda gross, but appears to be universal

  // edit: upon closer inspection of the recipes: no universal rules re ingredients
  // the exceptions to the number delimiter pattern are too numerous to be worth accounting for;
  // however, this pattern DOES seem to be the most (51% at least?) consistent pattern
  // will assume that pattern and correct the exceptions as needed

  const finalIngredientsList: Ingredient[] = [];
  ingredients.forEach((row) => {
    const ingredientRow = row.split(" ");
    const partialRow = row.split(" ").slice(2);

    const indexOfSalt = ingredientRow.indexOf("dash");
    if (indexOfSalt > 0) {
      const firstItem = ingredientRow.slice(0, indexOfSalt).join(" ");
      const secondItem = ingredientRow.slice(indexOfSalt).join(" ");

      finalIngredientsList.push({ firstItem, secondItem });
    }

    partialRow.forEach((char) => {
      if (Number(char)) {
        const numberIndex = ingredientRow.indexOf(char);
        const firstItem = ingredientRow.slice(0, numberIndex).join(" ");
        const secondItem = ingredientRow.slice(numberIndex).join(" ");

        finalIngredientsList.push({ firstItem, secondItem });
      }
    });
  });

  return [finalIngredientsList, instructions];
}
