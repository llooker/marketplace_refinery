# Marketplace Refinery

This is a simple script that will help automate migrating "core/config" Looker blocks to be "refinement ready". 
Still a work in progress but the hope is that this will prevent the user from some repetative tasks.

Specifically, this script will transform `extends` based LookML objects into a vanilla one so that they can be refined. 

**Checkout [go/looker-migrate-block-checklist](https://docs.google.com/document/d/1-CZAHXSVh2BK_vOd36fOPdga2YNCUQ8AeTtQMp36pgg/edit?usp=sharing) for more details about this process.** 

This should cover the transformations needed for views and explores but validation and still needs to happen on a Looker instance.

## Getting Started
Clone this repo! 

Then clone [my fork of Fabio's node.js LookML parser](https://github.com/thomasbanghart/node-lookml-parser/tree/tjbanghart/sort-support) which provides additional support for some LookML parameters. Make sure you clone this into your home directory. My changes and Fabio's LookML generation aren't in the npm version of the library, so **be sure to use this forked repo!**

Install both this library and the parser:
```bash
cd ~/marketplace_refinery && npm install
cd ~/node-lookml-parser && npm install
```

## Usage
Run this node and give it a path to a LookML project directory. It should rewrite the files in place:
```bash
node ~/marketplace_refinery/index.js <path_to_lookml_project>
```


## Troubleshooting 
This is still a work in progess but feel free to push updates here or the LookML parser if things are breaking.

Both libs can be dense but you can easily debug by opening `chrome://inspect` in Chrome and starting a "dedicated DevTools for Node".

Then drop `debugger;` at some offending point and run: 
```bash
cd ~/marketplace_refinery && npm run debug
```
