
// v.1.8.
// Batch Mockup Smart Object Replacement.jsx

// You'll need to incplude this file to another script file:
// #include "../script/Batch Mockup Smart Object Replacement.jsx" 
// Check the example folders for a few real world examples.

// Minimal settings
/*

#include "Batch Mockup Smart Object Replacement.jsx"

var outputOpts = {
  path: '$/_output' 
};

mockups([
  
  {
    output: outputOpts,
    mockupPath: '$/mockup/file.psd',
    smartObjects: [
      {
        target: 'smart object layer name',
        input: '$/input',
      },
      // {..},  comma separate multiple smartobjects 
    ]
  },
  // {..},  comma separate multiple mockups 
  
]);

*/

// CHANGELOG

// v.1.8.
// - Added 2 new options that allow you to edit input files on the fly, which could potentially eliminate the need to batch process input files before running this mockup script.
//   - These options are specific to each smart object in the mockup.
//   - Usage example: 
//       inputPlaced_runScript: '$/Input placed script.jsx',
//       inputPlaced_runAction: ['Default Actions', 'Gradient Map'], // ['folder name', 'action name']

// v.1.7.
// - Added folder structure capabilities to output.filename, which allows you to create a folder
//   structure dynamically using the filename. For example filename: '@input/@mockup - @input'.

// v.1.6.
// - Fixed an issue with multiple smart objects where the output image count was determined by the number of input files for the first smart object (as defined in the setting script).
// - Added sorting that should work in CS6 
// - Fixed issue in CS6 where input files would not resize properly. 

// v.1.5.
// - Not much changed...
// - An attempt to suppress some dialogs
// - Redoing readme / documentation: https://joonaspaakko.gitbook.io/batch-mockup-smart-object-replacement-jsx-photosho/

// v.1.4.
// - Added issue #6: Option to use input filename(s) as the output filename(s)

// v.1.3.
// Tested in Photoshop CC 2019
// - Added a new "filename" keyword "@input", which takes the output filename from the input file of whichever smart object that has the most input files.

// v.1.3.
// Tested in Photoshop CC 2019
// - Fixed an issue that prevented you from leaving output settings empty in order to use the defaults

// v.1.2.
// Tested in Photoshop CC 2019
// - Fixed an issue with zero padding

// v.1.1.
// Tested in Photoshop CC 2019
// - Fixed an issue where an array of input files would silently fail to output every single file

// v.1.0.
// Tested in Photoshop CC 2019

var includePath = '';
if ( $.includePath ) includePath = File.decode($.includePath);
var docPath = '';

function mockups( mockups ) {
  
  var displayDLG = app.displayDialogs;
  app.displayDialogs = DialogModes.NO;
  
  var playbackDisplayDLG = app.playbackDisplayDialogs;
  app.playbackDisplayDialogs = DialogModes.NO; // Affects Actions, which aren't used as of now, but maybe that changes in the future...
  
  soReplaceBatch( mockups );
  
  app.displayDialogs = displayDLG;
  app.playbackDisplayDialogs = playbackDisplayDLG;
  
}

function soReplaceBatch( mockups ) {
  
  addMultipleMockupsByPath( mockups );
  
  each( mockups, function( mockup ) {
    
    var mockupPSD = absolutelyRelativePath( mockup.mockupPath );
    if ( mockupPSD.file && mockupPSD.extension ) {
      
      app.open( mockupPSD.file );
      
      if ( mockup.showLayers ) {
        each( mockup.showLayers, function( layerName ) {
          var layer = getLayer( layerName );
          layer.visible = true;
        });
      }
      
      if ( mockup.hideLayers ) {
        each( mockup.hideLayers, function( layerName ) {
          var layer = getLayer( layerName );
          layer.visible = false;
        });
      }
      
      mockup.items = mockup.smartObjects;
      delete mockup.smartObjects;
      
      soReplace( mockup );
      
      app.activeDocument.close( SaveOptions.DONOTSAVECHANGES );
      
    }
  
  });
  
  alert('Batch process done!');
}

function addMultipleMockupsByPath( mockups ) {
  
  each(mockups, function( mockup ) {
    
    var mockupPSD = absolutelyRelativePath( mockup.mockupPath );
    var isFolder = !mockupPSD.extension;
    if ( isFolder ) {
      
      var mockupsFolder = new Folder( mockupPSD.decoded );
      var mockupFiles = getFiles( mockupsFolder, { inputFormats: "psd|psb", inputNested: !!mockup.mockupNested });
            
      if ( !mockupFiles ) return;
      // Goes through every found mockup file...
      each( mockupFiles, function( mockupFile ) {
        
        // Get text string of the full (absolute) path to the file
        var pathToMockup = mockupFile.fullName;
        // Create new mockup settings object using the path...
        var settingsCopy = JSON.parse(JSON.stringify(mockup));
        settingsCopy.mockupPath = pathToMockup;
        // Add new mockup settings to the array of mockups
        mockups.push( settingsCopy );
        
      });
      
    }
    
  });
  
}

