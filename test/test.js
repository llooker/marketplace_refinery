const homedir = require('os').homedir();
const path = require('path');
const fs = require('fs');
const lookmlParser_parse = require(homedir + '/node-lookml-parser/lib/parse');
const lookmlParser_generate = require(homedir + '/node-lookml-parser/lib/generate');
const { refineParsedFile } = require('../index.js');
const { assert } = require('console');

let lookMl;
beforeAll(() => {
  lookMl = fs.readFileSync(path.resolve(__dirname, 'sample-model.lkml')).toString();
});

describe('transformFiles', () => {
  test('it transforms views as expected', () => {
    const EXTENDS_REGEX = /(extension: required | extends: \[.*_config\])/
    const parsed = lookmlParser_parse(lookMl);
    const test = refineParsedFile(parsed);
    expect(lookMl).toEqual(expect.stringMatching(EXTENDS_REGEX))
    expect(test).toEqual(expect.not.stringMatching(EXTENDS_REGEX))
  });
});
