var assert = require('assert');
var helpers = require('../../../views/helpers');


describe('views.helpers', () => {
  describe('#contrastColor', () => {
    it('should return "white" when the value is not present', () => {
      assert.equal('white', helpers.contrastColor(null));      
      assert.equal('white', helpers.contrastColor(''));
    });

    it('should return "black" when value is "#FFFFFFF"', () => {      
      assert.equal('black', helpers.contrastColor("FFFFFF"));      
      assert.equal('black', helpers.contrastColor("#FFFFFF"));
    });

    it('should return "white" when value is "#000000"', () => {      
      assert.equal('white', helpers.contrastColor("000000"));      
      assert.equal('white', helpers.contrastColor("#000000"));
    });    
  });

  describe("#firstLetter", function() {
    it('should return an empty string when value is not present', () => {
      assert.equal('', helpers.firstLetter(null));
    });

    it('should return "G" for "Gulliver"', () => {
      assert.equal('G', helpers.firstLetter("Gulliver"));
    });

    it('should return "G" for "gulliver"', () => {
      assert.equal('G', helpers.firstLetter("gulliver"));
    });
  });
});