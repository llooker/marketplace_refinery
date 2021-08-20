const homedir = require('os').homedir();
const cloneDeep = require('clone-deep');
const fs = require('fs');
const lookmlParser_parse = require(homedir + '/node-lookml-parser/lib/parse');
const lookmlParser_generate = require(homedir + '/node-lookml-parser/lib/generate');
const { glob } = require('glob');
const { exit } = require('process');

const CONFIG_INCLUDES = /\/\/@{CONFIG/;
const CONFIG_EXTENDED = /_config$/;
const CORE_EXTENDED = /_core$/;

const argv = process.argv.slice(2)
if (argv.length < 1) {
    console.warn("USAGE: node index.js <path/to/lookmlProject>")
    exit(1)
}

let lookmlProjectPath = argv[0]
if (lookmlProjectPath.startsWith('~/')) {
  lookmlProjectPath = lookmlProjectPath.replace('~/', homedir)
}

process.chdir(lookmlProjectPath);
glob("**/*.lkml", {}, (err, files) => {
  files.forEach(file => {
    let refined = refineParsedFile(lookmlParser_parse(fs.readFileSync(file).toString()))
    // WIP -- eventually we just want to point this at a LookML project and do the transformation
    //fs.writeFileSync(file, lookmlParser_generate(refined))
  })
})

function refineParsedFile(parsed) {
  const toReturn = Object.assign({}, parsed);
  const includeIndexCollector = [];
  toReturn.include = transformIncludes(parsed.include, includeIndexCollector);
  toReturn.view = transformObjects(parsed.view);
  toReturn.explore = transformObjects(parsed.explore);
  toReturn.$strings = transformStrings(parsed.$strings, includeIndexCollector);

  return toReturn;
}

function transformStrings(strings, collector) {
  const toReturn = cloneDeep(strings);
  const lineRefs = [];
  for (let i = 0; i < strings.length; i++) {
    let string = strings[i][0];
    if (string.includes('include')) {
      let num = parseInt(string.split('.')[1]);
      // Case where we only have a single include
      if(isNaN(num)) { 
        toReturn[i][0] = 'include.0'
        num = 0
      }
      if (collector.includes(num)) {
        lineRefs.push(i);
      }
    } else if (CORE_EXTENDED.test(string)) {
      lineRefs.push(i);
    }
  }
  return toReturn.filter((_, i) => !lineRefs.includes(i));
}

function transformIncludes(parsedIncludes, collector) {
  if(!Array.isArray(parsedIncludes)) {
    parsedIncludes = [parsedIncludes]
  }
  return parsedIncludes.filter((inc, i) => {
    if (CONFIG_INCLUDES.test(inc)) {
      collector.push(i);
      return false;
    }
    return true;
  });
}

function transformObjects(parsed) {
  const toReturn = {};
  for (let obj in parsed) {
    obj = parsed[obj];
    let name = obj.$name;
    // If we have a _config or _core object just ignore them
    if (CONFIG_EXTENDED.test(name) || CORE_EXTENDED.test(name)) {
      continue;
    }
    toReturn[name] = {};
    // If the object has an extensions and one is related to a _config project we need to "refine" it
    if (obj.extends !== undefined && obj.extends.some((e) => CONFIG_EXTENDED.test(e))) {
      let cleanedExtends = obj.extends.filter(e => !CONFIG_EXTENDED.test(e))
      // copy the original view
      toReturn[name] = Object.assign({}, parsed[name + '_core']);
      // If the _config was the only extension, remove it
      if (cleanedExtends.length == 0 && parsed[name + '_core'].extends && parsed[name + '_core'].extends.length == 0) {
        delete toReturn[name].extends;
      } else if(parsed[name + '_core'].extends && parsed[name + '_core'].extends.length) {
        // Otherwise, merge the core and content layer
        toReturn[name].extends = parsed[name + '_core'].extends.concat(cleanedExtends);
        cleanedExtends = toReturn[name].extends
      } else {
        toReturn[name].extends = cleanedExtends
      }
      // Complexity here as we need to remove the metadata as well as the reference in $strings
      delete toReturn[name].extension;
      toReturn[name].$name = name.replace('_core', '');

      let sawExtendsIdx = -1
      let openingBraceIdx = -1
      toReturn[name].$strings.forEach((line, num) => {
        if(line.includes("{")) { openingBraceIdx = num }
        // Remove extension declaration from strings
        if (line[0].includes('extension')) {
          toReturn[name].$strings.splice(num, 1);
          // Remove "extends" for _config reference
        } else if(line[0].includes('extends')) {
          sawExtendsIdx = num
        }
      });
      // If the core or content layer had extends other than _config we need to make sure that they get merged
      if(cleanedExtends.length > 0) {
        let mergedExtends = cleanedExtends.map((_, i) => {
          if(i == 0) {
            return [String(i), []]
          } else {
            return [String(i), ",", " ", []]
          }
        })
        if (sawExtendsIdx) {
          toReturn[name].$strings.splice(sawExtendsIdx, 1, ["extends", "extends", ":", " ", "[", ...mergedExtends, "]"])
        } else {
          toReturn[name].$strings.splice(openingBraceIdx + 2, 0, ["extends", "extends", ":", " ", "[", ...mergedExtends, "]"])
        }
      }
    } else {
      toReturn[name] = Object.assign({}, parsed[name]);
    }
  }
  return toReturn;
}

module.exports = {
  refineParsedFile,
};
