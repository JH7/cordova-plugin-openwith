const fs = require('fs');
const path = require('path');

const {
  PLUGIN_ID,
  getPreferences,
  findXCodeproject,
  replacePreferencesInFile,
  log, redError,
} = require('./utils')

function copyFileSync(source, target, preferences) {
  var targetFile = target;

  // If target is a directory a new file with the same name will be created
  if (fs.existsSync(target)) {
    if (fs.lstatSync(target).isDirectory()) {
      targetFile = path.join(target, path.basename(source));
    }
  }

  fs.writeFileSync(targetFile, fs.readFileSync(source));
  // Do not replace preferences in the files (yet), because they are
  // most probably nonsense at this point. Replace them in the 
  // after_prepare hook.
  // replacePreferencesInFile(targetFile, preferences);
}

function copyFolderRecursiveSync(source, target, preferences) {
  var files = [];

  // Check if folder needs to be created or integrated
  var targetFolder = path.join(target, path.basename(source));
  if (!fs.existsSync(targetFolder)) {
    fs.mkdirSync(targetFolder);
  }

  // Copy
  if (fs.lstatSync(source).isDirectory()) {
    files = fs.readdirSync(source);
    files.forEach(function(file) {
      var curSource = path.join(source, file);
      if (fs.lstatSync(curSource).isDirectory()) {
        copyFolderRecursiveSync(curSource, targetFolder, preferences);
      } else {
        copyFileSync(curSource, targetFolder, preferences);
      }
    });
  }
}

module.exports = function(context) {
  log('Copying ShareExtension files to iOS project')

  return new Promise((resolve, reject) => {
    findXCodeproject(context, function(projectFolder, projectName) {
      var preferences = getPreferences(context, projectName);
  
      var srcFolder = path.join(context.opts.projectRoot, 'plugins', PLUGIN_ID, 'src', 'ios', 'ShareExtension');
      var targetFolder = path.join(context.opts.projectRoot, 'platforms', 'ios');
  
      if (!fs.existsSync(srcFolder)) {
        reject(redError('Missing extension project folder in ' + srcFolder + '.'));

        return;
      }
  
      copyFolderRecursiveSync(srcFolder, targetFolder, preferences);
      resolve();
    });
  });
};