function soReplace( rawData ) {
  
  app.activeDocument.suspendHistory("soReplace", "init(rawData)");
  
  function init( rawData ) {
    
    var rulerUnits = app.preferences.rulerUnits;
    app.preferences.rulerUnits = Units.PIXELS;
    
    var data = replaceLoopOptionsFiller( rawData );
    
    // Preparing files
    if ( data.doc.input ) {
      
      data.doc.files = prepFiles( data.doc, data );
      data.maxLoop = Math.ceil(data.doc.files.length / data.items.length);
      data.largestArray = data.doc.files;
      
    }
    else {
      
      each( data.items, function( item ) {
        item.files = prepFiles( item );
      });
      
      // This makes sure all file arrays are the same length
      data = evenOutFileArrays( data );
      
    }
    
    replaceLoop( data );
    
    app.preferences.rulerUnits = rulerUnits;
    
  }
  
}

function replaceLoop( data ) {
  
  for ( var fileIndex=0; fileIndex < data.maxLoop; fileIndex++ ) {
    for ( var itemIndex=0; itemIndex < data.items.length; itemIndex++ ) {
      var item = data.items[ itemIndex ];
      if ( item.target ) {

        var targetConfirmed = false;
        try { 
          app.activeDocument.activeLayer = item.target; 
          targetConfirmed = true;
        } catch(e) {}
        
        if ( targetConfirmed ) {
          
          if ( fileIndex == 0 ) convertSoToEmbedded(); // Just in case the target layer is a linked SO...
          
          // alert( data.doc.inputIndex )
          var sourceFilePath = data.doc.files ? data.doc.files[ data.doc.input ? data.doc.inputIndex : fileIndex ] : item.files[ fileIndex ];
          if ( data.doc.input ) data.doc.inputIndex++;
          
          if ( sourceFilePath !== null ) {
            
            app.activeDocument.activeLayer.visible = true;
            
            replaceSoContents( item, sourceFilePath ); // The old switcheroo
            
            // if ( item.targetVisibility === false || item.targetVisibility === true ) {
            //   app.activeDocument.activeLayer.visible = item.targetVisibility;
            // }
            
          }
          else {
            app.activeDocument.activeLayer.visible = false;
          }
          
        }
        
      }
    }
    
    var outputPathPrefix = data.output.path + "/";
    var outputFilePath = parseFilePath( data, fileIndex, outputPathPrefix );
    var splitfilenamepath = outputFilePath.filename.split("/"); 
    splitfilenamepath.splice(-1); 
    newFolder( outputFilePath.path + splitfilenamepath.join("/") );
    app.activeDocument.saveAs( new File( outputFilePath.fullpath ), saveOpts()[ data.output.format ](), true, Extension.LOWERCASE);
    
    if ( sourceFilePath === null ) app.activeDocument.activeLayer.visible = item.targetVisibility;
    
  }
  
}

function parseFilePath( data, fileIndex, outputPathPrefix ) {
  
  var fileNumber = fileIndex+1;
  if ( data.output.zeroPadding ) fileNumber = zeroPadding( fileNumber, data.maxLoop.toString().length );
  
  var inputFile = data.largestArray[fileIndex];
  var inputFilename = inputFile ? inputFile.name.replace(/\.[^\.]+$/, '') : fileNumber;
  
  var filename = data.output.filename.replace(/@mockup/g, data.doc.name).replace(/\$/g, fileNumber).replace(/@input/g, inputFilename);
  // Just a thought....
  // var outputPath = outputPathPrefix.replace(/@mockup/g, data.doc.name).replace(/\$/g, fileNumber).replace(/@input/g, inputFilename);
  var outputPath = outputPathPrefix;
  
  return {
    path: outputPath,
    filename: filename,
    extension: "." + data.output.format,
    fullpath: outputPath + filename + "." + data.output.format,
  };
  
}

function prepFiles( item, data ) {
  
  if ( typeof item.input === 'string' ) item.input = [ item.input ];
  
  var inputFiles = [];
  for ( var i=0; i < item.input.length; i++ ) {
    var inputFolder = new Folder( item.input[i] );
    var files = getFiles( inputFolder, item, data );
    if ( files ) inputFiles = inputFiles.concat( files );
  };
  
  return inputFiles.sort(function (a, b) {
    if ( app.compareWithNumbers ) {
      return app.compareWithNumbers(a.name, b.name)
    }
    else {
      return sortAlphaNum(a.name, b.name);
    }
  });
  
}

