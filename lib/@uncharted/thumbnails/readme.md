# Thumbnails

## Overview
*TBD*

## Getting Started

#### Prerequisites
- Node.js v4.2.2 or higher  
- Docker & Docker Tools (optional)

#### Setup
1. Clone the repository
2. **[Optional]** Give the `thumbnails.sh` shell script execution privilege:  

    `chmod +x thumbnails.sh`
3. Build and run the thumbnails project:  

    `./thumbnails.sh --all` or `sh ./thumbnails.sh --all`  

4. **[Optional]** If Docker is installed, you can dockerize the project with the following command:  

    `./thumbnails.sh -d -a`  

5. **[Optional]** Verify that the Docker application is working correctly by navigating to the url specified in the console window.  

## Usage

Include following script tags:

    <script type="text/javascript" src="uncharted.thumbnails.dependencies.js"></script>
    <script type="text/javascript" src="uncharted.thumbnails.js"></script>

#### Example Data format    

    [
        {
            id: 1,
            imageUrl: 'http://mscorpnews.blob.core.windows.net/ncmedia/2015/11/000-all-future-011-1600x700.jpg',
            rank: 1,
            source: 'microsoft.com',
            sourceUrl: 'http://microsoft.com',
            sourceimage: 'https://tse1.mm.bing.net/th?&id=OIP.M3171d61d279961c0af79591e17bd762bo0&w=289&h=289&c=0&pid=1.9&rs=0&p=0&r=0',
            title: 'From AI and data science to cryptography: Microsoft researchers offer 16 predictions for "16"',
            author: 'Microsoft News Center Staff',
            articledate: '2015-12-04 00:00:00',
            summary: 'Last month, Microsoft released “Future Visions,” an anthology of short stories written by some of today’s top science fiction writers based in part on the writers’ access to Microsoft researchers and their labs.  The eBook is available for free from Amazon and other sites. Today we offer an',
            entities: [
                {
                    'name': 'Donald Trump',
                    'type': 'person',
                    'description': '',
                    'firstPosition': '0.56',
                },
                {
                    'name': 'Washington DC',
                    'type': 'place',
                    'description': 'rally in',
                    'firstPosition': '0.36',
                },
            ],
            url: 'http://www.cnn.com/2015/09/27/politics/obama-un-general-assembly/index.html',
            readerUrl: '/story?url=http%3A%2F%2Fwww.cnn.com%2F2015%2F09%2F28%2Fus%2Fpope-francis-u-s-trip-impact%2Findex.html',
        },

        ... more data ...
    ]
#### Direct instantiation
Load thumbnails module:

    var Thumbnails = Uncharted.Thumbnails;

Or with module loader:

    var Thumbnails = require('uncharted.thumbnails.js');

Instantiate and Load data:

    var data = < data in the specified format >  
    var options < options for the thumbnails module >

    var thumbnails = new Thumbnails({
        container: document.getElementsByClassName('thumbnails-panel'),
        config: options
    });
    thumbnails.loadData(data);

#### As jQuery Plugin

Load thumbnails as a jquery Plugin

    var data = < data in the specified format >  
    var options < options for the thumbnails module >

    // register thumbnails as a jquery plugin
    Uncharted.Thumbnails.asJQueryPlugin();

    // thumbnail panel element which is the container for thumbnails element
    var $thumbnailsPanel = $('.thumbnails-panel');

    // instantiate thumbnails into its container
    $thumbnailsPanel.thumbnails(options);

    // load the data into thumbnails
    $thumbnailsPanel.thumbnails('loaddata', data);

## Options
The config options passed to thumbnails should look like this:

    {
        entityIcons: [ // OPTIONAL. Entity icons used to map entites in the readerview
            {
                "type": "person", // Type of entity. what is it.
                "class": "fa fa-male",
                "color": "#400000", // Color of the entity.
            },
            {
                "type": "person", // Type of the entity this default represents.
                "class": "fa fa-male",
                "color": "#d26502", // Overall color of the entities of this type
                "isDefault": true,
            } // Default icon is used when there is no more available icon of same type.
        ],
        thumbnail: {
            height: 400, // OPTIONAL. height of the each thumbnail card
        },
        readerview: {
            readerWidth: 500, // OPTIONAL. reader view width
            entityBarWidth: 24, // OPTIONAL. readerWidth - entityBarWidth = reader content width

            // callback function that returns promise which resolves to reader content data
            onLoadUrl: function () {
                return Promise.resolve({
                    title: 'Obama hits Putin, Repub licans in U.N. speech',
                    author: 'Kevin Liptak',
                    content: <div>html content</div>
                    source: 'source',
                    sourceUrl: 'sourceUrl',
                    figureImgUrl: 'http://i2.cdn.turner.com/cnnnext/dam/assets/150928104501-obama-un-general-assembly-address-russia-ukraine-crimea-00003513-large-169.jpg',
                    figureCaption: 'We want a strong Russia that will work with us',
                    lastupdatedon: 'Sep. 28, 2015',
                });
            },
        }
    }

## Troubleshooting / FAQ
For more example, look at example/index.html file.

##Contact  
Main Contact: *TBD*  
Technical Manager: Isaac Wong <iwong@uncharted.software>  
Development Support: Jaehwan Ryu <jryu@uncharted.software>

## License
*TBD*
