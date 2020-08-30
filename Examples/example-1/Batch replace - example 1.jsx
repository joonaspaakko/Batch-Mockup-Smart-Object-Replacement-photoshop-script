
#include "../../script/Batch Mockup Smart Object Replacement.jsx" 

// Identical output settings for every mockup
var output = {
  // Path prefix: "$/" points to the parent folder of this script. 
  // You could also use "./", which points to the parent folder of the psd mockup. 
  // The only place where you can't use "./" is in the "mockupPath"
  path: '../$/example-1 (output)', 
  format: 'jpg', // 'jpg', 'png', 'tif', 'psd', 'pdf'
  folders: true, // Files will be grouped by folders inside the output folder
  filename: '$', 
};

mockups([
  
  // Mockup #1
  {
    output: output, // You can of course give individual output settings for each mockup if you want...
    mockupPath: '$/assets/Web Showcase Project Presentation/Web-Showcase-Project-Presentation.psd', 
    smartObjects: [
      {
        target: '@phone', // Target layer name. I've renamed all of the smart object names in the mockup psd because you need the layer names to be unique. The prefix: "@" is just an easy way to make sure it's unique.
        input: '$/assets/_input files/phone-screens/Deadline UI Kit',  // Look for image files from this input folder...
      },
      {
        target: '@tablet',
        input: '$/assets/_input files/photos-1',
      },
      {
        target: '@laptop', 
        input: ['$/assets/_input files/photos-2', '$/assets/_input files/photos-3'], // You can pass multiple input folders in an array. 
      },
    ]
  },
  
  // Mockup #2
  // These smart objects are somewhat tricky, because they have transparent whitespace in them. 
  // - I handled both smart object using different methods:
  //    - @black-mug: I used the smart object contents as a template for the input files to make sure 
  //                  the inputs are exactly the same size and that the graphics are in the right position.
  //                  This method requires: trimTransparency: 'false' and resize: false just to be sure the 
  //                  size stays the same...
  //    - @white-mug: These input images have been trimmed from whitespace. Here the workhorse is "nestedTarget", 
  //                  which was used as bounds for the graphics.
  {
    output: output,
    mockupPath: '$/assets/Mug PSD MockUp 2/Mug PSD MockUp 2.psd',
    noRepeats: true, // None of the input files repeat: after output file #2, the white mug will be blank. 
    smartObjects: [
      {
        target: '@black-mug', // Againt both smart objects had identical names, so I needed to rename them manually to make them unique.
        input: './_input files/black-mug', // I opted to store both mug input files in the mockup folder since they aren't used anywhere else, hence the "./" prefix
        trimTransparency: false, // Align and resize will use the full size of the input images
        resize: false, // Resize is not needed since my source images are exactly the same size as the target smart object document
      },
      {
        target: '@white-mug', 
        input: './_input files/white-mug',
        // Another way to handle transparent whitespace is to make your own placeholder smartobject inside the target smart object. 
        // If you want this nested target to be the size of the placeholder graphic that came with the mockup, you might get a good result 
        // by converting the placeholder graphic layer into a new smartobject and using it as the "nestedTarget", like I have done here.
        // TL;DR The input images are placed inside this nested smart object instead...
        nestedTarget: 'Placeholder',
        resize: 'fit', 
        align: 'center bottom', 
      }
    ]
  },
  
  // Mockup #3
  {
    output: output,
    mockupPath: '$/assets/Bus Stop Billboard MockUp/Bus Stop Billboard MockUp.psd',
    smartObjects: [
      {
        target: 'Your design here (double-click on the layer thumbnail)', 
        inputNested: true, // photos-1 folder has a nested folder
        input: [
          '$/assets/_input files/photos-1', // Could've also added a 4th item: '$/assets/_input files/nested',
          '$/assets/_input files/photos-2', 
          '$/assets/_input files/photos-3',
        ], 
      },
    ]
  },
  
]);