// PS CS6
function sortAlphaNum(a,b) {

  var reA = /[^a-zA-Z]/g;
  var reN = /[^0-9]/g;
  var AInt = parseInt(a, 10);
  var BInt = parseInt(b, 10);

  if ( isNaN(AInt) && isNaN(BInt) ) {
      var aA = a.replace(reA, "");
      var bA = b.replace(reA, "");
      if ( aA === bA ) {
          var aN = parseInt(a.replace(reN, ""), 10);
          var bN = parseInt(b.replace(reN, ""), 10);
          return aN === bN ? 0 : aN > bN ? 1 : -1;
      } 
      else {
          return aA > bA ? 1 : -1;
      }
  } 
  else if ( isNaN(AInt) ) {
      return 1;
  } 
  else if ( isNaN(BInt) ) {
      return -1;
  }
  else {
      return AInt > BInt ? 1 : -1;
  }
  
}

function getFiles(folder, item, data ) {

  data = data || {};
  data.doc = data.doc || {};
  
  var filteredFiles = [];
  var files = folder.getFiles();
  
  for ( var i = 0; i < files.length; i++ ) {
    
    var file = files[i];
    var regex = ".+\.(?:"+ (data.doc.inputFormats || item.inputFormats || 'tiff?|gif|jpe?g|bmp|eps|svg|png|ai|psd|pdf') +")$";
    var matchThis = new RegExp(regex, "i");
    var fileFilter = file.name.match( matchThis );
    
    var isFile = (file instanceof File && fileFilter);
    var isFolder = (file instanceof Folder);
    
    if ( isFolder && item.inputNested ) {
      var folder = file;
      filteredFiles = filteredFiles.concat( this.getFiles( folder, item, data ) );
    }
    else if ( isFile ) {
      filteredFiles.push( file );
    }
    
  }
    
  return filteredFiles.length < 1 ? [] : filteredFiles;
  
}


function evenOutFileArrays( data ) {
  
  var largestArray = findLargestArrayLength( data.items );
  data.maxLoop = largestArray.length;
  
  for ( var a=0; a < data.items.length; a++ ) {
    var item = data.items[a];
    var itemLength = item.length;
    var fillerIndex = 0;
    for ( var b=0; b < data.maxLoop; b++ ) {

      if ( item.files[b] == undefined ) {
        item.files[b] = data.noRepeats ? null : item.files[ fillerIndex ];
        fillerIndex++;
        if ( fillerIndex > (itemLength-1) ) fillerIndex = 0;
      }
      
    }
  }
  
  data.largestArray = largestArray;
  
  return data;
  
}

function findLargestArrayLength( items ) {
  
	var max = [];
  for ( var i=0; i < items.length; i++ ) {
    var cItems = items[i];
    var filesLength = cItems.files.length;
    if ( filesLength > max.length ) max = cItems.files;
  }
  
  return max;
  
}

function replaceLoopOptionsFiller( rawData ) {
  
  // General fallbacks...
  rawData.output = rawData.output || {};
  var data = {
    output: {
      path       : rawData.output.path || '$/output',
      format     : rawData.output.format || 'jpg',
      folders    : rawData.output.folders || false,
      filename   : rawData.output.filename || '@mockup - $',
      zeroPadding: rawData.output.zeroPadding === undefined ? true : rawData.output.zeroPadding,
    }
  };
  
  if ( rawData.noRepeats === true ) data.noRepeats = true;
  
  // Document
  var doc = app.activeDocument;
  data.doc = {
    name: doc.name.replace(/\.[^\.]+$/, ''),
    path: File.decode( doc.path ) + '/',
  };
  
  if ( rawData.inputNested ) data.doc.inputNested = rawData.inputNested;
  data.doc.input  = rawData.input;
  data.doc.inputFormats = rawData.inputFormats;
  data.doc.inputIndex = 0;
  
  // Input folder path
  if ( data.doc.input && typeof data.doc.input === 'string' ) data.doc.input = [ data.doc.input ];
  each( data.doc.input, function( item, index ) {
    data.doc.input[ index ] = absolutelyRelativePath( data.doc.input[index] ).decoded;
  });
  
  docPath = data.doc.path;
  
  var items = [];
  for ( var i=0; i < rawData.items.length; i++ ) {
    var rawItem = rawData.items[i];
    var itemObj = {};
    if ( rawItem.target ) itemObj.target = rawItem.target;
    if ( rawItem.align  ) itemObj.align  = rawItem.align;
    if ( rawItem.nestedTarget ) itemObj.nestedTarget = rawItem.nestedTarget;
    if ( rawItem.trimTransparency === false ) itemObj.trimTransparency = false;
    if ( rawItem.inputNested ) itemObj.inputNested = rawItem.inputNested;
    itemObj.input  = rawItem.input || '$/input';
    itemObj.inputFormats = rawItem.inputFormats;
    itemObj.resize = (rawItem.resize || rawItem.resize === false) ? rawItem.resize : 'fill';
    if ( rawItem.inputPlaced_runAction ) itemObj.inputPlaced_runAction = rawItem.inputPlaced_runAction;
    if ( rawItem.inputPlaced_runScript ) itemObj.inputPlaced_runScript = rawItem.inputPlaced_runScript;
    items.push( itemObj );
  }
  
  data.items = items || [];
  
  // ITEM specific fallbacks
  for ( var i=0; i < data.items.length; i++ ) {
    
    var item = data.items[i];
    
    // Target layer
    if ( item.target  ) {
      // var targetName = item.target;
      item.target = getLayer( item.target );
      item.targetVisibility = item.target.visible;
      // if ( !item.target ) alert( 'Target layer missing: \n ' + targetName );
    }
    
    // Input folder path
    if ( !data.doc.input ) {
      if ( typeof item.input === 'string' ) item.input = [ item.input ];
      for ( var inputIndex=0; inputIndex < item.input.length; inputIndex++ ) {
        item.input[ inputIndex ] = absolutelyRelativePath( item.input[inputIndex] ).decoded;
      }
    }
    
  }
  
  // Output folder path
  data.output.path = absolutelyRelativePath( data.output.path ).decoded;
  newFolder( data.output.path );
  
  if ( data.output.folders ) {
    data.output.path = absolutelyRelativePath( data.output.path + '/' + data.doc.name ).decoded;
    newFolder( data.output.path );
  }
  
  // Output file format
  data.output.format = data.output.format || 'jpg';
  data.output.format = data.output.format.toLowerCase();
  if ( data.output.format === 'jpeg' ) data.output.format = 'jpg';
  else if ( data.output.format === 'tiff' ) data.output.format = 'tif';
    
  return data;
  
}

