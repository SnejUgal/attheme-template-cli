const path = require(`path`);
const Attheme = require(`attheme-js`);
const fs = require(`promise-fs`);
const Color = require(`./color`);

const localization = require(`./localization`);

const colorVariablesPairs = (theme) => {
  const reversed = {};

  for (const variable in theme) {
    const color = Color.hex(theme[variable]);

    if (!(color in reversed)) {
      reversed[color] = [];
    }

    reversed[color].push(variable);
  }

  return reversed;
};

const createTemplate = async (args) => {
  const { savePath, themePath } = args;

  let finalThemePath = path.resolve(process.cwd(), themePath);
  let finalSavePath = path.resolve(process.cwd(), savePath);

  if (!finalThemePath.endsWith(`.attheme`)) {
    finalThemePath += `.attheme`;
  }

  if (!finalSavePath.endsWith(`.attheme-template`)) {
    finalSavePath += `.attheme-template`;
  }

  try {
    const themeContent = await fs.readFile(finalThemePath, `binary`);
    const theme = new Attheme(themeContent);
    const reversed = colorVariablesPairs(theme);

    console.log(localization.en.createTemplateInstruction());

    for (const color in reversed) {
      const colorName = Color.name(Color.parse(color));
      const answer = (await ask(
        localization.en.colorReplace(color, colorName),
      )).trim();

      if (answer !== ``) {
        reversed[answer] = reversed[color];
        delete reversed[color];
      }
    }

    const template = {
      template: reversed,
    };

    if (Attheme.IMAGE_KEY in theme) {
      const imageBuffer = Buffer.from(theme[Attheme.IMAGE_KEY], `binary`);

      template.image = imageBuffer.toString(`base64`);
    }

    const stringified = JSON.stringify(template, null, 2);

    try {
      await fs.writeFile(finalSavePath, stringified, `utf8`);
      console.log(localization.en.templateCreationSuccess(finalSavePath));
      process.exit(0);
    } catch (error) {
      console.log(localization.en.saveError(finalSavePath));
      process.exit(1);
    }
  } catch (error) {
    console.log(localization.en.themeDoesNotExist(finalThemePath));
    process.exit(1);
  }
};

module.exports = createTemplate;