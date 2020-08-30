
![](https://github.com/joonaspaakko/Batch-Mockup-Smart-Object-Replacement-photoshop-script/blob/master/script/Batch%20Mockup%20Smart%20Object%20Replacement.gif)

# Batch Mockup Smart Object Replacement.js Photoshop script <!-- omit in toc -->

A script that can batch process multiple mockup files and is able to replace multiple smart objects per mockup. 

- [Usage](#usage)
- [Minimal settings](#minimal-settings)
- [Default Settings](#default-settings)
- [Information counter (+troubleshooting)](#information-counter-troubleshooting)
  - [1. Sorting](#1-sorting)
  - [2. Mixed amount of input images between smart objects in a mockup](#2-mixed-amount-of-input-images-between-smart-objects-in-a-mockup)
    - [Visualizing how it works with an example scenario](#visualizing-how-it-works-with-an-example-scenario)
  - [3. Smart objects with transparent whitespace](#3-smart-objects-with-transparent-whitespace)
    - [Transparent whitespace method 1 (fast)](#transparent-whitespace-method-1-fast)
    - [Transparent whitespace method 2 (precise)](#transparent-whitespace-method-2-precise)
  - [4. Dialogs interrupt the batch process](#4-dialogs-interrupt-the-batch-process)
  - [5. The last input file sticks around in the output when using noRepeats: true](#5-the-last-input-file-sticks-around-in-the-output-when-using-norepeats-true)


## Usage

I'd recommend making a project folder where you copy the mockup psd files, input files, and the script that initiates the batch process. `Batch Mockup Smart Object Replacement.jsx` doesn't need to be in this project folder.

1. Download "Batch Mockup Smart Object Replacement.jsx"
2. Create a new `.jsx` file that will initiate the batch process
    - Make sure to `#include "Batch Mockup Smart Object Replacement.jsx"`, wherever you put it. 
    - This is _just about the minimum setup_ for the initiating script file:
    -
      ```js
      #include "Batch Mockup Smart Object Replacement.jsx"

      mockups([
        
        {
          output: {
            path: '$/_output' // Automatically created
          },
          mockupPath: '$/mockup/file.psd', 
          smartObjects: [
            {
              target: 'smart object layer name', // Unique smart object layer name
              input: '$/input', 
            },
            // {..},  comma separate multiple smartobjects 
          ]
        },
        // {..},  comma separate multiple mockups 
        
      ]);
      ```
3. Run this script to initiate the process.

Make sure to check [Default Settings](#default-settings) for more info. The example folders use nearly all settings to demonstrate various scenarios.

____

____

## Minimal settings

```js
mockups([
  
  {
    mockupPath: '$/mockup.psd',
    smartObjects: [
      { target: '@replace' }, 
    ]
  },
  
]);
```

## Default Settings


```js
mockups([
  
  {
    output: {
      // General path info: 
      // - Paths need to be absolute or include the following prefixes: "$" or "."
      // - ...Although, ou can get parent folders by combining them with "../", like so: "../$/mockup.psd", ".././mockup.psd"
      // - Path prefix: "$/"
      //   - Points to the parent folder of the initiating script file. 
      //   - Can be used with all paths.
      // - Path prefix: "./"
      //   - Points to the parent folder of the psd mockup. 
      //   - Can be used with all paths except "mockupPath".
      path: '$/_output', // The output folder is created automatically.
      format: 'jpg',     // 'jpg', 'png', 'tif', 'psd', 'pdf'
      zeroPadding: true  // Set this to false if you don't want to add zero padding to the number suffix of the output images: (009, 010, ...100, 101). The padding is based on the amount of output images.
      folders: false, // Files will be grouped in folders inside the output folder
      // @mockup = mockup psd name
      // $ = incremental numbers
      filename: '@mockup - $', // Can be any static string, but make sure to include $.
    }, 
    mockupPath: '', // Path to the mockup. For example: '../$/example-1/assets/Bus Stop Billboard MockUp/Bus Stop Billboard MockUp.psd'
    hideLayers: [], // Array of strings with unique layer names. Will be hidden before any replacements are made in the mockup.
    showLayers: [], // Array of strings with unique layer names. Will be shown before any replacements are made in the mockup. Smart object "target" layer is always shown...
    // If you have multiple smart objects per mockup and let's say one of them has 2 input images and another has 6 input images, the default behavior is that the smaller array of images is supplemented by using duplicates:
    // SO #1 inputs: ['1.jpg', '2.jpg']
    // SO #2 inputs: ['1.jpg', '2.jpg', '3.jpg', '4.jpg', '5.jpg', '6.jpg']
    // Input #1 will end up looking like this: ['1.jpg', '2.jpg', '1.jpg', '2.jpg', '1.jpg', '2.jpg']
    // With noRepeats true, the so content swapping is stopped once the input images run out and the smart object is hidden.
    // This may require you to set a separate background fill behind the smart object in some cases.
    noRepeats: false, 
    smartObjects: [
      {
        // Unique smart object layer name. Sometimes mockups have multiple layers with the same name. Make sure they are unique. I recommend adding a '@' to the front of the layer name.
        target: '', // String
        // Same as with "target", make sure this a unique layer name.
        // "nestedTarget" needs to be inside the "target" smartobject.
        // - This can be used to for example placing screenshots inside a desktop browser window
        // - Sometimes mockup smart objects have transparent whitespace around the graphic. You can set a smaller target inside "target" by using "nestedTarget".
        // - There's an example on the usage in both example script files. In example-1 it's in the mug mockup and in example-2 it's in the billboard mockup.
        nestedTarget: '',  // String.
        // Input example: ['$/_input/photos-1', './_input/photos-2']
        // - Only looks for files from the input path(s)
        // - Ignores nested folders
        // - If you want to use nested folders you need to define each of them separately: ['$/_input/photos-1', '$/_input/photos-1/nested-photos']
        // - Non-image files in the input folder will be ignored
        // - Input files are sorted alphanumerically in ascending order. This is also the output order. 
        // - You can add numbering if you want a specific order.
        input: '', // String or Array. Path to the input files. 
        inputNested: false, // Set to true to dig deep in the input folder(s)
        inputFormats: 'tiff?|gif|jpe?g|bmp|eps|svg|png|ai|psd|pdf', // Separate multiple formats with a vertical pipe. 
        // CSS style alignment values:
        // 'left top' 
        // 'left center' 
        // 'left bottom' 
        // 'right top'
        // 'right center' 
        // 'right bottom'
        // 'center top'
        // 'center center'
        // 'center bottom'
        align: 'center center',
        // Resize values: 
        // false
        // 'fill'  
        // 'fit'   
        // 'xFill' - Fills horizontally (useful for screenshots, for instance)
        // 'yFill  - Fill vertically
        resize: 'fill',
        // Set this to false if you want the resizing to take transparent whitespace in the input images into consideration. Settings this to false works with  align: 'center center'. This could be improved, but the crux of the issue 
        trimTransparency: true, 
      },
      
      // You can set as many smart objects as you dare...
      // { ... },
      
    ]
  },
  
  // You can set as many mockups as you dare...
  // { ... },
  
]);
```





_____

_____



## Information counter (+troubleshooting)

### 1. Sorting

The input files are sorted alphanumerically. To make sure your input files output in a specific order add numbers in the filename. It's easier to set that up if you sort the input folder in your file manager _(Explorer, Finder, etc..)_ by filename in ascending order.


### 2. Mixed amount of input images between smart objects in a mockup

The script will repeat the input files as many times as it takes to match the largest amount of input files.

  - In the example output, you can see that the tablet rotates multiple times between 2 different images, because it has 2 input images and phone has 14.
  - If you don't like duplicates, then you have to make sure each smart object has the same amount of input images. 
  - If you want specific image(s) to repeat at specific spots, you need to make a duplicate of the file and rename the files to be in the correct order.
  - If for some reason you want to leave a blank spot, you have to do it using a blank input file. The mug mockup in the example is a pretty good example of a situation where you likely wouldn't mind leaving s

#### Visualizing how it works with an example scenario

If these are the input files for a made up file called: `mockup.psd`;
| @phone | @tablet | @laptop |
|--------|---------|---------|
| 1.jpg  | 1.jpg   | 1.jpg   |
| 2.jpg  | 2.jpg   | 2.jpg   |
| 3.jpg  |         | 3.jpg   |
| 4.jpg  |         | 4.jpg   |
| 5.jpg  |         |         |
| 6.jpg  |         |         |
| 7.jpg  |         |         |
| 8.jpg  |         |         |
 
 ...the output will be:
| output (mockup.psd) | @phone | @tablet                        | @laptop                        |
|:-------------------:|--------|--------------------------------|--------------------------------|
|     mockup 1.jpg    | 1.jpg  | 1.jpg                          | 1.jpg                          |
|     mockup 2.jpg    | 2.jpg  | 2.jpg                          | 2.jpg                          |
|     mockup 3.jpg    | 3.jpg  | 1.jpg :heavy_exclamation_mark: | 3.jpg                          |
|     mockup 4.jpg    | 4.jpg  | 2.jpg :heavy_exclamation_mark: | 4.jpg                          |
|     mockup 5.jpg    | 5.jpg  | 1.jpg :heavy_exclamation_mark: | 1.jpg :heavy_exclamation_mark: |
|     mockup 6.jpg    | 6.jpg  | 2.jpg :heavy_exclamation_mark: | 2.jpg :heavy_exclamation_mark: |
|     mockup 7.jpg    | 7.jpg  | 1.jpg :heavy_exclamation_mark: | 3.jpg :heavy_exclamation_mark: |

### 3. Smart objects with transparent whitespace

Sometimes mockups have a bunch of _whitespace_ in the smart object surrounding the placeholder graphic. This isn't an issue if the smart object has a background, but if it's _transparent whitespace_, you need to to jump through some hoops:

> It might be enticing to try and trim away this transparent whitespace, but any kind of adjustment that changes the smart object's document size is likely to cause issues you're not ready to face.

#### Transparent whitespace method 1 (fast)

In the mockup psd, open the `target` smart object and make a new smart object inside it that is approximately the size of the placeholder graphic and also in the same location. You could also convert the placeholder graphic into a smart object. Use this new smart object as a `nestedTarget`. You'll likely also want to use `resize: fit`.

For a real world example, see the mug example in `example-1/` (white mug) and the billboard example in `example-2/`.

#### Transparent whitespace method 2 (precise)

Make sure all input image(s) are exactly the same size as the smart object document and add settings `trimTransparency: false` with `resize: false`. I'd recommend using the smart object as a template for the input files. This saves some time and effort and slightly reduces the risk of human error.

For a real world example, see the mug example in `example-1/` (black mug).

### 4. Dialogs interrupt the batch process

There are 3 dialog types that may interrupt the bathc process. All of them should have a checkbox that says either `Don't show on document open` or `Don't show again`, that I would recommend you tick.

### 5. The last input file sticks around in the output when using noRepeats: true

Sometimes the smart objects in a mockup have been lifted to the top of the stack or perhaps separated into a labeled folder. This usually means that there is a duplicate smartobject somwhere in the document and so when the script runs out of input images, the `target` smart object is hidden, but the duplicate smart object is still there. The simplest fix is to change the target to that duplicate smart object instead.