function saveOpts() {
  return {
    psd: function() {
      
      var psd_saveOpts = new PhotoshopSaveOptions();
      
      psd_saveOpts.layers            = true;
      psd_saveOpts.embedColorProfile = true;
      psd_saveOpts.annotations       = true;
      psd_saveOpts.alphaChannels     = true;
      
      return psd_saveOpts;
      
    },
    pdf: function() {
      
      var presetName = '[High Quality Print]';
      var pdf_SaveOpts = new PDFSaveOptions();
      // pdf_SaveOpts.pDFPreset = 'presetName';
      return pdf_SaveOpts;
      
    },
    jpg: function() {
      
      var jpg_SaveOpts = new JPEGSaveOptions();
      jpg_SaveOpts.matte   = MatteType.WHITE;
      jpg_SaveOpts.quality = 12;
      jpg_SaveOpts.formatOptions.STANDARDBASELINE;
      return jpg_SaveOpts;
      
    },
    png: function() {
      
      var png_SaveOpts = new PNGSaveOptions();
      png_SaveOpts.compression = 9;
      png_SaveOpts.interlaced = false;
      return png_SaveOpts;
      
    },
    tif: function() {
      
      var tiff_SaveOpts = new TiffSaveOptions();
      tiff_SaveOpts.alphaChannels      = true;
      tiff_SaveOpts.annotations        = true;
      tiff_SaveOpts.imageCompression   = TIFFEncoding.JPEG;
      tiff_SaveOpts.interleaveChannels = true;
      tiff_SaveOpts.jpegQuality        = 12;
      tiff_SaveOpts.layers             = true;
      tiff_SaveOpts.layerCompression   = LayerCompression.ZIP;
      tiff_SaveOpts.transparency       = true;
      return tiff_SaveOpts;
      
    }
  };
}

function newFolder( path ) {
  
  var folder = new Folder( path );
  if ( !folder.exists ) folder.create();
  
}

function convertSoToEmbedded() {
  try { executeAction( stringIDToTypeID( "placedLayerConvertToEmbedded" ), undefined, DialogModes.NO ); } catch (e) {}
}

