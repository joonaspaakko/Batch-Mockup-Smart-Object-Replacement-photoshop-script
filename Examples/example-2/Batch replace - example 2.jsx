
#include "../../script/Batch Mockup Smart Object Replacement.jsx" 

var output = {
  path: '../../$/Examples - Outputs/example-2', 
  format: 'jpg', 
  folders: true,
  filename: '$', 
};

mockups([
  
  // Mockup #1
  {
    output: output, 
    mockupPath: '$/Modern Poster Mockup #10/Mockup.psd', 
    smartObjects: [
      {
        target: 'Poster 1', 
        inputNested: true, 
        input: ['../example-1/assets/_input files/photos-1'], // Fetches images from "example-1" folder
      },
      {
        target: 'Poster 2',
        input: '../$/example-1/assets/_input files/photos-2', // You can also keep the dollar sign there...
      },
    ]
  },
  
  // Mockup #2
  {
    output: output, 
    mockupPath: '../$/example-1/assets/Bus Stop Billboard MockUp/Bus Stop Billboard MockUp.psd', // Using a mockup from "example-1" in this batch
    hideLayers: ['graphic overlay', 'Reflection'], // These layers will be hidden before any replacements are made in the mockup.
    showLayers: ['Card'], // These layers will be shown before any replacements are made in the mockup.
    smartObjects: [
      // FOREGROUND
      {
        target: '@browser', 
        nestedTarget: '@viewport', 
        input: '$/_input files/billboard',
        align: 'left top', 
        resize: 'xFill',
      },
      // BACKGROUND
      {
        target: 'Your design here (double-click on the layer thumbnail)', 
        input: ['../example-1/assets/_input files/photos-2'],
      },
    ]
  },
  
]);

