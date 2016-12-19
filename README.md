[![CircleCI](https://circleci.com/gh/Microsoft/PowerBI-visuals-StrippetsBrowser/tree/master.svg?style=svg)](https://circleci.com/gh/Microsoft/PowerBI-visuals-StrippetsBrowser/tree/master)

# Outlines API


## Operations
The Strippets component can be used in two ways:
1. As a full featured component where the lifecycle of outlines, reader, and references are completely managed by the Strippets container.
2. As an individual outline, where the lifecycle of the reader view is managed by the consuming application.

### Outlines Operations

Operation |  Description
--------- |  -----------
Initialize | **`require('Strippets')($container, options);`** <br/><br/> This operation is used to initialize strippets given a jquery element. See the *Initialization* section above for more details.
Load Data | **`strippets.loadData(data, append);`** <br/><br/> Called to load and render data. The `append` flag is used to determine whether new outlines are added to the end or replaces existing data.
Center on Strippet | **`strippets.centerStrippet(outlineId);`** <br/><br/> Used to center viewport on the specified outline.
Open Reading Mode | **`strippets.openReadingMode(outlineId);`** <br/><br/> Used to open reading mode for a specific outline.
Close Reading Mode | **`strippets.closeReadingMode(outlineId);`** <br/><br/> Used to open reading mode for a specific outline. If an outlineId is not specified, all open reader views will be closed.


## Outlines Configuration
### Configuration
Certain Strippet behaviors can be controlled via configuration:
* **autoGenerateIconMap** (boolean): Determines whether an iconmap should be auto generated based on a set of icon mappings.
* **autoGenerateIconMappings** (array): If `autoGenerateIconMap` is set to true, Strippets will look for a set of default mappings to use. The template looks something like this:
```
 [
 	<type>: [{
 			'class': <type_class>,
 			'color': <color>,
 		    'isDefault':<true|false>
 		  },
 		  ...],
 ]
```

and here's an example:
```
 [
 	person: [{'class': 'fa fa-male', 'color': '#400000'},
            {'class': 'fa fa-male', 'color': '#35364e'},
            {'class': 'fa fa-male', isDefault: true}],
 	place: [{'class': 'fa fa-globe', 'color': '#1b2c3f'},
            {'class': 'fa fa-globe', 'color': '#3d697a'},
            {'class': 'fa fa-globe', isDefault: true}],
 ]
```

* **outline.reader.disableAnimation** (boolean): Enables/disables open and close animation for the reader view.

#### Example
```
var options = {
	outline:{
		reader: {
			disableAnimation:false,
			onLoadUrl: function(outline){},
		},
	},
	autoGenerateIconMap: true,
	autoGenerateIconMappings: {
		{'class': 'fa fa-male', 'color': '#400000'},
        {'class': 'fa fa-male', 'color': '#d26502'},
        {'class': 'fa fa-male', 'color': '#f0ab21', isDefault: true},
	},
}
```


### Event Hooks
Applications can tap into events that happen within strippets via the Strippets Configuration Object. The following hooks are exposed:

Events | Description
------ | -----------
`onLoadUrl` | Raised when the reader is ready to load content. The outline object in context will be passed as a parameter.

## Data Models
### Stories Data Model

A story is the data representation of an outline.

```
[{
	"id": "1",
	"title": "Canada will seek UN Security Council seat: Trudeau",
	"source": {
		"name": "ctvnews.com",
		"url": "http://www.ctvnews.com",
		"imageUrl": "http://www.ctvnews.ca/polopoly_fs/7.301269!/defaultIcon/64_news_icon.jpg"
	},
	"references": [{
		"name": "Donald Trump",
		"type": "person",
		"firstPosition": 0.53,
	    "referenceId": "PERSON_1",
	}],
},...]
```

* **id** (string): Identifier for the story.
* **title** (string): Title of the story.
* **source.name** (string): Origin Name of the story.
* **source.url** (string): Origin location of the story.
* **source.imageurl** (url): Image URL of the Origin
* **references** ([reference]): Array of references found in the document.
* **reference.name** (string): Name to uniquely identify
* **reference.type** (string): Group to which the reference belongs.
* **reference.firstPosition** (decimal): First occurence of the reference in the document.
* **reference.referenceId** (string): Id of the Reference. Used by the consuming application to associate a reference back to the original reference set.

##Example
TBD