function replaceSoContents( item, sourcepath ) {
  
  // EDIT SO CONTENTS
  try { 
    executeAction( stringIDToTypeID( "placedLayerEditContents" ), new ActionDescriptor(), DialogModes.NO ); 
    var editingSO = true; 
  } 
  catch (e) { var editingSO = false; }
  
  // Inception - Time moves like thrice as slow here
  if ( editingSO && item.nestedTarget ) {
    editingSO = false;
    var nestedSO = getLayer( item.nestedTarget );
    if ( nestedSO ) {
      try { 
        executeAction( stringIDToTypeID( "placedLayerEditContents" ), new ActionDescriptor(), DialogModes.NO ); 
        editingSO = true;
      } catch (e) {}
    }
  }
  
  if ( editingSO ) {
    
    var doc = app.activeDocument;
    
    // FLATTEN
    executeAction( stringIDToTypeID( "flattenImage" ), undefined, DialogModes.NO );
        
    // PLACE NEW IMAGE
    var file = new File( sourcepath );
    if ( file.exists ) {
      try {
        
        var idPlc = charIDToTypeID( "Plc " );
          var desc394 = new ActionDescriptor();
          var idIdnt = charIDToTypeID( "Idnt" );
          desc394.putInteger( idIdnt, 9999 );
          var idnull = charIDToTypeID( "null" );
          desc394.putPath( idnull, file );
          var idFTcs = charIDToTypeID( "FTcs" );
          var idQCSt = charIDToTypeID( "QCSt" );
          var idQcsa = charIDToTypeID( "Qcsa" );
          desc394.putEnumerated( idFTcs, idQCSt, idQcsa );
          var idOfst = charIDToTypeID( "Ofst" );
            var desc395 = new ActionDescriptor();
            var idHrzn = charIDToTypeID( "Hrzn" );
            var idPxl = charIDToTypeID( "#Pxl" );
            desc395.putUnitDouble( idHrzn, idPxl, 0.000000 );
            var idVrtc = charIDToTypeID( "Vrtc" );
            var idPxl = charIDToTypeID( "#Pxl" );
            desc395.putUnitDouble( idVrtc, idPxl, 0.000000 );
          var idOfst = charIDToTypeID( "Ofst" );
          desc394.putObject( idOfst, idOfst, desc395 );
          var idAntA = charIDToTypeID( "AntA" );
          desc394.putBoolean( idAntA, true );
          var idLnkd = charIDToTypeID( "Lnkd" );
          desc394.putBoolean( idLnkd, true );
        executeAction( idPlc, desc394, DialogModes.NO );
        
        var bounds  = app.activeDocument.activeLayer.boundsNoEffects || app.activeDocument.activeLayer.bounds;        
        var imageSize = {
          width: bounds[2].value - bounds[0].value,
          height: bounds[3].value - bounds[1].value
        };
        
        // When trimTransparency is set to false some trickery is needed:
        // - Resize: we open SO contents to get the true document witdh, because transparency is not included in layer.bounds
        // - Align: for same reason we also add in a color fill, so that bounds are fetched properly
        // The tricky part is that to make sure we can save the smart object back, be actually need to make a new one 
        // with the contents of the input image and the newly made color fill and then duplicate that to the parent SO.
        // The color fill is removed after aligning.
        if ( item.trimTransparency === false ) {
          
          var returnLayer = app.activeDocument.activeLayer;
          
          executeAction( stringIDToTypeID( "placedLayerEditContents" ), new ActionDescriptor(), DialogModes.NO ); 
          
          var soDoc = app.activeDocument;
          imageSize = {
            width: soDoc.width.value,
            height: soDoc.width.value,
          };
          
          if ( item.align ) {
            var soFillLayer = soDoc.artLayers.add();
            soFillLayer.name = '@soFillLayer (Ksivzn0Tqm)';
            
            // Fill document with color
            var idFl = charIDToTypeID( "Fl  " );
            var desc486 = new ActionDescriptor();
            var idUsng = charIDToTypeID( "Usng" );
            var idFlCn = charIDToTypeID( "FlCn" );
            var idFrgC = charIDToTypeID( "FrgC" );
            desc486.putEnumerated( idUsng, idFlCn, idFrgC );
            executeAction( idFl, desc486, DialogModes.NO );
            
            // Turn all layers into a new smart object and push it to the parent smart object
            selectAllLayers(false, true);
            executeAction( stringIDToTypeID( "newPlacedLayer" ), undefined, DialogModes.NO );
            soDoc.activeLayer.name = soDoc.name;
            soDoc.activeLayer.duplicate( returnLayer, ElementPlacement.PLACEBEFORE );
            
          }
          
        }
        
        if ( item.resize ) {
          var newSize = calculateNewSize(
            [ imageSize.width, imageSize.height ],
            [ doc.width.value, doc.height.value ]
          ).percentage;
          
          switch ( item.resize ) {
            case "fit":
              newSize = newSize.fit; // Makes sure image fits inside the document
              break;
              
            case "x":
            case "fillX":
            case "fitX":
            case "xFill":
            case "xFit":
              newSize = newSize.x; // Makes sure image fills document horizontally
              break;
            
            case "y":
            case "fillY":
            case "fitY":
            case "yFill":
            case "yFit":
              newSize = newSize.y; // Makes sure image fills document vertically
              break;

            default:
              newSize = newSize.fill; // Makes sure every part of the document is filled by the image
              break;
          }
          doc.activeLayer.resize( newSize, newSize, AnchorPosition.MIDDLECENTER );
        }
        
        if ( item.align ) align( doc.activeLayer, [ 0, 0, doc.width.value, doc.height.value ], item.align );
        
        if ( item.align && item.trimTransparency === false ) {
          executeAction( stringIDToTypeID( "placedLayerEditContents" ), new ActionDescriptor(), DialogModes.NO ); 
          var soFillLayer = getLayer('@soFillLayer (Ksivzn0Tqm)')
          if ( soFillLayer ) soFillLayer.remove();
          app.activeDocument.close( SaveOptions.SAVECHANGES );
        }
        
        // HIDE BACKGROUND
        if ( doc.layers.length > 1 ) doc.backgroundLayer.visible = false;
        
        try {
          if ( item.inputPlaced_runAction ) {
            app.doAction(item.inputPlaced_runAction[1], item.inputPlaced_runAction[0]);
          }
          
          if ( item.inputPlaced_runScript ) {
            var scriptPath = absolutelyRelativePath( item.inputPlaced_runScript ).decoded;
            $.evalFile( File(scriptPath) );
          }
        } catch(e) { alert(e) }
        
        soDoc.close( SaveOptions.DONOTSAVECHANGES );
        if ( item.align ) returnLayer.remove();
        
      } catch (e) {}
    }
    
    if ( item.nestedTarget ) doc.close( SaveOptions.SAVECHANGES );
    
    app.activeDocument.close( SaveOptions.SAVECHANGES );
    
  }
  
}

