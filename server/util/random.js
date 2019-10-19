const { uniqueNamesGenerator } = require('unique-names-generator');

const randomNumber = (min, max) => {
  return Math.floor(Math.random() * max) + min;
};

const randomColour = () => {
  const x = Math.floor(Math.random() * 256);
  const y = Math.floor(Math.random() * 256);
  const z = Math.floor(Math.random() * 256);
  const colour = 'rgb(' + x + ',' + y + ',' + z + ')';
  return colour;
};

const randomName = (length = 2) => {
  return uniqueNamesGenerator({ length });
};

module.exports = {
  randomNumber,
  randomColour,
  randomName
};
