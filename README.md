# torch-logger
Logging and visualization utility for Torch

## Installation

You will need to clone the repository; this package is not distributable with `luarocks` due to the visualization server using JavaScript and HTML.

### Logging

Run `luarocks make` in the repository directory after cloning.

### Visualization

To visualize the output for a specific project, one way is to copy the JS and HTML files to your project directory by running

``` 
cp -R vis {project_dir}/ 
mkdir {project_dir}/vis/static
```

in the repository directory.

## Example Usage 

```lua
require 'logger'

local hyperparams = { HiddenLayerSize = 1000, learningRate = 0.1} 

local trainingLog = Log("experiment_name", hyperparams, "vis/static")

... every training iteration ...
  trainingLog:update({ TrainingError = ..., ValidationError = ...})
  
trainingLog:save()
```

Then visualize the results by viewing `vis/visualize_training.html`, for instance by running
``` 
python -m SimpleHTTPServer
```