function selectAllLayers( ignoreBackground, detachBG ) {
  if ( !ignoreBackground && detachBG ) {
    try { 
      activedocument.backgroundLayer; 
      var bgVisible = doc.backgroundLayer.visible;
      if ( bgVisible ) {
        // Make into a normal layer
        // =======================================================
        var idsetd = charIDToTypeID( "setd" );
        var desc304 = new ActionDescriptor();
        var idnull = charIDToTypeID( "null" );
            var ref46 = new ActionReference();
            var idLyr = charIDToTypeID( "Lyr " );
            var idBckg = charIDToTypeID( "Bckg" );
            ref46.putProperty( idLyr, idBckg );
        desc304.putReference( idnull, ref46 );
        var idT = charIDToTypeID( "T   " );
            var desc305 = new ActionDescriptor();
            var idOpct = charIDToTypeID( "Opct" );
            var idPrc = charIDToTypeID( "#Prc" );
            desc305.putUnitDouble( idOpct, idPrc, 100.000000 );
            var idMd = charIDToTypeID( "Md  " );
            var idBlnM = charIDToTypeID( "BlnM" );
            var idNrml = charIDToTypeID( "Nrml" );
            desc305.putEnumerated( idMd, idBlnM, idNrml );
        var idLyr = charIDToTypeID( "Lyr " );
        desc304.putObject( idT, idLyr, desc305 );
        var idLyrI = charIDToTypeID( "LyrI" );
        desc304.putInteger( idLyrI, 49 );
        executeAction( idsetd, desc304, DialogModes.NO );
      }
    } catch(e) {}
  }
  // Select all layers (doesn't include Background)
  try {
    var desc = new ActionDescriptor();
    var ref = new ActionReference();
    ref.putEnumerated( charIDToTypeID('Lyr '), charIDToTypeID('Ordn'), charIDToTypeID('Trgt') );
    desc.putReference( charIDToTypeID('null'), ref );
    executeAction( stringIDToTypeID('selectAllLayers'), desc, DialogModes.NO );
  } catch(e) {}
  // if ( !ignoreBackground ) {
  //   // Add Background Layer to the selection (if it exists)
  //   try {
  //     activeDocument.backgroundLayer;
  //     var bgID = activeDocument.backgroundLayer.id;
  //     var ref = new ActionReference();
  //     var desc = new ActionDescriptor();
  //     ref.putIdentifier(charIDToTypeID('Lyr '), bgID);
  //     desc.putReference(charIDToTypeID('null'), ref);
  //     desc.putEnumerated( stringIDToTypeID('selectionModifier'), stringIDToTypeID('selectionModifierType'), stringIDToTypeID('addToSelection') );
  //     desc.putBoolean(charIDToTypeID('MkVs'), false);
  //     executeAction(charIDToTypeID('slct'), desc, DialogModes.NO);
  //   } catch(e) {}
  // }
}

function calculateNewSize( inputSize, targetSize ) {
  function mathMax( array ) { return array[0] > array[1] ? array[0] : array[1]; }
  function mathMin( array ) { return array[0] < array[1] ? array[0] : array[1]; }
  var sizeArray  = [ targetSize[0] / inputSize[0], targetSize[1] / inputSize[1] ];
  var ratioFit   = mathMin( sizeArray );
  var ratioFill  = mathMax( sizeArray );
  var fillWidth  = inputSize[ sizeArray[0] > sizeArray[1] ? 1 : 0 ]*ratioFill;
  var fillHeight = inputSize[ sizeArray[0] < sizeArray[1] ? 1 : 0 ]*ratioFit;
  return {
    pixels: {
      fit:  { width: inputSize[0]*ratioFit,  height: inputSize[1]*ratioFit  },
      fill: { width: inputSize[0]*ratioFill, height: inputSize[1]*ratioFill },
      x:    { width: targetSize[0],          height: fillWidth 							},
      y:    { width: fillHeight, 						 height: targetSize[1] 				  },
    },
    percentage: {
      fit:  (100 / inputSize[0]) * (inputSize[0]*ratioFit),
      fill: (100 / inputSize[0]) * (inputSize[0]*ratioFill),
      x:    (100 / inputSize[0]) * (inputSize[0]*sizeArray[0]),
      y:    (100 / inputSize[1]) * (inputSize[1]*sizeArray[1]),
    }
  };
}


function zeroPadding(number, padding) {
  number = number.toString();
  while (number.length < padding) number = '0' + number;
  return number;
}

/*
left top
left center
left bottom
right top
right center
right bottom
center top
center center
center bottom
*/
function align( imageLayer, targetBounds, alignment ) {
  
  var imageBounds = imageLayer.boundsNoEffects || app.activeDocument.activeLayer.bounds;
  
  var image = {
    offset: {
      top: imageBounds[1].value,
      right: imageBounds[2].value,
      bottom: imageBounds[3].value,
      left: imageBounds[0].value,
    },
  };
  var target = {
    offset: {
      top: targetBounds[1].value || targetBounds[1],
      right: targetBounds[2].value || targetBounds[2],
      bottom: targetBounds[3].value || targetBounds[3],
      left: targetBounds[0].value || targetBounds[0],
    },
  };
  
  image.width  = image.offset.right  - image.offset.left;
  image.height = image.offset.bottom - image.offset.top;
  
  target.width   = target.offset.right  - target.offset.left;
  target.height  = target.offset.bottom - target.offset.top;
  var translateX = 0;
  var translateY = 0;
  var splitAlignment = alignment ? alignment.split(' ') : ['center', 'center'];
  
  // Assumes both x and y are always given
  each( splitAlignment, function( alignment, index ) {
    
    var x = (index === 0);
    var y = (index === 1);
    var alignmentString = alignment.replace(/^\s+/,'').replace(/\s+$/,'');
    if ( x ) {
      translateX = calculateAlignmentX( image, target, alignmentString );
    }
    else if ( y ) {
      translateY = calculateAlignmentY( image, target, alignmentString );
    }
    
  });
  
  imageLayer.translate( translateX, translateY );
  
}

function calculateAlignmentX( image, target, align ) {
  // HORIZONTAL
  var originX = target.offset.left - image.offset.left;
  switch( align ) {
    case "left":
      return originX;
      break;
    case "center":
      return originX - ( image.width/2  ) + ( target.width/2  );
      break;
    case "right":
      return originX + target.width - image.width;
      break;
  }
}

function calculateAlignmentY( image, target, align ) {
  // VERTICAL
  var originY = target.offset.top  - image.offset.top;
  switch( align ) {
    case "top":
      return originY;
      break;
    case "center":
      return originY - ( image.height/2 ) + ( target.height/2 );
      break;
    case "bottom":
      return originY + target.height - image.height;
      break;
  }
}

// Find & Select a layer anywhere in the active document;
function getLayer( layerName ) {
  try {
    
    var select = charIDToTypeID( "slct" );
    var actionDescriptor = new ActionDescriptor();
    var idnull = charIDToTypeID( "null" );
    var actionReference = new ActionReference();
    var layer = charIDToTypeID( "Lyr " );
    actionReference.putName( layer, layerName );
    actionDescriptor.putReference( idnull, actionReference );
    var makeVisibleID = charIDToTypeID( "MkVs" );
    actionDescriptor.putBoolean( makeVisibleID, false );
    var layerId = charIDToTypeID( "LyrI" );
    var actionList = new ActionList();
    actionList.putInteger( 1 );
    actionDescriptor.putList( layerId, actionList );
    executeAction( select, actionDescriptor, DialogModes.NO );
    
    return app.activeDocument.activeLayer;
    
  } catch(e) {
    return false;
  }
}

function scriptFolder() {
  return File.decode( new File($.includePath) ) + '/';
}

function each( array, callback ) {
  var imAboutTo = false;
  for ( var i=0; i < array.length; i++ ) {
    imAboutTo = callback( array[i], i );
    if ( imAboutTo ) break;
  }
}

function absolutelyRelativePath( string ) {
  
  string = string.replace(/\/$/, '') // Removes trailing forward slash...
  
  var newString = '';
  var familyTrees = [
    { type: 'script',  regex: string.match( /^(\.\.\/)+(\$\/)/ ) },
    { type: 'doc',     regex: string.match( /^(\.\.\/)+(\.\/)/ ) },
    { type: 'regular', regex: string.match( /^(\.\.\/)+/ )       },
  ];
  
  var familyTree;
  each( familyTrees, function( tree ) {
    if ( tree.regex ) {
      familyTree = tree;
      return true;
    }
  });
  
  if ( familyTree ) {
    
    familyTree.string = familyTree.regex[0]; // "../../../$/"
    familyTree.array  = familyTree.regex[0].match(/\.\.\//g); // ["../", "../", "../"]
    
    // Traverse upwards
    var pathPrefix = new File( familyTree.type === 'doc' ? docPath : includePath );
    each(familyTree.array, function() { pathPrefix = pathPrefix.parent; });
    
    var removeString = familyTree.string; // "../../../$/"
    newString = string.replace( removeString, pathPrefix.fullName + '/' );
    
  }
  else {
    
    newString = string.replace(/^\$\//, includePath + '/');
    if ( docPath ) newString = newString.replace(/^\.\//, docPath + '/');
    
  }
  
  var newFile = File( newString );
  
  return {
    file: newFile,
    decoded: File.decode( newString ),
    extension: getExtension( newFile.name ),
  };
  
}

function getExtension( string ) {
  
  var array        = (string||'').split('.');
  var lengthBefore = array.length;
  var extension    = array.pop();
  var lengthAfter  = array.length;
  
  return (lengthBefore !== lengthAfter && lengthAfter !== 0 ) ? extension : undefined;
  
};

// JSON
"object"!=typeof JSON&&(JSON={}),function(){"use strict";var gap,indent,meta,rep,rx_one=/^[\],:{}\s]*$/,rx_two=/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,rx_three=/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,rx_four=/(?:^|:|,)(?:\s*\[)+/g,rx_escapable=/[\\"\u0000-\u001f\u007f-\u009f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,rx_dangerous=/[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;function f(t){return t<10?"0"+t:t}function this_value(){return this.valueOf()}function quote(t){return rx_escapable.lastIndex=0,rx_escapable.test(t)?'"'+t.replace(rx_escapable,function(t){var e=meta[t];return"string"==typeof e?e:"\\u"+("0000"+t.charCodeAt(0).toString(16)).slice(-4)})+'"':'"'+t+'"'}function str(t,e){var n,o,f,u,r,$=gap,i=e[t];switch(i&&"object"==typeof i&&"function"==typeof i.toJSON&&(i=i.toJSON(t)),"function"==typeof rep&&(i=rep.call(e,t,i)),typeof i){case"string":return quote(i);case"number":return isFinite(i)?String(i):"null";case"boolean":case"null":return String(i);case"object":if(!i)return"null";if(gap+=indent,r=[],"[object Array]"===Object.prototype.toString.apply(i)){for(n=0,u=i.length;n<u;n+=1)r[n]=str(n,i)||"null";return f=0===r.length?"[]":gap?"[\n"+gap+r.join(",\n"+gap)+"\n"+$+"]":"["+r.join(",")+"]",gap=$,f}if(rep&&"object"==typeof rep)for(n=0,u=rep.length;n<u;n+=1)"string"==typeof rep[n]&&(f=str(o=rep[n],i))&&r.push(quote(o)+(gap?": ":":")+f);else for(o in i)Object.prototype.hasOwnProperty.call(i,o)&&(f=str(o,i))&&r.push(quote(o)+(gap?": ":":")+f);return f=0===r.length?"{}":gap?"{\n"+gap+r.join(",\n"+gap)+"\n"+$+"}":"{"+r.join(",")+"}",gap=$,f}}"function"!=typeof Date.prototype.toJSON&&(Date.prototype.toJSON=function(){return isFinite(this.valueOf())?this.getUTCFullYear()+"-"+f(this.getUTCMonth()+1)+"-"+f(this.getUTCDate())+"T"+f(this.getUTCHours())+":"+f(this.getUTCMinutes())+":"+f(this.getUTCSeconds())+"Z":null},Boolean.prototype.toJSON=this_value,Number.prototype.toJSON=this_value,String.prototype.toJSON=this_value),"function"!=typeof JSON.stringify&&(meta={"\b":"\\b","	":"\\t","\n":"\\n","\f":"\\f","\r":"\\r",'"':'\\"',"\\":"\\\\"},JSON.stringify=function(t,e,n){var o;if(gap="",indent="","number"==typeof n)for(o=0;o<n;o+=1)indent+=" ";else"string"==typeof n&&(indent=n);if(rep=e,e&&"function"!=typeof e&&("object"!=typeof e||"number"!=typeof e.length))throw Error("JSON.stringify");return str("",{"":t})}),"function"!=typeof JSON.parse&&(JSON.parse=function(text,reviver){var j;function walk(t,e){var n,o,f=t[e];if(f&&"object"==typeof f)for(n in f)Object.prototype.hasOwnProperty.call(f,n)&&(void 0!==(o=walk(f,n))?f[n]=o:delete f[n]);return reviver.call(t,e,f)}if(text=String(text),rx_dangerous.lastIndex=0,rx_dangerous.test(text)&&(text=text.replace(rx_dangerous,function(t){return"\\u"+("0000"+t.charCodeAt(0).toString(16)).slice(-4)})),rx_one.test(text.replace(rx_two,"@").replace(rx_three,"]").replace(rx_four,"")))return j=eval("("+text+")"),"function"==typeof reviver?walk({"":j},""):j;throw SyntaxError("JSON.parse")})}();
